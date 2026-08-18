<#
.SYNOPSIS
  Builds an installable release APK.

.DESCRIPTION
  Works around two things that bite on Windows:

  1. MAX_PATH. The C++ build writes object files whose names embed the full
     source path, and under a normal project location those exceed 260
     characters and ninja fails. The build therefore runs from a short path
     (default C:\rm) rather than in place. `subst` is not a substitute here -
     Expo's autolinking cannot resolve package.json through a subst drive.

  2. `expo prebuild` regenerates android/ from scratch, which would take the
     signing keystore with it. The keystore lives in credentials/ and is copied
     into place on each build.

.PARAMETER SkipPrebuild
  Reuse the existing android/ directory instead of regenerating it.

.PARAMETER BuildPath
  Short working directory for the build. Deleted and recreated each run.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\build-apk.ps1
#>
param(
    [switch]$SkipPrebuild,
    [string]$BuildPath = 'C:\rm'
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$keystore = Join-Path $projectRoot 'credentials\release.keystore'
$outputDir = Join-Path $projectRoot 'build'

function Find-Jdk {
    $candidates = @(
        'C:\Program Files\Eclipse Adoptium\jdk-21*',
        'C:\Program Files\Android\Android Studio\jbr',
        'C:\Program Files\Microsoft\jdk-21*'
    )
    foreach ($pattern in $candidates) {
        $found = Get-Item $pattern -ErrorAction SilentlyContinue |
            Where-Object { Test-Path (Join-Path $_.FullName 'bin\java.exe') } |
            Select-Object -First 1
        if ($found) { return $found.FullName }
    }
    throw 'No JDK 17+ found. Install Android Studio or Eclipse Temurin JDK 21.'
}

$jdk = Find-Jdk
$sdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { "$env:LOCALAPPDATA\Android\Sdk" }
if (-not (Test-Path $sdk)) { throw "Android SDK not found at $sdk. Set ANDROID_HOME." }
if (-not (Test-Path $keystore)) {
    throw "Signing keystore missing at $keystore. See scripts\make-keystore.ps1."
}

Write-Host "JDK          : $jdk"
Write-Host "Android SDK  : $sdk"
Write-Host "Build path   : $BuildPath"

if (-not $SkipPrebuild) {
    Write-Host "`n== Regenerating the native project =="
    Push-Location $projectRoot
    try { & npx expo prebuild --platform android --clean } finally { Pop-Location }
    if ($LASTEXITCODE -ne 0) { throw 'expo prebuild failed' }
}

Write-Host "`n== Copying the project to a short path =="
if (Test-Path $BuildPath) { Remove-Item $BuildPath -Recurse -Force }
# node_modules is reinstalled below rather than copied: a copy of a tree this
# deep drops files, and a missing one only surfaces as a confusing bundler error.
robocopy $projectRoot $BuildPath /E /MT:16 /NFL /NDL /NJH /NP `
    /XD '.git' 'node_modules' 'dist' '.expo' 'build' 'android\app\build' 'android\build' 'android\.gradle' 'android\app\.cxx' | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy failed with exit code $LASTEXITCODE" }

Write-Host "`n== Installing dependencies =="
Push-Location $BuildPath
try {
    & npm ci
    if ($LASTEXITCODE -ne 0) { throw 'npm ci failed' }
} finally { Pop-Location }

Write-Host "`n== Signing configuration =="
Copy-Item $keystore (Join-Path $BuildPath 'android\app\release.keystore') -Force

$gradleProps = Join-Path $BuildPath 'android\gradle.properties'
$props = Get-Content $gradleProps -Raw
if ($props -notmatch 'ROOMMATE_UPLOAD_STORE_FILE') {
    Add-Content $gradleProps @'

ROOMMATE_UPLOAD_STORE_FILE=release.keystore
ROOMMATE_UPLOAD_STORE_PASSWORD=roommatematch
ROOMMATE_UPLOAD_KEY_ALIAS=roommate-match
ROOMMATE_UPLOAD_KEY_PASSWORD=roommatematch
'@
}

$appGradle = Join-Path $BuildPath 'android\app\build.gradle'
$gradle = Get-Content $appGradle -Raw
if ($gradle -notmatch 'signingConfigs\.release') {
    $releaseConfig = @'
        release {
            if (project.hasProperty('ROOMMATE_UPLOAD_STORE_FILE')) {
                storeFile file(ROOMMATE_UPLOAD_STORE_FILE)
                storePassword ROOMMATE_UPLOAD_STORE_PASSWORD
                keyAlias ROOMMATE_UPLOAD_KEY_ALIAS
                keyPassword ROOMMATE_UPLOAD_KEY_PASSWORD
            } else {
                storeFile file('debug.keystore')
                storePassword 'android'
                keyAlias 'androiddebugkey'
                keyPassword 'android'
            }
        }
    }
'@
    # Close signingConfigs with the release block, then point release at it.
    $gradle = $gradle -replace "(?s)(signingConfigs \{.*?keyPassword 'android'\s*\}\s*)\}", "`$1$releaseConfig"
    $gradle = $gradle -replace 'signingConfig signingConfigs\.debug(\s*\r?\n\s*def enableShrinkResources)', 'signingConfig signingConfigs.release$1'
    Set-Content $appGradle $gradle -NoNewline
}

Write-Host "`n== Building =="
$env:JAVA_HOME = $jdk
$env:ANDROID_HOME = $sdk
Push-Location (Join-Path $BuildPath 'android')
try {
    & .\gradlew.bat assembleRelease --no-daemon
    if ($LASTEXITCODE -ne 0) { throw 'gradle assembleRelease failed' }
} finally { Pop-Location }

$version = (Get-Content (Join-Path $projectRoot 'app.json') -Raw | ConvertFrom-Json).expo.version
$apk = Join-Path $BuildPath 'android\app\build\outputs\apk\release\app-release.apk'
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
$target = Join-Path $outputDir "roommate-match-v$version.apk"
Copy-Item $apk $target -Force

$size = (Get-Item $target).Length / 1MB
Write-Host "`nAPK: $target"
Write-Host ("Size: {0:N1} MB" -f $size)
Write-Host "`nInstall with: adb install -r `"$target`""
Write-Host "Delete $BuildPath when you no longer need the build cache."
