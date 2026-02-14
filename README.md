# Voobi

**Curated YouTube for kids.** Parents whitelist channels and videos; kids get a focused feed—nothing else.

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

## Documentation

All project documentation lives in the [**docs/**](docs/README.md) folder. The [documentation index](docs/README.md) links to:

- **[Setup guide](docs/setup.md)** – Prerequisites, Supabase, YouTube API, env vars, E2E tests
- **[Docker & E2E guide](docs/docker-e2e.md)** – Building with Docker, Playwright E2E, CI/CD
- **[Product requirements (PRD)](docs/prd.md)** – Vision, user flows, MVP scope
- Architecture decision records (ADRs), security/E2E reviews, and more

See [docs/README.md](docs/README.md) for the full list.

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

4. **If you only have `.env.local`:** Docker Compose only loads a file named `.env`. Copy it: `cp .env.local .env` (then run from project root: `docker compose up --build`).

5. **Verify env inside the container** (use single quotes so the variable is expanded inside the container, not on the host):
   ```bash
   docker compose run --rm voobi-app sh -c 'echo SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL'
   ```
   If this prints `SUPABASE_URL=` with nothing after it, the container has no URL: ensure `.env` exists in the project root and run `docker compose up --build` from that directory. Do not use plain `docker run` without `--env-file .env`—Compose is what injects `.env` into the container.

6. **Still "Could not reach the authentication server"?**  
   The client bundle is built with `NEXT_PUBLIC_*` at **image build time**, so the image must be built with your real Supabase values:
   - From project root, run **`./scripts/docker-build.sh`** (it loads `.env` or `.env.local` and passes build args explicitly). Then run `docker compose up -d`.
   - After the app is up, run **`curl -s http://localhost:10100/api/health`**. You should see `"supabase_configured":true`. If you see `false`, the container has no Supabase env at runtime—create `.env` in the project root (e.g. `cp .env.local .env`) and run `docker compose up -d` again.
   - If `supabase_configured` is true but login still fails, the browser may be blocking the request to Supabase (e.g. ad blocker, or wrong Supabase URL). Check the browser Network tab for the failing request.

### Device linking (parents + kids view)

For the **link-device** flow and kids’ home/watch pages to work, the app must have the **parents**, **households**, and **household_members** tables in Supabase (and optionally **device_tokens** for secure token validation).

1. **Run the migration** in your Supabase project (SQL Editor or CLI):
   - `migrations/001_schema.sql` – creates the full schema: `parents` (synced with auth.users), `households`, `household_members`, `videos`, `device_tokens`, `youtube_connections`, `household_children`, plus RLS and backfills. Required for device linking, admin dashboard, and YouTube OAuth.

### Troubleshooting

- **"Could not find the table 'public.household_members' in the schema cache"** (or "Failed to fetch household members: ... schema cache")  
  The schema has not been applied yet. Run **`migrations/001_schema.sql`** in your Supabase project: open [Supabase Dashboard → SQL Editor](https://app.supabase.com/project/_/sql), paste the contents of `migrations/001_schema.sql`, and run it. Then retry the flow (e.g. link device or admin dashboard).

2. After running `001_schema.sql`, existing Auth users are backfilled into `parents` and one household per parent is created. New signups are synced automatically. If “Parent account not found” appears when linking a device, confirm the parent’s email in **Authentication → Users** matches and that the migrations have been run.

## E2E tests

End-to-end tests use **Playwright** and run against the dev server on **port 3001**.

- **Node:** Next.js 16 requires **Node 20+**. Use Node 20 or later for local E2E and CI (e.g. `nvm use 20` or Docker).
- **Run (Chromium only):** `npm run test:e2e`
- **Port:** The E2E webServer starts the app with `PORT=3001`; ensure port 3001 is free.
- **Browsers:** Install Playwright browsers once: `npx playwright install --with-deps chromium` (use `chromium`, `firefox`, or `webkit` as needed).
- **CI:** In CI, set `CI=true`, use Node 20+, and run `npx playwright install --with-deps` before `npm run test:e2e`. Tests use retries and a single worker when `CI` is set (see `playwright.config.ts`).
- **Docker:** To run E2E inside Docker (e.g. with Supabase/Redis), see [Docker & E2E guide](docs/docker-e2e.md).

Tests live in `tests/e2e/` and use page objects in `tests/pages/`. Key flows: device linking, home feed, watch page, navigation, multi-household. Admin login has a smoke spec; full auth flows may require a test Supabase project or mocks.

## Deploy on Cloudflare

The app is set up for [Cloudflare Workers](https://workers.cloudflare.com/) via [OpenNext for Cloudflare](https://opennext.js.org/cloudflare/get-started).

1. **Install and configure:** `@opennextjs/cloudflare` and `wrangler` are already in the project. Copy `.dev.vars.example` to `.dev.vars` if you want to run a local Workers preview with env vars.

2. **Set environment variables** in the [Cloudflare dashboard](https://dash.cloudflare.com/) (Workers & Pages → your worker → Settings → Variables and Secrets). These are **runtime** variables (the Worker reads them when handling requests; build-time vars are only for inlining `NEXT_PUBLIC_*`). Set: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and optionally `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APP_URL`, `YOUTUBE_OAUTH_ENCRYPTION_KEY` (required for YouTube/child OAuth and for adding videos to the whitelist).

3. **Deploy:** From the project root, run:
   ```bash
   npm run deploy:cloudflare
   ```
   Or run a local preview in the Workers runtime: `npm run preview`.

   On Windows, set `BUILD_FOR_CLOUDFLARE=1` in your shell before running the OpenNext build if the script does not set it.

4. **Git-based deploy (Cloudflare dashboard):** Connect the repo in Cloudflare Pages/Workers. Set **Build command** to `npm run build:cloudflare` (so the local `opennextjs-cloudflare` CLI is used). Set **Deploy command** to `npx wrangler deploy`.

### Custom domain (e.g. voobi.app)

`wrangler.jsonc` is set up with a Custom Domain route for `voobi.app`. **workers.dev** works automatically; a custom domain only works if the domain is on Cloudflare in the same account as the Worker.

- **If https://voobi.app does not work** (but `voobi.<account>.workers.dev` does):
  1. **Add the domain to Cloudflare:** In the [Cloudflare dashboard](https://dash.cloudflare.com/), go to **Websites** and add `voobi.app` (or the zone that contains it). Use Cloudflare’s nameservers for the domain so the zone is “Active”.
  2. **Attach the Custom Domain to the Worker:** Go to **Workers & Pages** → select the **voobi** worker → **Settings** → **Domains & Routes** → **Add** → **Custom Domain** → enter `voobi.app`. Cloudflare will create the DNS record and certificate.
  3. **Set `APP_URL`** in the Worker’s environment variables (and in Supabase / Google OAuth redirect URIs) to `https://voobi.app`.

You cannot use a Custom Domain on a hostname that already has a CNAME in DNS or on a zone you don’t own in Cloudflare. See [Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
