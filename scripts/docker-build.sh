#!/usr/bin/env bash
# Build Docker image with Supabase env vars from .env
# Run from project root: ./scripts/docker-build.sh
# Or: bash scripts/docker-build.sh

set -e
cd "$(dirname "$0")/.."
PROJECT_ROOT="$(pwd)"

if [ ! -f "$PROJECT_ROOT/.env" ]; then
  echo "ERROR: .env not found in $PROJECT_ROOT"
  echo "Copy .env.example to .env and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
  exit 1
fi

# Load .env and export so docker-compose sees them for build-arg substitution
set -a
# shellcheck source=/dev/null
source "$PROJECT_ROOT/.env"
set +a

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo "ERROR: .env must define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
  exit 1
fi

if [ "$NEXT_PUBLIC_SUPABASE_URL" = "https://placeholder.supabase.co" ] || [ "$NEXT_PUBLIC_SUPABASE_ANON_KEY" = "placeholder" ]; then
  echo "ERROR: Replace placeholder values in .env with your real Supabase URL and anon key"
  echo "Get them from: https://app.supabase.com/project/_/settings/api"
  exit 1
fi

echo "Building with Supabase URL from .env (no-cache)..."
docker compose build --no-cache
echo "Done. Start with: docker compose up -d"
