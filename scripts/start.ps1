<#
.SYNOPSIS
    Starts the LogAllTheThings API (http://localhost:5000) and the Vite web app.
.PARAMETER SkipInstall
    Skip `npm install` for the web app.
#>
[CmdletBinding()]
param(
    [switch]$SkipInstall
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$apiPath = Join-Path $root 'src/LogAllTheThings.Api'
$webPath = Join-Path $root 'src/LogAllTheThings.Web'

foreach ($cmd in 'dotnet', 'npm') {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        throw "'$cmd' was not found on PATH. Install it and try again."
    }
}

if (-not $SkipInstall -and -not (Test-Path (Join-Path $webPath 'node_modules'))) {
    Write-Host 'Installing web dependencies...' -ForegroundColor Cyan
    Push-Location $webPath
    try { npm install } finally { Pop-Location }
}

$processes = @()

Write-Host 'Starting API on http://localhost:5000 ...' -ForegroundColor Cyan
$processes += Start-Process -FilePath 'dotnet' -ArgumentList 'run' -WorkingDirectory $apiPath -PassThru -NoNewWindow

Write-Host 'Starting web app ...' -ForegroundColor Cyan
$processes += Start-Process -FilePath 'npm.cmd' -ArgumentList 'run', 'dev' -WorkingDirectory $webPath -PassThru -NoNewWindow

Write-Host 'Both servers are running. Press Ctrl+C to stop.' -ForegroundColor Green

try {
    Wait-Process -Id $processes.Id
}
finally {
    foreach ($p in $processes) {
        if (-not $p.HasExited) {
            Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
        }
    }
    Write-Host 'Stopped.' -ForegroundColor Yellow
}
