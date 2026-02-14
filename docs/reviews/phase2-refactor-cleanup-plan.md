# Phase 2: Refactor and Cleanup Plan

**Date:** 2026-02-14  
**Purpose:** What to remove, consolidate, and fix (with file references) before Phase 3 implementation. Do not implement in Phase 2; proceed to Phase 3 only after agreement.

---

## Part A: Behavior / security fixes (from consolidated findings)

Apply in Phase 3; order by priority.

### High priority

1. **H1 – Device token validation (dev fallback)**  
   - **File:** `lib/services/device-token.service.ts`  
   - **Action:** Keep production guard (no cookie-only when no admin). Optionally remove cookie-only fallback entirely or document “dev-only, never in production.” Ensure deployment checklist requires `SUPABASE_SERVICE_ROLE_KEY` in production.

2. **H2 – Device-token route: enforce parentId === user.id**  
   - **File:** `app/api/device-token/route.ts`  
   - **Action:** After parsing body, validate `parentId === (await getUser()).id`; return 403 if not. Alternatively, ignore body `parentId` and use session `user.id` only.

### Medium priority

3. **M1 – Validate-invite when no codes set**  
   - **File:** `app/api/auth/validate-invite/route.ts`  
   - **Action:** In production, when `allowedCodes.length === 0`, return `valid: false` (or fail startup/health check). Document that production must set `BETA_INVITE_CODE` or `BETA_INVITE_CODES`.

4. **M2 – Watch endpoint unauthenticated**  
   - **File:** `app/api/videos/[id]/watch/route.ts`  
   - **Action:** Product decision: accept (document) or add auth/device-token and/or idempotency (e.g. session/user once per time window).

5. **M3 – service_role grant on public.parents**  
   - **File:** New migration (e.g. `migrations/004_service_role_parents.sql`) or add to 002/001 if still in flux.  
   - **Action:** If admin fallback path is required: `GRANT SELECT, INSERT, UPDATE ON public.parents TO service_role;`. Otherwise document that only RPC path is used and fallback is dev-only.

6. **M4 – Auth callbacks: state binding to user**  
   - **Files:** `lib/services/youtube-oauth.service.ts` (or youtube-connection), `lib/services/child-oauth.service.ts`; callbacks in `app/api/auth/youtube/callback/route.ts`, `app/api/auth/child/callback/route.ts`  
   - **Action:** In services that consume state, verify `state.parentId === user.id` (or user is member of `state.householdId`). Reject and redirect to error if not.

7. **M5 – Double watch count**  
   - **Files:** Modal: component that calls track watch (e.g. `components/VideoModal.tsx`); watch page: `app/watch/[id]/page.tsx`; API: `app/api/videos/[id]/watch/route.ts`  
   - **Action:** Product decision: e.g. track only on watch page and remove track from modal; or add idempotency key/session window.

8. **M6 – Admin client placeholder check**  
   - **File:** `lib/supabase/admin.ts`  
   - **Action:** Reuse same placeholder check as `lib/supabase/server.ts`; if URL or key is placeholder, return `null`.

9. **M7 – Rate limit identifier**  
   - **File:** `lib/middleware/rate-limit.ts`  
   - **Action:** Document that app must run behind trusted proxy that sets `x-forwarded-for` / `x-real-ip`. Optional: configurable trust proxy or fallback identifier.

10. **M8 – listUsers(1000) cap**  
    - **File:** `lib/services/parent.service.ts`  
    - **Action:** Document edge case; optionally paginate or use Auth Admin API by email if available to avoid cap.

### Low priority

11. **L1 – Migration order + ensureMember helper**  
    - **Files:** `docs/setup.md` or migration README; optionally new `lib/api-helpers.ts` or similar  
    - **Action:** Document 001 → 003 (002 if needed). Optionally add helper “requireAuthAndEnsureMember(householdId)” used by routes.

12. **L2 – Auth callback error logging**  
    - **Files:** `app/api/auth/youtube/callback/route.ts`, `app/api/auth/child/callback/route.ts`  
    - **Action:** Log error reason (no secrets) before redirecting to error URL.

13. **L3 – E2E cookie names**  
    - **File:** `tests/fixtures/auth.ts`; app constants in `lib/utils/constants.ts`  
    - **Action:** Align fixture cookie names with app or document difference.

14. **L4 – Test coverage**  
    - **Files:** `__tests__/lib/`; add tests for validators (parent, household), rate-limit, optional service/repo tests  
    - **Action:** Add unit tests for high-value logic; consider 1–2 integration tests for critical API routes.

---

## Part B: Refactor / dead code and dependencies

### B.1 Files to remove (after confirmation)

