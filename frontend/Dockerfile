# syntax=docker/dockerfile:1
# Development image only. Source is bind-mounted by docker-compose.yml.
FROM node:22.23.3-bookworm-slim

ENV NODE_ENV=development \
    NEXT_TELEMETRY_DISABLED=1 \
    NPM_CONFIG_UPDATE_NOTIFIER=false

WORKDIR /app
RUN chown node:node /app
USER node
# Pre-create so the .next volume is owned by node, not root.
RUN mkdir .next

# Dependencies only; this layer is reused until the lockfile changes.
COPY --chown=node:node package.json package-lock.json ./
RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000 npm ci

EXPOSE 3000
CMD ["npx", "next", "dev", "-H", "0.0.0.0", "-p", "3000"]
/