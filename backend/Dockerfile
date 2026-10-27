# syntax=docker/dockerfile:1
# Development image only. Source is bind-mounted by docker-compose.yml and
# dependencies are installed into the node_modules volume by docker-entrypoint.sh
# on start, so this image is just Node, Prisma's system deps and the entrypoint.
FROM node:22.23.3-bookworm-slim

# openssl: Prisma schema engine. procps: lets nest --watch kill the old process on restart.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates procps \
 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=development \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_CACHE=/tmp/npm-cache

WORKDIR /app
RUN chown node:node /app
USER node
# Pre-create the volume mount point so the volume is owned by node, not root.
RUN mkdir node_modules

COPY --chown=node:node --chmod=755 docker-entrypoint.sh /usr/local/bin/docker-entrypoint

EXPOSE 3000 9229
ENTRYPOINT ["docker-entrypoint"]
CMD ["npm", "run", "start:dev"]
