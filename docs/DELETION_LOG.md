# Deletion Log (Refactor Cleaner)

Records safe removals applied during Phase 3 refactor. No behavior changes intended.

## 2026-02-14 (Phase 3)

### Files removed (unused)

| File | Reason |
|------|--------|
| `lib/hooks/useParentId.ts` | Unused hook; no imports in codebase (knip). |
| `lib/validators/api-responses.validator.ts` | Unused; no imports (knip). |
| `lib/validators/database.validator.ts` | Unused; only imported by api-responses.validator (knip). |

### Migrations squashed (2026-02-14)

| File | Reason |
|------|--------|
| `migrations/002_service_role_grants.sql` | Squashed into `001_schema.sql` (service_role grants already in 001). |
| `migrations/003_ensure_parent_from_auth.sql` | Squashed into `001_schema.sql` (function and EXECUTE grant already in 001). |
| `migrations/004_service_role_parents.sql` | Squashed into `001_schema.sql` (added `GRANT SELECT, INSERT, UPDATE ON public.parents TO service_role`). |

### Files / exports intentionally kept

- `open-next.config.ts` — Used by Cloudflare/OpenNext build (`build:cloudflare`).
- `scripts/list-users.js` — Dev/ops script; kept.
- `lib/utils/fullscreen.ts` — `exitFullscreen`, `isFullscreen` kept for API completeness; some callers may use them.
- `lib/errors/app-errors.ts` — `ForbiddenError` kept for future use.
- `components/ui/table.tsx` — `TableFooter`, `TableCaption` kept for component API.
