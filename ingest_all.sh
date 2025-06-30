#!/usr/bin/env bash
set -euo pipefail

# 1) Adjust this if you run against a remote Supabase URL
BASE_URL="http://127.0.0.1:54321/functions/v1/full-ingestion"

# 2) Pull your service-role key from the env (fails if not set)
TOKEN="${SUPABASE_SERVICE_ROLE_KEY:?Need to set SUPABASE_SERVICE_ROLE_KEY}"

# 3) Path to your surfSpots.ts
CONFIG_PATH="supabase/functions/full-ingestion/config/surfSpots.ts"

if [[ ! -f "$CONFIG_PATH" ]]; then
  echo "❌  Config file not found at $CONFIG_PATH"
  exit 1
fi

# 4) Extract all the slugs
SLUGS=$(grep -o "slug: *'[-a-z]\+'" "$CONFIG_PATH" \
        | sed -E "s/slug: *'(.+)'/\1/")

if [[ -z "$SLUGS" ]]; then
  echo "❌  No slugs found in $CONFIG_PATH"
  exit 1
fi

# 5) Debug your token prefix once, before the loop (slug not needed here)
echo "🔑 Using token prefix: ${TOKEN:0:10}…"

# 6) Loop through each slug
for slug in $SLUGS; do
  echo
  echo "⏱  starting $slug at $(date +"%T")"

  # debug the exact URL you’re hitting
  echo "   → Calling: ${BASE_URL}?spot=${slug}"

  # invoke the function
  response=$(curl -s -X POST "${BASE_URL}?spot=${slug}" \
    -H "Authorization: Bearer ${TOKEN}")

  # print whatever came back
  echo "   ← Response: $response"
  echo "✅  done $slug at $(date +"%T")"

  # optional throttle
  sleep 1
done
