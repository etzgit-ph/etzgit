#!/bin/bash
# tag-release.sh: Tag and push a release
VERSION="$1"

if [[ -z "$VERSION" ]]; then
  echo "Usage: $0 <version>"
  exit 1
fi

git tag -a "$VERSION" -m "release $VERSION"
git push origin "$VERSION"
echo "Release $VERSION tagged and pushed."
