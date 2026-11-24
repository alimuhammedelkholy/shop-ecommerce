#!/usr/bin/env bash
# Starts SQL Server (Docker), the API and the Angular app for local development.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"

[ -f "$root/.env" ] || { cp "$root/.env.example" "$root/.env"; echo "Created .env from .env.example"; }
docker compose -f "$root/docker-compose.yml" up -d sqlserver

trap 'kill 0' EXIT
(cd "$root/backend" && dotnet run --project src/Shop.Api) &
(cd "$root/frontend" && npm install && npm start) &
wait
