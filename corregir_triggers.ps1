# Script PowerShell para corregir los triggers

# Leer las variables de entorno del archivo .env
function Get-DatabaseConfig {
    $envFile = Join-Path $PSScriptRoot ".env"
    if (Test-Path $envFile) {
        Get-Content $envFile | ForEach-Object {
            if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim()
                if ($key -and $value) {
                    Set-Variable -Name $key -Value $value -Scope Script
                }
            }
        }
    }
    
    # Valores por defecto si no se encuentran en .env
    if (-not (Get-Variable -Name "DB_HOST" -ErrorAction SilentlyContinue)) { $Script:DB_HOST = "localhost" }
    if (-not (Get-Variable -Name "DB_PORT" -ErrorAction SilentlyContinue)) { $Script:DB_PORT = "5432" }
    if (-not (Get-Variable -Name "DB_NAME" -ErrorAction SilentlyContinue)) { $Script:DB_NAME = "pueblo_valiente" }
    if (-not (Get-Variable -Name "DB_USER" -ErrorAction SilentlyContinue)) { $Script:DB_USER = "postgres" }
    if (-not (Get-Variable -Name "DB_PASSWORD" -ErrorAction SilentlyContinue)) { $Script:DB_PASSWORD = "" }
    
    return @{
        Host = $Script:DB_HOST
        Port = $Script:DB_PORT
        Database = $Script:DB_NAME
        User = $Script:DB_USER
        Password = $Script:DB_PASSWORD
    }
}

# Obtener configuración
$dbConfig = Get-DatabaseConfig
Write-Host "Configuración de BD:"
Write-Host "Host: $($dbConfig.Host)"
Write-Host "Port: $($dbConfig.Port)"
Write-Host "Database: $($dbConfig.Database)"
Write-Host "User: $($dbConfig.User)"

# Construir el SQL directamente
$sql = @"
-- Eliminar el trigger que está causando problemas
DROP TRIGGER IF EXISTS actualizar_timestamps_trigger ON estados;
DROP TRIGGER IF EXISTS actualizar_timestamps_trigger ON municipios;
DROP TRIGGER IF EXISTS actualizar_timestamps_trigger ON parroquias;
DROP TRIGGER IF EXISTS actualizar_timestamps_trigger ON sorteos;
DROP TRIGGER IF EXISTS actualizar_timestamps_trigger ON participantes;
DROP TRIGGER IF EXISTS actualizar_timestamps_trigger ON usuarios;

-- Eliminar la función que estaba intentando actualizar el campo "updated_at"
DROP FUNCTION IF EXISTS actualizar_timestamps();

-- Crear una nueva función que verifique si el campo "fecha_actualizacion" existe
CREATE OR REPLACE FUNCTION actualizar_fecha_actualizacion()
RETURNS TRIGGER AS `$`$
BEGIN
  -- Verificar si la tabla tiene el campo "fecha_actualizacion"
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = TG_TABLE_NAME 
    AND column_name = 'fecha_actualizacion'
  ) THEN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
  END IF;
  RETURN NEW;
END;
`$`$ LANGUAGE plpgsql;

-- Aplicar el nuevo trigger a cada tabla que tenga el campo fecha_actualizacion
CREATE TRIGGER actualizar_fecha_actualizacion_trigger
BEFORE UPDATE ON estados
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_actualizacion();

CREATE TRIGGER actualizar_fecha_actualizacion_trigger
BEFORE UPDATE ON municipios
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_actualizacion();

CREATE TRIGGER actualizar_fecha_actualizacion_trigger
BEFORE UPDATE ON parroquias
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_actualizacion();

-- Solo si estas tablas tienen fecha_actualizacion
CREATE TRIGGER actualizar_fecha_actualizacion_trigger
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_actualizacion();

CREATE TRIGGER actualizar_fecha_actualizacion_trigger
BEFORE UPDATE ON sorteos
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_actualizacion();

-- Verificar y corregir el campo fecha_actualizacion en cada tabla si es necesario
ALTER TABLE IF EXISTS estados 
ALTER COLUMN fecha_actualizacion SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE IF EXISTS municipios 
ALTER COLUMN fecha_actualizacion SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE IF EXISTS parroquias 
ALTER COLUMN fecha_actualizacion SET DEFAULT CURRENT_TIMESTAMP;
"@

# Crear archivo temporal con el SQL
$tempSqlFile = Join-Path $env:TEMP "corregir_triggers_temp.sql"
$sql | Out-File -FilePath $tempSqlFile -Encoding utf8

Write-Host "SQL guardado en archivo temporal: $tempSqlFile"

# Configurar PGPASSWORD como variable de entorno
$env:PGPASSWORD = $dbConfig.Password

# Ejecutar SQL con psql
$psqlPath = "psql"
$psqlArgs = "-h $($dbConfig.Host) -p $($dbConfig.Port) -d $($dbConfig.Database) -U $($dbConfig.User) -f `"$tempSqlFile`""

Write-Host "Ejecutando: $psqlPath $psqlArgs"

try {
    $output = & $psqlPath -h $dbConfig.Host -p $dbConfig.Port -d $dbConfig.Database -U $dbConfig.User -f "$tempSqlFile" 2>&1
    Write-Host "Resultado de la ejecución:"
    Write-Host $output
} catch {
    Write-Host "Error al ejecutar psql: $_"
}

# Limpiar
Remove-Item -Path $tempSqlFile -Force
$env:PGPASSWORD = ""

Write-Host "Proceso completado." 