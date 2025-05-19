#!/usr/bin/env pwsh
#
# Script para verificar la preparación del sistema para realizar sorteos
# Para usar en Windows con PowerShell

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "     SISTEMA DE SORTEOS PUEBLO VALIENTE" -ForegroundColor Yellow
Write-Host "     Verificación Previa al Sorteo" -ForegroundColor Yellow
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar la existencia de Node.js
try {
    $nodeVersion = node --version
    # Write-Host "Node.js detectado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Node.js no está instalado o no está en el PATH" -ForegroundColor Red
    Write-Host "Por favor, instale Node.js desde https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Ejecutar verificaciones
try {
    node app_escritorio/src_main/utils/run-checks.js

    # Verificar código de salida
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Todas las verificaciones se completaron con éxito." -ForegroundColor Green
        Write-Host "   El sistema está listo para realizar sorteos."
    } elseif ($LASTEXITCODE -eq 1) {
        Write-Host ""
        Write-Host "⚠️ Se encontraron advertencias durante las verificaciones." -ForegroundColor Yellow
        Write-Host "   Revise el informe para más detalles."
    } else {
        Write-Host ""
        Write-Host "❌ Se encontraron errores críticos durante las verificaciones." -ForegroundColor Red
        Write-Host "   Por favor, resuelva los problemas antes de realizar un sorteo."
    }

    Write-Host ""
    Write-Host "Para más detalles, consulte el archivo de log generado." -ForegroundColor Cyan
    Write-Host "======================================================" -ForegroundColor Cyan

    # Devolver el mismo código de salida
    exit $LASTEXITCODE
} catch {
    Write-Host "❌ Error al ejecutar verificaciones: $_" -ForegroundColor Red
    exit 2
} 