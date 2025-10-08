#!/usr/bin/env bash
# Helper: start the API in background and call /openai/chat once with curl.
# Requires OPENAI_API_KEY in the environment or in apps/api/.env.local

set -euo pipefail

if [ -z "${OPENAI_API_KEY:-}" ]; then
  echo "OPENAI_API_KEY is not set. Please export it or add to apps/api/.env.local"
  exit 1
fi

cd apps/api

# Start the API in the background (assumes start:dev uses nodemon/nest with watch)
pnpm start:dev &
API_PID=$!

# Wait for server to start (simple sleep, could be improved)
sleep 3

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/openai/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello from local test"}')

echo "HTTP status: ${HTTP_STATUS}"

# Kill the background server
kill ${API_PID}

exit 0
