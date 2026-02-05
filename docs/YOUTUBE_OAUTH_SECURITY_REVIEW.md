# Security Review: YouTube OAuth (Connect Child's Account)

**File/Component:** youtube_connections, OAuth flow, youtube-connection API, AdminDashboard YouTube UI  
**Reviewed:** YouTube OAuth feature (minimal-interaction link)  
**Reviewer:** security-reviewer agent

## Summary

- **Critical issues:** 0  
- **High issues:** 0  
- **Medium issues:** 0  
- **Low issues:** 1  
- **Risk level:** LOW

## OWASP-oriented checks

1. **Injection:** All inputs use Zod (household_id UUID). State is signed, not parsed from untrusted payload without verification. Supabase client used for DB; no raw SQL.  
2. **Authentication:** GET /api/auth/youtube and GET/DELETE /api/youtube-connection require Supabase session. Callback requires session and verifies state.parentId === current user.  
3. **Authorization:** Every route validates household membership via `householdService.ensureMember(householdId, parentId)`. Callback additionally verifies signed state and that state.parentId matches session (prevents linking on behalf of another user).  
4. **Sensitive data:** Refresh token stored encrypted (AES-256-GCM). Access token not persisted. API responses expose only `connected` and optional `channelId`; no tokens or PII.  
5. **Access control:** RLS on `youtube_connections` limits read/write to household members. Repository uses user-scoped Supabase client.  
6. **Security config:** No default credentials. GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, YOUTUBE_OAUTH_ENCRYPTION_KEY from env. Rate limiting ("auth") on /api/auth/youtube, callback, and /api/youtube-connection.  
7. **XSS:** React escapes output; no user-controlled HTML. Toast and status messages are fixed or from trusted API (channelId).  
8. **CSRF / State:** OAuth state is HMAC-signed (householdId, parentId, nonce, exp). Callback verifies signature and expiry before exchanging code; prevents binding to another household or replay.

## Vulnerability patterns

- **Secrets:** All from env; encryption key used for HMAC (state) and AES (tokens). Key length supports 32-byte AES-256.  
- **Token handling:** Code exchanged once; refresh token encrypted at rest; no token in URLs or client.  
- **Redirect:** Callback redirect_uri derived from APP_URL; no open redirect. Google Console allowlist required.  
- **Scope:** Only `youtube.readonly` requested (least privilege).  
- **Error handling:** Callback catches errors and redirects to `/admin?youtube=error` without leaking details. handleApiError used on other routes; no tokens in responses.

## Low issue

- **Encryption key reuse:** Same env key used for state signing (HMAC) and token encryption (AES). Acceptable for this feature; consider separate keys for future if key rotation or different lifetimes are needed.

## Security checklist

- [x] No hardcoded secrets  
- [x] Inputs validated (Zod household_id)  
- [x] Authorization on all OAuth and youtube-connection routes  
- [x] RLS on youtube_connections (household members only)  
- [x] State signed and verified; expiry enforced  
- [x] Refresh token encrypted at rest  
- [x] Rate limiting on auth and youtube-connection endpoints  
- [x] No tokens or sensitive data in client or URL responses  

## Recommendation

**APPROVE** – No blocking issues. YouTube OAuth flow uses signed state, encrypted token storage, and consistent membership checks.
