# Documentation Index

This folder contains all project documentation for Voobi. The root [README](../README.md) links here as the central hub for docs.

## Getting started

| Doc | Description |
|-----|-------------|
| [Setup guide](setup.md) | Prerequisites, Supabase, YouTube API, env vars, running the app and E2E tests. |
| [Product requirements (PRD)](prd.md) | Product vision, user flows, MVP scope, technical spec, and implementation sequence. |

## Running the app

| Doc | Description |
|-----|-------------|
| [Docker & E2E guide](docker-e2e.md) | Building and running with Docker, Playwright E2E tests, CI/CD, troubleshooting. |
| [E2E execution summary](e2e-execution-summary.md) | E2E test discovery results, environment notes, and recommendations. |

## Architecture & decisions

| Doc | Description |
|-----|-------------|
| [ADR-001: Households and device identity](ADR-001-households-and-device-identity.md) | Households as scope for whitelist; device tokens with cookie fallback. |
| [ADR-002: Service and repository layers](ADR-002-service-and-repository-layers.md) | API → service → repository; thin routes. |
| [Multi-parent video sharing architecture](MULTI_PARENT_VIDEO_SHARING_ARCHITECTURE.md) | Shared video whitelist and sync across multiple parents/guardians. |
| [YouTube OAuth architecture](YOUTUBE_OAUTH_ARCHITECTURE.md) | Connecting a child's YouTube account per household (OAuth flow, storage). |
| [Child account OAuth](CHILD_ACCOUNT_OAUTH.md) | Child accounts section: YouTube connection and linked children (Google identity OAuth). |

## Reviews & plans

| Doc | Description |
|-----|-------------|
| [Phase 1 security review](PHASE1_SECURITY_REVIEW.md) | npm audit, device-token fallback, OWASP checklist and remediation. |
| [Phase 1 E2E coverage and stability](PHASE1_E2E_COVERAGE_AND_STABILITY.md) | Node 20, data-testid gaps, critical flows, Phase 4 recommendations. |
| [Phase 2 refactor plan](PHASE2_REFACTOR_PLAN.md) | AdminDashboard, VideoModal, watch page split; depcheck; implementation order. |
| [Multi-parent code review](MULTI_PARENT_CODE_REVIEW.md) | Code review for multi-parent household feature. |
| [Multi-parent security review](MULTI_PARENT_SECURITY_REVIEW.md) | Security review for multi-parent household feature. |
| [YouTube OAuth code review](YOUTUBE_OAUTH_CODE_REVIEW.md) | Code review for YouTube OAuth integration. |
| [YouTube OAuth security review](YOUTUBE_OAUTH_SECURITY_REVIEW.md) | Security review for YouTube OAuth integration. |
| [Deletion log](DELETION_LOG.md) | Log of removed code and dependencies. |

## Changelog

The project [CHANGELOG](../CHANGELOG.md) is kept at the repository root.
