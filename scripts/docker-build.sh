#!/usr/bin/env bash
# Build Docker image with Supabase env vars from .env
# Run from project root: ./scripts/docker-build.sh
# Or: bash scripts/docker-build.sh

set -e
cd "$(dirname "$0")/.."
PROJECT_ROOT="$(pwd)"

# Prefer .env; fall back to .env.local so build works with either
if [ -f "$PROJECT_ROOT/.env" ]; then
  ENV_FILE="$PROJECT_ROOT/.env"
elif [ -f "$PROJECT_ROOT/.env.local" ]; then
  ENV_FILE="$PROJECT_ROOT/.env.local"
  echo "Note: Using .env.local. For 'docker compose up' to pass env into the container, create .env: cp .env.local .env"
else
  echo "ERROR: No .env or .env.local in $PROJECT_ROOT"
  echo "Copy .env.example to .env and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
  exit 1
fi

set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
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
docker compose build --no-cache \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "Done. Start with: docker compose up -d"
echo "To verify env in container: docker compose run --rm safetube-app sh -c 'echo SUPABASE_URL=\$NEXT_PUBLIC_SUPABASE_URL'"
