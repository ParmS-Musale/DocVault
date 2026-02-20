# Deploy Prep Script for DocVault
# ------------------------------------
# This script builds both Backend and Frontend for Production
# and organizes them into a "deploy" folder.

$ErrorActionPreference = "Stop"

$root = Get-Location
$deployDir = "$root\deploy"
$backendSrc = "$root\backend\DocVault.API"
$frontendSrc = "$root\frontend"

Write-Host "🚀 Starting DocVault Deployment Prep..." -ForegroundColor Cyan

# 1. Clean previous deploy folder
if (Test-Path $deployDir) {
    Write-Host "🧹 Cleaning previous deployment artifacts..." -ForegroundColor Yellow
    Remove-Item $deployDir -Recurse -Force
}
New-Item -ItemType Directory -Path "$deployDir\backend" | Out-Null
New-Item -ItemType Directory -Path "$deployDir\frontend" | Out-Null

# 2. Backend Build
Write-Host "🛠️  Building Backend (Release)..." -ForegroundColor Cyan
Push-Location $backendSrc
dotnet restore
dotnet publish -c Release -o "$deployDir\backend"
Pop-Location

# 3. Frontend Build
Write-Host "🎨 Building Frontend (Production)..." -ForegroundColor Cyan
Push-Location $frontendSrc
Write-Host "   Installing dependencies..."
npm install
Write-Host "   Compiling Angular app..."
npm run build:prod
Pop-Location

# 4. Copy Frontend to Deploy
Write-Host "📂 Copying Frontend artifacts..." -ForegroundColor Cyan
# Angular dist output structure usually: dist/docvault-frontend/browser
if (Test-Path "$frontendSrc\dist\docvault-frontend\browser") {
    Copy-Item "$frontendSrc\dist\docvault-frontend\browser\*" "$deployDir\frontend" -Recurse
} elseif (Test-Path "$frontendSrc\dist\docvault-frontend") {
    # Fallback for older CLI versions
    Copy-Item "$frontendSrc\dist\docvault-frontend\*" "$deployDir\frontend" -Recurse
} else {
    Write-Error "❌ Could not find Angular build output in dist/docvault-frontend"
}

# 5. Zip for Deployment
Write-Host "📦 Zipping artifacts..." -ForegroundColor Cyan
Compress-Archive -Path "$deployDir\backend\*" -DestinationPath "$deployDir\backend.zip"
Compress-Archive -Path "$deployDir\frontend\*" -DestinationPath "$deployDir\frontend.zip"

Write-Host "✅ Deployment Prep Complete!" -ForegroundColor Green
Write-Host "   Backend: $deployDir\backend.zip"
Write-Host "   Frontend: $deployDir\frontend.zip"
