@echo off
setlocal

echo ======================================================
echo      SISTEMA DE SORTEOS PUEBLO VALIENTE
echo      Verificación Previa al Sorteo
echo ======================================================
echo.

rem Cambiar al directorio donde se encuentra el script
cd /d "%~dp0"

rem Verificar si Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js no está instalado
    echo Por favor, instale Node.js desde https://nodejs.org/
    exit /b 1
)

rem Verificar si PostgreSQL está disponible (verificando psql)
where psql >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ADVERTENCIA: PostgreSQL CLI (psql) no está en el PATH
    echo Esto no significa necesariamente que PostgreSQL no esté instalado,
    echo pero el sistema no puede verificar su disponibilidad directamente.
)

echo Verificando dependencias...
rem Instalar dependencias si es necesario
if not exist "node_modules\" (
    echo Instalando dependencias...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo ERROR: No se pudieron instalar las dependencias
        exit /b 1
    )
)

echo Ejecutando verificaciones previas al sorteo...
rem Ejecutar el script de verificación
node app_escritorio/src_main/utils/run-checks.js

set EXIT_CODE=%ERRORLEVEL%

if %EXIT_CODE% equ 0 (
    echo.
    echo Todas las verificaciones se completaron con éxito.
    echo El sistema está listo para realizar sorteos.
) else if %EXIT_CODE% equ 1 (
    echo.
    echo Se encontraron advertencias durante las verificaciones.
    echo Revise el informe para más detalles.
) else (
    echo.
    echo Se encontraron errores críticos durante las verificaciones.
    echo Debe resolver estos problemas antes de realizar un sorteo.
)

echo.
echo Para más detalles, consulte el archivo de log generado.
echo ======================================================

exit /b %EXIT_CODE% 