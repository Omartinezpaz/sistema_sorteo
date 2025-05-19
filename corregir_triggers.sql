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
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

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