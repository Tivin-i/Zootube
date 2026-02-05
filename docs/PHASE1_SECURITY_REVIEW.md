# Phase 1 Security Review Report

**Reviewed:** 2026-02-04  
**Reviewer:** security-reviewer (Phase 1)  
**Scope:** parent-by-email, device-token service, auth/youtube, youtube-connection, dependencies, secrets

---

## Summary

- **Critical issues:** 1 (Next.js RCE advisory)
- **High issues:** 1 (jws HMAC verification)
- **Medium issues:** 2 (lodash prototype pollution; device-token cookie fallback)
- **Low issues:** 2 (encryption key reuse; ensure .env not committed)
- **Risk level:** HIGH (due to dependency vulnerabilities)

---

## Critical Issues (Fix Immediately)

### 1. Next.js RCE (React flight protocol)

**Severity:** CRITICAL  
**Category:** Using components with known vulnerabilities  
**Location:** `package.json` — next (direct dependency)

**Issue:** Next.js is vulnerable to RCE in React flight protocol (GHSA-9qr9-h5gf-34mp). CVSS 10.0.

**Remediation:**
- Run `npm audit fix` or upgrade Next.js to a patched version as soon as one is available.
- Check https://github.com/advisories/GHSA-9qr9-h5gf-34mp for fixed version and upgrade.

**References:** GitHub Advisory GHSA-9qr9-h5gf-34mp

---

## High Issues (Fix Before Production)

### 2. jws – Improper HMAC signature verification

**Severity:** HIGH  
**Category:** Using components with known vulnerabilities  
**Location:** Transitive dependency (jws)

**Issue:** auth0/node-jws improperly verifies HMAC signature (GHSA-869p-cjfg-cm3x). CVSS 7.5.

**Remediation:** Update dependency tree so a patched version of jws is used; `npm audit fix` if available, or wait for upstream fix in the direct dependency that pulls in jws.

**References:** GitHub Advisory GHSA-869p-cjfg-cm3x

---

## Medium Issues (Fix When Possible)

### 3. Device-token validation fallback (cookie-only)

**Severity:** MEDIUM  
**Category:** Broken access control / insufficient authorization  
**Location:** `lib/services/device-token.service.ts` — `validateDeviceToken()`

**Issue:** When `SUPABASE_SERVICE_ROLE_KEY` is not set, validation falls back to reading `PARENT_ID_COOKIE_NAME`. Anyone who can set cookies (e.g. same-origin) can set that cookie and be treated as that parent for the session.

**Impact:** In trusted home use impact is limited; in shared or kiosk environments this could allow impersonation.

**Remediation:**
- Production should always use service role and DB-backed device tokens; document that fallback is dev-only.
- Optionally: reject or restrict fallback when `NODE_ENV === 'production'`.
- Long-term: consider signed cookies or a separate token store so validation does not rely solely on an unverified parent_id cookie.

**References:** CODE_REVIEW_IN_DEPTH.md §2.4

### 4. Lodash prototype pollution

**Severity:** MODERATE  
**Category:** Using components with known vulnerabilities  
**Location:** Transitive dependency (lodash)

**Issue:** Lodash has prototype pollution in `_.unset` and `_.omit` (GHSA-xxjr-mmjv-4gpg). CVSS 6.5.

**Remediation:** `npm audit fix` or upgrade to lodash > 4.17.22 if possible; or ensure no user-controlled keys are passed to affected functions.

---

## Low Issues (Consider Fixing)

### 5. Encryption key reuse (OAuth)

**Severity:** LOW  
**Category:** Security configuration  
**Location:** YouTube OAuth flow — same env key for state signing (HMAC) and token encryption (AES)

**Issue:** Same key used for two purposes; rotation or compromise of one use case affects the other.

**Remediation:** Consider separate env vars for state signing vs token encryption in future; not blocking.

**References:** YOUTUBE_OAUTH_SECURITY_REVIEW.md

### 6. Environment files and secrets

**Severity:** LOW  
**Category:** Sensitive data exposure  
**Location:** `.env`, `.env.local`

**Issue:** Grep found `YOUTUBE_API_KEY` in `.env` and `.env.local`. These files must not be committed; real keys must only live in environment or secure secret store.

**Remediation:** Confirm `.env` and `.env.local` are in `.gitignore`; never commit real keys; use `.env.example` with placeholders only.

---

## OWASP-Oriented Checks (summary)

| Category | Status |
|----------|--------|
| Injection | Zod used on API inputs; parameterized Supabase; no raw SQL. OK. |
| Broken authentication | Admin: Supabase Auth. Device: token or cookie; fallback is weaker (see #3). |
| Sensitive data exposure | Error handler hides details in production; tokens not in responses. OK. |
| Access control | householdService.ensureMember on protected routes; RLS in use. OK. |
| Security misconfiguration | Rate limiting applied; no default credentials in code. |
| XSS | React escaping; no user-controlled HTML. OK. |
| Known vulnerabilities | Next.js, jws, lodash — see above. |

---

## Security Checklist

- [x] No hardcoded secrets in source (credentials from env)
- [x] Input validation (Zod) on parent-by-email, device-token, videos, households, youtube-connection
- [x] Rate limiting on parent-by-email (public), auth/youtube, youtube-connection (auth)
- [x] Parent-by-email returns minimal data (parentId + households); 404 same message for not found (no email enumeration)
- [ ] **Fix Next.js and dependency vulnerabilities (npm audit)**
- [ ] **Tighten device-token fallback in production or document and enforce service role**
- [ ] Ensure .env / .env.local never committed

---

## Recommendations

1. **Immediate:** Run `npm audit` and apply fixes for critical/high where possible; track Next.js patch.
2. **Before production:** Require `SUPABASE_SERVICE_ROLE_KEY` in production so device tokens are always DB-validated; or add runtime check and reject cookie-only fallback in production.
3. **Process:** Add `npm audit` to CI; consider `audit-ci` or similar to block high/critical.

---

## Phase 2 Remediation (2026-02-04)

- **npm audit fix:** Applied. jws, lodash, qs vulnerabilities addressed (3 packages updated).
- **Next.js:** Critical RCE (GHSA-9qr9-h5gf-34mp) fix requires upgrading to Next.js 16.1.6 or 16.0.7. Run: `npm install next@16.1.6 eslint-config-next@16.1.6` (or use patched 16.0.7). Re-run `npm audit` after upgrade.
- **Device-token fallback:** In `lib/services/device-token.service.ts`, when `NODE_ENV === "production"`, cookie-only fallback is disabled (validation returns null if service role is not set). Production must set `SUPABASE_SERVICE_ROLE_KEY` for device linking to work.
- **.gitignore:** Confirmed `.env*` is ignored; no change needed.
