# In-Depth Code Review – SafeTube / ZooTube

**Date:** 2026-01-29  
**Scope:** Full codebase review; Docker up; CLI testing with verified user `zootube@elijah.anonmail.work`

---

## Executive Summary

- **Build:** ✅ Passes (`npm run build`)
- **Unit tests:** ✅ 32 tests pass after excluding Playwright specs from Jest
- **Docker health:** ✅ `GET /api/health` returns 200
- **Verified user lookup:** ⚠️ `GET /api/parent-by-email?email=zootube@elijah.anonmail.work` returns **404** – see “Data / deployment” below

**Fixes applied in this review:**

1. **Jest:** Excluded `tests/e2e/` so Jest no longer runs Playwright specs (avoids “Class extends value undefined”).
2. **Server Supabase:** Added env validation in `lib/supabase/server.ts` so missing or placeholder URL/key throw a clear error instead of passing `undefined` into the client.

---

## 1. What’s Working Well

- **API design:** Clear route layout; validators (Zod) on inputs; shared `handleApiError` and custom errors (NotFound, Unauthorized, Validation, RateLimit).
- **Layers:** API → services → repositories; video/parent/YouTube/device-token services are separated and testable.
- **Auth:** Admin uses Supabase Auth; device linking uses parent-by-email + device-token cookie; home page auto-links when parent is logged in.
- **Security:** Rate limiting (in-memory when Redis not set); RLS-oriented design; parent_id required for video list; delete/write checks ownership.
- **Caching:** In-memory cache for YouTube metadata and video list with TTL; cache invalidation on add/delete.
- **Docker:** Health check, standalone build, env at build time documented.

---

## 2. Issues Found (and Fixes)

### 2.1 Jest running Playwright E2E specs – **FIXED**

- **Problem:** `npm test` was matching `tests/e2e/*.spec.ts`. Those files use `import { test } from '@playwright/test'`, so Jest tried to run them and failed with “Class extends value undefined is not a constructor or null”.
- **Fix:** In `jest.config.js`, added `testPathIgnorePatterns: ['/node_modules/', '/.next/', '/tests/e2e/']` so only unit tests in `__tests__/` (and other non-E2E specs) run under Jest. E2E should be run with `npm run test:e2e`.

### 2.2 Server Supabase client with missing env – **FIXED**

- **Problem:** `lib/supabase/server.ts` used `process.env.NEXT_PUBLIC_SUPABASE_URL!` and `..._ANON_KEY!`. If env was missing or still placeholder, the client could get `undefined` and fail in a hard-to-diagnose way.
- **Fix:** Read env into variables, then validate (non-empty, not placeholder) and throw a clear error before calling `createServerClient`. Aligns with the validation already done in `lib/supabase/client.ts`.

### 2.3 Double watch count (modal + watch page)

- **Behavior:** Opening a video in `VideoModal` on the home page triggers `POST /api/videos/[id]/watch` in a `useEffect`. Navigating to `/watch/[id]` also calls the same endpoint in `fetchVideoAndRecommendations`. So one “watch” (open modal → then go to full watch page) can be counted twice.
- **Suggestion:** Either:
  - Do **not** call track watch from the modal (treat modal as preview only), or
  - Track only on the watch page and remove the call from the modal, or
  - Introduce a “session” or idempotency so the same watch isn’t counted twice in a short window.  
  Left as a product/UX decision; no code change applied.

### 2.4 Device token validation trusts parent_id cookie

- **Behavior:** In `lib/services/device-token.service.ts`, `validateDeviceToken()` effectively uses `PARENT_ID_COOKIE_NAME` to determine the parent. The `DEVICE_TOKEN_COOKIE_NAME` cookie is set but not used for validation. So anyone who can set cookies (e.g. in the same origin) could set `safetube_parent_id_secure` and be treated as that parent.
- **Risk:** Low if the app is only used in a trusted context (e.g. at home). For higher assurance, the service should validate the device token (e.g. stored in DB or signed) and map it to a parent_id, and not rely only on a second cookie for identity. The TODOs in the file already mention this.

---

## 3. Data / Deployment

### Verified user `zootube@elijah.anonmail.work`

- **Observed:** `GET /api/parent-by-email?email=zootube%40elijah.anonmail.work` returns **404** with body `{"error":"Parent account not found","code":"NOT_FOUND"}` (HTTP 404).
- **Implications:**
  - Either the **parents** table has no row with that email, or
  - The **migration** that syncs `auth.users` → `parents` has not been run on this Supabase project, or
  - The Auth user was created with a different email (e.g. casing, typo).
- **What to do:**  
  - Run `migrations/001_create_parents_table_and_sync.sql` on the Supabase DB (creates `parents`, trigger, and backfill from `auth.users`).  
  - In Supabase Dashboard, confirm there is a user with email `zootube@elijah.anonmail.work` and that `parents` has a row with the same `id` and `email`.

---

## 4. Minor / Non-Blocking

- **GET /api/videos:** Requires `parent_id` (validated as UUID). Calling without `parent_id` correctly returns 400. No bug.
- **Error handler:** `handleApiError` uses `console.error`; unit tests trigger it and add noise. Consider a small logger abstraction so tests can suppress or mock.
- **E2E fixture cookie name:** `tests/fixtures/auth.ts` uses cookie name `device_token`; the app uses `safetube_device_token` and `safetube_parent_id_secure`. E2E mocks may need to align if tests ever assert on real cookies.
- **YouTube API key:** `lib/youtube.ts` uses `process.env.YOUTUBE_API_KEY`. If missing, the Google client may fail on first use. Optional: check at startup or in the route that uses it and return a clear error.

---

## 5. Testing Commands Run

```bash
npm run build          # OK
npm test               # OK after excluding tests/e2e
curl http://localhost:10100/api/health                    # 200
curl "http://localhost:10100/api/parent-by-email?email=zootube%40elijah.anonmail.work"  # 404 (see §3)
```

---

## 6. Files Touched in This Review

| File | Change |
|------|--------|
| `jest.config.js` | Added `testPathIgnorePatterns` to exclude `tests/e2e/` |
| `lib/supabase/server.ts` | Validate Supabase URL/key before creating client; throw clear error if missing or placeholder |
| `CODE_REVIEW_IN_DEPTH.md` | New in-depth review (this file) |

---

## 7. Recommendations

1. **Run migration:** Ensure `001_create_parents_table_and_sync.sql` is applied so `zootube@elijah.anonmail.work` (and any other Auth users) exist in `parents` and device linking works.
2. **Watch count:** Decide whether the modal should trigger a watch and, if not, remove the track call from `VideoModal` to avoid double count.
3. **Device token:** When adding a `device_tokens` table (or similar), validate the token server-side and derive parent_id from it instead of trusting only the parent_id cookie.
4. **E2E:** Run `npm run test:e2e` against a stack (e.g. Docker + test Supabase) to confirm full flows; keep Jest for unit tests only.
