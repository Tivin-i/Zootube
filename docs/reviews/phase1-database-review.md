# Phase 1: Database Review

**Reviewer:** Database Reviewer (subagent)  
**Date:** 2026-02-13  
**Scope:** Schema, migrations 001–003, RLS, indexes, triggers, service role grants.

---

## Summary

- Schema is well-structured with clear FKs and constraints. RLS is enabled on all application tables; helper functions use `SECURITY DEFINER` with explicit `search_path`. One **missing grant** for `service_role` on `public.parents` affects the app’s admin fallback path. Migrations are idempotent where applicable. Index usage aligns with query patterns.

---

## Schema Overview

| Table | Purpose | RLS | Key indexes |
|-------|---------|-----|-------------|
| `parents` | Synced from auth.users; device linking lookup | Yes (SELECT for all) | `idx_parents_email` |
| `device_tokens` | Hashed tokens for kid devices | Yes (no direct anon/authenticated use; server uses service_role) | `idx_device_tokens_token_hash`, `idx_device_tokens_expires_at` |
| `households` | Video list container | Yes | — |
| `household_members` | Parent membership in households | Yes | `idx_household_members_parent_id`, `idx_household_members_household_id` |
| `videos` | Per-household video list | Yes | `videos_household_id_youtube_id_key`, `idx_videos_household_id` |
| `youtube_connections` | OAuth refresh token per household | Yes | `idx_youtube_connections_household_id` |
| `household_children` | Linked child Google accounts | Yes | `idx_household_children_household_id` |

---

## RLS and Helper Functions

- **`current_user_household_ids()`** / **`current_user_owner_household_ids()`**: `STABLE`, `SECURITY DEFINER`, `search_path = public`. Used in RLS policies; avoids recursion by not reading RLS-protected tables in a way that would re-invoke RLS.
- **`ensure_parent_from_auth_email(lookup_email text)`**: `SECURITY DEFINER`, `search_path = public, auth`. Looks up `auth.users` by email, inserts into `parents`, `households`, `household_members` with `ON CONFLICT DO NOTHING`. Safe and idempotent.
- **`handle_new_user()`**: Trigger on `auth.users`; inserts one row into `parents`. Idempotent with backfill in 001.

Policies consistently scope by `household_id IN (SELECT current_user_household_ids())` or owner variant. Only `parents` uses `USING (true)` for SELECT to allow public parent-by-email lookup.

---

## Indexes and Query Patterns

- **parents**: `idx_parents_email` supports `findByEmail` (ILIKE with escaped pattern). Email lookups are covered.
- **device_tokens**: Unique on `token_hash`; index on `expires_at` for expiry filters. Appropriate.
- **household_members**: Composite PK `(household_id, parent_id)`; indexes on both columns support “households for parent” and “members for household”.
- **videos**: Unique `(household_id, youtube_id)`; index on `household_id` supports list/count by household. No index on `last_watched_at` or `watch_count`; acceptable for current usage.
- **youtube_connections** / **household_children**: Index on `household_id` supports “by household” queries.

No obvious missing indexes for current access patterns.

---

## Migration Notes

- **001_schema.sql**: Single idempotent migration (IF NOT EXISTS, DROP IF EXISTS, ON CONFLICT). Backfill from `auth.users` into `parents` and then `households` / `household_members`. Contains service_role grants for `households`, `household_members`, `device_tokens` and RPC `ensure_parent_from_auth_email`. Does **not** grant `service_role` on `public.parents`.
- **002_service_role_grants.sql**: Optional; for DBs created before 001 included service_role grants. Same subset (no `parents`, no `ensure_parent_from_auth_email`).
- **003_ensure_parent_from_auth.sql**: Replaces `ensure_parent_from_auth_email`, adds `GRANT EXECUTE ... TO service_role`. Safe to run after 001.

**Recommended run order:** 001 → 003; 002 only if 001 was applied before service_role grants were added.

---

## Service Role Grants Gap

**Issue:**  
The app’s `parent.service` uses the admin client in two places:

1. **`findParentByEmailWithAdmin`**: `admin.from("parents").select("id").ilike("email", ...)`
2. **`ensureParentFromAuthByEmail`** (fallback when RPC is not used): `admin.from("parents").upsert(...)`, then households/household_members.

In **001_schema.sql**, `service_role` has:
- `households`, `household_members`, `device_tokens`: SELECT, INSERT, UPDATE, DELETE
- No grant on **`public.parents`**

So:
- If only the RPC path is used (003 applied), the app never needs `service_role` to touch `parents` directly; the RPC runs with definer rights and inserts into `parents`.
- If the fallback path runs (e.g. RPC not deployed or fails), `admin.from("parents").select(...)` and `admin.from("parents").upsert(...)` will fail with permission denied.

**Recommendation:**  
If the fallback path is required in any environment, add:

```sql
GRANT SELECT, INSERT, UPDATE ON public.parents TO service_role;
```

(Or only SELECT if backfill is always done via RPC and only lookup is needed.) Document that 002/001 do not currently grant `parents` to service_role; either add this grant in a new migration or ensure the RPC path is always used and fallback is dev-only.

---

## Security and Safety

- No raw SQL concatenation; app uses Supabase client (parameterized).
- RLS is enabled on all tables; `device_tokens` has no anon/authenticated policies (server-only via service_role). 
- `ensure_parent_from_auth_email` and `handle_new_user` use `search_path` and only touch intended tables.
- Trigger `on_auth_user_created` runs after insert on `auth.users`; backfill in 001 covers existing users.

---

## Checklist

- [x] RLS enabled on application tables
- [x] Helper functions use SECURITY DEFINER and explicit search_path
- [x] Indexes support main query patterns
- [x] Migrations idempotent where possible
- [ ] service_role grant on `public.parents` if app fallback path is used (see above)
