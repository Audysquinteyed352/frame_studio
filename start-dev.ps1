# Frame Studio - Development Server
# Clean webpack build - no turbopack, no workers

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $ScriptDir

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "   Frame Studio - Dev Server   " -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check pnpm
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] pnpm not found. Install: npm i -g pnpm" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check .env (optional for server-side API key fallback)
if (-not (Test-Path "$ScriptDir\.env")) {
    Write-Host "[INFO] No .env found - users will provide API keys via browser" -ForegroundColor Yellow
    Write-Host "[TIP]  Add GEMINI_API_KEY to .env for server-side fallback (optional)" -ForegroundColor DarkGray
    Write-Host ""
}

Write-Host "Starting Next.js dev server (webpack)..." -ForegroundColor Green
Write-Host "URL: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""

pnpm dev
