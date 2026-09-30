# ============================================================
# fix-structure.ps1
# Repara la estructura de carpetas del proyecto.
# - Mueve styles/layout/components  -> styles/components
# - Mueve styles/layout/effects     -> styles/effects
# - Verifica que todos los archivos esperados existan
# ============================================================

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }

Write-Host ""
Write-Host "=== Reparando estructura del proyecto ===" -ForegroundColor Cyan
Write-Host "Raiz: $root" -ForegroundColor DarkGray
Write-Host ""

function Move-Safe {
    param([string]$From, [string]$To)

    $fromPath = Join-Path $root $From
    $toPath   = Join-Path $root $To

    if (-not (Test-Path $fromPath)) {
        Write-Host "  - No existe: $From  (nada que mover)" -ForegroundColor DarkGray
        return
    }

    if (Test-Path $toPath) {
        Write-Host "  ! Ya existe el destino: $To" -ForegroundColor Yellow
        Write-Host "    Moviendo contenido archivo por archivo..." -ForegroundColor Yellow

        Get-ChildItem -Path $fromPath -File | ForEach-Object {
            $destFile = Join-Path $toPath $_.Name
            if (Test-Path $destFile) {
                Write-Host "      - Ya existe: $($_.Name), salteando" -ForegroundColor DarkYellow
            } else {
                Move-Item $_.FullName $destFile
                Write-Host "      OK: $($_.Name)" -ForegroundColor Green
            }
        }

        if ((Get-ChildItem -Path $fromPath -Force | Measure-Object).Count -eq 0) {
            Remove-Item $fromPath -Force
            Write-Host "    - Carpeta origen vacia eliminada" -ForegroundColor DarkGray
        }
        return
    }

    Move-Item $fromPath $toPath
    Write-Host "  OK: $From  ->  $To" -ForegroundColor Green
}

Write-Host "[1/3] Moviendo carpetas mal ubicadas..." -ForegroundColor Cyan
Move-Safe "styles\layout\components" "styles\components"
Move-Safe "styles\layout\effects"    "styles\effects"

Write-Host ""
Write-Host "[2/3] Verificando archivos esperados..." -ForegroundColor Cyan

$expected = @(
    "index.html",

    "styles\main.css",
    "styles\base\_reset.css",
    "styles\base\_tokens.css",
    "styles\base\_typography.css",
    "styles\layout\_stage.css",
    "styles\layout\_content.css",
    "styles\components\_badge.css",
    "styles\components\_headline.css",
    "styles\components\_subtitle.css",
    "styles\components\_progress.css",
    "styles\components\_credit.css",
    "styles\effects\_flashes.css",
    "styles\animations\_keyframes.css",
    "styles\utilities\_responsive.css",
    "styles\utilities\_a11y.css",

    "scripts\main.js",
    "scripts\config.js",
    "scripts\state.js",
    "scripts\lib\math.js",
    "scripts\lib\distributions.js",
    "scripts\modules\progress.js",
    "scripts\modules\video.js",
    "scripts\modules\flashes\index.js",
    "scripts\modules\flashes\spawn.js",
    "scripts\modules\flashes\bursts.js",
    "scripts\modules\flashes\scheduler.js"
)

$missing = @()
$found   = 0

foreach ($file in $expected) {
    $full = Join-Path $root $file
    if (Test-Path $full) {
        $found++
    } else {
        $missing += $file
        Write-Host "  FALTA: $file" -ForegroundColor Red
    }
}

if ($missing.Count -eq 0) {
    Write-Host "  OK: Todos los archivos presentes ($found/$($expected.Count))" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "  AVISO: Faltan $($missing.Count) archivos de $($expected.Count)" -ForegroundColor Yellow
    Write-Host "  Tenes que crearlos manualmente con el contenido correspondiente." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[3/3] Estructura final de /styles:" -ForegroundColor Cyan
if (Test-Path (Join-Path $root "styles")) {
    Get-ChildItem (Join-Path $root "styles") -Recurse |
        ForEach-Object {
            $rel = $_.FullName.Replace($root, '').TrimStart('\')
            $indent = '  ' * (($rel -split '\\').Count - 1)
            $name = Split-Path $rel -Leaf
            if ($_.PSIsContainer) {
                Write-Host "$indent$name/" -ForegroundColor Magenta
            } else {
                Write-Host "$indent$name" -ForegroundColor Gray
            }
        }
}

Write-Host ""
Write-Host "=== Listo ===" -ForegroundColor Cyan
if ($missing.Count -gt 0) {
    Write-Host "Recorda crear los archivos faltantes antes de recargar el navegador." -ForegroundColor Yellow
}
Write-Host "Ahora recarga el navegador con Ctrl+Shift+R"
Write-Host ""