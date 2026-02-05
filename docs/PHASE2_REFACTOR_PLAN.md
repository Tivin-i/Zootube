# Phase 2: Refactor and Dead-Code Plan

**Date:** 2026-02-04  
**Depends on:** Phase 1 Architecture (ARCHITECTURE_ANALYSIS.md §1.6, ADRs)

---

## 1. Objectives

- Break up large components into smaller, testable units.
- Consolidate duplicated logic (player init, fullscreen) where not already centralized.
- Identify and safely remove dead code / unused dependencies.
- Add route-level error boundaries and replace hardcoded values with constants.

---

## 2. Large Components to Split

### 2.1 AdminDashboard.tsx (~438 lines)

**Current:** Single component with households, videos list, YouTube status, add form, pagination, toasts.

**Proposed:**
- Keep `AdminDashboard` as container: state and data fetching; compose existing subcomponents.
- Already extracted: `VideoAddForm`, `AnalyticsSection`, `VideoListSection`. Consider:
  - Extract **HouseholdSelector** (dropdown + fetch households) into its own component.
  - Extract **YouTubeConnectionBlock** (status, connect button, toast) into `components/admin/YouTubeConnectionBlock.tsx`.
  - Move YouTube status fetch into a custom hook `useYoutubeConnection(householdId)` to simplify AdminDashboard.
- **Risk:** Low. Subcomponents already exist; mainly moving JSX and one hook.

### 2.2 VideoModal.tsx (~398 lines)

**Current:** Modal + YouTube IFrame API load + player init + break/done modals + fullscreen.

**Proposed:**
- Extract **YouTubePlayerEmbed** (load script, create player, expose play/pause/seek) into `components/video/YouTubePlayerEmbed.tsx` or reuse/align with `useVideoPlayer` used on watch page.
- Use shared `useVideoPlayer` (or a modal-specific wrapper) so watch page and modal share one player-init pattern.
- Keep BreakModal and DoneModal as-is (already in `components/video/`).
- **Risk:** Medium. Player lifecycle and YT API readiness need careful handling; test modal and watch page after.

### 2.3 app/watch/[id]/page.tsx (~450+ lines)

**Current:** Fetch video + recommendations, player, recommendations grid, fullscreen.

**Proposed:**
- Extract **WatchPagePlayer** (player container + fullscreen UI) using `useVideoPlayer`.
- Extract **RecommendationsGrid** (thumbnail list with formatDuration) into `components/watch/RecommendationsGrid.tsx`.
- Keep page as orchestrator: fetch data, pass to Player + RecommendationsGrid.
- **Risk:** Low. Clear boundaries.

---

## 3. Duplication to Consolidate

### 3.1 Duration formatting

**Status:** Already centralized in `lib/utils/duration.ts` (`formatDuration`, `formatDurationFromISO`). Used by app/page, watch page, BreakModal, video-columns, VideoSelector. No further action.

### 3.2 YouTube player initialization

**Current:** VideoModal and watch page each load the YouTube IFrame API and create a player (different div IDs and callbacks).

**Proposed:**
- Prefer a single **useVideoPlayer** (or extend existing `lib/hooks/useVideoPlayer.ts`) that:
  - Loads the IFrame API once (or checks if already loaded).
  - Creates player for a given container element and videoId.
  - Returns play, pause, getCurrentTime, destroy.
- Use this hook in both VideoModal and watch page so script loading and player creation live in one place.
- **Risk:** Medium. Ensure modal and full page both work; handle unmount/destroy.

### 3.3 Fullscreen handling

**Current:** `lib/utils/fullscreen.ts` exists. Verify watch page and VideoModal use it; if either has inline fullscreen logic, replace with the util.
- **Action:** Grep for fullscreen usage; ensure both use the same util.

---

## 4. Dead Code and Dependencies (depcheck 2026-02-04)

### 4.1 Unused dependency (candidate for removal after verification)

| Package | Notes |
|---------|--------|
| **class-variance-authority** | Reported unused by depcheck. Grep for `cva(` or `"class-variance-authority"`; if no usage, remove in Phase 3. |

### 4.2 DevDependencies reported unused by depcheck

These are often used indirectly (config, Jest, Tailwind, Prettier). **Do not remove without verification:**

- `@tailwindcss/postcss`, `tailwindcss` — Likely used by PostCSS config; keep unless build works without.
- `@testing-library/react`, `@testing-library/user-event` — Used by Jest component tests; keep.
- `@types/jest`, `@types/react-dom`, `jest-environment-jsdom` — Jest/React types; keep.
- `prettier`, `prettier-plugin-tailwindcss` — Formatting; keep unless formatting is disabled.

**Action for Phase 3:** Run tests and build after any removal; revert if anything breaks.

### 4.3 Knip / ts-prune (optional)

- **knip:** Add `knip` to devDependencies and run `npx knip` to find unused exports and files. Address in Phase 3.
- **ts-prune:** Run `npx ts-prune` to list unused exports; remove only after confirming no dynamic imports.

---

## 5. Error Boundaries and Constants

### 5.1 Route-level error boundaries

- **app/watch/[id]/error.tsx** — Exists. Ensure it catches player and data-fetch errors and shows a child-friendly message.
- **app/link-device/error.tsx** — Exists.
- **app/admin/error.tsx** — Exists.
- No new files required; verify messaging and recovery actions in Phase 3.

### 5.2 Constants

- Replace hardcoded child name (e.g. in KidsHeader) with `DEFAULT_CHILD_NAME` from `lib/utils/constants.ts` if not already.
- Video limit / page size: already use `DEFAULT_PAGE_SIZE` from constants where applicable; ensure no magic numbers remain in components.

---

## 6. Implementation Order (Phase 3)

1. **Safe dependency cleanup:** Verify and remove `class-variance-authority` if unused; run tests and build.
2. **Watch page:** Extract RecommendationsGrid and WatchPagePlayer; use useVideoPlayer and fullscreen util.
3. **VideoModal:** Refactor to use shared useVideoPlayer (or YouTubePlayerEmbed) and fullscreen util; test modal and watch page.
4. **AdminDashboard:** Extract YouTubeConnectionBlock and useYoutubeConnection; optionally HouseholdSelector.
5. **Knip/ts-prune:** Run tools; remove unused exports in small batches with tests after each.

---

## 7. DELETION_LOG (to be updated in Phase 3)

After each removal in Phase 3, append to `docs/DELETION_LOG.md` (create if missing):

- Unused dependencies removed (with version).
- Unused files deleted (with replacement path if any).
- Unused exports removed (file and symbol name).

---

## 8. Success Criteria

- AdminDashboard, VideoModal, and watch page each under ~250 lines (or clearly split into files under that).
- One shared player-init path (hook or component) for modal and watch page.
- No duplicate fullscreen logic; single source in `lib/utils/fullscreen.ts`.
- Dead code and unused deps removed only after verification; DELETION_LOG updated.
- All tests and E2E pass after refactor.
