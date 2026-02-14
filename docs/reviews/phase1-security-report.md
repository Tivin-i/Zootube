# Phase 1: Security Review Report

**Reviewer:** Security Reviewer (subagent)  
**Date:** 2026-02-13  
**Scope:** API routes, services, validators, Supabase clients, env usage.

---

## Summary

- **Critical issues:** 0  
- **High issues:** 1 (device-token validation trust in dev fallback)  
- **Medium issues:** 2 (validate-invite open signup when unset; watch endpoint unauthenticated)  
- **Low issues:** 2 (admin client placeholder check; rate-limit identifier)  
- **Risk level:** MEDIUM

`npm audit` reports **0 vulnerabilities**. No hardcoded secrets found. Input validation (Zod) and parameterized Supabase queries are used consistently. Auth and membership checks are present on sensitive routes; RLS backs data access.

---

## Critical Issues (Fix Immediately)

None.

---

## High Issues (Fix Before Production)

### 1. Device token validation fallback (cookie-only)

**Severity:** HIGH  
**Category:** Broken Access Control / Authentication  
**Location:** `lib/services/device-token.service.ts` (lines 111–136)

**Issue:**  
When `SUPABASE_SERVICE_ROLE_KEY` is not set, `validateDeviceToken()` falls back to trusting the `PARENT_ID_COOKIE_NAME` cookie. Anyone who can set cookies on the origin can set `voobi_parent_id_secure` to a valid parent UUID and be treated as that parent (in dev). Production correctly returns `null` when service role is missing, but the fallback logic is fragile and could be mis-deployed.

**Impact:**  
In dev or if env is misconfigured in production, impersonation of a parent by setting a cookie.

**Remediation:**  
- Keep current production guard: when `NODE_ENV === "production"` and no admin client, return `null`.  
- Consider removing cookie-only fallback entirely and requiring service role for device linking in all environments, or document clearly that dev-only fallback must never be used in production.  
- Ensure deployment checklists require `SUPABASE_SERVICE_ROLE_KEY` for production.

---

## Medium Issues (Fix When Possible)

### 2. Validate-invite: open signup when env unset

**Severity:** MEDIUM  
**Category:** Security Misconfiguration  
**Location:** `app/api/auth/validate-invite/route.ts` (lines 28–35)

**Issue:**  
When neither `BETA_INVITE_CODE` nor `BETA_INVITE_CODES` is set, the API returns `valid: true` for any code. Signup becomes open. A dev-only `console.warn` is emitted.

**Impact:**  
If deployed without invite codes configured, anyone can pass validation and sign up.

**Remediation:**  
- In production, treat “no codes configured” as closed signup (e.g. return `valid: false` when `allowedCodes.length === 0` and `NODE_ENV === "production"`), or  
- Document that production must set `BETA_INVITE_CODE` or `BETA_INVITE_CODES` and add a startup or health check that fails if they are unset in production.

### 3. Watch endpoint unauthenticated

**Severity:** MEDIUM  
**Category:** Broken Access Control  
**Location:** `app/api/videos/[id]/watch/route.ts`

**Issue:**  
POST `/api/videos/[id]/watch` does not require authentication. Any caller with a valid video ID can increment watch count. Video IDs are UUIDs (hard to guess but enumerable).

**Impact:**  
Inflated watch counts; possible abuse if rate limit is high. No exposure of other users’ data.

**Remediation:**  
- Accept as product decision (e.g. kid device has no parent session), or  
- Require auth or device token and/or add idempotency (e.g. same session/user only counts once per time window).

---

## Low Issues (Consider Fixing)

### 4. Admin client does not reject placeholder URL/key

**Severity:** LOW  
**Category:** Security Misconfiguration  
**Location:** `lib/supabase/admin.ts` (lines 9–15)

**Issue:**  
`getAdminClientOrNull()` returns `null` only when URL or service role key is missing. It does not check for placeholder values (e.g. `https://placeholder.supabase.co`), unlike the server client in `lib/supabase/server.ts`.

**Remediation:**  
Reuse the same placeholder check as in `server.ts`: if URL or key equals a known placeholder, return `null`.

### 5. Rate limit identifier spoofing

**Severity:** LOW  
**Category:** Insufficient Rate Limiting  
**Location:** `lib/middleware/rate-limit.ts` (lines 87–93)

**Issue:**  
Client identifier is `x-forwarded-for` or `x-real-ip`. These headers can be spoofed if the app is not behind a trusted proxy that sets them. In-memory limit is per-identifier; Redis uses the same identifier.

**Remediation:**  
Document that in production the app must run behind a trusted proxy that sets these headers. Optionally support a configurable “trust proxy” and/or fallback to a hash of other request data when headers are missing.

---

## Security Checklist

- [x] No hardcoded API keys, passwords, or tokens
- [x] Secrets from environment variables; server validates Supabase URL/key
- [x] Input validation (Zod) on API inputs (query, body, params)
- [x] Supabase queries parameterized (no raw SQL concatenation)
- [x] Auth required on sensitive routes (households, device-token POST, videos POST/DELETE, children, youtube-connection)
- [x] Membership enforced via `ensureMember` before household-scoped actions
- [x] OAuth state signed (HMAC) and expiry checked; timing-safe compare
- [x] Rate limiting applied on API routes (public / auth / videoAdd)
- [x] `npm audit` clean (0 vulnerabilities)
- [ ] Production invite-code configuration enforced or documented (see Medium #2)
- [ ] Production device-token path requires service role (see High #1)

---

## Recommendations

1. **High:** Keep production behavior for device token (no cookie-only); add deployment checklist for `SUPABASE_SERVICE_ROLE_KEY`.  
2. **Medium:** Decide and document validate-invite behavior when no codes are set; consider failing closed in production.  
3. **Medium:** Document or tighten watch endpoint (auth vs. anonymous, idempotency).  
4. **Low:** Align admin client with server client placeholder checks; document proxy/rate-limit assumptions.
