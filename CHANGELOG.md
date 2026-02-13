# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- **Set up device: "No account found with this email":** Parent lookup by email was case-sensitive while Supabase Auth stores emails in the original sign-up case. Device linking now uses a case-insensitive match (ILIKE with escaped pattern) so the parent is found regardless of email casing.

- **Admin dashboard: OAuth options and Analytics/Video list not loading:** When the households API failed or returned an empty list, `selectedHouseholdId` stayed null, so the Child accounts section (YouTube and linked-children OAuth) and the video/analytics sections never loaded. Fixes: (1) Households fetch now uses `credentials: "include"` and exposes a retry on error. (2) When the list is empty, the dashboard shows a “No household yet” state with a form to create the first household. (3) When no household is selected, video/analytics loading state is cleared so the UI does not show an endless “Loading…”. (4) Safety notice JSX structure corrected so the main content stays inside the layout container. (5) Child accounts and OAuth blocks are shown only when at least one household exists.

### Changed

- **Docker runs in development mode:** Dockerfile no longer runs a production build; it installs deps, copies source, and runs `next dev`. Production builds are done by Cloudflare when building from the repo. Docker Compose build args for `NEXT_PUBLIC_*` removed (env is provided at runtime via `.env` and `environment`). Health check start period increased to 15s for dev server startup.

- **Docker skips Cloudflare dev init:** In Docker, `initOpenNextCloudflareForDev()` is skipped via `SKIP_CLOUDFLARE_DEV_INIT=1` so the Cloudflare workerd binary is never spawned. workerd is glibc-only and fails on Alpine (musl) with "fcntl64: symbol not found". Cloudflare bindings still work when running `next dev` on the host.

