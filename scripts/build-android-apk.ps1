<#
.SYNOPSIS
    Builds a sideloadable Android debug APK for Log All The Things.
.PARAMETER ApiUrl
    API origin reachable from the Android phone, for example http://192.168.1.20:5000.
.PARAMETER SkipInstall
    Skip npm dependency installation when dependencies are already current.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidatePattern('^https?://')]
    [string]$ApiUrl,

    [switch]$SkipInstall
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$webPath = Join-Path $root 'src/LogAllTheThings.Web'
$androidPath = Join-Path $webPath 'android'
$artifactPath = Join-Path $root 'artifacts/android'
$apkSource = Join-Path $androidPath 'app/build/outputs/apk/debug/app-debug.apk'
$apkDestination = Join-Path $artifactPath 'LogAllTheThings-debug.apk'

foreach ($command in 'node', 'npm', 'npx') {
    if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
        throw "'$command' was not found on PATH. Install Node.js and try again."
    }
}

$nodeMajorVersion = [int]((& node --version).TrimStart('v').Split('.')[0])
if ($nodeMajorVersion -lt 22) {
    throw "Capacitor 8 requires Node.js 22 or later. Found Node.js $(& node --version)."
}

$androidSdk = $env:ANDROID_HOME
if (-not $androidSdk) {
    $androidSdk = $env:ANDROID_SDK_ROOT
}
if (-not $androidSdk) {
    $androidSdk = Join-Path $env:LOCALAPPDATA 'Android/Sdk'
}
if (-not (Test-Path $androidSdk)) {
    throw "Android SDK not found. Install Android Studio or set ANDROID_HOME. Checked: $androidSdk"
}
$env:ANDROID_HOME = $androidSdk
if (-not (Test-Path (Join-Path $androidSdk 'platforms/android-36/android.jar'))) {
    throw 'Android SDK Platform 36 is missing. Install it with Android Studio SDK Manager.'
}

$javaHomes = @(
    $env:JAVA_HOME
    (Join-Path $env:ProgramFiles 'Android/Android Studio/jbr')
)
$pathJava = Get-Command java -ErrorAction SilentlyContinue
if ($pathJava) {
    $javaHomes += Split-Path -Parent (Split-Path -Parent $pathJava.Source)
}

$selectedJavaHome = $null
foreach ($javaHome in ($javaHomes | Where-Object { $_ } | Select-Object -Unique)) {
    $javaExecutable = Join-Path $javaHome 'bin/java.exe'
    $javaCompiler = Join-Path $javaHome 'bin/javac.exe'
    if (-not (Test-Path $javaExecutable) -or -not (Test-Path $javaCompiler)) {
        continue
    }

    $javaVersionOutput = & $javaExecutable -version 2>&1 | Out-String
    if ($javaVersionOutput -match 'version "(?:1\.)?(\d+)' -and [int]$Matches[1] -ge 21) {
        $selectedJavaHome = $javaHome
        break
    }
}

if (-not $selectedJavaHome) {
    throw 'Java JDK 21 or later was not found. Install Android Studio or set JAVA_HOME to a compatible JDK.'
}
$env:JAVA_HOME = $selectedJavaHome
$env:PATH = "$(Join-Path $selectedJavaHome 'bin');$env:PATH"
Write-Host "Using Java from $selectedJavaHome" -ForegroundColor DarkGray

if (-not $SkipInstall) {
    Write-Host 'Installing web dependencies...' -ForegroundColor Cyan
    & npm.cmd install --prefix $webPath
    if ($LASTEXITCODE -ne 0) { throw 'npm install failed.' }
}
else {
    $missingPackages = @('@capacitor/cli', '@capacitor/core', '@capacitor/android') |
        Where-Object { -not (Test-Path (Join-Path $webPath "node_modules/$_")) }
    if ($missingPackages) {
        throw "Dependencies are missing ($($missingPackages -join ', ')). Run again without -SkipInstall."
    }
}

$previousApiUrl = $env:VITE_API_BASE_URL
try {
    $env:VITE_API_BASE_URL = $ApiUrl.TrimEnd('/')
    Write-Host "Building web app for $env:VITE_API_BASE_URL ..." -ForegroundColor Cyan
    & npm.cmd run build --prefix $webPath
    if ($LASTEXITCODE -ne 0) { throw 'Web build failed.' }
}
finally {
    $env:VITE_API_BASE_URL = $previousApiUrl
}

Push-Location $webPath
try {
    if (-not (Test-Path $androidPath)) {
        Write-Host 'Creating the generated Capacitor Android project...' -ForegroundColor Cyan
        & npx.cmd cap add android
        if ($LASTEXITCODE -ne 0) { throw 'Capacitor Android project creation failed.' }
    }

    Write-Host 'Synchronizing web assets with Android...' -ForegroundColor Cyan
    & npx.cmd cap sync android
    if ($LASTEXITCODE -ne 0) { throw 'Capacitor Android synchronization failed.' }
}
finally {
    Pop-Location
}

$manifestPath = Join-Path $androidPath 'app/src/main/AndroidManifest.xml'
[xml]$manifest = Get-Content $manifestPath -Raw
$androidNamespace = 'http://schemas.android.com/apk/res/android'
$manifest.manifest.application.SetAttribute('usesCleartextTraffic', $androidNamespace, 'true')
$manifest.Save($manifestPath)

Write-Host 'Building Android debug APK...' -ForegroundColor Cyan
Push-Location $androidPath
try {
    & .\gradlew.bat assembleDebug
    if ($LASTEXITCODE -ne 0) { throw 'Android Gradle build failed.' }
}
finally {
    Pop-Location
}

if (-not (Test-Path $apkSource)) {
    throw "Gradle completed but the APK was not found at $apkSource"
}

New-Item -ItemType Directory -Path $artifactPath -Force | Out-Null
Copy-Item $apkSource $apkDestination -Force

Write-Host "APK created: $apkDestination" -ForegroundColor Green
Write-Host 'Keep the API running at the supplied URL while using the app.' -ForegroundColor Yellow