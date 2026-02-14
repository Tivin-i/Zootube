# Phase 2: Consolidated Findings

**Date:** 2026-02-14  
**Scope:** Merge of Phase 1 reports (architecture, security, database, tests, logic) + Refactor Cleaner (knip, depcheck, ts-prune) + Web Interface Guidelines (UI pages).

---

## 1. Prioritized findings (Critical → High → Medium)

### Critical (0)

None.

### High (2)

| ID | Source | Finding | Location |
|----|--------|---------|----------|
| H1 | Security | Device token validation fallback: when `SUPABASE_SERVICE_ROLE_KEY` is unset, `validateDeviceToken()` trusts `PARENT_ID_COOKIE_NAME` in dev. In production returns `null`; fragile if mis-deployed. | `lib/services/device-token.service.ts` (lines 111–136) |
| H2 | Logic | POST /api/device-token accepts `parentId` in body; does not enforce `parentId === user.id`. A member could create a device token for another member. | `app/api/device-token/route.ts` |

### Medium (8)

| ID | Source | Finding | Location |
|----|--------|---------|----------|
| M1 | Security | Validate-invite: when neither `BETA_INVITE_CODE` nor `BETA_INVITE_CODES` is set, API returns `valid: true` for any code → open signup. | `app/api/auth/validate-invite/route.ts` (lines 28–35) |
| M2 | Security | Watch endpoint unauthenticated: POST `/api/videos/[id]/watch` can be called by anyone with a video ID; rate limit only mitigation. | `app/api/videos/[id]/watch/route.ts` |
| M3 | DB | service_role has no grant on `public.parents`; admin fallback path (`findParentByEmailWithAdmin`, `ensureParentFromAuthByEmail` without RPC) will get permission denied. | Migrations 001/002; add grant or ensure RPC-only. |
| M4 | Logic | Auth callbacks: verify `state.parentId === user.id` (or membership) in services to prevent one parent completing another’s OAuth flow. | `app/api/auth/youtube/callback/route.ts`, `app/api/auth/child/callback/route.ts`; services |
| M5 | Logic / CODE_REVIEW | Double watch count: modal + watch page both call track watch; one “watch” can be counted twice. | Frontend (VideoModal, watch page) + `app/api/videos/[id]/watch/route.ts` |
| M6 | Security | Admin client does not reject placeholder URL/key (server client does). | `lib/supabase/admin.ts` (lines 9–15) |
| M7 | Security | Rate limit identifier from `x-forwarded-for` / `x-real-ip` can be spoofed if not behind trusted proxy. | `lib/middleware/rate-limit.ts` (lines 87–93) |
| M8 | Logic | Parent-by-email fallback: `listUsers(1000)` cap; user not in first 1000 → fallback returns null. | `lib/services/parent.service.ts` line 69 |

### Low (4)

| ID | Source | Finding | Location |
|----|--------|---------|----------|
| L1 | Architecture | Document migration order (001 → 003; 002 only if 001 predates service_role grants). Consider centralizing “require auth + ensureMember” helper. | Docs; API layer |
| L2 | Logic | Auth callbacks: consider logging (no sensitive data) on error for debugging; user sees generic error. | YouTube/child callback routes |
| L3 | Test | E2E fixture cookie names may differ from app (`voobi_device_token`, `voobi_parent_id_secure`); align or document. | `tests/fixtures/auth.ts` |
| L4 | Test | No unit tests for services, repositories, API handlers; coverage gaps for validators (non-video), rate-limit. | `__tests__/`, `lib/` |

---

## 2. Refactor / clean (non-behavioral)

### 2.1 Safe removals (from knip)

**Unused files (candidates for removal after confirmation):**

- `lib/hooks/useParentId.ts` — unused.
- `lib/validators/api-responses.validator.ts` — unused.
- `lib/validators/database.validator.ts` — unused.
- `open-next.config.ts` — knip reports unused; keep if OpenNext/Cloudflare build uses it (check `build:cloudflare`).
- `scripts/list-users.js` — dev/ops script; keep or move to `scripts/` and exclude from knip.

**Unused devDependencies (knip):**

- `@testing-library/react`, `@testing-library/user-event` — reported by knip; used by Jest/Testing Library tests. **Do not remove** unless tests are removed.

**Unlisted dependency:**

- `postcss` — used by `postcss.config.mjs`; add to `package.json` devDependencies or document.

### 2.2 Unused exports (knip / ts-prune)

**Safe to consider for removal or keep for API stability:**

