This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Docker (with Supabase)

The app needs your Supabase URL and anon key **at image build time** (they are baked into the client bundle).

1. **Create `.env`** in the project root (same directory as `docker-compose.yml`), with real values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
   Get them from [Supabase → Project Settings → API](https://app.supabase.com/project/_/settings/api).

2. **Build using the script** (loads `.env` and passes values into the build):
   ```bash
   chmod +x scripts/docker-build.sh
   ./scripts/docker-build.sh
   ```
   Then start: `docker compose up -d`

   Or build manually **from the project root** (so Docker Compose finds `.env`):
   ```bash
   docker compose build --no-cache
   docker compose up -d
   ```

3. If you see "Supabase is using placeholder values", the build did not receive your env vars. Use `./scripts/docker-build.sh` or ensure you run `docker compose build` from the directory that contains both `docker-compose.yml` and `.env`.

### Device linking (parents + kids view)

For the **link-device** flow and kids’ home/watch pages to work, the app must have the **parents** table in Supabase and (optionally) the **device_tokens** table for secure token validation.

1. **Run the migrations** in your Supabase project (SQL Editor or CLI):
   - `migrations/001_create_parents_table_and_sync.sql` – creates `parents` and syncs from `auth.users`. Required so `/api/parent-by-email` can resolve a parent by email (e.g. after signup).
   - `migrations/002_device_tokens_table.sql` – creates `device_tokens` so device linking uses DB-backed token validation. Optional but recommended; if you skip it, the app falls back to the legacy cookie-only flow (set `SUPABASE_SERVICE_ROLE_KEY` in `.env` only when using this migration).

2. After running `001_...`, existing Auth users are backfilled into `parents`. New signups are synced automatically. If “Parent account not found” appears when linking a device, confirm the parent’s email in **Authentication → Users** matches and that the migration has been run.

## E2E tests

End-to-end tests use **Playwright** and run against the dev server on **port 3001**.

- **Node:** Next.js 16 requires **Node 20+**. Use Node 20 or later for local E2E and CI (e.g. `nvm use 20` or Docker).
- **Run (Chromium only):** `npm run test:e2e`
- **Port:** The E2E webServer starts the app with `PORT=3001`; ensure port 3001 is free.
- **Browsers:** Install Playwright browsers once: `npx playwright install --with-deps chromium` (use `chromium`, `firefox`, or `webkit` as needed).
- **CI:** In CI, set `CI=true`, use Node 20+, and run `npx playwright install --with-deps` before `npm run test:e2e`. Tests use retries and a single worker when `CI` is set (see `playwright.config.ts`).
- **Docker:** To run E2E inside Docker (e.g. with Supabase/Redis), see [DOCKER_E2E_README.md](DOCKER_E2E_README.md).

Tests live in `tests/e2e/` and use page objects in `tests/pages/`. Key flows: device linking, home feed, watch page, navigation, multi-household. Admin login has a smoke spec; full auth flows may require a test Supabase project or mocks.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
