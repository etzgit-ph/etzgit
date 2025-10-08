#!/usr/bin/env bash
# Collect lcov/coverage-final.json files from packages into top-level coverage/
set -euo pipefail
mkdir -p coverage
COPIED=0
TMP_LCOV="$(mktemp)"

# Find all lcov.info files under the repo excluding node_modules
FOUND=0
while IFS= read -r -d $'\0' file; do
  FOUND=1
  echo "Merging $file"
  # append file to temp, but strip out 'TN:' lines which can confuse concatenation
  sed '/^TN:/d' "$file" >> "$TMP_LCOV"
done < <(find . -path './node_modules' -prune -o -name 'lcov.info' -print0)

if [ "$FOUND" -eq 1 ]; then
  mv "$TMP_LCOV" coverage/lcov.info
  COPIED=1
else
  rm -f "$TMP_LCOV"
fi

if [ -f "apps/api/coverage/coverage-final.json" ]; then
  cp "apps/api/coverage/coverage-final.json" coverage/coverage-final.json
  COPIED=$((COPIED+1))
fi

if [ $COPIED -eq 0 ]; then
  echo "No coverage artifacts found to collect"
  exit 1
fi

echo "Collected coverage into coverage/" 
