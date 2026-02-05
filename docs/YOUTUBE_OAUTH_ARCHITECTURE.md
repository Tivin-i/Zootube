# Architecture: YouTube OAuth — Connect Child's YouTube Account

## Goal

Allow a registered parent to connect **one YouTube account** to a household with **minimal interaction**: one "Connect YouTube" action, one redirect to Google consent, one callback. The account linked is whoever signs in during OAuth (e.g. parent signs in with child's Google account). No ongoing child interaction in the app.

## Data Model

### Table: `youtube_connections`

One row per household. Tokens are stored server-side only; refresh token is encrypted at rest.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() |
| `household_id` | UUID | NOT NULL REFERENCES households(id) ON DELETE CASCADE, UNIQUE |
| `encrypted_refresh_token` | TEXT | NOT NULL |
| `youtube_channel_id` | TEXT | NULL (for display; set after first token use) |
| `linked_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |
| `linked_by` | UUID | NULL REFERENCES parents(id) ON DELETE SET NULL |

- **Index:** `household_id` (unique already gives lookup).
- **RLS:** Enable RLS. Policies:
  - **SELECT:** User is a member of the household (`household_id IN (SELECT household_id FROM household_members WHERE parent_id = auth.uid())`).
  - **INSERT:** Same membership check (WITH CHECK).
  - **UPDATE:** Same membership check (USING + WITH CHECK).
  - **DELETE:** Same membership check (USING).

Access from app: use Supabase client with user's JWT so RLS applies. For callback route we have the user from session and validate membership in service layer before inserting; use service role or ensure insert runs in a context where RLS allows it (e.g. after ensuring the authenticated user is a member, use the same user-scoped client to insert so RLS passes).

## OAuth Flow

- **Flow type:** Server-side web application (Google-recommended when storing tokens).
- **Scopes:** `https://www.googleapis.com/auth/youtube.readonly` only (playlists.list, subscriptions.list, channels for profile).
- **State:** Signed or encrypted payload containing `householdId` (UUID), nonce, and expiry (e.g. 10 minutes). Callback verifies signature and expiry before exchanging code. Prevents CSRF and binding to wrong household.
- **Redirect URI:** Fixed from `APP_URL` (e.g. `https://<host>/api/auth/youtube/callback`). Must be allowlisted in Google Cloud Console.

### Endpoints

| Method | Path | Purpose |
|--------|------|--------|
| GET | `/api/auth/youtube` | Query: `household_id`. Validates auth + membership; builds state; redirects to Google authorization URL. |
| GET | `/api/auth/youtube/callback` | Query: `code`, `state`. Verifies state; exchanges code for tokens; stores encrypted refresh_token; redirects to `/admin?youtube=connected` or `?youtube=error`. |
| GET | `/api/youtube-connection` | Query: `household_id`. Returns `{ connected: boolean, channelId?: string }`; auth + membership required. |
| DELETE | `/api/youtube-connection` | Query: `household_id`. Removes connection; auth + membership required. |

## Token Storage

- **Refresh token:** Persisted in `youtube_connections.encrypted_refresh_token`. Encrypt with AES-256-GCM (or equivalent) using a key from env (`YOUTUBE_OAUTH_ENCRYPTION_KEY`). Key must be 32 bytes (hex or base64) for AES-256.
- **Access token:** Not stored. Obtained when needed via refresh_token and kept in memory for the duration of a request (e.g. when calling YouTube API for playlists/subscriptions in a future import feature).
- **State:** Encode `{ householdId, nonce, exp }` as JSON, sign with HMAC (e.g. using same encryption key or a dedicated secret). Callback decodes and verifies before exchanging code.

## API Contracts

### GET /api/auth/youtube

- **Query:** `household_id` (UUID, required).
- **Auth:** Required (Supabase session).
- **Authorization:** Caller must be a member of the household.
- **Response:** 302 redirect to Google OAuth (no JSON body).
- **Errors:** 400 missing/invalid household_id; 401 unauthenticated; 403 not a member.

### GET /api/auth/youtube/callback

- **Query:** `code` (from Google), `state` (signed payload).
- **Auth:** Not required for redirect landing; state binds to household. After exchange we need to identify the user for `linked_by`: use session if available, or store in state (encrypted) the parent_id that initiated the flow so callback can set `linked_by`. Prefer: require session in callback (user must still be logged in when Google redirects back); then we know `linked_by` and can re-validate membership.
- **Response:** 302 redirect to `/admin?youtube=connected` or `/admin?youtube=error`.
- **Errors:** Invalid/expired state → redirect with `?youtube=error`; exchange failure → same.

### GET /api/youtube-connection

- **Query:** `household_id` (UUID, required).
- **Auth:** Required.
- **Authorization:** Caller must be a member of the household.
- **Response:** `200` body `{ connected: boolean, channelId?: string }`.
- **Errors:** 400 invalid household_id; 401; 403.

### DELETE /api/youtube-connection

- **Query:** `household_id` (UUID, required).
- **Auth:** Required.
- **Authorization:** Caller must be a member of the household.
- **Response:** `200` body `{ success: true }`.
- **Errors:** 400; 401; 403.

## Security Decisions

| Decision | Rationale |
|----------|-----------|
| Signed state | Prevents CSRF and linking another household's ID; expiry limits replay. |
| Encrypt refresh token | At-rest protection; key in env, not in code. |
| Minimal scope (youtube.readonly) | Least privilege; sufficient for future playlist/subscription read. |
| Membership on every route | Reuse `householdService.ensureMember(householdId, parentId)`. |
| No tokens in URLs or client | Tokens only server-side; callback uses code once then redirects. |
| Rate limiting | Apply to OAuth and youtube-connection routes. |

## Dependencies

- **Google Cloud Console:** OAuth 2.0 Client ID (Web application), consent screen, redirect URI.
- **Env:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APP_URL` (or `NEXTAUTH_URL`), optional `YOUTUBE_OAUTH_ENCRYPTION_KEY`.
- **Runtime:** `google-auth-library` (OAuth2Client) and `googleapis` (YouTube) already in project.

## Out of Scope (This Phase)

- Playlist/subscription import (future use of stored connection).
- Multiple YouTube accounts per household (one connection per household only).
