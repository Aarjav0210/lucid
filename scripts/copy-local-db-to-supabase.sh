#!/usr/bin/env bash
# Copy Pulse data from local Postgres to Supabase.
#
# Prereqs: schema already applied on Supabase (`npm run db:deploy` with Supabase URLs).
# Requires: psql and pg_dump (install Postgres client tools).
#
# Usage:
#   export LOCAL_DATABASE_URL="postgresql://pandemic:pandemic@localhost:5432/pandemic_pulse?schema=public"
#   export SUPABASE_DIRECT_URL="postgresql://postgres.[ref]:[PASSWORD]@...:5432/postgres"
#   bash scripts/copy-local-db-to-supabase.sh
#
# Optional: REPLACE=1 truncates target tables before load (recommended for a clean copy).
set -euo pipefail

LOCAL_DATABASE_URL="${LOCAL_DATABASE_URL:-}"
SUPABASE_DIRECT_URL="${SUPABASE_DIRECT_URL:-}"

if [[ -z "$LOCAL_DATABASE_URL" || -z "$SUPABASE_DIRECT_URL" ]]; then
  echo "Set LOCAL_DATABASE_URL and SUPABASE_DIRECT_URL (use Supabase direct / session mode on port 5432, not the transaction pooler)." >&2
  exit 1
fi

if [[ "${REPLACE:-}" == "1" ]]; then
  echo "[copy] Truncating Supabase Pulse tables..."
  psql "$SUPABASE_DIRECT_URL" -v ON_ERROR_STOP=1 <<'SQL'
TRUNCATE TABLE "outbreak_time_series", "outbreak_events", "source_poll_logs" CASCADE;
SQL
fi

echo "[copy] Dumping data from local DB and loading into Supabase..."
pg_dump "$LOCAL_DATABASE_URL" \
  --data-only \
  --no-owner \
  --no-acl \
  --table=public.outbreak_events \
  --table=public.outbreak_time_series \
  --table=public.source_poll_logs \
  | psql "$SUPABASE_DIRECT_URL" -v ON_ERROR_STOP=1

echo "[copy] Done."
