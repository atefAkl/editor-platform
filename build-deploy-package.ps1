$ErrorActionPreference = "Stop"

$root = $PSScriptRoot
$staging = Join-Path $root "deploy_staging"
$zipPath = Join-Path $root "editor-platform-production.zip"

Write-Host "1. Building React frontend for production..."
Push-Location (Join-Path $root "frontend")
npm run build
Pop-Location

Write-Host "2. Preparing clean staging directory..."
if (Test-Path $staging) {
    cmd /c "rmdir /s /q `"$staging`""
}
if (Test-Path $zipPath) {
    Remove-Item -Force $zipPath
}
New-Item -ItemType Directory -Path $staging | Out-Null

$backend = Join-Path $root "backend"
$dirsToCopy = @("app", "bootstrap", "config", "database", "public", "resources", "routes", "vendor")

foreach ($d in $dirsToCopy) {
    $src = Join-Path $backend $d
    $dst = Join-Path $staging $d
    $null = robocopy $src $dst /E /NFL /NDL /NJH /NJS /NC /NS /NP /MT:8
}

# Remove any dev storage symlink inside staged public/
$stagedPublicStorage = Join-Path $staging "public\storage"
if (Test-Path $stagedPublicStorage) {
    cmd /c "rmdir /s /q `"$stagedPublicStorage`""
}

# Copy root files
$filesToCopy = @("artisan", "composer.json", "composer.lock", ".env.production.example")
foreach ($f in $filesToCopy) {
    Copy-Item -Path (Join-Path $backend $f) -Destination (Join-Path $staging $f) -Force
}

# Root .htaccess for shared hosting convenience (forwards root requests to public/)
$rootHtaccess = @"
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REQUEST_URI} !^/public/
    RewriteRule ^(.*)$ public/`$1 [L,QSA]
</IfModule>
"@
[IO.File]::WriteAllText((Join-Path $staging ".htaccess"), $rootHtaccess, (New-Object System.Text.UTF8Encoding($false)))

# Create clean storage directory structure
$storageDirs = @(
    "storage\app\public\books\covers",
    "storage\app\public\posts\images",
    "storage\app\public\posts\files",
    "storage\app\public\authors\avatars",
    "storage\app\public\users\avatars",
    "storage\app\private\books\files",
    "storage\framework\cache\data",
    "storage\framework\sessions",
    "storage\framework\views",
    "storage\logs"
)
foreach ($sd in $storageDirs) {
    $fullSd = Join-Path $staging $sd
    New-Item -ItemType Directory -Path $fullSd -Force | Out-Null
    Set-Content -Path (Join-Path $fullSd ".gitignore") -Value "*`n!.gitignore"
}

# Clear any cached bootstrap files in staging
Get-ChildItem -Path (Join-Path $staging "bootstrap\cache") -Filter "*.php" | Remove-Item -Force

Write-Host "3. Injecting compiled React SPA into Laravel public/..."
$distDir = Join-Path $root "frontend\dist"
Copy-Item -Path (Join-Path $distDir "index.html") -Destination (Join-Path $staging "public\app.html") -Force
if (Test-Path (Join-Path $staging "public\assets")) {
    cmd /c "rmdir /s /q `"$(Join-Path $staging 'public\assets')`""
}
$null = robocopy (Join-Path $distDir "assets") (Join-Path $staging "public\assets") /E /NFL /NDL /NJH /NJS /NC /NS /NP

Write-Host "4. Compressing into editor-platform-production.zip..."
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($staging, $zipPath, [System.IO.Compression.CompressionLevel]::Optimal, $false)

cmd /c "rmdir /s /q `"$staging`""

$sizeMB = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
Write-Host "Done! Package created at: $zipPath ($sizeMB MB)"
