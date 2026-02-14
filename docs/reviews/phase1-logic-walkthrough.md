# Phase 1: Logic Walkthrough

**Reviewer:** Step-by-step reasoning pass (thinking/reasoning)  
**Date:** 2026-02-13  
**Scope:** Critical flows with assumptions, branches, edge cases, and possible logic issues.

---

## Method

For each flow: (1) state assumptions, (2) enumerate branches, (3) consider ordering and races, (4) list possible issues with location.

---

## Flow 1: Parent-by-email (GET /api/parent-by-email)

**Purpose:** Device linking: kid device sends parent email; API returns parentId and households (no auth).

**Assumptions:**

- Caller has the parent’s email (e.g. entered on link-device page).
- Email is normalized (trim, lowercase) in validator and in service lookups.
- RLS may prevent anon from reading `parents` in some setups; so admin/backfill paths exist.

**Step-by-step:**

1. Rate limit applied (public).
2. Query parse: `email` from search params → `parentByEmailQuerySchema` (required, email format, toLowerCase + trim). **Branch:** Invalid → 400 (Zod).
3. `parentService.findParentByEmail(email)` → `parentRepository.findByEmail(email)` (server client, RLS). **Branch:** Parent found → parentId; **Branch:** NotFoundError (no row or RLS hides row).
4. On NotFoundError:
   - `findParentByEmailWithAdmin(email)` (admin client, bypasses RLS). **Branch:** found → parentId; **Branch:** null → try backfill.
   - `ensureParentFromAuthByEmail(email)`: RPC `ensure_parent_from_auth_email` or fallback (Auth Admin listUsers + direct inserts). **Branch:** returns id → parentId; **Branch:** null → 404 "Parent account not found".
5. `householdService.getHouseholdsForParent(parentId)`. **Branch:** length > 0 → use it; **Branch:** length === 0 → call `ensureParentFromAuthByEmail(email)` again, then `getHouseholdsForParent(parentId)` again.
6. If households still empty → 404 "No household found for this account".
7. Return 200 with parentId and households (id, name).

**Possible issues:**

| # | Hypothesis | Location |
|---|------------|----------|
| 1 | **Double backfill:** When RLS fails and admin finds the parent, we do not backfill; we only use adminId. If that parent had no household row (e.g. created before household backfill), we then fetch households, get [], then call `ensureParentFromAuthByEmail` again. So we do at most two backfill attempts. Second call is redundant if RPC already ran in step 4 (RPC creates household). Only redundant if first 404 was due to admin lookup success without backfill. Logic is correct but slightly redundant when admin finds parent but household_members is empty. | `app/api/parent-by-email/route.ts` lines 48–52 |
| 2 | **Email normalization consistency:** Repository uses `trim()`; parent service admin path uses `trim().toLowerCase()` and escapes for ILIKE. Validator uses `.toLowerCase().trim()`. So all paths normalize; consistent. | — |
| 3 | **Race:** Two concurrent requests for same new user (in auth.users but not in parents): both may call ensureParentFromAuthByEmail. RPC and fallback use INSERT ... ON CONFLICT DO NOTHING / upsert, so both can succeed without conflict. Safe. | `lib/services/parent.service.ts` |
| 4 | **Fallback listUsers(1000):** If the user is not in the first 1000 users, fallback fails and returns null. Edge case for very large auth.users. | `lib/services/parent.service.ts` line 69 |

---

## Flow 2: Device token creation and validation

**Purpose:** Parent (authenticated) creates a device token for a household; kid device later validates cookie to get householdId/parentId.

**Assumptions:**

- POST /api/device-token is called only when parent is logged in (session).
- createDeviceToken is called with (householdId, parentId) after ensureMember(householdId, parentId).

**Creation (POST /api/device-token):**

1. Rate limit (auth). Body: householdId, parentId; validated with Zod; ensureMember(householdId, parentId). **Branch:** not member → NotFoundError.
2. createDeviceToken(householdId, parentId): service fetches household by id with server client (RLS). **Branch:** not found → NotFoundError.
3. Generate token, hash. If admin client: insert device_tokens (token_hash, household_id, parent_id, expires_at), set cookie (token value). If no admin: set cookie only, setParentIdCookie(parentId). So in dev without service role, only cookies are set; DB has no row.

**Validation (GET /api/device-token or internal validateDeviceToken):**

1. Read device token cookie. If admin and token present: lookup by token_hash and expires_at; if row found return householdId/parentId from DB. **Branch:** no admin or no token or no row or expired → continue.
2. If production and no admin/token/row: return null (no fallback).
3. If development: read PARENT_ID_COOKIE_NAME; validate as UUID; getDefaultHouseholdId(parentId); verify parent exists in parents (server client); return householdId + parentId. So in dev, identity is effectively trust-based on parent_id cookie.

**Possible issues:**

| # | Hypothesis | Location |
|---|------------|----------|
| 1 | **Cookie-only identity in dev:** Anyone who can set cookies can set voobi_parent_id_secure and (if no service role) be treated as that parent. Documented in security review; product decision for dev-only. | `lib/services/device-token.service.ts` |
| 2 | **POST /api/device-token does not set parent_id cookie when DB path is used:** When admin is set, we set only DEVICE_TOKEN_COOKIE_NAME. setParentIdCookie is only called in the no-admin branch. So on validation with admin we get parentId from DB; no need for parent_id cookie. Consistent. | `lib/services/device-token.service.ts` |
| 3 | **clearDeviceToken:** Deletes by token_hash from DB if admin and token cookie present; then deletes both cookies. Correct. | Same file |

