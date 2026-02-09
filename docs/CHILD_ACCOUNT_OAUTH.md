# Child Account OAuth — Architecture

## Overview

The parent admin dashboard supports two OAuth flows under the **Child accounts** section:

1. **Child's YouTube account** — Connect one YouTube account per household (existing flow). Used for future playlist/subscription features. See [YouTube OAuth architecture](YOUTUBE_OAUTH_ARCHITECTURE.md).

2. **Linked children** — Link one or more child Google accounts (identity only: email, name) to the household. Stored as profiles for future multi-child and device-assignment features.

Both use the same Google OAuth client (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) but different redirect URIs and scopes.

---

## Child-identity OAuth (linked children)

### Data model

**Table: `household_children`**

| Column           | Type      | Description                                |
|------------------|-----------|--------------------------------------------|
| `id`             | UUID      | Primary key                                |
| `household_id`   | UUID      | FK to households, NOT NULL                 |
| `google_sub`     | TEXT      | Google OAuth subject (unique per household)|
| `email`          | TEXT      | Nullable                                   |
| `display_name`   | TEXT      | Nullable                                   |
| `linked_at`      | TIMESTAMPTZ | Default NOW()                            |
| `linked_by`      | UUID      | FK to parents, nullable                    |

- **Unique:** `(household_id, google_sub)` — same Google account cannot be added twice to the same household.
- **RLS:** SELECT/INSERT/UPDATE/DELETE only for users who are members of the household.

### OAuth flow

- **Scopes:** `openid`, `https://www.googleapis.com/auth/userinfo.email`, `https://www.googleapis.com/auth/userinfo.profile` (no YouTube scope).
- **Redirect URI:** `{APP_URL}/api/auth/child/callback`. Must be allowlisted in Google Cloud Console (same OAuth client as YouTube, add this redirect URI).
- **State:** Signed payload (HMAC, same key as YouTube state) with `type: "child"`, `householdId`, `parentId`, `nonce`, `exp`. Callback verifies type and signature before exchanging code.

### Endpoints

| Method | Path                        | Purpose |
|--------|-----------------------------|---------|
| GET    | `/api/auth/child`           | Query: `household_id`. Auth + membership; redirect to Google. |
| GET    | `/api/auth/child/callback`  | Query: `code`, `state`. Exchange code, fetch userinfo, upsert `household_children`; redirect to `/admin?child=connected` or `?child=error`. |
| GET    | `/api/children`             | Query: `household_id`. Returns list of linked children; auth + membership. |
| DELETE | `/api/children/[id]`        | Removes linked child; auth + membership (child must belong to user's household). |

### Security

- Signed state with expiry (replay and CSRF protection).
- No tokens stored for child identity (only `google_sub`, `email`, `display_name`).
- Rate limiting on auth and children routes.
- RLS enforces household membership.

---

## Dashboard UI

- **Child accounts** section contains:
  - **Child's YouTube account** block: Connect / Disconnect YouTube (one per list).
  - **Linked children** block: List of linked children (name, email, linked date), **Add child** button, per-child **Remove**.
- Toasts for `?child=connected` and `?child=error` (same pattern as YouTube).

---

## Env and Google Cloud

- Same as YouTube OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APP_URL`, `YOUTUBE_OAUTH_ENCRYPTION_KEY` (used for child state signing).
- In Google Cloud Console, add redirect URI: `https://<your-domain>/api/auth/child/callback` (and `http://localhost:3000/api/auth/child/callback` for local).
