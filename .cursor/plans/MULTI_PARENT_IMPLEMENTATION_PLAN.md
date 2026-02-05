# Implementation Plan: Multi-Parent Video Sharing and Sync

## Overview

Implement households so multiple parents can share one whitelist; videos are keyed by household; device linking uses household_id. Existing single-parent data is migrated to one household per parent.

## Requirements

- Multiple parents can co-manage the same video list (household).
- Any member’s add/remove is visible to all members and linked children (sync).
- Device linking ties the child device to a household (one shared list).
- Backward compatibility: existing accounts work after migration (one household per parent).

## Architecture Changes

- **New:** `migrations/003_households_and_members.sql` – households, household_members, video household_id/added_by, device_tokens household_id, RLS, backfill.
- **Types:** `types/database.ts` – Household, HouseholdMember, Video with household_id/added_by.
- **Repositories:** `lib/repositories/household.repository.ts` (new), `lib/repositories/video.repository.ts` (household_id-based).
- **Services:** `lib/services/household.service.ts` (new), `lib/services/video.service.ts` (household_id), `lib/services/device-token.service.ts` (household_id).
- **API:** `app/api/households/route.ts`, `app/api/households/[id]/members/route.ts`, `app/api/videos/route.ts` and `[id]/route.ts` (household_id + membership), `app/api/device-token/route.ts` (householdId), `app/api/parent-by-email/route.ts` (return households for link-device).
- **Client:** `app/link-device/page.tsx` (choose household), `app/page.tsx` and `app/watch/[id]/page.tsx` (use householdId), `lib/hooks/useParentId.ts` → `useHouseholdId.ts` or extend to household, `components/AdminDashboard.tsx` (household selector, invite member).

## Implementation Steps

### Phase 1: Database and Types

1. **Add migration 003_households_and_members.sql** (File: `migrations/003_households_and_members.sql`)
   - Action: Create `households` (id, name, created_at). Create `household_members` (household_id, parent_id, role, joined_at), PK (household_id, parent_id). Add `household_id` (nullable) and `added_by` (nullable) to `videos`. Add `household_id` (nullable) to `device_tokens`. Create indexes and FKs. Add RLS policies: household_members visible to members; videos readable by all, writable by household members (via service/API).
   - Why: Foundation for shared lists and device→household binding.
   - Dependencies: None.
   - Risk: Low.

2. **Backfill and switch videos to household** (same migration file)
   - Action: For each parent with videos: create one household (name = 'My list'), insert household_member (owner), set videos.household_id = new household id, videos.added_by = parent_id. Set device_tokens.household_id = household id for that parent’s tokens. Then ALTER videos ADD CONSTRAINT household_id NOT NULL, drop parent_id from videos (or second migration). Drop unique(parent_id, youtube_id); add unique(household_id, youtube_id).
   - Why: Existing users get one household and keep their list.
   - Dependencies: Step 1.
   - Risk: Medium (data migration); test on copy.

3. **Update TypeScript types** (File: `types/database.ts`)
   - Action: Add Household, HouseholdMember; add Video.household_id and added_by; remove or deprecate Video.parent_id. Add DeviceToken.household_id if needed for types.
   - Why: Type safety across app.
   - Dependencies: Step 1–2.
   - Risk: Low.

### Phase 2: Repositories and Services

4. **Create household repository** (File: `lib/repositories/household.repository.ts`)
   - Action: HouseholdRepository with create(household), findById(id), findMembersByHouseholdId(householdId), addMember(householdId, parentId, role), removeMember(householdId, parentId), findHouseholdsByParentId(parentId). Implement with Supabase.
   - Why: Centralized data access for households.
   - Dependencies: Migration, types.
   - Risk: Low.

5. **Create household service** (File: `lib/services/household.service.ts`)
   - Action: createHousehold(parentId, name), getHouseholdsForParent(parentId), getDefaultHouseholdId(parentId) (first household), inviteMember(householdId, inviterParentId, email), removeMember(householdId, parentId, removerParentId). Enforce membership checks.
   - Why: Business rules and auth checks in one place.
   - Dependencies: Household repository, parent repository.
   - Risk: Low.

6. **Update video repository** (File: `lib/repositories/video.repository.ts`)
   - Action: Replace parentId with householdId in GetVideosOptions, findByParentId → findByHouseholdId, exists(householdId, youtubeId), countByHouseholdId(householdId). create(videoData) with household_id and added_by. delete(id, householdId). Keep findById(id) unchanged.
   - Why: Videos belong to households.
   - Dependencies: Migration, types.
   - Risk: Low.

7. **Update video service** (File: `lib/services/video.service.ts`)
   - Action: All methods use householdId instead of parentId; cache key by householdId; addVideo and deleteVideo require householdId; optionally accept invoker parentId for added_by.
   - Why: Service layer aligned with household model.
   - Dependencies: Video repository update.
   - Risk: Low.

8. **Update device-token service** (File: `lib/services/device-token.service.ts`)
   - Action: createDeviceToken(householdId) (and optionally parentId for audit). validateDeviceToken() returns householdId (or return { householdId, parentId }). Update DB insert to use household_id; backfill already done in migration. Legacy cookie: if only parent_id stored, resolve default household for that parent and return householdId.
   - Why: Child feed is driven by household.
   - Dependencies: Migration, household service for default household.
   - Risk: Medium (cookie/legacy handling).

