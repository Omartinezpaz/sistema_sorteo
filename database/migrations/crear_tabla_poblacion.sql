-- Script para crear una tabla separada para la información de población
-- Ejecutar este script en la base de datos 'sorteo_db'

-- 1. Crear tabla para información de población por región
CREATE TABLE IF NOT EXISTS poblacion_regiones (
    id SERIAL PRIMARY KEY,
    tipo_region VARCHAR(20) NOT NULL CHECK (tipo_region IN ('estado', 'municipio', 'parroquia')),
    region_id INTEGER NOT NULL,
    nombre_region VARCHAR(100) NOT NULL,
    poblacion INTEGER NOT NULL DEFAULT 0,
    anio_censo INTEGER,
    fuente VARCHAR(255),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX idx_poblacion_tipo_region ON poblacion_regiones(tipo_region);
CREATE INDEX idx_poblacion_region_id ON poblacion_regiones(region_id);
CREATE UNIQUE INDEX idx_poblacion_tipo_region_id ON poblacion_regiones(tipo_region, region_id);

-- 3. Agregar comentarios a las tablas y columnas
COMMENT ON TABLE poblacion_regiones IS 'Almacena información de población para estados, municipios y parroquias';
COMMENT ON COLUMN poblacion_regiones.tipo_region IS 'Tipo de región: estado, municipio o parroquia';
COMMENT ON COLUMN poblacion_regiones.region_id IS 'ID de la región en su respectiva tabla (estados.cod_estado, municipios.cod_municipio, etc.)';
COMMENT ON COLUMN poblacion_regiones.nombre_region IS 'Nombre de la región para facilitar consultas sin necesidad de JOIN';
COMMENT ON COLUMN poblacion_regiones.poblacion IS 'Número de habitantes de la región';
COMMENT ON COLUMN poblacion_regiones.anio_censo IS 'Año del censo de donde se obtuvo la información';
COMMENT ON COLUMN poblacion_regiones.fuente IS 'Fuente de la información de población (INE, etc.)';

-- 4. Crear función de actualización de timestamp
CREATE OR REPLACE FUNCTION actualizar_fecha_poblacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Crear trigger para actualizar automáticamente fecha_actualizacion
CREATE TRIGGER actualizar_poblacion_timestamp
BEFORE UPDATE ON poblacion_regiones
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_poblacion();

-- 6. Crear vista para facilitar consultas comunes
CREATE OR REPLACE VIEW vw_poblacion_estados AS
SELECT 
    e.cod_estado AS id,
    e.nom_estado AS nombre,
    COALESCE(p.poblacion, 0) AS poblacion,
    COALESCE(p.anio_censo, 0) AS anio_censo,
    COALESCE(p.fuente, 'No especificada') AS fuente
FROM 
    estados e
LEFT JOIN 
    poblacion_regiones p ON p.tipo_region = 'estado' AND p.region_id = e.cod_estado
WHERE 
    e.activo = TRUE AND (p.activo IS NULL OR p.activo = TRUE);

-- 7. Crear vista para municipios
CREATE OR REPLACE VIEW vw_poblacion_municipios AS
SELECT 
    m.cod_municipio AS id,
    m.nom_municipio AS nombre,
    e.nom_estado AS estado,
    COALESCE(p.poblacion, 0) AS poblacion,
    COALESCE(p.anio_censo, 0) AS anio_censo,
    COALESCE(p.fuente, 'No especificada') AS fuente
FROM 
    municipios m
JOIN 
    estados e ON m.cod_estado = e.cod_estado
LEFT JOIN 
    poblacion_regiones p ON p.tipo_region = 'municipio' AND p.region_id = m.cod_municipio
WHERE 
    m.activo = TRUE AND e.activo = TRUE AND (p.activo IS NULL OR p.activo = TRUE);

-- 8. Crear vista para parroquias
CREATE OR REPLACE VIEW vw_poblacion_parroquias AS
SELECT 
    pa.cod_parroquia AS id,
    pa.nom_parroquia AS nombre,
    m.nom_municipio AS municipio,
    e.nom_estado AS estado,
    COALESCE(p.poblacion, 0) AS poblacion,
    COALESCE(p.anio_censo, 0) AS anio_censo,
    COALESCE(p.fuente, 'No especificada') AS fuente
FROM 
    parroquias pa
JOIN 
    municipios m ON pa.cod_municipio = m.cod_municipio
JOIN 
    estados e ON m.cod_estado = e.cod_estado
LEFT JOIN 
    poblacion_regiones p ON p.tipo_region = 'parroquia' AND p.region_id = pa.cod_parroquia
WHERE 
    pa.activo = TRUE AND m.activo = TRUE AND e.activo = TRUE AND (p.activo IS NULL OR p.activo = TRUE);

-- 9. Crear función para importar datos de población de estados (ejemplo)
CREATE OR REPLACE FUNCTION importar_poblacion_estados(datos JSONB)
RETURNS INTEGER AS $$
DECLARE
    contador INTEGER := 0;
    estado JSONB;
BEGIN
    FOR estado IN SELECT * FROM jsonb_array_elements(datos)
    LOOP
        -- Insertar o actualizar población de estado
        INSERT INTO poblacion_regiones (
            tipo_region, region_id, nombre_region, poblacion, anio_censo, fuente
        ) VALUES (
            'estado',
            (estado->>'cod_estado')::INTEGER,
            estado->>'nom_estado',
            (estado->>'poblacion')::INTEGER,
            (estado->>'anio_censo')::INTEGER,
            estado->>'fuente'
        )
        ON CONFLICT (tipo_region, region_id) DO UPDATE 
        SET 
            nombre_region = EXCLUDED.nombre_region,
            poblacion = EXCLUDED.poblacion,
            anio_censo = EXCLUDED.anio_censo,
            fuente = EXCLUDED.fuente,
            fecha_actualizacion = CURRENT_TIMESTAMP;
            
        contador := contador + 1;
    END LOOP;
    
    RETURN contador;
END;
$$ LANGUAGE plpgsql; 