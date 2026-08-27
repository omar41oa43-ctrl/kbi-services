# ==============================================================================
# KBI Technician App — Firebase App Distribution Release Script (Windows PowerShell)
# ==============================================================================
[CmdletBinding()]
param(
    [string]$ProjectId = "kbi2-f4f19",
    [string]$AppId = "1:1078380307626:android:5df8faeb875a00defa9cd3",
    [string]$TesterGroup = "kbi-technicians"
)

$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent $PSScriptRoot
$AppDir = Join-Path $RootDir "kbi_technician_app"
$ApkPath = Join-Path $AppDir "build\app\outputs\flutter-apk\app-release.apk"
$FallbackApk = Join-Path $AppDir "build\kbi-technician.apk"
$ReleaseNotesFile = Join-Path $RootDir "scripts\release-notes.txt"
$TestersFile = Join-Path $RootDir "scripts\testers.txt"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "🚀 KBI Technician App: Firebase App Distribution" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Project ID:   $ProjectId"
Write-Host "App ID:       $AppId"
Write-Host "Target Group: $TesterGroup"
Write-Host "========================================================"

# Step 1: Verify Firebase CLI
Write-Host "1️⃣  Verifying Firebase CLI..."
try {
    & npx -y firebase-tools@latest projects:list | Out-Null
    Write-Host "   ✓ Firebase CLI authenticated." -ForegroundColor Green
} catch {
    Write-Host "⚠️  Please log in: npx -y firebase-tools@latest login" -ForegroundColor Yellow
    exit 1
}

# Step 2: Locate APK
if (!(Test-Path $ApkPath) -and (Test-Path $FallbackApk)) {
    $ApkDir = Split-Path -Parent $ApkPath
    if (!(Test-Path $ApkDir)) { New-Item -ItemType Directory -Path $ApkDir -Force | Out-Null }
    Copy-Item -Path $FallbackApk -Destination $ApkPath -Force
}

if (!(Test-Path $ApkPath)) {
    Write-Host "   Building Release APK via Flutter..." -ForegroundColor Yellow
    Push-Location $AppDir
    flutter clean
    flutter build apk --release
    Pop-Location
}

if (!(Test-Path $ApkPath)) {
    Write-Host "❌ Error: Release APK not found at: $ApkPath" -ForegroundColor Red
    exit 1
}

$ApkItem = Get-Item $ApkPath
$SizeMB = [math]::Round($ApkItem.Length / 1MB, 2)
Write-Host "   ✓ Release APK found ($SizeMB MB): $ApkPath" -ForegroundColor Green

# Step 3: Flags
$ExtraArgs = @()

if (Test-Path $ReleaseNotesFile) {
    Write-Host "3️⃣  Attaching release notes..." -ForegroundColor Cyan
    $ExtraArgs += "--release-notes-file"
    $ExtraArgs += $ReleaseNotesFile
} else {
    $ExtraArgs += "--release-notes"
    $ExtraArgs += "KBI Technician Mobile App Release"
}

if (Test-Path $TestersFile) {
    Write-Host "4️⃣  Distributing to testers listed in: $TestersFile" -ForegroundColor Cyan
    $ExtraArgs += "--testers-file"
    $ExtraArgs += $TestersFile
} elseif ($TesterGroup) {
    Write-Host "4️⃣  Distributing to tester group: $TesterGroup" -ForegroundColor Cyan
    $ExtraArgs += "--groups"
    $ExtraArgs += $TesterGroup
}

# Step 4: Upload
Write-Host "5️⃣  Uploading APK to Firebase App Distribution..." -ForegroundColor Cyan
& npx -y firebase-tools@latest appdistribution:distribute $ApkPath `
    --app $AppId `
    --project $ProjectId `
    @ExtraArgs

Write-Host "========================================================" -ForegroundColor Green
Write-Host "✅ Release uploaded to Firebase App Distribution!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