- `components/ui/table.tsx`: `TableFooter`, `TableCaption` — unused; remove if UI never uses them.
- `lib/errors/app-errors.ts`: `ForbiddenError` — unused; remove or keep for future use.
- Repository classes exported but only used via dependency injection / instantiation inside same file: e.g. `SupabaseHouseholdChildrenRepository`, `SupabaseHouseholdRepository`, etc. — keep if used dynamically or by tests; otherwise consider not exporting.
- `lib/services/device-token.service.ts`: `setParentIdCookie` — used internally and possibly in dev path; keep.
- `lib/services/youtube-oauth.service.ts`: `decryptRefreshToken` — unused externally; can stay internal.
- `lib/utils/constants.ts`: many rate-limit/cache constants — used by middleware/services; verify then keep or inline.
- `lib/utils/fullscreen.ts`: `exitFullscreen`, `isFullscreen` — used or only `enterFullscreen`? If unused, remove.
- `lib/validators/household.validator.ts`: `householdQuerySchema` — use or remove.
- `lib/validators/parent.validator.ts`: `emailSchema`, `deviceTokenSchema` — use or remove.
- `tests/fixtures/auth.ts`: `clearDeviceToken` — export for E2E if needed; else remove.
- `tests/fixtures/test-data.ts`: `waitForCondition` — same.

**Note:** Many ts-prune “unused” entries are default exports (pages, API handlers) or types “used in module”; only remove after manual check.

### 2.3 depcheck

depcheck reported “unused” devDependencies that are actually used by config/tooling:

- `@tailwindcss/postcss`, `tailwindcss`, `prettier`, `prettier-plugin-tailwindcss` — used by PostCSS/Tailwind/Prettier config. **Do not remove.**
- `@types/jest`, `jest-environment-jsdom`, `@types/react-dom` — used by Jest. **Do not remove.**

No safe dependency removals recommended from depcheck without verifying each.

---

## 3. Web Interface Guidelines (a11y / forms / focus)

**Scope:** `app/link-device/page.tsx`, `app/feed/page.tsx`, `app/watch/[id]/page.tsx`, `app/admin/page.tsx`, `app/admin/login/page.tsx`, `app/admin/signup/page.tsx`, `components/AdminDashboard.tsx`, `components/KidsHeader.tsx`.

### app/link-device/page.tsx

- `app/link-device/page.tsx:219` — Success state SVG decorative; add `aria-hidden="true"`.
- `app/link-device/page.tsx:171` — Placeholder "parent@example.com"; guidelines suggest placeholders end with "…" for example pattern; optional for email.

### app/feed/page.tsx

- `app/feed/page.tsx:221` — Empty state SVG decorative; add `aria-hidden="true"`.
- Otherwise: labels, aria-live, focus-visible, loading "…" present. ✓

### app/watch/[id]/page.tsx

- `app/watch/[id]/page.tsx:143` — Error state SVG has `aria-hidden="true"`. ✓
- Loading "…", focus-visible on buttons. ✓

### app/admin/login/page.tsx

- `app/admin/login/page.tsx:105` — Error block: add `aria-live="polite"` for async error updates.
- Labels sr-only; focus-visible present. ✓

### app/admin/signup/page.tsx

- `app/admin/signup/page.tsx:182` — Error block: add `role="alert"` and `aria-live="polite"`.
- `app/admin/signup/page.tsx:187` — Success message: add `aria-live="polite"`.
- `app/admin/signup/page.tsx:199` — "Creating account..." → use "…" not "..." (Typography rule).
- Checkbox + label, focus-visible. ✓

### components/KidsHeader.tsx

- Back button has `aria-label="Go back to home"`. ✓
- Menu/icon buttons: ensure all have `aria-label` (e.g. unlink, profile switcher). Verify in full file.

### components/AdminDashboard.tsx

- Full a11y pass recommended: toasts (aria-live), form labels, icon buttons (aria-label), focus order. Not enumerated line-by-line here; include in Phase 3 cleanup if desired.

---

## 4. Summary counts

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 2 |
| Medium | 8 |
| Low | 4 |
| Refactor/clean (safe removals, unused exports) | See §2 |
| Web (a11y/forms) | 6+ items |

---

## 5. References

- Architecture: `docs/reviews/phase1-architecture-review.md`
- Security: `docs/reviews/phase1-security-report.md`
- Database: `docs/reviews/phase1-database-review.md`
- Tests: `docs/reviews/phase1-test-report.md`
- Logic: `docs/reviews/phase1-logic-walkthrough.md`
- In-depth code review: `.cursor/plans/CODE_REVIEW_IN_DEPTH.md`
