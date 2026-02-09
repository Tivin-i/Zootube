# Phase 1 E2E Coverage and Stability Report

**Date:** 2026-02-04  
**Reviewer:** e2e-runner (Phase 1)  
**Scope:** Test suite structure, selectors, critical flows, environment requirements

---

## Summary

- **Test files:** 5 (device-linking, multi-parent-household, navigation, video-browsing, video-watching)
- **Test cases:** 20+ across 3 browser projects (chromium, firefox, webkit)
- **Node requirement:** Next.js 16 requires Node >= 20.9.0; E2E webServer runs `npm run dev` — ensure Node 20+ for local/CI or use Docker.
- **Port:** Playwright uses port 3001 (configured in playwright.config.ts) to avoid conflict with other apps.

---

## Environment Requirements

### Node.js
- **Next.js 16** requires **Node >= 20.9.0**.
- If Node 18 is used, the dev server may fail to start and E2E will fail (see `.cursor/plans/E2E_TEST_FIX_PLAN.md`).
- **Recommendation:** Use Node 20+ for local E2E; in CI use a matrix or Docker with Node 20.

### Docker (alternative)
- E2E can be run inside Docker (e.g. docker-compose) with Node 20 and Playwright browsers installed; document in README.

### Port
- `playwright.config.ts` uses `PORT=3001` and `baseURL: http://localhost:3001`. No change needed unless port 3001 is in use.

---

## Test Structure

| File | Focus |
|------|--------|
| device-linking.spec.ts | Redirect when not linked, form display, validation, error/loading |
| video-browsing.spec.ts | Redirect, loading, video display, empty state, errors, interactions |
| video-watching.spec.ts | Player, title, error handling, watch tracking, recommendations |
| navigation.spec.ts | Page navigation, state persistence, browser history |
| multi-parent-household.spec.ts | Multi-household / link-device flow with households |

Page objects: `HomePage`, `LinkDevicePage`, `WatchPage` in `tests/pages/`.

---

## data-testid Gaps (Selector Stability)

Most tests use **aria-label**, **role**, or **class/text** selectors instead of `data-testid`. This can cause flakiness when copy or styles change.

| Location | Current selector | Recommendation |
|----------|------------------|----------------|
| HomePage | `button[aria-label^="Watch"]` | Add `data-testid="video-card"` or `data-testid="video-card-{id}"` to video buttons. |
| HomePage | `.animate-spin` | Add `data-testid="loading-spinner"` where loading is shown. |
| HomePage | `.text-red-800`, `[class*="red-800"]` | Add `data-testid="error-message"` for error state. |
| HomePage | `getByRole('heading', { name: 'No Videos Yet' })` | OK (role + name); optional `data-testid="empty-state"`. |
| WatchPage | `h1, h2.text-xl, [data-testid="video-title"]` | Prefer single `data-testid="video-title"` on watch page. |
| LinkDevicePage | (form elements) | Add `data-testid="link-device-email"`, `data-testid="link-device-submit"`, `data-testid="link-device-error"` for stability. |

**Action for Phase 4:** Add these `data-testid` attributes to components and update page objects to use them where beneficial.

---

## Critical Flows – Coverage

| Flow | Covered | Notes |
|------|---------|--------|
| Device not linked → redirect to link-device | Yes | device-linking, video-browsing |
| Link device (email → household → cookie) | Yes | device-linking, multi-parent-household (mocked APIs) |
| Home feed load (with token) | Yes | video-browsing (mocked) |
| Video play / watch page | Yes | video-watching (mocked) |
| Watch tracking (POST watch) | Yes | video-watching |
| Admin login | **No** | No E2E for /admin/login or dashboard. |
| Admin add/delete video | **No** | No E2E for dashboard CRUD. |
| YouTube OAuth connect | **No** | Optional feature; lower priority. |

**Recommendation:** Add E2E for admin login and, if feasible, one happy-path “add video” flow (can be mocked or test account) in Phase 4.

---

## Flaky Risk

- **Loading/network:** Tests use mocks for `/api/videos`, `/api/parent-by-email`, and device token; this reduces flakiness. `waitForVideos()` uses a race between video cards and “No Videos Yet” which is reasonable.
- **Animation/timing:** No hard `waitForTimeout` observed; prefer `waitForLoadState` and locator waits.
- **Cookie names:** Fixtures use cookie names; app uses `safetube_device_token` and `safetube_parent_id_secure`. E2E fixtures (e.g. auth.ts) should align with these names when setting cookies for tests (already noted in CODE_REVIEW_IN_DEPTH).

---

## Playwright Config

- **Config path:** `playwright.config.ts`
- **Port:** 3001
- **webServer:** `PORT=3001 npm run dev`; reuseExistingServer when not in CI.
- **Reporters:** html, junit, json.
- **Trace:** on-first-retry; screenshot only-on-failure; video retain-on-failure.

No config change required for Phase 1; Phase 4 may add `data-testid` and optionally expand projects (e.g. mobile).

---

## Recommendations (for Phase 4)

1. **Node / CI:** Document in README that E2E requires Node 20+ (or Docker); add CI step with Node 20 and `npx playwright install --with-deps` and `npx playwright test`.
2. **Selectors:** Add `data-testid` to key elements (video card, loading, error, link-device form, video title on watch page) and switch page objects to use them.
3. **Critical flows:** Add admin login E2E and, if possible, one add-video flow.
4. **Fixtures:** Align cookie names in tests with app constants (`safetube_device_token`, `safetube_parent_id_secure`).

---

## Phase 4 update (2026-02-05)

- **Selectors (Phase 3):** `data-testid` added on home (`loading-spinner`, `error-message`, `empty-state`, `video-card`), link-device (`link-device-email`, `link-device-submit`, `link-device-error`, `link-device-success`), watch (`loading-spinner`, `watch-error-state`, `video-title`). Page objects (HomePage, LinkDevicePage, WatchPage) updated to use them.
- **Admin login:** Smoke spec added (`tests/e2e/admin-login.spec.ts`): login page loads, form and sign-up link visible. Admin login page has `data-testid="admin-login-email"`, `admin-login-password`, `admin-login-submit`, `admin-login-error`.
- **Docs:** README and docs/setup.md updated with E2E section (Node 20+, port 3001, `npm run test:e2e`, CI and Docker pointers).
