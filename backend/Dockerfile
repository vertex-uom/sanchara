# syntax=docker/dockerfile:1
# Development image only. Source is bind-mounted by docker-compose.yml.
FROM node:22.12.0-bookworm-slim

# openssl is required by the Prisma schema engine.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=development \
    NPM_CONFIG_UPDATE_NOTIFIER=false

WORKDIR /app
RUN chown node:node /app
USER node

# Dependencies only; this layer is reused until the lockfile changes.
COPY --chown=node:node package.json package-lock.json ./
RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000 npm ci

EXPOSE 3000 9229
CMD ["npm", "run", "start:dev"]
