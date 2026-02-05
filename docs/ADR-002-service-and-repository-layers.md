# ADR-002: Service and Repository Layers

## Status
Accepted

## Date
2026-02-04

## Context
API routes initially mixed HTTP handling with direct database access and business logic, making testing and consistency difficult.

## Decision
- **Repository layer** (`lib/repositories/`): Data access only. Each entity (parent, video, household, youtube_connection) has a repository that wraps Supabase client calls. APIs do not call Supabase directly for domain data.
- **Service layer** (`lib/services/`): Business logic and orchestration. Services use repositories and validators; they enforce rules (e.g. membership checks, token creation). API route handlers parse input (Zod), call one or more services, and return responses.
- **API routes** (`app/api/`): Thin. Validate request (query/body via Zod), apply rate limiting, call services, handle errors via `handleApiError`.

## Consequences

### Positive
- Testability: services and repositories can be unit-tested with mocks.
- Consistent authorization (e.g. `householdService.ensureMember`) and error handling.
- Clear place for caching, logging, and future DB swaps.

### Negative
- More files and indirection; new contributors must follow the layering.

## References
- Current layout: [lib/services/](../lib/services/), [lib/repositories/](../lib/repositories/)
