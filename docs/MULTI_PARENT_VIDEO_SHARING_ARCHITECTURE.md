# Architecture: Multi-Parent Video Sharing and Sync

## Context

SafeTube currently has a single-parent model: one parent owns a video list, and child devices are linked to that parent. The product goal is to allow **multiple parents or guardians to share and sync the whitelisted videos for one or more children**.

## Requirements

### Functional
- Multiple parents/guardians can co-manage the same whitelist (add/remove videos).
- Changes made by any member are visible to all members and to all linked children (sync).
- One or more children can use the same whitelist (e.g., same household).
- Backward compatibility: existing single-parent accounts continue to work without mandatory migration.

### Non-Functional
- Authorization: only household members can add/delete videos or manage the household.
- Performance: list and write operations remain fast (no N+1, minimal round-trips).
- Security: RLS and API enforce membership; no cross-household data leakage.

## Current State

- **parents**: `id` (auth.users), `email`; synced from Supabase Auth.
- **videos**: `id`, `parent_id` (FK to parents), `youtube_id`, title, thumbnail, etc.; unique `(parent_id, youtube_id)`.
- **Device linking**: Child device stores `parent_id` (cookie or device_token); feed uses `parent_id` to load videos.

## Design Decision: Introduce Households

We introduce a **Household** as the scope for a shared whitelist. Multiple parents belong to a household; videos belong to a household; devices can be linked to a household so children see that household’s list.

### Data Model

```
households
  id            UUID PK
  name          TEXT (e.g. "Smith Family")
  created_at    TIMESTAMPTZ

household_members
  household_id  UUID FK → households(id) ON DELETE CASCADE
  parent_id     UUID FK → parents(id) ON DELETE CASCADE
  role          TEXT ('owner' | 'member')
  joined_at     TIMESTAMPTZ
  PRIMARY KEY (household_id, parent_id)

videos (evolved)
  id, youtube_id, title, thumbnail_url, duration_seconds, made_for_kids,
  watch_count, last_watched_at, created_at  -- unchanged
  household_id  UUID NOT NULL FK → households(id) ON DELETE CASCADE
  added_by      UUID NULL FK → parents(id)  -- audit only; optional
  UNIQUE (household_id, youtube_id)
  -- parent_id removed after migration; replaced by household_id + added_by
```

### Trade-offs

| Approach | Pros | Cons |
|----------|------|------|
| **Household as first-class** | Clear multi-parent model; one place to enforce membership; easy to add “children” later. | Requires migration and new tables. |
| Keep only parent_id, add “shared_to” parents | No new concept. | Complex: which parent “owns” list, how to sync, duplicate videos across parents. |
| **Decision** | Use households; migrate existing data to one household per parent. | Accepted migration and schema change. |

### Backward Compatibility and Migration

1. **Migration**
   - Create `households` and `household_members`.
   - Add `household_id` (nullable) and `added_by` (nullable) to `videos`.
   - For each existing parent: create a household (e.g. `name = 'My list'`, optional `id = gen_random_uuid()`), insert into `household_members` (that parent as `owner`), set `videos.household_id` and `videos.added_by` for all videos for that parent.
   - Make `household_id` NOT NULL; drop `parent_id` from `videos` (or keep for a short transition and remove in a follow-up).
   - Add RLS policies for households and household_members; update videos RLS to use `household_id` and membership.

2. **Device linking**
   - **Option A (recommended):** Device stores `household_id`. Link-device flow: parent enters email → resolve parent → choose household (or default) → set `household_id` on device/cookie.
   - **Option B:** Device continues to store `parent_id`; backend resolves “default” household for that parent (e.g. first household they belong to) and returns that household’s video list. Simpler for UI but couples device to parent instead of to list.
   - **Decision:** Use **household_id** on the device so the child is explicitly tied to one shared list; link-device UI can show “Which list?” when parent has multiple households.

3. **API**
   - **List videos:** `GET /api/videos?household_id=xxx` (and/or keep `parent_id` that backend maps to default household for backward compat).
   - **Add/delete video:** Require auth; validate that current user is a member of the video’s household; use `household_id` in body or context.
   - **Households:** `GET /api/households` (my households), `POST /api/households` (create), `POST /api/households/[id]/members` (invite by email), etc., as needed for MVP.

### Component Responsibilities

| Component | Responsibility |
|-----------|-----------------|
| **Household repository** | CRUD households; list members; add/remove member. |
| **Household service** | Create household; invite/remove member; “default household” for a parent (e.g. first by created_at). |
| **Video repository** | List/filter by `household_id`; create/delete with `household_id`; keep `added_by` on create. |
| **Video service** | Same as today but keyed by `household_id`; invalidate cache per household. |
| **Device token / cookie** | Store `household_id` (and optionally parent_id for “linked by”); resolve to household for feed. |
| **API routes** | Auth + household membership checks; accept `household_id` for videos; expose household endpoints as needed. |
| **Admin UI** | Household selector or “current household”; add/remove videos for that household; optional “invite guardian” (email) → add to household_members. |

### Security (High Level)

- **RLS:** Rows in `household_members` visible only to members; `videos` visible to anyone (for child feed) but writable only by household members (enforced in app/API).
- **API:** Every mutation (add video, delete video, manage household) checks `auth.uid()` and verifies membership via `household_members`.
- **Device linking:** Only a parent who is a member of the household can link a device to that household (link-device flow validates parent then lets them pick household they belong to).

### Scalability and Performance

- List videos: single query by `household_id`; existing cache key can be `household_id` instead of `parent_id`.
- No N+1: loading “my households” then “videos for selected household” is two round-trips.
- Indexes: `household_members(parent_id)`, `household_members(household_id)`, `videos(household_id)`, `videos(household_id, youtube_id)` unique.

### Future Extensions (Out of Scope for This Feature)

- Multiple children per household (profiles): device or session could store `child_id`; same whitelist, possibly different watch stats later.
- Invitation flow: invite by email → token → join household (can be added after MVP).

## Summary

- Introduce **households** and **household_members**; attach **videos** to **household_id** with optional **added_by**.
- Migrate existing data so each parent gets one household and their videos move to it.
- Device stores **household_id**; link-device flow resolves parent and lets them choose household.
- APIs and RLS enforce household membership for all writes and household-scoped reads.
- This yields a clear multi-parent shared whitelist with sync and a path to multi-child later.
