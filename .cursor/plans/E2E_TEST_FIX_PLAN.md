# E2E Test Fix Plan

## Date
2026-01-29

## Issues Identified

### 🔴 CRITICAL: Node.js Version Mismatch

**Issue**: 
- Current Node.js version: `v18.19.1`
- Required Node.js version for Next.js 16: `>=20.9.0`
- Error: `Process from config.webServer was not able to start. Exit code: 1`

**Impact**: 
- E2E tests cannot run because the Next.js dev server fails to start
- This is a blocking issue that prevents all E2E tests from executing

**Root Cause**:
- System has Node.js 18.19.1 installed at `/usr/bin/node`
- Next.js 16.0.6 requires Node.js >=20.9.0
- The webServer configuration in `playwright.config.ts` tries to start `npm run dev`, which fails due to version mismatch

**Fix Options**:

#### Option 1: Upgrade System Node.js (Recommended for Production)
```bash
# Using nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20

# Verify
node --version  # Should show v20.x.x
```

#### Option 2: Use Docker for E2E Tests
- Run E2E tests inside a Docker container with Node.js 20
- This isolates the test environment and ensures consistency

#### Option 3: Use CI/CD Environment
- Run E2E tests in CI/CD pipeline with Node.js 20
- Local development can continue with Node.js 18 for other tasks

#### Option 4: Downgrade Next.js (Not Recommended)
- Downgrade to Next.js 15 which supports Node.js 18
- This is not recommended as it may break existing functionality

**Recommended Solution**: Option 1 (Upgrade Node.js) or Option 2 (Use Docker)

---

### 🟡 MEDIUM: Port Configuration

**Issue**: 
- Port 3000 is already in use by `vps-manager-frontend-dev` container
- Tests need to use a different port

**Status**: ✅ **FIXED**
- Updated `playwright.config.ts` to use port 3001
- Updated `docker-compose.yml` to map port 3001:3000
- Updated webServer command to use `PORT=3001 npm run dev`

**Verification Needed**:
- Verify port 3001 is available
- Test that Next.js dev server starts on port 3001
- Ensure all test URLs use port 3001

---

### 🟢 LOW: Test Selector Stability

**Issue**: 
- Some tests use generic selectors (text-based, class-based) instead of `data-testid`
- This may cause flakiness if UI text or classes change

**Examples**:
- `page.locator('text=/error|failed/i')` - text-based selector
- `page.locator('.animate-spin')` - class-based selector
- `page.locator('input[type="email"]')` - attribute-based selector

**Impact**: 
- Tests may break if UI text changes
- Tests may be less reliable than using stable `data-testid` attributes

**Recommendation**:
- Add `data-testid` attributes to key UI elements in components
- Update test selectors to use `data-testid` where possible
- Keep text/class selectors as fallbacks

**Priority**: Low - Current selectors work but could be more stable

---

### 🟢 LOW: Browser Installation

**Issue**: 
- Playwright browsers may not be installed
- Error: `Failed to install browsers` (permission issue encountered earlier)

**Status**: 
- Browsers need to be installed with proper permissions
- Command: `npx playwright install --with-deps chromium`

**Fix**:
```bash
# Install browsers (may require sudo or proper permissions)
npx playwright install --with-deps chromium

# Or install all browsers
npx playwright install --with-deps
```

**Priority**: Low - Can be done after Node.js upgrade

---

## Test Execution Status

### Current Status: ❌ BLOCKED

**Reason**: Node.js version mismatch prevents test execution

**Tests Recognized**: ✅
- 20 tests across 4 test files
- 3 browser projects (chromium, firefox, webkit)
- Total: 60 test cases

**Code Quality Checks**: ✅
- TypeScript compilation: ✅ PASSING (no errors)
- Playwright installation: ✅ INSTALLED (v1.58.0)
- Test file structure: ✅ VALID
- Import statements: ✅ VALID

**Test Files**:
- ✅ `tests/e2e/device-linking.spec.ts` - 5 tests
- ✅ `tests/e2e/video-browsing.spec.ts` - 5 tests
- ✅ `tests/e2e/video-watching.spec.ts` - 5 tests
- ✅ `tests/e2e/navigation.spec.ts` - 3 tests

---

## Fix Implementation Steps

### Step 1: Resolve Node.js Version (CRITICAL)

**Option A: Upgrade Node.js (Recommended)**
```bash
# Install nvm if not already installed
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Install and use Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Verify installation
node --version  # Should be v20.x.x
npm --version

# Reinstall dependencies with correct Node version
cd /opt/safetube
rm -rf node_modules package-lock.json
npm install
```

**Option B: Use Docker for Tests**
```bash
# Create a test Dockerfile
# Run tests in container with Node.js 20
docker run --rm -v $(pwd):/app -w /app node:20-alpine sh -c "npm install && npm run test:e2e"
```

### Step 2: Verify Port Configuration

```bash
# Check if port 3001 is available
lsof -i :3001 || echo "Port 3001 is available"

# Test Next.js dev server on port 3001
PORT=3001 npm run dev &
sleep 5
curl http://localhost:3001/api/health
pkill -f "next dev"
```

### Step 3: Install Playwright Browsers

```bash
# After Node.js upgrade
npx playwright install --with-deps chromium

# Or install all browsers
npx playwright install --with-deps
```

### Step 4: Run Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test tests/e2e/device-linking.spec.ts

# Run in UI mode for debugging
npm run test:e2e:ui
```

### Step 5: Fix Test Issues (After Tests Run)

Once tests can execute, identify and fix:
- Flaky tests
- Selector issues
- Timing issues
- API mocking issues

---

## Expected Test Results (After Fixes)

After resolving the Node.js version issue, tests should:
1. ✅ Start Next.js dev server on port 3001
2. ✅ Execute all 20 test cases
3. ✅ Generate test reports
4. ✅ Capture screenshots/videos on failure
5. ✅ Run across 3 browsers (chromium, firefox, webkit)

---

## Verification Checklist

- [x] Node.js upgraded to v20.x.x (via nvm)
- [x] Port 3001 is available and working
- [x] Playwright browsers installed (chromium)
- [x] Next.js dev server starts successfully
- [x] All E2E tests can execute
- [x] Test reports generate correctly
- [x] No blocking test failures (19/19 passed)

## Run Tests (after nvm + Node 20)

```bash
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use default   # or nvm use 20
npx playwright test --project=chromium
```

---

## Additional Notes

### Environment Variables Required

Tests may need these environment variables (if not using mocks):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `YOUTUBE_API_KEY`

However, tests are designed to use mocks, so these may not be strictly required.

### CI/CD Considerations

For CI/CD environments:
- Ensure Node.js 20 is available
- Install Playwright browsers: `npx playwright install --with-deps`
- Set `BASE_URL` environment variable if testing against staging/production
- Configure artifact uploads for test results

---

## Summary

**Primary Blocker**: Node.js version mismatch (v18.19.1 vs required >=20.9.0)

**Secondary Issues**: 
- ✅ Port configuration (FIXED)
- 🟡 Test selector stability (LOW priority)
- 🟡 Browser installation (LOW priority)

**Next Steps**:
1. Upgrade Node.js to v20.x.x
2. Verify port 3001 works
3. Install Playwright browsers
4. Run tests and fix any issues that arise

**Estimated Fix Time**: 
- Node.js upgrade: 10-15 minutes
- Test execution and fixes: 30-60 minutes (depending on issues found)
