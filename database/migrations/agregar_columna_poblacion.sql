-- Script para agregar columna de población a las tablas geográficas
-- Ejecutar este script en la base de datos 'sorteo_db'

-- 1. Agregar columna a la tabla estados
ALTER TABLE estados
ADD COLUMN poblacion INTEGER DEFAULT 0;

-- 2. Agregar columna a la tabla municipios
ALTER TABLE municipios
ADD COLUMN poblacion INTEGER DEFAULT 0;

-- 3. Agregar columna a la tabla parroquias
ALTER TABLE parroquias
ADD COLUMN poblacion INTEGER DEFAULT 0;

-- 4. Comentarios explicativos
COMMENT ON COLUMN estados.poblacion IS 'Población total del estado según el último censo disponible';
COMMENT ON COLUMN municipios.poblacion IS 'Población total del municipio según el último censo disponible';
COMMENT ON COLUMN parroquias.poblacion IS 'Población total de la parroquia según el último censo disponible';

-- 5. Función para actualizar la fecha de actualización automáticamente
DO $$
BEGIN
  -- Verificar si la columna fecha_actualizacion existe en cada tabla
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'estados' AND column_name = 'fecha_actualizacion') THEN
    UPDATE estados SET fecha_actualizacion = CURRENT_TIMESTAMP;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'municipios' AND column_name = 'fecha_actualizacion') THEN
    UPDATE municipios SET fecha_actualizacion = CURRENT_TIMESTAMP;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parroquias' AND column_name = 'fecha_actualizacion') THEN
    UPDATE parroquias SET fecha_actualizacion = CURRENT_TIMESTAMP;
  END IF;
END$$;

-- 6. Ejecutar VACUUM ANALYZE para actualizar las estadísticas
VACUUM ANALYZE estados;
VACUUM ANALYZE municipios;
VACUUM ANALYZE parroquias; 