---

## Flow 3: Auth callbacks (YouTube and Child)

**Purpose:** OAuth callback: verify state, exchange code, store connection, redirect.

**Assumptions:**

- State is signed (HMAC) and contains householdId, parentId, nonce, exp. Child state also has type "child".
- Callback is only hit after redirect from Google; user session must still be valid.

**Steps:**

1. Rate limit (auth). Read code and state from query. **Branch:** missing → redirect to admin?youtube=error (or child=error).
2. supabase.auth.getUser(). **Branch:** no user → redirect error.
3. youtubeConnectionService.linkConnectionFromState(state, code, user.id) or childConnectionService.linkFromState(state, code, user.id). These verify state (signature + expiry), then exchange code and write to DB. **Branch:** invalid state or exchange failure → throw; catch redirects to error.
4. Redirect to admin?youtube=connected or child=connected.

**Possible issues:**

| # | Hypothesis | Location |
|---|------------|----------|
| 1 | **State binding to user:** Callback uses user.id from session. Service should verify that state.parentId === user.id (or at least that user is member of state.householdId). If not, a different parent could complete a flow started by another. Need to confirm linkConnectionFromState / linkFromState enforce parentId or membership. | `app/api/auth/youtube/callback/route.ts`, `app/api/auth/child/callback/route.ts`; services |
| 2 | **Silent failure:** On any exception, callback redirects to error. No logging of reason; user sees generic error. Consider logging (without sensitive data) for debugging. | Both callbacks |

---

## Flow 4: Video watch count

**Purpose:** POST /api/videos/[id]/watch increments watch_count for the video.

**Steps:**

1. Rate limit (public). Parse video id (UUID). videoService.trackWatch(id) → repository incrementWatchCount(id). No auth.

**Possible issues:**

| # | Hypothesis | Location |
|---|------------|----------|
| 1 | **Double count (modal + watch page):** Opening video in modal may call track watch; navigating to /watch/[id] also calls it. One “watch” can be counted twice. Known from CODE_REVIEW_IN_DEPTH. Product decision: accept or add idempotency/session. | Frontend + `app/api/videos/[id]/watch/route.ts` |
| 2 | **No auth:** Any client with video UUID can increment. Rate limit only mitigation. Acceptable for product or tighten (see security report). | Same route |

---

## Flow 5: Household membership and IDOR

**Purpose:** Ensure only members (or owners) can act on a household.

**Pattern:** Routes that take household_id (or resource under a household) call householdService.ensureMember(householdId, user.id) before performing the action. ensureMember checks householdRepository.isMember(householdId, parentId); if false throws NotFoundError.

**Routes checked:**

- GET/POST /api/households: use user.id from session; no arbitrary household_id from input for list/create. Safe.
- GET /api/videos?household_id=xxx: no explicit ensureMember; RLS on videos restricts to current_user_household_ids(). So even if client passes another household_id, Supabase returns only rows for that household that also belong to the user’s households; if household_id is not in user’s list, result set is empty. Safe.
- POST /api/videos: ensureMember(household_id, user.id) before add. Safe.
- DELETE /api/videos/[id]: get video by id, then ensureMember(video.household_id, user.id). Safe.
- POST /api/device-token: ensureMember(householdId, parentId) with body parentId. Caller is authenticated; parentId should equal user.id (client sends it). If client sends another parent’s ID and that parent is in the household, they could create a token for that parent. So ensureMember(householdId, parentId) does not enforce “parentId === user.id”. **Possible issue:** Should enforce parentId === user.id so a member cannot create a device token for another member. | `app/api/device-token/route.ts` |
| GET/DELETE /api/youtube-connection, GET/POST/DELETE children, POST households/[id]/members: all use ensureMember(householdId, user.id) with household from URL or body and user from session. Safe.
| DELETE /api/children/[id]: childConnectionService.deleteChild(childId, user.id); service should verify child belongs to a household the user is in. Needs quick check in child-connection.service. | `app/api/children/[id]/route.ts` |

**Possible issues:**

| # | Hypothesis | Location |
|---|------------|----------|
| 1 | **Device token for another parent:** POST /api/device-token accepts body parentId. If not constrained to session user, a member could create a token binding a different member’s parent_id to the same household. Recommend: validate parentId === user.id (or drop parentId from body and use user.id). | `app/api/device-token/route.ts` |
| 2 | **deleteChild authorization:** deleteChild(childId, user.id) should ensure the child’s household is one where user is a member. If implemented in service, OK. | `lib/services/child-connection.service.ts` |

---

## Summary of possible logic issues

1. **Parent-by-email:** Redundant second backfill when admin finds parent but households empty; listUsers(1000) cap in fallback.
2. **Device token:** In dev, cookie-only trust; in production, OK. POST /api/device-token should enforce parentId === user.id.
3. **Auth callbacks:** Verify state.parentId === user.id (or membership) in services; consider logging on error.
4. **Watch count:** Double count (modal + page); unauthenticated endpoint (accepted or tighten).
5. **Household/IDOR:** device-token parentId not tied to session; deleteChild correctly verifies household membership.

These are hypotheses; confirm in code and fix or accept by product decision.
