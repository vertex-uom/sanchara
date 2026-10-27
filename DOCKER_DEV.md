# Docker development setup

Development only. Services: `api` (NestJS), `web` (Next.js), `postgres`, `redis`.

## First run

```sh
cp .env.example .env     # adjust ports/values if needed
make build
make up
make migrate             # migrations never run automatically
```

- Web: http://localhost:3001 · API: http://localhost:3000 · Debugger: `localhost:9229`
- Postgres: `localhost:5434` · Redis: `localhost:6379` (all bound to 127.0.0.1)
- Change ports in `.env` (`*_PORT`).

## Commands

| Command | What it does |
|---|---|
| `make up` / `make down` | Start / stop. `down` keeps the database volume. |
| `make build` | Build the api and web images. |
| `make logs [s=api]` | Follow logs. |
| `make ps` | Service status and health. |
| `make migrate [name=...]` | `prisma migrate dev` in the api container. |
| `make seed` | `prisma db seed` (needs `migrations.seed` set in `backend/prisma.config.ts`). |
| `make psql` / `make redis-cli` | Database / Redis shells. |
| `make shell-api` / `make shell-web` | Bash in the app container. |
| `make reset-db` | `prisma migrate reset` after typing `yes`. Deletes all dev data. |
| `make add-api pkg=...` / `make add-web pkg=...` | Install a package (see below). |
| `make rebuild-api` / `make rebuild-web` | Rebuild image and recreate `node_modules`. |

## add-* vs rebuild-*

`node_modules` lives in the container, not on the host.

- **`add-*`**: you are adding a package. It runs `npm install` inside the running
  container, which updates `package.json` and `package-lock.json` on the host,
  then rebuilds the image so it matches the lockfile. Dev deps: `pkg="-D name"`.
  The service must be running.
- **`rebuild-*`**: `node_modules` is out of date or broken. Use after `git pull`
  changes a lockfile, after editing `package.json` by hand, or after adding a
  native dependency. It rebuilds the image, removes the named `node_modules`
  volume and starts the container, which refills the volume from the new image.

## Troubleshooting

- **`.env not found`**: `cp .env.example .env`.
- **Port already allocated**: change the matching `*_PORT` in `.env`, then `make up`.
- **`Cannot find module ...` after a pull**: `make rebuild-api` / `make rebuild-web`.
- **Prisma client missing or stale**: the api runs `prisma generate` on start;
  restart with `docker compose restart api`, or run `npx prisma generate` in `make shell-api`.
- **Hot reload misses changes (Docker Desktop / WSL)**: set `WATCHPACK_POLLING=true`
  in `.env` and `docker compose up -d web`.
- **Permission errors on files created by containers**: the containers run as
  uid 1000. If your host uid differs, files may need `chown`.
- **Debugger won't attach**: attach to `localhost:9229` (Node inspector).
  Check `make logs s=api` for `Debugger listening on ws://0.0.0.0:9229`.
- **Disk space**: `node_modules` and `.next` use named volumes, so `up`/`down`
  reuse them. Volumes left over from older setups show in
  `docker volume ls -f dangling=true`; `docker volume prune` removes unused
  anonymous ones only. `postgres_data` holds the database.
- **Stale Next.js cache (Turbopack panic)**: `docker compose rm -sf web`,
  `docker volume rm sanchara_web_next`, then `make up`.
