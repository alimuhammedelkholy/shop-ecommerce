# Usage: .\scripts\add-migration.ps1 InitialCreate
# Requires: dotnet tool install --global dotnet-ef --version 10.0.*
param([Parameter(Mandatory = $true)][string]$Name)
$ErrorActionPreference = 'Stop'
$backend = Join-Path (Split-Path $PSScriptRoot -Parent) 'backend'
Push-Location $backend
try {
  dotnet ef migrations add $Name --project src/Shop.Infrastructure --startup-project src/Shop.Api --output-dir Persistence/Migrations
} finally { Pop-Location }
