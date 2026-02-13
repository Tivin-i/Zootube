# Docker & E2E Testing Implementation Plan

## Overview
This document outlines the implementation plan for Docker containerization and End-to-End (E2E) testing infrastructure for Voobi.

## Requirements

### Docker Requirements
1. **Production-ready Docker image** that can be run (but not started automatically)
2. **Multi-stage build** for optimal image size
3. **Environment variable support** for Supabase and YouTube API keys
4. **Development docker-compose** for local testing
5. **.dockerignore** to exclude unnecessary files

### E2E Testing Requirements
1. **Playwright-based E2E tests** for critical user journeys
2. **Test infrastructure** (fixtures, helpers, page objects)
3. **CI/CD ready** configuration
4. **Artifact management** (screenshots, videos, traces)
5. **Test scripts** integrated into package.json

## Architecture Decisions

### Docker Architecture
- **Base Image**: Node.js 20 LTS (Alpine for smaller size)
- **Multi-stage build**:
  - Stage 1: Dependencies installation
  - Stage 2: Build Next.js application
  - Stage 3: Production runtime (minimal dependencies)
- **Port**: 3000 (Next.js default)
- **Health check**: HTTP endpoint for container health

### E2E Testing Architecture
- **Framework**: Playwright (modern, reliable, cross-browser)
- **Test Structure**:
  - `tests/e2e/` - E2E test files
  - `tests/fixtures/` - Test data and helpers
  - `tests/pages/` - Page Object Model classes
- **Critical User Journeys**:
  1. Device linking flow
  2. Video browsing (home page)
  3. Video watching
  4. Admin authentication (if testable)
- **Test Environment**: Local Next.js server (via webServer config)

## Implementation Steps

### Phase 1: Docker Setup

#### Step 1.1: Create Dockerfile
- Multi-stage build with Node.js 20 Alpine
- Optimize for production
- Include health check
- Set proper working directory
- Use non-root user for security

#### Step 1.2: Create docker-compose.yml
- Development service configuration
- Environment variable mapping
- Volume mounting for hot reload (optional)
- Network configuration

#### Step 1.3: Create .dockerignore
- Exclude node_modules, .next, .git
- Exclude test files and documentation
- Exclude IDE files

### Phase 2: E2E Testing Setup

#### Step 2.1: Install Playwright
- Add @playwright/test to devDependencies
- Install Playwright browsers
- Create playwright.config.ts

#### Step 2.2: Create Test Infrastructure
- Page Object Model classes:
  - HomePage
  - LinkDevicePage
  - WatchPage
  - AdminPage (if testable)
- Test fixtures for:
  - Authentication helpers
  - Test data setup
  - API mocking (if needed)

#### Step 2.3: Create E2E Tests
- Device linking test
- Video browsing test
- Video watching test
- Error handling tests

#### Step 2.4: Configure CI/CD
- Add test scripts to package.json
- Configure Playwright for CI environment
- Set up artifact uploads

## File Structure

```
/opt/voobi/
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── playwright.config.ts
├── tests/
│   ├── e2e/
│   │   ├── device-linking.spec.ts
│   │   ├── video-browsing.spec.ts
│   │   ├── video-watching.spec.ts
│   │   └── admin.spec.ts (if testable)
│   ├── fixtures/
│   │   ├── auth.ts
│   │   └── test-data.ts
│   └── pages/
│       ├── HomePage.ts
│       ├── LinkDevicePage.ts
│       ├── WatchPage.ts
│       └── AdminPage.ts
└── package.json (updated with E2E scripts)
```

## Testing Strategy

### Test Coverage Goals
- **Critical Paths**: 100% coverage
  - Device linking
  - Video browsing
  - Video playback
- **Error Scenarios**: Key error cases
  - Invalid device token
  - Network failures
  - Missing videos

### Test Execution
- **Local**: `npm run test:e2e`
- **CI**: Automated on PR/push
- **Debug**: `npm run test:e2e:debug`

## Security Considerations

### Docker
- Non-root user in container
- Minimal base image (Alpine)
- No secrets in image layers
- Environment variables for sensitive data

### E2E Tests
- No real API keys in tests
- Mock external services where possible
- Test data isolation
- Cleanup after tests

## Success Criteria

### Docker
- ✅ Docker image builds successfully
- ✅ Image can be run with docker run
- ✅ Environment variables work correctly
- ✅ Health check responds
- ✅ Image size is reasonable (<500MB)

### E2E Tests
- ✅ All critical journeys have tests
- ✅ Tests run reliably (no flakiness)
- ✅ Tests execute in <5 minutes
- ✅ Artifacts are captured on failure
- ✅ Tests can run in CI/CD

## Risks & Mitigations

### Risk 1: E2E Tests Require Real Supabase
- **Mitigation**: Use test Supabase project or mock API calls

### Risk 2: Flaky Tests
- **Mitigation**: Use proper waits, retries, and stable selectors

### Risk 3: Docker Image Size
- **Mitigation**: Multi-stage build, Alpine base, exclude dev dependencies

### Risk 4: Environment Variable Management
- **Mitigation**: Clear documentation, .env.example, docker-compose env mapping

## Next Steps After Implementation

1. Document Docker usage in README
2. Add E2E test documentation
3. Set up CI/CD pipeline integration
4. Monitor test stability and fix flaky tests
5. Expand test coverage based on usage patterns
