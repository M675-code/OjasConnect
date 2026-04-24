# consolidate_frontend.ps1
# Run this from the backend folder in PowerShell to move backend/frontend to project root as frontend/ and remove duplicate backend-copy/frontend if present.

$scriptDir = Split-Path -Path $MyInvocation.MyCommand.Definition -Parent
$projectRoot = Resolve-Path (Join-Path $scriptDir '..')
$projectRoot = $projectRoot.Path

$source = Join-Path $scriptDir 'frontend'
$dest = Join-Path $projectRoot 'frontend'
$dup = Join-Path $projectRoot 'backend-copy\frontend'

Write-Host "Project root: $projectRoot"
Write-Host "Source: $source"
Write-Host "Destination: $dest"

if (-not (Test-Path $source)) {
  Write-Error "Source frontend folder does not exist: $source"
  exit 1
}

if (Test-Path $dest) {
  Write-Error "Destination already exists: $dest. Remove or rename it before running this script."
  exit 1
}

try {
  Move-Item -Path $source -Destination $dest -Force -ErrorAction Stop
  Write-Host "Moved frontend to project root: $dest"

  if (Test-Path $dup) {
    Remove-Item -Path $dup -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Removed duplicate frontend at: $dup"
  }

  Write-Host "Consolidation complete. Next: update frontend .env (VITE_API_URL) and run 'npm install' inside the new frontend folder."
} catch {
  Write-Error "Failed to move frontend: $_"
  exit 1
}
