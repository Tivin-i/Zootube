# Docker & E2E Testing Guide

## Docker Setup

### Building the Docker Image

```bash
# Build the production image
docker build -t voobi:latest .

# Build with a specific tag
docker build -t voobi:v1.0.0 .
```

### Running the Docker Container

```bash
# Run with environment variables from .env file
docker run -p 3000:3000 --env-file .env voobi:latest

# Run with inline environment variables
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
  -e SUPABASE_SERVICE_ROLE_KEY=your_key \
  -e YOUTUBE_API_KEY=your_key \
  voobi:latest

# Run in detached mode
docker run -d -p 3000:3000 --name voobi-app --env-file .env voobi:latest
```

### Using Docker Compose

```bash
# Start the application
docker-compose up

# Start in detached mode
docker-compose up -d

# Stop the application
docker-compose down

# Rebuild and start
docker-compose up --build
```

### Health Check

The container includes a health check endpoint:

```bash
# Check health status
curl http://localhost:3000/api/health

# Expected response:
# {"status":"ok","timestamp":"2026-01-29T..."}
```

### Docker Image Details

- **Base Image**: Node.js 20 Alpine (minimal size)
- **Port**: 3000
- **User**: Non-root (nextjs user)
- **Health Check**: Enabled (30s interval)
- **Standalone Output**: Optimized for production

## E2E Testing

### Prerequisites

```bash
# Install Playwright browsers (if not already installed)
npx playwright install --with-deps chromium
```

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug

# Run tests with visible browser
npm run test:e2e:headed

# Run specific test file
npx playwright test tests/e2e/device-linking.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Show test report
npm run test:e2e:report
```

### Test Structure

```
tests/
├── e2e/                    # E2E test files
│   ├── device-linking.spec.ts
│   ├── video-browsing.spec.ts
│   ├── video-watching.spec.ts
│   └── navigation.spec.ts
├── fixtures/               # Test helpers and data
│   ├── auth.ts
│   └── test-data.ts
└── pages/                  # Page Object Model
    ├── HomePage.ts
    ├── LinkDevicePage.ts
    └── WatchPage.ts
```

### Test Coverage

The E2E tests cover critical user journeys:

1. **Device Linking**
   - Redirect when device not linked
   - Link device form display
   - Invalid email handling
   - Email not found handling
   - Loading states

2. **Video Browsing**
   - Redirect when not linked
   - Loading states
   - Video display
   - Empty state handling
   - Error handling
   - Video card interaction

3. **Video Watching**
   - Video player display
   - Video title display
   - Not found handling
   - Watch count tracking
   - Recommendations display

4. **Navigation**
   - Page navigation
   - Device link persistence
   - Browser back/forward

### Test Configuration

The Playwright configuration (`playwright.config.ts`) includes:

- **Base URL**: `http://localhost:3000` (configurable via `BASE_URL` env var)
- **Retries**: 2 retries in CI, 0 locally
- **Workers**: 1 in CI, parallel locally
- **Artifacts**: Screenshots on failure, videos on failure, traces on first retry
- **Web Server**: Automatically starts Next.js dev server for tests
- **Browsers**: Chromium, Firefox, WebKit

### CI/CD Integration

The tests are configured for CI/CD:

```yaml
# Example GitHub Actions workflow
- name: Run E2E tests
  run: npm run test:e2e
  env:
    BASE_URL: ${{ secrets.STAGING_URL }}
```

### Debugging Failed Tests

1. **View HTML Report**:
   ```bash
   npm run test:e2e:report
   ```

2. **Run in Debug Mode**:
   ```bash
   npm run test:e2e:debug
   ```

3. **Check Artifacts**:
   - Screenshots: `test-results/`
   - Videos: `test-results/`
   - Traces: `test-results/`

4. **View Trace**:
   ```bash
   npx playwright show-trace test-results/trace.zip
   ```

### Writing New Tests

1. **Create Page Object** (if needed):
   ```typescript
   // tests/pages/NewPage.ts
   import { Page, Locator } from '@playwright/test';
   
   export class NewPage {
     readonly page: Page;
     readonly element: Locator;
     
     constructor(page: Page) {
       this.page = page;
       this.element = page.locator('[data-testid="element"]');
     }
     
     async goto() {
       await this.page.goto('/new-page');
     }
   }
   ```

2. **Write Test**:
   ```typescript
   // tests/e2e/new-feature.spec.ts
   import { test, expect } from '@playwright/test';
   import { NewPage } from '../pages/NewPage';
   
   test.describe('New Feature', () => {
     test('should work correctly', async ({ page }) => {
       const newPage = new NewPage(page);
       await newPage.goto();
       await expect(newPage.element).toBeVisible();
     });
   });
   ```

## Troubleshooting

### Docker Issues

**Issue**: Container fails to start
- Check environment variables are set correctly
- Check logs: `docker logs voobi-app`
- Verify health endpoint: `curl http://localhost:3000/api/health`

**Issue**: Build fails
- Ensure `.dockerignore` is correct
- Check `next.config.ts` has `output: "standalone"`
- Verify Node.js version compatibility

### E2E Test Issues

**Issue**: Tests fail with timeout
- Increase timeout in `playwright.config.ts`
- Check if dev server is running
- Verify base URL is correct

**Issue**: Tests are flaky
- Add proper waits for dynamic content
- Use stable selectors (data-testid preferred)
- Check for race conditions

**Issue**: Browsers not installed
```bash
npx playwright install --with-deps
```

## Best Practices

### Docker
- Always use `.env` file for secrets (never commit)
- Use specific image tags in production
- Monitor container health
- Keep base images updated

### E2E Tests
- Use Page Object Model pattern
- Keep tests independent and isolated
- Use meaningful test descriptions
- Add proper waits for async operations
- Mock external APIs when possible
- Clean up test data after tests

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
