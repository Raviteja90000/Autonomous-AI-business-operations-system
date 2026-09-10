# Autonomous AI Business Operations Manager - Startup Script for Windows PowerShell
param (
    [switch]$Dev,
    [switch]$SeedOnly,
    [switch]$Test
)

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  AUTONOMOUS AI BUSINESS OPERATIONS MANAGER" -ForegroundColor Cyan
Write-Host "  Enterprise ODAEA Autonomous Execution Engine" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if ($Test) {
    Write-Host "[*] Running Test Suite..." -ForegroundColor Yellow
    pytest -v tests/
    exit $LASTEXITCODE
}

if ($SeedOnly) {
    Write-Host "[*] Seeding Database..." -ForegroundColor Yellow
    python -c "import asyncio; from backend.app.core.database import init_db; from backend.app.services.seed_service import seed_all; asyncio.run(init_db()); asyncio.run(seed_all())"
    Write-Host "[+] Seeding complete!" -ForegroundColor Green
    exit 0
}

Write-Host "[*] Initializing Database & Seed Data..." -ForegroundColor Yellow
python -c "import asyncio; from backend.app.core.database import init_db; from backend.app.services.seed_service import seed_all; asyncio.run(init_db()); asyncio.run(seed_all())"

Write-Host "[+] Starting Backend (FastAPI on http://127.0.0.1:8000)..." -ForegroundColor Green
$backendJob = Start-Process python -ArgumentList "-m", "uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload" -PassThru

Write-Host "[+] Starting Background Worker..." -ForegroundColor Green
$workerJob = Start-Process python -ArgumentList "-m", "workers.worker" -PassThru

Write-Host "[+] Starting Frontend Dev Server (http://localhost:5173)..." -ForegroundColor Green
Set-Location "$root\frontend"
$frontendJob = Start-Process cmd.exe -ArgumentList "/c", "npm.cmd run dev" -PassThru
Set-Location $root

Write-Host "`nAll services started successfully!" -ForegroundColor Green
Write-Host "  - Frontend UI:  http://localhost:5173" -ForegroundColor White
Write-Host "  - Backend API:  http://127.0.0.1:8000" -ForegroundColor White
Write-Host "  - API Docs:     http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "  - Metrics:      http://127.0.0.1:8000/metrics" -ForegroundColor White
Write-Host "`nDefault Credentials:" -ForegroundColor Yellow
Write-Host "  - Admin:    admin@ops.ai / AdminPass123!" -ForegroundColor White
Write-Host "  - Operator: operator@ops.ai / OperatorPass123!" -ForegroundColor White
Write-Host "  - Approver: approver@ops.ai / ApproverPass123!" -ForegroundColor White
Write-Host "  - Auditor:  auditor@ops.ai / AuditorPass123!" -ForegroundColor White
Write-Host "  - Viewer:   viewer@ops.ai / ViewerPass123!" -ForegroundColor White
Write-Host "`nPress Ctrl+C or close windows to exit." -ForegroundColor Gray