| File | Reason |
|------|--------|
| `lib/hooks/useParentId.ts` | Unused (knip). |
| `lib/validators/api-responses.validator.ts` | Unused (knip). |
| `lib/validators/database.validator.ts` | Unused (knip). |

**Do not remove:**  
- `open-next.config.ts` — Likely used by Cloudflare/OpenNext build; confirm with `build:cloudflare` before removing.  
- `scripts/list-users.js` — Keep as dev/ops script; exclude from knip if needed.

### B.2 Unused exports to remove or keep

- **`components/ui/table.tsx`:** `TableFooter`, `TableCaption` — Remove if no usage in codebase.
- **`lib/errors/app-errors.ts`:** `ForbiddenError` — Remove if never used; or keep for future.
- **`lib/utils/fullscreen.ts`:** `exitFullscreen`, `isFullscreen` — Remove if only `enterFullscreen` is used.
- **`lib/validators/household.validator.ts`:** `householdQuerySchema` — Remove if unused.
- **`lib/validators/parent.validator.ts`:** `emailSchema`, `deviceTokenSchema` — Remove if unused; or keep for API consistency.
- **Repository/service class exports** — Keep if used by tests or DI; otherwise can be made non-exported (same file only).
- **Constants** (`lib/utils/constants.ts`) — Used by middleware/services; do not remove without verifying each reference.

### B.3 Dependencies

- **postcss:** Add to `package.json` devDependencies (used by `postcss.config.mjs`) or document as peer/build dependency.
- **Do not remove** devDependencies reported by depcheck/knip that are used by Jest, Tailwind, PostCSS, or Prettier (see consolidated findings §2.3).

### B.4 Duplicate or redundant code

- No explicit duplicate modules identified. Optional: centralize “require auth + ensureMember” (see L1).

---

## Part C: Web Interface Guidelines (a11y / forms)

### C.1 Quick wins

| File | Change |
|------|--------|
| `app/link-device/page.tsx` | Success SVG (around line 219): add `aria-hidden="true"`. |
| `app/feed/page.tsx` | Empty state SVG (around line 221): add `aria-hidden="true"`. |
| `app/admin/login/page.tsx` | Error block: add `aria-live="polite"`. |
| `app/admin/signup/page.tsx` | Error block: add `role="alert"` and `aria-live="polite"`. Success block: add `aria-live="polite"`. Replace "Creating account..." with "Creating account…". |

### C.2 Follow-up

- **KidsHeader:** Ensure every icon-only button has `aria-label`.
- **AdminDashboard:** Toasts (aria-live), form labels, icon buttons (aria-label), focus order — full pass in Phase 3 if desired.

---

## Part D: Implementation order (Phase 3 suggestion)

1. **Refactor Cleaner (safe only):** Remove unused files (B.1), remove clearly unused exports (B.2), add postcss if needed (B.3). Document in `docs/DELETION_LOG.md`.
2. **High (H1, H2):** Device token validation and device-token route parentId check.
3. **Medium (M3, M6, M4, M1, M7, M2, M5, M8):** DB grant, admin placeholder, auth state binding, validate-invite, rate-limit doc, watch endpoint decision, double-count decision, listUsers doc.
4. **Web (C.1):** a11y quick wins.
5. **Low (L1–L4):** Docs, logging, E2E fixtures, tests.
6. **Code Reviewer:** Run on all modified files after Phase 3 implementation.

---

## File reference index

| Area | Files |
|------|--------|
| Device token | `lib/services/device-token.service.ts`, `app/api/device-token/route.ts` |
| Auth | `app/api/auth/validate-invite/route.ts`, `app/api/auth/youtube/callback/route.ts`, `app/api/auth/child/callback/route.ts`, `lib/services/youtube-oauth.service.ts`, `lib/services/child-oauth.service.ts` |
| Watch | `app/api/videos/[id]/watch/route.ts`, `app/watch/[id]/page.tsx`, VideoModal |
| Supabase | `lib/supabase/admin.ts`, `lib/supabase/server.ts` |
| Rate limit | `lib/middleware/rate-limit.ts` |
| Parent | `lib/services/parent.service.ts` |
| Migrations | `migrations/001_schema.sql`, `002_service_role_grants.sql`, `003_ensure_parent_from_auth.sql` |
| UI | `app/link-device/page.tsx`, `app/feed/page.tsx`, `app/watch/[id]/page.tsx`, `app/admin/login/page.tsx`, `app/admin/signup/page.tsx`, `components/KidsHeader.tsx`, `components/AdminDashboard.tsx` |
| Tests | `tests/fixtures/auth.ts`, `__tests__/lib/` |
