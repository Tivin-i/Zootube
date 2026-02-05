# Code Review: YouTube OAuth (Connect Child's Account)

**Reviewed:** YouTube OAuth flow, youtube_connections, admin YouTube UI  
**Reviewer:** code-reviewer agent

## Summary

- **Critical issues:** 0  
- **High issues:** 0  
- **Medium issues:** 0  
- **Recommendation:** APPROVE

## Checklist

- **Code is simple and readable:** Yes; repository, OAuth service, connection service, and API routes follow existing patterns (repository → service → route; Zod; handleApiError).
- **Functions and variables well-named:** Yes; `createSignedState`, `verifyAndDecodeState`, `linkConnectionFromState`, `getStatus`, `fetchYoutubeStatus` are clear.
- **No duplicated code:** Membership checks delegated to `householdService.ensureMember`; OAuth helpers in one service.
- **Proper error handling:** handleApiError on auth and youtube-connection routes; callback redirects to `?youtube=error` without leaking details; frontend shows generic messages for 401/403 and API errors.
- **No exposed secrets:** All credentials and encryption key from env; no tokens in responses or URLs.
- **Input validation:** household_id validated with `householdIdSchema` (Zod UUID) on all routes; state verified by signature and expiry.
- **Performance:** Single row per household; indexed on household_id; no N+1.

## Security checks (CRITICAL)

- No hardcoded credentials; env for Google OAuth and encryption key.
- No SQL injection; Supabase client only; RLS on youtube_connections.
- No unescaped user input in HTML; React and fixed/API-derived strings only.
- Input validation on all API routes (household_id).
- Authorization: every route requires auth and household membership; callback verifies state.parentId === session user.

## Minor notes (non-blocking)

- **AdminDashboard:** YouTube section depends on `selectedHouseholdId`; when households are still loading, the section is hidden (acceptable).
- **OAuth service:** `getEncryptionKey()` and `getSigningKey()` both read from the same env var; consider extracting a small helper to avoid drift if keys are split later.

## Approval

**APPROVE** – No blocking issues. Safe to merge; aligns with existing patterns and security practices.
