Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
$nodePath = Join-Path $PSScriptRoot "node-bin\node-v22.13.0-win-x64"
$env:PATH = "$nodePath;" + $env:PATH

Write-Host "🚌 Starting Manivtha Tours Frontend Dev Server..." -ForegroundColor Cyan
Write-Host "   Using Node: $(& "$nodePath\node.exe" -v)" -ForegroundColor Gray
Write-Host "   App URL: http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "   Default Login Credentials:" -ForegroundColor Yellow
Write-Host "   Manager: manager@manivtha.com / password123" -ForegroundColor White
Write-Host "   Admin:   admin@manivtha.com   / password123" -ForegroundColor White
Write-Host ""

Set-Location "$PSScriptRoot\frontend"
& "$nodePath\node_modules\.bin\vite.cmd" --host
