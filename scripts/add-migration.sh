#!/usr/bin/env bash
# Usage: ./scripts/add-migration.sh InitialCreate
set -euo pipefail
cd "$(dirname "$0")/../backend"
dotnet ef migrations add "${1:?Migration name required}" \
  --project src/Shop.Infrastructure --startup-project src/Shop.Api --output-dir Persistence/Migrations
