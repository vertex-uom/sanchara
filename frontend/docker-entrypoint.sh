#!/bin/sh
# Development entrypoint. node_modules is a named volume (see docker-compose.yml),
# so dependencies are installed here, on start, instead of being baked into the
# image: the image stays small and a lockfile change never leaves an old
# node_modules layer behind. `npm ci` runs only when package-lock.json differs
# from the copy saved after the last install.
set -eu

stamp="node_modules/.installed-package-lock.json"

if [ ! -f "$stamp" ] || ! cmp -s package-lock.json "$stamp"; then
  echo "[entrypoint] package-lock.json changed: installing dependencies..." >&2
  npm ci --no-audit --no-fund
  # This image is Debian (glibc). npm also installs the musl builds of native
  # packages that ship both; they are never loaded here, so drop them.
  find node_modules -maxdepth 2 -type d \( -name '*-musl' -o -name '*linuxmusl*' \) -prune -exec rm -rf {} +
  rm -rf "${NPM_CONFIG_CACHE:-$HOME/.npm}"
  cp package-lock.json "$stamp"
  echo "[entrypoint] dependencies installed." >&2
fi

exec "$@"
