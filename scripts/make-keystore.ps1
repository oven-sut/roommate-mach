<#
.SYNOPSIS
  Creates the release signing keystore.

.DESCRIPTION
  Only needed once. Android identifies an app by its signing key, so a new key
  produces an APK that cannot upgrade an existing install - users would have to
  uninstall first. Keep credentials/release.keystore safe and out of git.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\make-keystore.ps1
#>
param(
    [string]$Password = 'roommatematch',
    [string]$Alias = 'roommate-match'
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$keystore = Join-Path $projectRoot 'credentials\release.keystore'

if (Test-Path $keystore) {
    Write-Host "A keystore already exists at $keystore"
    Write-Host 'Refusing to overwrite it: replacing the key breaks upgrades for anyone who already installed the app.'
    exit 1
}

$keytool = Get-Item 'C:\Program Files\Eclipse Adoptium\jdk-21*\bin\keytool.exe',
                    'C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe' -ErrorAction SilentlyContinue |
           Select-Object -First 1
if (-not $keytool) { throw 'keytool not found. Install a JDK 17+.' }

New-Item -ItemType Directory -Force -Path (Split-Path $keystore) | Out-Null

& $keytool.FullName -genkeypair -v `
    -storetype PKCS12 `
    -keystore $keystore `
    -alias $Alias `
    -keyalg RSA -keysize 2048 -validity 10000 `
    -storepass $Password -keypass $Password `
    -dname 'CN=Roommate Match, OU=SUT, O=Suranaree University of Technology, L=Nakhon Ratchasima, S=Nakhon Ratchasima, C=TH'

Write-Host "`nKeystore created: $keystore"
Write-Host 'Back this file up. Losing it means never being able to update the installed app.'
