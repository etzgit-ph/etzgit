#!/bin/bash
# update-changelog.sh: Append summary to CHANGELOG.md
VERSION="$1"
SUMMARY_FILE="$2"
CHANGELOG="CHANGELOG.md"

if [[ -z "$VERSION" || -z "$SUMMARY_FILE" ]]; then
  echo "Usage: $0 <version> <summary-file>"
  exit 1
fi

SUMMARY=$(cat "$SUMMARY_FILE")

{
  echo "## $VERSION - $(date +%Y-%m-%d)"
  echo "$SUMMARY"
  echo
  cat "$CHANGELOG"
} > "$CHANGELOG.tmp" && mv "$CHANGELOG.tmp" "$CHANGELOG"
echo "CHANGELOG.md updated for $VERSION."
