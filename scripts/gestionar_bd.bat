@echo off
setlocal enabledelayedexpansion

:: Script de gestión de base de datos para Sorteo Pueblo Valiente
:: Este script facilita la ejecución de los diferentes scripts SQL

:: Configuración
set DB_NAME=sorteo_db
set PSQL_BIN="C:\Program Files\PostgreSQL\14\bin"
set SCRIPTS_DIR=%~dp0

:: Título
echo ======================================================
echo      SISTEMA DE SORTEOS PUEBLO VALIENTE
echo      Herramienta de Gestión de Base de Datos
echo ======================================================
echo.

:: Verificar si PostgreSQL está en el PATH o en la ubicación predeterminada
where /q psql
if %ERRORLEVEL% NEQ 0 (
    if exist %PSQL_BIN%\psql.exe (
        set PATH=%PATH%;%PSQL_BIN%
    ) else (
        echo ERROR: No se encontró PostgreSQL.
        echo Por favor, asegúrese de que PostgreSQL está instalado y
        echo modifique este script para indicar la ruta correcta.
        echo.
        echo Ubicaciones comunes:
        echo - C:\Program Files\PostgreSQL\14\bin
        echo - C:\Program Files\PostgreSQL\13\bin
        echo - C:\Program Files\PostgreSQL\12\bin
        goto :eof
    )
)

:: Solicitar credenciales
set /p DB_USER="Ingrese nombre de usuario de PostgreSQL: "
set /p DB_PASSWORD="Ingrese contraseña: "

:: Menú principal
:menu
cls
echo ======================================================
echo      SISTEMA DE SORTEOS PUEBLO VALIENTE
echo      Herramienta de Gestión de Base de Datos
echo ======================================================
echo.
echo Opciones disponibles:
echo.
echo 1. Verificar conexión a base de datos
echo 2. Adecuar estructura de base de datos
echo 3. Cargar datos de prueba
echo 4. Generar respaldo de base de datos
echo 5. Verificar tablas existentes
echo 6. Salir
echo.
set /p OPTION="Seleccione una opción (1-6): "

if "%OPTION%"=="1" goto :verificar_conexion
if "%OPTION%"=="2" goto :adecuar_estructura
if "%OPTION%"=="3" goto :cargar_datos
if "%OPTION%"=="4" goto :generar_respaldo
if "%OPTION%"=="5" goto :verificar_tablas
if "%OPTION%"=="6" goto :salir

echo Opción no válida. Por favor, intente de nuevo.
timeout /t 2 >nul
goto :menu

:verificar_conexion
echo.
echo Verificando conexión a PostgreSQL...
set PGPASSWORD=%DB_PASSWORD%
psql -U %DB_USER% -d postgres -c "SELECT version();"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: No se pudo conectar a PostgreSQL.
    echo Verifique sus credenciales y que el servidor esté en ejecución.
) else (
    echo Conexión exitosa a PostgreSQL.
    
    :: Verificar si la base de datos existe
    psql -U %DB_USER% -d postgres -c "SELECT datname FROM pg_database WHERE datname='%DB_NAME%';" | findstr /C:"%DB_NAME%" >nul
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo La base de datos '%DB_NAME%' no existe.
        set /p CREATE_DB="¿Desea crearla ahora? (s/n): "
        if /i "!CREATE_DB!"=="s" (
            echo Creando base de datos '%DB_NAME%'...
            psql -U %DB_USER% -d postgres -c "CREATE DATABASE %DB_NAME%;"
            if !ERRORLEVEL! NEQ 0 (
                echo ERROR: No se pudo crear la base de datos.
            ) else (
                echo Base de datos '%DB_NAME%' creada exitosamente.
            )
        )
    ) else (
        echo Base de datos '%DB_NAME%' encontrada.
    )
)
echo.
pause
goto :menu

:adecuar_estructura
echo.
echo Adecuando estructura de base de datos...
set PGPASSWORD=%DB_PASSWORD%
psql -U %DB_USER% -d %DB_NAME% -f "%SCRIPTS_DIR%adecuar_bd_pgadmin.sql"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: No se pudo ejecutar el script de adecuación.
) else (
    echo Estructura de base de datos actualizada correctamente.
)
echo.
pause
goto :menu

:cargar_datos
echo.
echo ADVERTENCIA: Esta acción puede sobrescribir datos existentes.
set /p CONFIRM="¿Está seguro de que desea cargar datos de prueba? (s/n): "
if /i NOT "%CONFIRM%"=="s" goto :menu

echo Cargando datos de prueba...
set PGPASSWORD=%DB_PASSWORD%
psql -U %DB_USER% -d %DB_NAME% -f "%SCRIPTS_DIR%cargar_datos_prueba.sql"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: No se pudieron cargar los datos de prueba.
) else (
    echo Datos de prueba cargados correctamente.
)
echo.
pause
goto :menu

:generar_respaldo
echo.
echo Generando vistas de respaldo...
set PGPASSWORD=%DB_PASSWORD%
psql -U %DB_USER% -d %DB_NAME% -f "%SCRIPTS_DIR%respaldar_bd.sql"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: No se pudo ejecutar el script de respaldo.
) else (
    echo Vistas de respaldo generadas correctamente.
    echo.
    
    :: Generar nombre de archivo con timestamp
    for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /format:list') do set DATETIME=%%I
    set TIMESTAMP=%DATETIME:~0,8%_%DATETIME:~8,6%
    set BACKUP_FILE=%CD%\respaldo_sorteo_%TIMESTAMP%.sql
    
    set /p FULL_BACKUP="¿Desea generar un archivo de respaldo completo ahora? (s/n): "
    if /i "!FULL_BACKUP!"=="s" (
        echo Generando respaldo completo...
        pg_dump -U %DB_USER% -d %DB_NAME% -F p --column-inserts --inserts > "%BACKUP_FILE%"
        if !ERRORLEVEL! NEQ 0 (
            echo ERROR: No se pudo generar el archivo de respaldo.
        ) else (
            echo Respaldo guardado en: %BACKUP_FILE%
        )
    )
)
echo.
pause
goto :menu

:verificar_tablas
echo.
echo Verificando tablas existentes en la base de datos...
set PGPASSWORD=%DB_PASSWORD%
psql -U %DB_USER% -d %DB_NAME% -c "SELECT table_name, table_type FROM information_schema.tables WHERE table_schema='public' ORDER BY table_type, table_name;"
echo.
pause
goto :menu

:salir
echo.
echo Gracias por utilizar la herramienta de gestión de base de datos.
echo Saliendo...
timeout /t 2 >nul
exit /b 0 