#!/bin/bash
# build-push-docker.sh: Build and push Docker image for a given tag
TAG="$1"
DOCKERFILE_PATH="apps/api/Dockerfile"
IMAGE="ghcr.io/etzgit-ph/etzgit:$TAG"

if [[ -z "$TAG" ]]; then
  echo "Usage: $0 <tag>"
  exit 1
fi

docker build -t "$IMAGE" -f "$DOCKERFILE_PATH" .
docker push "$IMAGE"
echo "Docker image $IMAGE built and pushed."
