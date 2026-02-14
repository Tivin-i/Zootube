# Phase 1: Test Report

**Reviewer:** TDD / Test coverage (subagent)  
**Date:** 2026-02-13  
**Scope:** Unit tests (`__tests__/`), E2E tests (`tests/e2e/`), Jest config, coverage thresholds.

---

## Summary

- **Unit tests:** Jest; located under `__tests__/` (and matched by `**/?(*.)+(spec|test).[jt]s?(x)` excluding `tests/e2e/`). Cover error-handler, validators (video), cache, duration.
- **E2E tests:** Playwright in `tests/e2e/`; page objects and auth fixtures in `tests/pages/`, `tests/fixtures/`.
- **Coverage:** Jest `coverageThreshold` in `jest.config.js` is 50% (branches, functions, lines, statements). Run `npm run test:coverage` for current numbers.
- **Gaps:** No unit tests for services (parent, household, device-token, video, youtube, child), repositories, or API route handlers. No integration tests against a test DB. E2E rely heavily on mocks; some specs mock APIs end-to-end.

---

## Unit Tests (Jest)

| Path | What’s tested |
|------|----------------|
| `__tests__/lib/utils/error-handler.test.ts` | `handleApiError` for ValidationError, NotFoundError, UnauthorizedError, RateLimitError, AppError, ZodError, unknown |
| `__tests__/lib/utils/cache.test.ts` | Cache get/set/TTL, key names |
| `__tests__/lib/utils/duration.test.ts` | Duration formatting |
| `__tests__/lib/validators/video.validator.test.ts` | youtubeVideoIdSchema, youtubeUrlSchema, videoIdParamSchema, createVideoSchema, videoQuerySchema |

**Not covered by unit tests:**

- `lib/services/*` (parent, household, device-token, video, youtube-connection, child-connection, youtube-oauth, child-oauth)
- `lib/repositories/*`
- `lib/validators/*` other than video (parent, household, database, api-responses, youtube)
- `lib/utils/error-handler` is covered; `lib/utils/app-url`, `constants`, `fullscreen` are not
- Any API route handler (no route-level unit or integration tests)
- `lib/middleware/rate-limit.ts` (in-memory and Upstash behavior)

---

## E2E Tests (Playwright)

| Spec | Focus |
|------|--------|
| `admin-signup.spec.ts` | Signup page UI (invite code, email, password, submit, log in link) |
| `admin-login.spec.ts` | Login page and form |
| `navigation.spec.ts` | Navigation flows |
| `device-linking.spec.ts` | Redirect when not linked, link form, invalid email (with API mock), success path (mocked) |
| `video-browsing.spec.ts` | Redirect when not linked, loading state, videos when available (mocked), no-videos state (mocked) |
| `video-watching.spec.ts` | Watch page player visibility, play button; mocks `/api/videos` and `/api/videos/*/watch` |
| `multi-parent-household.spec.ts` | Multi-parent household flows |

**Fixtures:** `tests/fixtures/auth.ts` (device token mock), `tests/fixtures/test-data.ts` (TEST_EMAILS, TEST_PARENT_IDS, TEST_VIDEOS). Cookie names in fixtures may differ from app (`voobi_device_token`, `voobi_parent_id_secure`) — document or align for tests that assert on real cookies.

**Pattern:** Many E2E tests stub API routes (`page.route('**/api/...')`) and set device token cookies so the app thinks the device is linked. This validates UI and redirect behavior but not real API or DB behavior. Consider a small set of E2E tests against a real test backend for critical flows (e.g. link-device → parent-by-email → device-token).

---

## Jest Configuration

- **jest.config.js:** Next.js Jest, jsdom, `@/` → `<rootDir>/`, testMatch for `__tests__` and `*.test/spec`, **testPathIgnorePatterns** includes `tests/e2e/` so Playwright specs are not run by Jest.
- **collectCoverageFrom:** `lib/**`, `app/**`, `components/**` (excludes .d.ts, node_modules, .next).
- **coverageThreshold:** 50% global (branches, functions, lines, statements).

Running `npm run test` runs only Jest; `npm run test:e2e` runs Playwright. No cross-contamination.

---

## Recommendations

1. **Unit tests:** Add tests for high-value, pure logic: validators (parent, household), error-handler edge cases, rate-limit in-memory behavior. Optionally unit-test services with mocked repositories.
2. **Integration tests:** Consider a few API route tests (e.g. with MSW or a test Supabase project) for `/api/parent-by-email`, `/api/device-token`, `/api/health`.
3. **Coverage:** Run `npm run test:coverage` regularly; if coverage is below 50%, add tests or adjust threshold intentionally. TDD skill targets 80% — treat as a goal for new code.
4. **E2E:** Document that most E2E tests use mocks; add 1–2 “real backend” E2E flows if the team wants to catch API/DB regressions. Align fixture cookie names with app constants if tests ever assert on cookies.
5. **Stability:** Use `waitForLoadState('networkidle')` or explicit waits where needed; avoid flaky selectors (prefer role/label over brittle DOM).

---

## Files Referenced

- `jest.config.js`, `jest.setup.js`
- `__tests__/lib/**/*.test.ts`
- `tests/e2e/*.spec.ts`, `tests/fixtures/*.ts`, `tests/pages/*.ts`
- `package.json` scripts: `test`, `test:coverage`, `test:e2e`
