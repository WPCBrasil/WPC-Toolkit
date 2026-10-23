# build.ps1 — Empacota a extensão WPC Hub para distribuição manual
# Uso: ./build.ps1 (executa na pasta wpc-hub/)

param(
  [string]$Version = "3.0.0"
)

$ErrorActionPreference = 'Stop'
$root    = $PSScriptRoot
$outDir  = Split-Path $root -Parent
$zipName = "wpc-hub-v$Version.zip"
$zipPath = Join-Path $outDir $zipName

Write-Host "Building WPC Hub v$Version..." -ForegroundColor Cyan

# Remove zip anterior se existir
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

# Arquivos e pastas a incluir
$include = @(
  'manifest.json',
  'popup.html',
  'popup.css',
  'popup.js',
  'icons',
  'lib',
  'models',
  'modules',
  'scripts'
)

# Criar zip usando .NET (disponível em todas as versões do Windows/PowerShell)
Add-Type -Assembly System.IO.Compression.FileSystem

$zip = [System.IO.Compression.ZipFile]::Open($zipPath, 'Create')

foreach ($item in $include) {
  $fullPath = Join-Path $root $item
  if (-not (Test-Path $fullPath)) {
    Write-Warning "  Skipping (not found): $item"
    continue
  }

  if (Test-Path $fullPath -PathType Container) {
    # Pasta — adicionar todos os arquivos recursivamente
    Get-ChildItem -Path $fullPath -Recurse -File | ForEach-Object {
      $entryName = $_.FullName.Substring($root.Length + 1) -replace '\\', '/'
      [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $entryName) | Out-Null
    }
  } else {
    # Arquivo único
    $entryName = $item -replace '\\', '/'
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $fullPath, $entryName) | Out-Null
  }
}

$zip.Dispose()

$size = [math]::Round((Get-Item $zipPath).Length / 1KB, 1)
Write-Host "Done! $zipName ($size KB)" -ForegroundColor Green
Write-Host "Output: $zipPath"
