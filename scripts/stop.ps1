<#
.SYNOPSIS
    Stops the LogAllTheThings API and web dev server by freeing their ports.
.PARAMETER Port
    Ports to release. Defaults to the API (5000) and Vite (5173) ports.
#>
[CmdletBinding()]
param(
    [int[]]$Port = @(5000, 5173)
)

$ErrorActionPreference = 'Stop'

$stopped = $false

foreach ($p in $Port) {
    $processIds = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique

    if (-not $processIds) {
        Write-Host "No listener on port $p." -ForegroundColor DarkGray
        continue
    }

    foreach ($processId in $processIds) {
        $proc = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if (-not $proc) { continue }

        Write-Host "Stopping $($proc.ProcessName) (PID $processId) on port $p ..." -ForegroundColor Cyan
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        $stopped = $true
    }
}

if ($stopped) {
    Write-Host 'Stopped.' -ForegroundColor Green
}
else {
    Write-Host 'Nothing to stop.' -ForegroundColor Yellow
}
