# Code review: Household create and share

**Feature:** Parent can create a household and share it with another parent (invite guardian by email).

**Files changed:**
- `lib/repositories/household.repository.ts` – `findMembersWithEmailByHouseholdId`, `findMemberRole`; `HouseholdMemberWithEmail` interface
- `lib/services/household.service.ts` – owner-only invite, duplicate-member check, `getMembersWithEmails`
- `app/api/households/[id]/members/route.ts` – GET members, POST (existing) with owner enforced in service
- `components/admin/HouseholdGuardiansBlock.tsx` – new component (list members, invite form for owner)
- `components/AdminDashboard.tsx` – Guardians block, New list button, create household form
- `CHANGELOG.md` – entry for the feature

## Review checklist

- **Auth:** GET/POST members require authenticated user; POST uses `user.id` as inviter; service enforces membership then owner role.
- **Authorization:** Only household owner can invite (ForbiddenError for non-owner). GET members restricted to household members via `ensureMember`.
- **Input validation:** `householdId` via `householdIdSchema` (UUID); invite body via `inviteMemberSchema` (email); create household body via `createHouseholdSchema` (name 1–100 chars). Duplicate invite returns ValidationError with clear message.
- **Errors:** NotFoundError (parent not found), ForbiddenError (not owner), ValidationError (already member). Handled by `handleApiError` with appropriate status codes.
- **UI:** No secrets in client; credentials: "include" for API calls; owner sees invite form only; create form has maxLength 100; errors and success messages shown.
- **Build/lint/tests:** `npm run build`, `npx tsc --noEmit`, `npm run test` (32 tests) passed.

**Result:** No critical or high issues. Feature ready for use.
