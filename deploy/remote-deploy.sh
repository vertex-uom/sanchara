#!/bin/sh
# Runs on the server as the deploy user, from .github/workflows/deploy.yml:
#   remote-deploy.sh <image tag>
# docker-compose.yml (the repo's docker-compose.prod.yml) has already been
# copied next to it. Records the tag in .env, pulls the images, restarts and
# waits until every service is healthy. The api applies migrations on start.
set -eu

tag="${1:?usage: remote-deploy.sh <image tag>}"
cd "$(dirname "$0")"

test -f .env || { echo ".env is missing in $(pwd)" >&2; exit 1; }
sed -i '/^IMAGE_TAG=/d' .env
echo "IMAGE_TAG=$tag" >> .env

docker compose pull --quiet api web
docker compose up -d --wait --wait-timeout 300 --remove-orphans
docker compose ps

# Old releases' images, kept only while a container still uses them.
docker image prune -af --filter "label=org.opencontainers.image.source=https://github.com/vertex-uom/sanchara" >/dev/null
