# ADR-001: Households and Device Identity

## Status
Accepted

## Date
2026-02-04

## Context
SafeTube needed to support multiple parents sharing one video whitelist and to link child devices securely. The original model used a single `parent_id` and stored it in localStorage, which was insecure and did not support multi-parent households.

## Decision

### Households
- Introduced **households** as the scope for a shared whitelist. Multiple parents belong to a household via `household_members`; videos belong to a household (`household_id`), not directly to a parent.
- Device linking resolves parent by email, then returns that parent's households; user selects a household and receives a **device token** (or legacy `parent_id` cookie when service role is unavailable).
- APIs that list or mutate videos use `household_id`; authorization is enforced via household membership (e.g. `householdService.ensureMember(householdId, parentId)`).

### Device identity
- **Preferred:** When `SUPABASE_SERVICE_ROLE_KEY` is set, the app creates and validates **device tokens**: a random token is stored hashed in `device_tokens` with `household_id` and `parent_id`; the token is set in an httpOnly, secure cookie. Validation looks up the token in the DB and returns `householdId` (and optional `parentId`).
- **Fallback:** When the service role is not set (e.g. some dev setups), the app falls back to a **parent_id cookie** and resolves the default household for that parent. This is weaker: anyone who can set the cookie can impersonate that parent. Documented as technical debt; production should use device tokens.

## Consequences

### Positive
- Multi-parent households supported; one whitelist per household; clear authorization model.
- Device tokens are stored hashed, bound to household, and expire; httpOnly cookies reduce XSS impact.
- Backward compatibility: existing flows can still use parent_id cookie when DB-backed tokens are not available.

### Negative
- Fallback (parent_id cookie only) is insecure if an attacker can set cookies; Phase 2 security work should strengthen validation or require service role in production.
- Migration and schema complexity (households, household_members, device_tokens).

## References
- [MULTI_PARENT_VIDEO_SHARING_ARCHITECTURE.md](./MULTI_PARENT_VIDEO_SHARING_ARCHITECTURE.md)
- [CODE_REVIEW_IN_DEPTH.md](../.cursor/plans/CODE_REVIEW_IN_DEPTH.md) (device token validation note)
