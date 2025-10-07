#!/bin/bash
set -e
if [[ -n $(git status --porcelain) ]]; then
  echo "Working directory is not clean!"
  exit 1
fi
pnpm build
