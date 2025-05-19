@echo off
echo =====================================================
echo     SISTEMA DE SORTEOS - VERIFICACION PREVIA
echo =====================================================
echo.
echo Iniciando verificacion del sistema...
echo.

REM Comprobar que Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js no esta instalado o no se encuentra en el PATH.
    echo         Por favor, instale Node.js desde https://nodejs.org/
    echo         y reinicie este script.
    echo.
    pause
    exit /b 1
)

REM Verificar que PostgreSQL está en ejecución
echo Verificando conexion con PostgreSQL...
pg_isready -h localhost -p 5432 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ADVERTENCIA] PostgreSQL no parece estar en ejecucion.
    echo               Es posible que necesite iniciar el servicio de PostgreSQL.
    echo.
    choice /C SN /M "Desea continuar de todos modos (S/N)?"
    if %ERRORLEVEL% EQU 2 exit /b 1
    echo.
) else (
    echo [OK] PostgreSQL esta activo.
    echo.
)

REM Ejecutar el script de verificación
echo Ejecutando verificacion completa del sistema...
echo.
node verificar-preparacion.js
set VERIFICACION_RESULT=%ERRORLEVEL%

if %VERIFICACION_RESULT% NEQ 0 (
    echo.
    echo [ADVERTENCIA] La verificacion encontro problemas.
    echo               Consulte los mensajes anteriores para obtener mas detalles.
    echo.
    echo Revise los siguientes puntos:
    echo 1. PostgreSQL esta en ejecucion y es accesible
    echo 2. Los datos de conexion son correctos (usuario/contraseña)
    echo 3. La base de datos 'sorteo_db' existe
    echo 4. Hay suficiente espacio en disco
    echo.
) else (
    echo.
    echo [EXITO] La verificacion previa se completo correctamente.
    echo         El sistema esta listo para realizar sorteos.
    echo.
)

echo.
echo =====================================================
pause 