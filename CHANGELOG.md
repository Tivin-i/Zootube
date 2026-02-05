# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Phase 4 (App improvements plan – E2E hardening and docs)**
  - **E2E docs:** README has new "E2E tests" section (Node 20+, port 3001, `npm run test:e2e`, CI, Docker link). SETUP.md: prerequisites Node 20+; "Running E2E tests" subsection with install and run commands.
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
  - **Env:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APP_URL`, `YOUTUBE_OAUTH_ENCRYPTION_KEY` (see `.env.example` and SETUP.md).
  - **Docs:** `docs/YOUTUBE_OAUTH_ARCHITECTURE.md`, `docs/YOUTUBE_OAUTH_SECURITY_REVIEW.md`. SETUP.md updated with optional OAuth setup (Step 3.4).

### Changed

- **Documentation:** Moved all plan documents into `plans/`: `ARCHITECTURE_ANALYSIS.md`, `DOCKER_E2E_PLAN.md`, `E2E_TEST_FIX_PLAN.md`, `IMPLEMENTATION_PLAN.md`, `implementation-plan.md`, and `docs/MULTI_PARENT_IMPLEMENTATION_PLAN.md` → `plans/MULTI_PARENT_IMPLEMENTATION_PLAN.md`. Updated references in CHANGELOG and E2E_TEST_EXECUTION_SUMMARY.

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
  - `tests/fixtures/auth.ts` now uses app cookie names `safetube_device_token` and `safetube_parent_id_secure`, and sets both cookies when simulating a linked device so legacy flow works without mocking.

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