- **allowedDevOrigins from APP_URL:** When `APP_URL` is set, it is used to populate `allowedDevOrigins` in dev so access from that origin (e.g. http://host:10100 when using Docker) does not trigger the cross-origin warning.

### Added

- **Terms and Conditions and Privacy Policy:** New legal pages at `/terms` and `/privacy` with content tailored to Voobi (curated kids video). Terms cover definitions, eligibility, account and device linking, license, content/YouTube, acceptable use, termination, disclaimers, and changes. Privacy policy states no demographic or gender data collection; analytics limited to country, pages visited, and duration of visit; optional future use of aggregated watch statistics for recommendations with policy update; COPPA- and GDPR-aligned sections (data controller, retention, rights, children, recipients). Links added to landing footer and admin login; signup requires agreement to Terms and Privacy Policy via checkbox.

- **Beta invite code for registration:** Optional server-side validation via `BETA_INVITE_CODE` (and optional comma-separated `BETA_INVITE_CODES`). Signup form includes an invite code field; when the env var(s) are set, only a valid code allows account creation. When unset, signup remains open. See `.env.example` and docs/setup.md.

- **Cloudflare deployment (OpenNext):** Project can be deployed to Cloudflare Workers via `@opennextjs/cloudflare`. Added `wrangler.jsonc` (worker name `voobi`, assets, images binding, nodejs_compat), `open-next.config.ts`, `public/_headers` for static asset caching, and `.dev.vars.example` for local preview. New scripts: `npm run build:cloudflare` (OpenNext build only; use this as **Build command** in the Cloudflare dashboard), `npm run preview` (local Workers preview), `npm run deploy:cloudflare`, `npm run upload:cloudflare`, `npm run cf-typegen`. Next.js config uses `BUILD_FOR_CLOUDFLARE=1` to skip `output: "standalone"` when building for Cloudflare (Docker builds unchanged). `.gitignore` updated for `.open-next` and `.dev.vars`. Set env vars (Supabase, Upstash, Google OAuth, APP_URL) in Cloudflare dashboard or `.dev.vars` for preview. See [OpenNext Cloudflare](https://opennext.js.org/cloudflare/get-started).

- **GitHub project name Voobi:** README now opens with a clear **# Voobi** title and tagline so the repository displays as Voobi on GitHub. Added `repository` in `package.json` pointing to `https://github.com/Tivin-i/voobi.git` (update the URL if you use a different org or repo name). To rename the repo on GitHub: **Settings → General → Repository name** → set to `voobi` (or `Voobi`) and save; then update your local remote with `git remote set-url origin https://github.com/YOUR_ORG/voobi.git` if needed.

- **Merged design updates from safetube (mintyq77/safetube):** Brought in recent UI changes from upstream: (1) **Break Mode** in VideoModal redesigned to match mockup—two-panel layout (portrait: top/bottom; landscape: left/right) with white section (giraffe-on-bike illustration, “Time to take a break?”, “Ok, I’m done!”) and blue section (“Back to my video” thumbnail card, “Watch something else” link). (2) **Done Mode** updated with celebrating-giraffe illustration and “Well done!” / “See you next time” copy. (3) **CSS variables** in `app/globals.css` for brand and semantic colors (`--color-primary-yellow`, `--color-primary-blue`, `--color-btn-primary`, `--color-btn-secondary`, etc.) so Break/Done screens use the design system. (4) **Assets** from safetube: `public/img/giraffe_break.png`, `public/img/giraffe_celerate.png`, `public/img/giraffe_profile.svg`. Existing behavior preserved: `useVideoPlayer` hook, fullscreen utils, watch tracking, and Voobi branding elsewhere unchanged.

### Fixed

- **Cloudflare build OOM:** Set `NODE_OPTIONS=--max-old-space-size=4096` in `build:cloudflare` so the Next.js/TypeScript step has a 4GB heap and no longer hits "JavaScript heap out of memory" on Cloudflare's build environment.

- **npm audit and deprecation warnings:** Ran `npm audit fix` (resolved 2 low-severity issues: qs, webpack). Added `overrides` in `package.json`: `glob` → `^12.0.0` (removes glob@7/9 and inflight), `source-map` → `^0.7.4` (replaces deprecated 0.6.x and 0.8.0-beta), `sourcemap-codec` → `npm:@jridgewell/sourcemap-codec@^1.4.15` (API-compatible replacement). Build and tests pass. Remaining transitive deprecations (whatwg-encoding, node-domexception) come from jsdom and formdata-node and will clear when those upstream packages update.

- **Supabase Auth leaked password protection:** Lint "Leaked Password Protection Disabled" is resolved by enabling the feature in the Supabase dashboard (Authentication → Providers → Email). Documented in docs/setup.md §2.3. Requires Pro plan or above.

- **Function `public.handle_new_user` search_path:** Set `SET search_path = public` on the SECURITY DEFINER trigger function so name resolution is fixed and the lint "role mutable search_path" is resolved; reduces search-path injection risk. Updated `migrations/001_schema.sql` and `docs/setup.md`.

- **Migration 001_schema.sql grants:** Added explicit `GRANT USAGE ON SCHEMA public` and `GRANT SELECT/INSERT/UPDATE/DELETE` on `households`, `household_members`, `videos`, `youtube_connections`, `household_children`, `device_tokens` to `authenticated`, and `GRANT SELECT ON public.parents` to `anon` and `authenticated`, plus `GRANT EXECUTE` on the RLS helper functions, so the API no longer returns "permission denied for table household_members" when using the anon key with a logged-in user.

- **Migration 001_schema.sql idempotency:** Backfill steps that reference `parent_id` on `videos` and `device_tokens` now run only when that column exists (check via `information_schema.columns`), avoiding "column parent_id does not exist" when re-running the migration after a previous run already dropped `parent_id`.

- **RLS infinite recursion on `household_members`:** Policies on `household_members` (and others that depended on it) used a subquery on `household_members` themselves, causing "infinite recursion detected in policy for relation household_members". Migration `001_schema.sql` now defines SECURITY DEFINER helpers `public.current_user_household_ids()` and `public.current_user_owner_household_ids()`; all RLS policies use these instead of querying `household_members` directly in the policy expression.

### Added

- **APP_URL environment variable:** Single env var `APP_URL` (e.g. `http://103.167.150.103:10100`) used for OAuth redirect URIs (YouTube and child callback) and post-login redirects. Helper `lib/utils/app-url.ts` normalizes host:port (adds `http://` if missing) and strips trailing slashes. Set in `.env`; documented in `.env.example` and docs/setup.md. Supabase Site URL should match `APP_URL` so email verification links point to your app.

- **Rebrand to Voobi:** Replaced all PickList Kids references with Voobi across app, docs, Docker, and deployment. Cookie names updated to `voobi_device_token` and `voobi_parent_id_secure`; package name to `voobi`; Docker service/container/network to `voobi`/`voobi-app`/`voobi-network`. Logo asset: `voobi-logo.png` (copy of previous logo; replace with final branding as needed).

- **Rebrand to PickList Kids (superseded by Voobi):** Replaced all ZooTube and SafeTube references with PickList Kids. Cookie names `picklistkids_*`; package `picklist-kids`; Docker `picklistkids`/`picklistkids-app`/`picklistkids-network`.

- **Customer-facing marketing website:** New landing page at `/` for parents and caregivers. Hero with tagline "YouTube they'll love. Only what you approve.", CTAs to Get started (`/admin/signup`) and Set up your child's device (`/link-device`). How it works (3 steps), Why Voobi, and FAQ accordion. Warm/amber palette; no purple–blue gradients; minimal emoji. Accessibility: skip link, semantic HTML, focus-visible on all CTAs, `prefers-reduced-motion` for FAQ animation. Child video feed moved to `/feed`; all "home" links (link-device success, KidsHeader, watch page, error pages) and E2E HomePage now point to `/feed`. New `app/feed/page.tsx` (feed content), `app/page.tsx` (marketing), `components/marketing/MarketingFAQ.tsx`. E2E: marketing smoke test at `/`, specs and HomePage updated for `/feed`.

- **Migrations squashed:** All schema migrations are now a single file `migrations/001_schema.sql` (parents, device_tokens, households, household_members, videos, youtube_connections, household_children, RLS, backfills). Idempotent; safe to re-run. README device-linking and troubleshooting updated to reference `001_schema.sql`.

- **Troubleshooting (README):** New "Troubleshooting" subsection under Device linking: documents the "Could not find the table 'public.household_members' in the schema cache" error and fix (run `migrations/001_schema.sql` in Supabase SQL Editor).

- **Migration 003 (households and members):** Safe to run on greenfield DB where `videos` or `device_tokens` do not exist. If `public.videos` is missing, the migration creates it with the final schema (household_id, added_by, youtube_id, etc.). If `public.device_tokens` is missing, the migration skips adding `household_id` to it. Existing DBs with `videos` (and optional `device_tokens`) still get the same backfill and RLS as before.

- **Child accounts section and linked children OAuth (parent admin dashboard)**
  - New **Child accounts** section in the admin dashboard groups the existing YouTube connection and a new **Linked children** block.
  - **Child's YouTube account:** Copy updated to "Child's YouTube account" / "Connect the YouTube account for this list (e.g. your child's). One per list."
  - **Linked children:** Parents can link a child's Google account (identity only: openid, email, profile) to the household. New table `household_children` (migration `005_household_children.sql`): `household_id`, `google_sub`, `email`, `display_name`, `linked_at`, `linked_by`; unique per `(household_id, google_sub)`; RLS for household members.
  - **API:** `GET /api/auth/child?household_id=...` (redirects to Google OAuth), `GET /api/auth/child/callback` (exchanges code, upserts child, redirects to `/admin?child=connected` or `?child=error`), `GET /api/children?household_id=...` (list), `DELETE /api/children/[id]` (remove). All require auth and household membership.
  - **Services:** `lib/services/child-oauth.service.ts` (state signing, auth URL, exchange code for userinfo), `lib/services/child-connection.service.ts` (list, link from state, delete). Repository `lib/repositories/household-children.repository.ts`.
  - **UI:** `LinkedChildrenBlock` with Add child / Remove; `useLinkedChildren` hook; child toast handling in AdminDashboard.
  - **Docs:** `docs/CHILD_ACCOUNT_OAUTH.md`. Google Cloud: add redirect URI `.../api/auth/child/callback` for the same OAuth client.

- **Docker env and auth**
  - README: step to copy `.env.local` to `.env` for Docker (Compose only loads `.env`); step to verify env in container with `docker compose run --rm voobi-app sh -c 'echo SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL'` (single quotes so the variable is expanded inside the container). Note that plain `docker run` does not load `.env`—use `docker compose up` or `docker run --env-file .env`. New "Still Could not reach the authentication server?" troubleshooting: use `./scripts/docker-build.sh`, then check `curl -s http://localhost:10100/api/health` for `supabase_configured`.
  - docker-compose.yml: comment that Compose loads `.env` from current working directory, so run from project root; and note to copy `.env.local` to `.env` if needed.
  - scripts/docker-build.sh: build with explicit `--build-arg` so env is always passed; support `.env.local` when `.env` is missing (for build); after build, print the verify command for container env.
  - Health API (`/api/health`): response now includes `supabase_configured` (true when `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set and not placeholders) for Docker debugging.
  - Dockerfile: builder echoes length of `NEXT_PUBLIC_SUPABASE_URL` in build log so you can confirm build args were passed; error message updated to suggest `./scripts/docker-build.sh`.

- **Phase 4 (App improvements plan – E2E hardening and docs)**
  - **E2E docs:** README has new "E2E tests" section (Node 20+, port 3001, `npm run test:e2e`, CI, Docker link). docs/setup.md: prerequisites Node 20+; "Running E2E tests" subsection with install and run commands.
  - **Admin login E2E:** New smoke spec `tests/e2e/admin-login.spec.ts` (login page loads, form and sign-up link visible). Admin login page: `data-testid="admin-login-email"`, `admin-login-password`, `admin-login-submit`, `admin-login-error`; loading copy "Signing in…" (ellipsis).
  - **E2E report:** Phase 4 update added to `docs/PHASE1_E2E_COVERAGE_AND_STABILITY.md` (data-testids and admin spec done; docs updated).

- **Phase 3 (App improvements plan – App/UX improvements)**
  - **E2E stability:** Added `data-testid` on home (`loading-spinner`, `error-message`, `empty-state`, `video-card`), link-device (`link-device-email`, `link-device-submit`, `link-device-error`, `link-device-success`), and watch (`loading-spinner`, `watch-error-state`, `video-title`). Updated Playwright page objects (HomePage, LinkDevicePage, WatchPage) to use these selectors.
  - **Accessibility:** `aria-live="polite"` and `role="alert"` on loading/error/success regions; visible focus styles (`focus-visible:ring-*`) on KidsHeader, link-device, and error-boundary buttons; `aria-expanded` on user menu; error boundaries use `<a href="...">` for navigation (Go Home, Link device again); decorative spinners marked `aria-hidden="true"`.
  - **Typography:** Loading copy uses Unicode ellipsis (…) per Web Interface Guidelines: "Loading videos…", "Loading video…", "Linking device…".
  - **Watch page error UX:** Inline error state with icon, "Try again" (refetch) and "Go Home" link; consistent child-friendly messaging.
  - **Error boundaries:** Watch and link-device error pages use `<a>` for secondary actions and focus-visible styles; link-device error adds "Link device again" option.

- **Phase 3 (App improvements plan – refactor execution)**
  - **Refactor:** Removed unused dependency `class-variance-authority`; added `docs/DELETION_LOG.md`. Watch page: extracted `WatchPagePlayer` (useVideoPlayer + fullscreen util) and `RecommendationsGrid`; page uses BreakModal/DoneModal. VideoModal: uses shared `useVideoPlayer` and `lib/utils/fullscreen`. AdminDashboard: extracted `YouTubeConnectionBlock` and `useYoutubeConnection` hook. BreakModal uses `RecommendationsGrid`. Single player-init and fullscreen path across modal and watch page.
  - **Phase 3 kickoff:** Next.js 16.1.6 and eslint-config-next 16.1.6 (RCE fix). Jest and build pass.

- **Phase 2 (App improvements plan)**
  - **Security:** `npm audit fix` applied (jws, lodash, qs). Device-token validation: in production, cookie-only fallback disabled—requires `SUPABASE_SERVICE_ROLE_KEY` for device linking ([lib/services/device-token.service.ts](lib/services/device-token.service.ts)). Next.js 16.1.6 (or 16.0.7) for RCE fix—upgrade applied in Phase 3. Remediation summary in `docs/PHASE1_SECURITY_REVIEW.md`.
  - **Refactor plan:** `docs/PHASE2_REFACTOR_PLAN.md`—split plan for AdminDashboard, VideoModal, watch page; depcheck (unused deps); implementation order for Phase 3.

- **Phase 1 (App improvements plan – Task 1 complete)**
  - **Architecture:** Updated `.cursor/plans/ARCHITECTURE_ANALYSIS.md` with current stack, app structure, data flow diagram, service/repository patterns, and refactor priorities. Added ADRs: `docs/ADR-001-households-and-device-identity.md`, `docs/ADR-002-service-and-repository-layers.md`.
  - **Security:** Phase 1 security review report `docs/PHASE1_SECURITY_REVIEW.md` (npm audit: Next.js RCE, jws, lodash; device-token fallback; OWASP checklist and remediation).
  - **E2E:** Phase 1 E2E report `docs/PHASE1_E2E_COVERAGE_AND_STABILITY.md` (Node 20 requirement, data-testid gaps, critical flows, Phase 4 recommendations).

- **YouTube OAuth: connect child's YouTube account (minimal interaction)**
  - Parents can link one YouTube account per household from the admin dashboard (one click, one Google sign-in, one callback).
  - New table `youtube_connections` (migration `004_youtube_connections.sql`): `household_id`, encrypted refresh token, optional `youtube_channel_id`, `linked_by`; RLS restricts access to household members.
  - **API:** `GET /api/auth/youtube?household_id=...` (redirects to Google OAuth), `GET /api/auth/youtube/callback` (exchanges code, stores connection, redirects to `/admin?youtube=connected` or `?youtube=error`), `GET /api/youtube-connection?household_id=...` (status), `DELETE /api/youtube-connection?household_id=...` (unlink). All require auth and household membership.
  - **Security:** Signed OAuth state (HMAC) with expiry; refresh token encrypted at rest (AES-256-GCM); scope `youtube.readonly` only; rate limiting on OAuth and connection routes.
  - **Env:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APP_URL`, `YOUTUBE_OAUTH_ENCRYPTION_KEY` (see `.env.example` and docs/setup.md).
  - **Docs:** `docs/YOUTUBE_OAUTH_ARCHITECTURE.md`, `docs/YOUTUBE_OAUTH_SECURITY_REVIEW.md`. docs/setup.md updated with optional OAuth setup (Step 3.4).

### Fixed

- **Device linking "Internal server error"**: The link-device flow requires the `household_members` (and `households`) table. If you see "Could not find the table 'public.household_members' in the schema cache", run migration `migrations/003_households_and_members.sql` in your Supabase project (SQL Editor). README device-linking section updated to list migrations 003 and 004 and to state that 003 is required for device linking.

### Changed

- **Documentation:** All user-facing docs consolidated into `docs/`. SETUP.md → docs/setup.md, DOCKER_E2E_README.md → docs/docker-e2e.md, E2E_TEST_EXECUTION_SUMMARY.md → docs/e2e-execution-summary.md, prd.md (Voobi) → docs/prd.md. Added docs/README.md as documentation index. Root README now has a "Documentation" section linking to the index and key guides.

- **Documentation:** Moved all plan documents into `plans/`: `ARCHITECTURE_ANALYSIS.md`, `DOCKER_E2E_PLAN.md`, `E2E_TEST_FIX_PLAN.md`, `IMPLEMENTATION_PLAN.md`, `implementation-plan.md`, and `docs/MULTI_PARENT_IMPLEMENTATION_PLAN.md` → `plans/MULTI_PARENT_IMPLEMENTATION_PLAN.md`. Updated references in CHANGELOG and docs/e2e-execution-summary.md.

### Added

- **Multi-parent household: shared video whitelist and sync**
  - Multiple parents/guardians can share and sync the same whitelisted videos for one or more children.
  - New **households** and **household_members** tables (migration `003_households_and_members.sql`). Videos are keyed by `household_id`; device linking uses `household_id`.
  - Backward compatibility: migration creates one household per existing parent (id = parent id) and backfills videos and device_tokens to `household_id`.
  - **API:** `GET/POST /api/households` (list/create), `POST /api/households/[id]/members` (invite by email). `GET /api/videos?household_id=...`, `POST /api/videos` (body: `household_id`, url). Device-token API accepts and returns `householdId` (and `parentId`). Parent-by-email returns `parentId` and list of `households` for link-device.
  - **Link-device flow:** After email lookup, if parent has multiple households the user picks "Which video list?" then links; if one household, links directly.
  - **Admin dashboard:** Household selector when user has multiple households; add/remove videos for the selected household. Invite guardian via `POST /api/households/[id]/members` (email).
  - **Child feed and watch:** Use `householdId` from device token to fetch videos; same list for all linked children and all household members.
  - **E2E:** New `tests/e2e/multi-parent-household.spec.ts` (household picker, link with householdId, child feed uses household_id). Fixtures updated for `householdId` and parent-by-email households.
  - Architecture: `docs/MULTI_PARENT_VIDEO_SHARING_ARCHITECTURE.md`. Plan: `plans/MULTI_PARENT_IMPLEMENTATION_PLAN.md`. Code and security reviews: `docs/MULTI_PARENT_CODE_REVIEW.md`, `docs/MULTI_PARENT_SECURITY_REVIEW.md`.

- **Device linking: DB-backed token validation (backlog)**
  - New migration `migrations/002_device_tokens_table.sql` creates `device_tokens` (token_hash, parent_id, expires_at). When `SUPABASE_SERVICE_ROLE_KEY` is set, device linking stores and validates tokens in the DB instead of trusting only cookies.
  - New `lib/supabase/admin.ts` provides a server-only Supabase client with service role (bypasses RLS). Used only for device_tokens; returns null when the key is not set.
  - `createDeviceToken` / `validateDeviceToken` / `clearDeviceToken` use the admin client when available; otherwise fall back to the legacy cookie-only flow (parent_id cookie).
  - README: added "Device linking (parents + kids view)" with migration steps and when to run 001 vs 002.

- **E2E fixture cookie names (backlog)**
  - `tests/fixtures/auth.ts` now uses app cookie names `voobi_device_token` and `voobi_parent_id_secure`, and sets both cookies when simulating a linked device so legacy flow works without mocking.

### Fixed

- **Watch count: no double-count from modal (optional)**
  - Removed the watch-track call from `VideoModal`; only the full watch page (`/watch/[id]`) calls `POST /api/videos/[id]/watch`. Opening the modal then navigating to watch no longer counts twice.

- **In-depth code review (2026-01-29)**
  - Jest was picking up Playwright E2E specs in `tests/e2e/`, causing "Class extends value undefined" failures. Added `testPathIgnorePatterns` to exclude `tests/e2e/`; unit tests run with `npm test`, E2E with `npm run test:e2e`.
  - Server Supabase client (`lib/supabase/server.ts`) now validates `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` before creating the client; throws a clear error if missing or set to placeholders (consistent with browser client).

- **Videos API ZodError for page/limit when omitted**
  - GET `/api/videos?parent_id=...` without `page` or `limit` was failing validation because `searchParams.get("page")` returns `null`, and `z.coerce.number()` turns `null` into `0`, which then fails `.min(1)`. The route now passes `undefined` for missing `page`/`limit` so the optional schema accepts them and defaults (page 1, default limit) are used.

- **Login redirect loop (redirected back to link-device after signup/login)**
  - When a logged-in parent visits the home page ("/") without a device link cookie, the app now auto-links the device using their session instead of redirecting to the link-device page. This removes the loop where signing in and then opening the kids' view sent them back to link-device every time.

- **Registration / login "Failed to fetch"**
  - Supabase client now validates `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` and throws a clear error if missing or still set to placeholders (e.g. in Docker).
  - Signup and login pages show a helpful message when the auth server cannot be reached (e.g. "Could not reach the authentication server. Check your internet connection and ensure Supabase is configured...").
  - Client is created inside the submit handler so missing config no longer crashes the page on load.

### Added - Docker & E2E Testing Infrastructure

- **Docker Containerization**
  - Created production-ready multi-stage Dockerfile
    - Stage 1: Dependencies installation
    - Stage 2: Next.js build
    - Stage 3: Minimal production runtime
  - Added docker-compose.yml for local development
  - Created .dockerignore for optimized builds
  - Added health check endpoint at `/api/health`
  - Configured Next.js standalone output for Docker
  - Security: Non-root user, Alpine base image, no secrets in layers

- **E2E Testing with Playwright**
  - Installed and configured Playwright testing framework
  - Created comprehensive test infrastructure:
    - Page Object Model classes (HomePage, LinkDevicePage, WatchPage)
    - Test fixtures (auth helpers, test data)
    - Playwright configuration with CI/CD support
  - E2E test suites for critical user journeys:
    - Device linking flow (`tests/e2e/device-linking.spec.ts`)
    - Video browsing (`tests/e2e/video-browsing.spec.ts`)
    - Video watching (`tests/e2e/video-watching.spec.ts`)
    - Navigation (`tests/e2e/navigation.spec.ts`)
  - Test scripts added to package.json:
    - `test:e2e` - Run all E2E tests
    - `test:e2e:ui` - Run with Playwright UI
    - `test:e2e:debug` - Debug mode
    - `test:e2e:headed` - Run with visible browser
    - `test:e2e:report` - Show HTML report
  - Artifact management: Screenshots, videos, traces on failure
  - CI/CD ready configuration with retries and parallel execution

### Added - Phase 5: Performance & Testing

- **Caching Implementation**
  - Created `lib/utils/cache.ts` with in-memory cache with TTL support
  - YouTube metadata cached for 24 hours to reduce API calls
  - Video list API responses cached for 5 minutes
  - Cache invalidation on video add/delete operations
  - Added cache headers to API responses (5-minute cache with stale-while-revalidate)

- **Pagination**
  - Added pagination support to video list API
  - Updated `lib/repositories/video.repository.ts` with `countByParentId()` method
  - Added `getVideosWithPagination()` method to video service
  - AdminDashboard now uses pagination (20 videos per page)
  - Added pagination controls to `VideoListSection` component:
    - Page navigation buttons
    - Current page indicator
    - Total results display
    - Responsive design (mobile-friendly controls)

- **Testing Infrastructure**
  - Set up Jest with React Testing Library
  - Created `jest.config.js` and `jest.setup.js` for Next.js 16
  - Added test scripts: `test`, `test:watch`, `test:coverage`
  - Unit tests for utilities:
    - `lib/utils/duration.ts` - Duration formatting tests
    - `lib/utils/cache.ts` - Cache functionality tests
    - `lib/utils/error-handler.ts` - Error handling tests
  - Unit tests for validators:
    - `lib/validators/video.validator.ts` - Video validation schema tests
  - Test coverage threshold: 50% (branches, functions, lines, statements)

- **Bundle Optimization**
  - Dynamic imports for `AdminDashboard` component (reduces initial bundle)
  - Lazy loading for `VideoModal` component (only loads when needed)
  - Installed and configured `@next/bundle-analyzer`
  - Added `analyze` script to analyze bundle size
  - Optimized package imports for `lucide-react` and `@tanstack/react-table`
  - Admin route components only load when admin page is accessed

### Added - Phase 4: Code Quality Improvements

- **Extracted Duplicated Code**
  - Created `lib/utils/duration.ts` with `formatDuration()` and `formatDurationFromISO()` functions
  - All duration formatting now uses centralized utility functions
  - Created `lib/utils/fullscreen.ts` for cross-browser fullscreen handling
  - Created `lib/hooks/useVideoPlayer.ts` for reusable YouTube player logic

- **Constants Management**
  - Created `lib/utils/constants.ts` with all application constants:
    - `MAX_VIDEOS_PER_BATCH = 100`
    - `MAX_RECOMMENDATIONS = 6`
    - `DEVICE_TOKEN_EXPIRY_DAYS = 90`
    - `DEFAULT_CHILD_NAME = "Zoe"`
    - Rate limiting constants
  - Replaced all hardcoded values throughout codebase with constants

- **Component Breakdown**
  - Split `AdminDashboard` into smaller components:
    - `components/admin/VideoAddForm.tsx` - Video addition form with batch support
    - `components/admin/AnalyticsSection.tsx` - Analytics display
    - `components/admin/VideoListSection.tsx` - Video list/table
  - Created reusable modal components:
    - `components/video/BreakModal.tsx` - Break modal with recommendations
    - `components/video/DoneModal.tsx` - Completion celebration modal

- **Route-Level Error Boundaries**
  - Added `error.tsx` files for all main routes:
    - `app/error.tsx` - Root error boundary
    - `app/watch/[id]/error.tsx` - Watch page error handling
    - `app/admin/error.tsx` - Admin dashboard error handling
    - `app/link-device/error.tsx` - Device linking error handling
  - All error boundaries provide user-friendly messages and recovery options

### Added - Phase 3: Missing Functionality

- **Recommendations on Watch Page**
  - Added recommendations section to break modal
  - Shows other videos from same parent's collection
  - Sorted by least-watched first (as per PRD)
  - Clickable thumbnails to navigate to recommended videos
  - Displays up to 6 recommendations in a responsive grid
  - Shows video thumbnails, titles, and duration

- **Analytics Dashboard**
  - Added analytics section to admin dashboard
  - Summary statistics:
    - Total videos count
    - Total watches count
    - Number of videos watched
  - Most watched videos list (top 5)
    - Shows watch count and last watched timestamp
    - Displays video thumbnails and titles
  - Unwatched videos indicator
  - Visual cards with color coding

- **Improved Device Linking UX**
  - Better error messages with specific guidance:
    - Clear message when email not found
    - Rate limit error messages
    - Validation error messages
  - Success confirmation before redirect
  - Improved loading state with spinner
  - Better visual feedback throughout the flow
  - More helpful error descriptions

### Added - Phase 2: Architecture Improvements

- **Service Layer**
  - Created `lib/services/` directory with business logic layer:
    - `video.service.ts` - Video business logic (add, get, delete, track watch, recommendations)
    - `parent.service.ts` - Parent business logic (find by email, verify exists)
    - `youtube.service.ts` - YouTube API integration (validation, metadata fetching)
  - All business logic extracted from API routes
  - Services are testable and reusable

- **Repository Pattern**
  - Created `lib/repositories/` directory with data access layer:
    - `video.repository.ts` - Video data access (CRUD operations, watch tracking)
    - `parent.repository.ts` - Parent data access (find by email/id)
  - Abstracted Supabase client usage
  - Enables easier testing and future database migrations
  - Repository interfaces for dependency injection

- **Type Safety Improvements**
  - Removed all `any` types from codebase
  - Created Zod schemas for database types (`lib/validators/database.validator.ts`)
  - Created Zod schemas for API responses (`lib/validators/api-responses.validator.ts`)
  - Type-safe API responses throughout

- **API Route Refactoring**
  - All API routes now use services instead of direct database access
  - Routes are thin (validation + service calls only)
  - Consistent error handling across all routes
  - Better separation of concerns

- **Database Migration**
  - Created migration script for parents table (`migrations/001_create_parents_table_and_sync.sql`)
  - Ensures parents table is synced with auth.users
  - Adds RLS policy for secure email lookups

### Added - Phase 1: Critical Security Fixes
- **Input Validation System**
  - Installed Zod for runtime validation
  - Created validation schemas for all API inputs:
    - `lib/validators/parent.validator.ts` - Email, parent ID, device token validation
    - `lib/validators/video.validator.ts` - YouTube URLs, video IDs, query parameters
    - `lib/validators/youtube.validator.ts` - Batch request validation
  - All API routes now validate inputs before processing

- **Rate Limiting**
  - Installed `@upstash/ratelimit` and `@upstash/redis` for rate limiting
  - Created `lib/middleware/rate-limit.ts` with configurable limits:
    - Public endpoints: 100 requests per 15 minutes
    - Auth endpoints: 10 requests per 15 minutes
    - Video add endpoints: 20 requests per hour
  - In-memory fallback for development (when Redis not configured)
  - IP-based rate limiting to prevent API abuse

- **Secure Device Token System**
  - Replaced insecure localStorage with secure httpOnly cookies
  - Created `lib/services/device-token.service.ts` for token management
  - Created `/api/device-token` endpoint for token operations
  - Device tokens stored in secure cookies with 90-day expiration
  - Created `lib/hooks/useParentId.ts` for client-side parent ID access
  - Updated all pages to use secure cookie API instead of localStorage:
    - `app/page.tsx` (home feed)
    - `app/watch/[id]/page.tsx` (watch page)
    - `app/link-device/page.tsx` (device linking)
    - `components/KidsHeader.tsx` (unlink device)

- **Secure Parent Lookup API**
  - Fixed critical security vulnerability in `/api/parent-by-email`
  - Removed service role key usage (was exposing all user emails)
  - Now uses anon key with RLS-based lookup
  - Returns minimal data (only parent_id, no email)
  - Added rate limiting (10 requests per 15 minutes)
  - Added input validation with Zod

- **Centralized Error Handling**
  - Created `lib/errors/app-errors.ts` with custom error classes:
    - `AppError` (base class)
    - `ValidationError`
    - `NotFoundError`
    - `UnauthorizedError`
    - `RateLimitError`
    - `ForbiddenError`
  - Created `lib/utils/error-handler.ts` for standardized error responses
  - All API routes now use centralized error handling
  - Proper error messages (no information disclosure in production)

- **API Route Security Improvements**
  - Added input validation to all API routes:
    - `/api/videos` (GET, POST)
    - `/api/videos/[id]` (DELETE)
    - `/api/videos/[id]/watch` (POST)
    - `/api/parent-by-email` (GET)
    - `/api/youtube-batch` (POST)
    - `/api/device-token` (GET, POST, DELETE)
  - All routes now use rate limiting
  - All routes use centralized error handling
  - Consistent response format across all endpoints

### Changed
- **Breaking Changes**
  - Device linking now uses secure cookies instead of localStorage
  - Parent-by-email API now returns only `parentId` (not email)
  - All API error responses now follow standardized format

### Security
- Fixed CRITICAL: Insecure parent-by-email API (no longer exposes all user emails)
- Fixed CRITICAL: localStorage for parent ID (now uses secure httpOnly cookies)
- Fixed HIGH: Missing input validation (all endpoints now validate inputs)
- Fixed MEDIUM: Error message information disclosure (standardized error handling)

### Technical Notes
- **Database Requirement**: The secure parent-by-email API requires a `parents` table that's synced with `auth.users`. If this table doesn't exist, a database migration is needed to create it and sync it with auth.users via a trigger.
- **Rate Limiting**: For production, configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` environment variables. The system falls back to in-memory rate limiting in development.

### Analysis
- Completed comprehensive architecture review
- Identified critical security vulnerabilities
- Documented missing functionality from PRD
- Created phased implementation plan for improvements

### Architecture Issues Identified
- Missing service layer (business logic in API routes)
- No repository pattern (direct database access)
- Inconsistent error handling
- Missing type safety (some `any` types)
- No caching strategy

### Missing Functionality Identified
- Recommendations not shown on watch page (PRD requirement)
- Analytics dashboard not implemented (PRD requirement)
- Device linking UX could be improved

### Code Quality Issues Identified
- Code duplication (duration formatting, player logic)
- Hardcoded values (child name, magic numbers)
- Large components (AdminDashboard 536 lines, VideoModal 411 lines)
- Missing error boundaries (only root-level)

### Performance Issues Identified
- No request caching
- Inefficient YouTube API usage
- No pagination for video lists
- Large bundle size (no code splitting)

### Planned Improvements
- Phase 1: Critical Security Fixes (Week 1)
- Phase 2: Architecture Improvements (Week 2)
- Phase 3: Missing Functionality (Week 3)
- Phase 4: Code Quality Improvements (Week 4)
- Phase 5: Performance & Testing (Week 5-6)

## [0.1.0] - Initial Release

### Added
- Parent authentication (signup/login)
- Video management (add/remove YouTube videos)
- Device linking for child devices
- Child home feed with thumbnail grid
- Video playback with YouTube embedded player
- Watch count tracking
- Batch video import (channels/playlists)
- PWA support
- Responsive design
