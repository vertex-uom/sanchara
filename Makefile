# Development helpers. See DOCKER_DEV.md.
DC := docker compose

.PHONY: help env-check up down build logs ps migrate seed admin psql redis-cli \
        shell-api shell-web reset-db add-api add-web rebuild-api rebuild-web clean

help:
	@grep -E '^[a-z-]+:.*?## ' $(MAKEFILE_LIST) | awk -F':.*?## ' '{printf "  %-12s %s\n", $$1, $$2}'

env-check:
	@test -f .env || { echo ".env not found. Run: cp .env.example .env"; exit 1; }

up: env-check ## Start all services in the background
	$(DC) up -d

down: ## Stop and remove containers (data volumes are kept)
	$(DC) down

build: env-check ## Build the api and web images
	$(DC) build

logs: ## Follow logs (optional: s=api)
	$(DC) logs -f $(s)

ps: ## Show service status
	$(DC) ps

migrate: ## Run prisma migrate dev (optional: name=add_users)
	$(DC) exec api npx prisma migrate dev $(if $(name),--name $(name))

seed: ## Run prisma db seed
	$(DC) exec api npx prisma db seed

admin: ## Create a platform admin (email=... name="..."; prints a password)
	@test -n "$(email)" -a -n "$(name)" || { echo 'Usage: make admin email=<email> name="<full name>"'; exit 1; }
	$(DC) exec api node dist/create-admin.js --email "$(email)" --name "$(name)"

psql: ## Open psql in the postgres container
	$(DC) exec postgres sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'

redis-cli: ## Open redis-cli in the redis container
	$(DC) exec redis redis-cli

shell-api: ## Shell in the api container
	$(DC) exec api bash

shell-web: ## Shell in the web container
	$(DC) exec web bash

reset-db: ## Drop all data and re-apply migrations (asks first)
	@read -p "This deletes ALL data in the dev database. Type 'yes' to continue: " ans; \
	  [ "$$ans" = "yes" ] || { echo "Aborted."; exit 1; }
	$(DC) exec api npx prisma migrate reset --force

add-api: ## Install a package in api (pkg=name, or pkg="-D name")
	@test -n "$(pkg)" || { echo 'Usage: make add-api pkg=<name> (or pkg="-D <name>")'; exit 1; }
	$(DC) exec api npm install $(pkg)
	$(DC) build api

add-web: ## Install a package in web (pkg=name, or pkg="-D name")
	@test -n "$(pkg)" || { echo 'Usage: make add-web pkg=<name> (or pkg="-D <name>")'; exit 1; }
	$(DC) exec web npm install $(pkg)
	$(DC) build web

# The node_modules volume is filled from the image only when it is empty,
# so remove it to pick up the rebuilt dependencies.
rebuild-api: env-check ## Rebuild api image and recreate its node_modules
	$(DC) build api
	$(DC) rm -sf api
	docker volume rm -f sanchara_api_node_modules
	$(DC) up -d --no-deps api

rebuild-web: env-check ## Rebuild web image and recreate its node_modules and .next
	$(DC) build web
	$(DC) rm -sf web
	docker volume rm -f sanchara_web_node_modules sanchara_web_next
	$(DC) up -d --no-deps web

clean: ## Free disk: unused anonymous volumes, old images and build cache
	docker volume prune -f
	docker image prune -f
	docker builder prune -f
