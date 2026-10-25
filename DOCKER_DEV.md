# Docker development setup

Development only. Services: `api` (NestJS), `web` (Next.js), `postgres`, `redis`.

## First run

```sh
cp .env.example .env     # adjust ports/values if needed
make build
make up                  # the api applies pending migrations on start
```

- Web: http://localhost:3001 · API: http://localhost:3000 (REST under `/v1`) · Debugger: `localhost:9229`
- Health: http://localhost:3000/health (database + Redis). `make ps` shows the api as healthy.
- Postgres: `localhost:5434` · Redis: `localhost:6379` (all bound to 127.0.0.1)
- Change ports in `.env` (`*_PORT`).

## Commands

| Command | What it does |
|---|---|
| `make up` / `make down` | Start / stop. `down` keeps the database volume. |
| `make build` | Build the api and web images. |
| `make logs [s=api]` | Follow logs. |
| `make ps` | Service status and health. |
| `make migrate [name=...]` | `prisma migrate dev` in the api container: creates a new migration after a schema change. Existing migrations apply automatically (`prisma migrate deploy`) whenever the api starts. |
| `make seed` | Dev data: a demo company and an Owner invite (the link is printed in the output). Re-run for a fresh link. |
| `make admin email=... name="..."` | Create a platform admin. Prints a random password once (or set `ADMIN_PASSWORD`). |
| `make psql` / `make redis-cli` | Database / Redis shells. |
| `make shell-api` / `make shell-web` | Bash in the app container. |
| `make reset-db` | `prisma migrate reset` after typing `yes`. Deletes all dev data. |
| `make add-api pkg=...` / `make add-web pkg=...` | Install a package (see below). |
| `make rebuild-api` / `make rebuild-web` | Rebuild image and recreate `node_modules`. |
| `make clean` | Free disk space (see Troubleshooting). Keeps the database. |

## add-* vs rebuild-*

`node_modules` lives in the container, not on the host.

- **`add-*`**: you are adding a package. It runs `npm install` inside the running
  container, which updates `package.json` and `package-lock.json` on the host,
  then rebuilds the image so it matches the lockfile. Dev deps: `pkg="-D name"`.
  The service must be running.
- **`rebuild-*`**: `node_modules` is out of date or broken. Use after `git pull`
  changes a lockfile, after editing `package.json` by hand, or after adding a
  native dependency. It rebuilds the image, deletes the service's
  `node_modules` volume (and `.next` for web) and starts it again with a fresh copy.

## Troubleshooting

- **`.env not found`**: `cp .env.example .env`.
- **Port already allocated**: change the matching `*_PORT` in `.env`, then `make up`.
- **`Cannot find module ...` after a pull**: `make rebuild-api` / `make rebuild-web`.
- **Tests**: run inside the container: `docker compose exec api npm test` (unit) and
  `docker compose exec api npm run test:e2e`.
- **Web end-to-end tests (Playwright)**: `docker compose run --rm e2e` (needs `web` and
  `api` running). The `e2e` service uses the official Playwright image pinned to the
  same version as `@playwright/test`; bump both together. Reports land in
  `frontend/playwright-report/` (gitignored).
- **Prisma client missing or stale**: the api runs `prisma generate` on start (into `backend/src/generated`, gitignored);
  restart with `docker compose restart api`, or run `npx prisma generate` in `make shell-api`.
- **Hot reload misses changes (Docker Desktop / WSL)**: set `WATCHPACK_POLLING=true`
  in `.env` and `docker compose up -d web`.
- **Permission errors on files created by containers**: the containers run as
  uid 1000. If your host uid differs, files may need `chown`.
- **Debugger won't attach**: attach to `localhost:9229` (Node inspector).
  Check `make logs s=api` for `Debugger listening on ws://0.0.0.0:9229`.
- **Disk space**: check with `docker system df`. `make clean` removes unused
  anonymous volumes, untagged images and the build cache. It keeps `postgres_data`
  (the database) and the named `node_modules` / `.next` volumes. Older versions of
  this setup used anonymous volumes and left about 1.5 GB behind on every
  `down` / `up`; after updating, run `make up` once, then `make clean`.