### Phase 3: API and Authorization

9. **Household API routes** (Files: `app/api/households/route.ts`, `app/api/households/[id]/members/route.ts`)
   - Action: GET /api/households (auth, return current user’s households). POST /api/households (auth, body: name, create household and add current user as owner). GET/POST/DELETE members as needed (invite by email, remove member). All checks: user is member of household.
   - Why: UI can list/create households and manage members.
   - Dependencies: Household service.
   - Risk: Low.

10. **Parent-by-email and device-token API** (Files: `app/api/parent-by-email/route.ts`, `app/api/device-token/route.ts`)
    - Action: GET parent-by-email: return parentId and list of households (ids + names) so link-device can show “Which list?”. POST device-token: accept householdId (required) and optionally parentId; validate parent is member of household; create token with household_id.
    - Why: Link device to a specific household.
    - Dependencies: Household service, device-token service.
    - Risk: Low.

11. **Videos API** (Files: `app/api/videos/route.ts`, `app/api/videos/[id]/route.ts`)
    - Action: GET /api/videos?household_id=xxx (required for child feed). POST /api/videos: body url, household_id; auth; verify user is member of household; call videoService.addVideo with householdId. DELETE /api/videos/[id]: auth; load video; verify user is member of video.household_id; delete.
    - Why: All video operations scoped to household with membership check.
    - Dependencies: Video service, household service (membership check).
    - Risk: Low.

12. **Device-token GET** (File: `app/api/device-token/route.ts`)
    - Action: GET returns { householdId } (and optionally parentId) from validateDeviceToken() so client can fetch videos by household_id.
    - Why: Child pages need householdId to call GET /api/videos?household_id=.
    - Dependencies: Device-token service returning householdId.
    - Risk: Low.

### Phase 4: Frontend

13. **useHouseholdId hook** (File: `lib/hooks/useHouseholdId.ts` or extend `useParentId.ts`)
    - Action: Call GET /api/device-token; if response has householdId, set it; else treat as unlinked. Expose householdId, loading, refetch, clear. Optionally keep parentId in response for any future use.
    - Why: Child feed and watch page use householdId for API calls.
    - Dependencies: API returns householdId.
    - Risk: Low.

14. **Child feed and watch page** (Files: `app/page.tsx`, `app/watch/[id]/page.tsx`)
    - Action: Use householdId from hook; fetch GET /api/videos?household_id=householdId; same UI, swap parent_id for household_id in requests.
    - Why: Child sees household’s list.
    - Dependencies: useHouseholdId, videos API.
    - Risk: Low.

15. **Link-device page** (File: `app/link-device/page.tsx`)
    - Action: After parent-by-email, if parent has multiple households show dropdown “Which list?” (name); then POST device-token with chosen householdId. If one household, use it without asking.
    - Why: Device is linked to one shared list (household).
    - Dependencies: parent-by-email returning households, device-token POST householdId.
    - Risk: Low.

16. **Admin dashboard** (File: `components/AdminDashboard.tsx`)
    - Action: Household selector at top (dropdown or tabs); fetch /api/households, then GET /api/videos?household_id=selected. Add video POST with household_id. Delete video with membership check (API already enforces). Optional: “Invite guardian” button → call POST /api/households/[id]/members with email.
    - Why: Parent manages one household at a time and can invite others.
    - Dependencies: Households API, videos API.
    - Risk: Low.

### Phase 5: Validators and Cleanup

17. **Validators** (Files: `lib/validators/video.validator.ts`, `lib/validators/parent.validator.ts`, new `lib/validators/household.validator.ts`)
    - Action: videoQuerySchema: household_id (uuid) instead of or in addition to parent_id. createVideoSchema: household_id, url. Add householdIdSchema; use in device-token and household routes.
    - Why: Consistent validation.
    - Dependencies: None.
    - Risk: Low.

18. **Cache and constants** (Files: `lib/utils/cache.ts`, `lib/utils/constants.ts`)
    - Action: getVideoListCacheKey(householdId, …). Add HOUSEHOLD_ID_COOKIE_NAME if we ever store household_id in cookie. Invalidate cache by householdId in video service.
    - Why: Cache keys must reflect household.
    - Dependencies: Video service.
    - Risk: Low.

## Testing Strategy

- **Unit:** Household repository and service (membership, default household). Video repository/service with householdId. Validators.
- **Integration:** API routes: GET/POST videos with household_id and auth; device-token with householdId; households CRUD and members.
- **E2E:** Link device with household selection; child feed shows household videos; second parent logs in and sees same list; add video as second parent and verify child feed updates.

## Risks and Mitigations

- **Risk:** Migration fails or leaves inconsistent data.
  - **Mitigation:** Run migration in transaction; test on staging; keep parent_id on videos until backfill verified, then drop in follow-up if desired.
- **Risk:** Legacy devices with only parent_id cookie.
  - **Mitigation:** validateDeviceToken() returns householdId by resolving parent’s default household when only parent_id is present (DB or cookie).

## Success Criteria

- [ ] Existing single-parent accounts have one household and see their videos after migration.
- [ ] Second parent can be added to a household and sees the same video list.
- [ ] Child device linked to a household shows that household’s videos; linking flow allows choosing household when parent has multiple.
- [ ] Any household member can add/remove videos; changes appear for all members and on linked child devices.
- [ ] No CRITICAL or HIGH findings from code and security reviews.
