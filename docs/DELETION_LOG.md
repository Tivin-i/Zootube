# Phase 3 Deletion Log

Record of removals during Phase 3 refactor. Append entries after each change.

## Format

- **Dependencies:** package name and version removed.
- **Files:** path and (if applicable) replacement path.
- **Exports:** file and symbol name.

---

## 2026-02-05

### Unused dependencies removed

- **class-variance-authority** @ ^0.7.1 — Removed. No usage (`cva(` or import) found in codebase; reported unused by depcheck in Phase 2.

### Extractions (no deletions; new files)

- **components/watch/WatchPagePlayer.tsx** — Player + fullscreen for watch page; uses `useVideoPlayer` and `lib/utils/fullscreen`.
- **components/watch/RecommendationsGrid.tsx** — Shared recommendation thumbnail grid with `formatDuration`; used by BreakModal and watch break UI.
- **components/admin/YouTubeConnectionBlock.tsx** — YouTube status, connect/disconnect, toast; used by AdminDashboard.
- **lib/hooks/useYoutubeConnection.ts** — Hook for YouTube connection status and actions; used by AdminDashboard.
