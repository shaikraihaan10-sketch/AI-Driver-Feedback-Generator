Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
$nodePath = Join-Path $PSScriptRoot "node-bin\node-v22.13.0-win-x64"
$env:PATH = "$nodePath;" + $env:PATH

Write-Host "🚌 Starting Manivtha Tours Backend Server..." -ForegroundColor Cyan
Write-Host "   Using Node: $(& "$nodePath\node.exe" -v)" -ForegroundColor Gray
Write-Host "   API Endpoints: http://localhost:5000/api" -ForegroundColor Green
Write-Host ""

Set-Location "$PSScriptRoot\backend"
& "$nodePath\node.exe" server.js
