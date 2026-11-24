# Starts everything for local development on Windows: SQL Server (Docker), the API and the Angular app.
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent

if (-not (Test-Path "$root\.env")) { Copy-Item "$root\.env.example" "$root\.env"; Write-Host "Created .env from .env.example" }

docker compose -f "$root\docker-compose.yml" up -d sqlserver

Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd '$root\backend'; dotnet run --project src\Shop.Api"
Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd '$root\frontend'; npm install; npm start"

Write-Host "API:      http://localhost:5080/health"
Write-Host "Frontend: http://localhost:4200"
