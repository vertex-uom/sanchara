# syntax=docker/dockerfile:1
# Development image only. Source is bind-mounted by docker-compose.yml and
# dependencies are installed into the node_modules volume by docker-entrypoint.sh
# on start, so this image is just Node plus the entrypoint.
FROM node:22.23.3-bookworm-slim

ENV NODE_ENV=development \
    NEXT_TELEMETRY_DISABLED=1 \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_CACHE=/tmp/npm-cache

WORKDIR /app
RUN chown node:node /app
USER node
# Pre-create the volume mount points so the volumes are owned by node, not root.
RUN mkdir node_modules .next

COPY --chown=node:node --chmod=755 docker-entrypoint.sh /usr/local/bin/docker-entrypoint

EXPOSE 3000
ENTRYPOINT ["docker-entrypoint"]
CMD ["npx", "next", "dev", "-H", "0.0.0.0", "-p", "3000"]
