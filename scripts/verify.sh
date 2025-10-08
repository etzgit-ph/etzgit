#!/usr/bin/env bash
set -euo pipefail
echo "Running repo verification: lint, tsc, tests, coverage collection, and enforcement"

echo "1) Linting"
pnpm -w eslint .

echo "2) Type-check (apps/api)"
pnpm --filter ./apps/api -C apps/api exec tsc --noEmit

echo "3) Run tests (api)"
pnpm -w --filter api test -- --coverage

echo "4) Collect coverage"
pnpm run collect-coverage

echo "5) Merge coverage JSON"
node ./scripts/merge-coverage-json.js

echo "6) Enforce coverage thresholds"
node ./scripts/enforce-coverage.js

echo "Verification completed successfully."
