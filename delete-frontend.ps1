# Frontend directories to remove
$frontendDirs = @(
    "src",
    "public",
    "node_modules"
)

# Frontend config files to remove
$frontendFiles = @(
    "package.json",
    "package-lock.json",
    "yarn.lock",
    "vite.config.js",
    "index.html",
    ".eslintrc.json",
    ".eslintrc.js",
    "eslint.config.js",
    ".prettierrc",
    ".prettierignore",
    "tsconfig.json",
    "tailwind.config.js",
    "postcss.config.js",
    "babel.config.js",
    "README.md",
    "vite.svg",
    ".gitignore"
)

# Confirmation before deletion
Write-Host "This script will delete the following frontend files and directories:" -ForegroundColor Yellow
Write-Host "`nDirectories:" -ForegroundColor Cyan
$frontendDirs | ForEach-Object { Write-Host "- $_" }
Write-Host "`nFiles:" -ForegroundColor Cyan
$frontendFiles | ForEach-Object { Write-Host "- $_" }

Write-Host "`nWarning: This action cannot be undone!" -ForegroundColor Red
$confirm = Read-Host "`nDo you want to proceed? (y/N)"

if ($confirm -eq 'y') {
    # Remove directories
    foreach ($dir in $frontendDirs) {
        $path = Join-Path "d:\DATA\Github\swp-hiv-clinic" $dir
        if (Test-Path $path) {
            Write-Host "Removing directory: $dir" -ForegroundColor Yellow
            Remove-Item -Path $path -Recurse -Force
        }
    }

    # Remove files
    foreach ($file in $frontendFiles) {
        $path = Join-Path "d:\DATA\Github\swp-hiv-clinic" $file
        if (Test-Path $path) {
            Write-Host "Removing file: $file" -ForegroundColor Yellow
            Remove-Item -Path $path -Force
        }
    }

    Write-Host "`nFrontend files have been removed successfully." -ForegroundColor Green
} else {
    Write-Host "`nOperation cancelled." -ForegroundColor Cyan
}
