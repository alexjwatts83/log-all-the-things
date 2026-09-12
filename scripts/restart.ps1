<#
.SYNOPSIS
    Force stops existing LogAllTheThings servers on ports 5000 and 5173 and starts them again.
.PARAMETER SkipInstall
    Skip `npm install` for the web app.
#>
[CmdletBinding()]
param(
    [switch]$SkipInstall
)

$ErrorActionPreference = 'Stop'

$scriptDir = $PSScriptRoot

Write-Host 'Force stopping existing servers...' -ForegroundColor Cyan
& (Join-Path $scriptDir 'stop.ps1')

Write-Host 'Starting servers...' -ForegroundColor Cyan
& (Join-Path $scriptDir 'start.ps1') -SkipInstall:$SkipInstall
