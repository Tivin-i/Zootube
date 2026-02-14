# Optional Phase: Code Reviewer Pass

**Plan:** Architecture Security Tests Review – Optional phase  
**Date:** 2026-02-14  
**Subagent:** Code Reviewer  
**Scope:** Files involved in the five logic-walkthrough flows (read-only).

---

## Files reviewed

| File | Role in flows |
|------|----------------|
| `app/api/parent-by-email/route.ts` | Flow 1: Parent-by-email |
| `app/api/device-token/route.ts` | Flow 2: Device token |
| `lib/services/device-token.service.ts` | Flow 2 |
| `app/api/auth/youtube/callback/route.ts` | Flow 3: Auth callbacks |
| `app/api/auth/child/callback/route.ts` | Flow 3 |
| `lib/services/youtube-connection.service.ts` | Flow 3 |
| `lib/services/child-connection.service.ts` | Flow 3, 5 |
| `app/api/videos/[id]/watch/route.ts` | Flow 4: Watch count |
| `lib/services/video.service.ts` | Flow 4 |
| `lib/services/household.service.ts` | Flow 5: ensureMember |
| `app/api/videos/route.ts` | Flow 5 (POST) |
| `app/api/videos/[id]/route.ts` | Flow 5 (DELETE) |

---

## Checklist results

- **Code is simple and readable:** Yes; route → service → repository layering is clear.
- **Functions and variables well-named:** Yes (e.g. ensureMember, validateDeviceToken, linkConnectionFromState).
- **No duplicated code:** ensureMember reused; OAuth state verification in respective services.
- **Proper error handling:** handleApiError; NotFoundError, UnauthorizedError, ValidationError used appropriately.
- **No exposed secrets:** Env vars for Supabase; no hardcoded keys.
- **Input validation:** Zod schemas on query/body/params in all routes reviewed.
- **Performance:** No N+1 or obvious inefficiencies in flow paths.

---

## Findings by priority

### Critical

None.

### High

None.

### Warnings (should fix / consider)

1. **Route size / testability**  
   **File:** `app/api/parent-by-email/route.ts`  
   **Issue:** Route contains non-trivial branching (RLS fail → admin → backfill → households empty → retry).  
   **Suggestion:** Extract "resolve parent id and households by email" into a single service method (e.g. `parentService.resolveParentAndHouseholdsByEmail(email)`) so the route is a thin wrapper and the logic is unit-testable without hitting the route.

2. **Logging in callbacks**  
   **Files:** `app/api/auth/youtube/callback/route.ts`, `app/api/auth/child/callback/route.ts`  
   **Issue:** `console.error` in catch; no structured logger.  
   **Suggestion:** Use a small logger abstraction (or existing project logger) so tests can suppress and production can route to monitoring; ensure no sensitive data in messages (current messages are safe).

### Suggestions (consider improving)

1. **JSDoc for fallback cap**  
   **File:** `lib/services/parent.service.ts`  
   **Issue:** `listUsers({ page: 1, perPage: 1000 })` implies users beyond the first 1000 are not found by fallback.  
   **Suggestion:** Add a one-line JSDoc: "Fallback uses listUsers(1000); users not in the first page are not backfilled."

2. **Magic number**  
   **File:** `lib/services/parent.service.ts` (listUsers perPage)  
   **Suggestion:** Named constant e.g. `const AUTH_LIST_USERS_PAGE_SIZE = 1000` for clarity.

---

## Approval

- **Result:** Approve (no Critical or High issues).
- **Recommendation:** Optional phase logic walkthrough and this pass are complete; address Warnings/Suggestions when convenient.
