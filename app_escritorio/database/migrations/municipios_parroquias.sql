-- Crear tabla de municipios si no existe
CREATE TABLE IF NOT EXISTS municipios (
    id SERIAL PRIMARY KEY,
    cod_municipio INTEGER NOT NULL,
    nom_municipio VARCHAR(100) NOT NULL,
    cod_estado INTEGER NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cod_estado) REFERENCES estados(cod_estado),
    UNIQUE(cod_municipio, cod_estado)
);

-- Crear tabla de parroquias si no existe
CREATE TABLE IF NOT EXISTS parroquias (
    id SERIAL PRIMARY KEY,
    cod_parroquia INTEGER NOT NULL,
    nom_parroquia VARCHAR(100) NOT NULL,
    cod_municipio INTEGER NOT NULL,
    cod_estado INTEGER NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cod_municipio, cod_estado) REFERENCES municipios(cod_municipio, cod_estado),
    UNIQUE(cod_parroquia, cod_municipio, cod_estado)
);

-- Vista para obtener información completa de ubicaciones
CREATE OR REPLACE VIEW vw_ubicaciones AS
SELECT 
    e.cod_estado,
    e.nom_estado,
    m.cod_municipio,
    m.nom_municipio,
    p.cod_parroquia,
    p.nom_parroquia
FROM 
    estados e
LEFT JOIN 
    municipios m ON e.cod_estado = m.cod_estado
LEFT JOIN 
    parroquias p ON m.cod_municipio = p.cod_municipio AND m.cod_estado = p.cod_estado
WHERE 
    e.activo = TRUE AND (m.activo IS NULL OR m.activo = TRUE) AND (p.activo IS NULL OR p.activo = TRUE);

-- Función para asignar tickets proporcionalmente según división político-territorial
CREATE OR REPLACE FUNCTION distribuir_tickets_por_territorio(
    p_total_tickets INTEGER,
    p_nivel_detalle VARCHAR(15), -- 'estado', 'municipio' o 'parroquia'
    p_territorio_ids INTEGER[] -- IDs de los territorios seleccionados
) RETURNS TABLE (
    cod_estado INTEGER,
    nom_estado VARCHAR,
    cod_municipio INTEGER,
    nom_municipio VARCHAR,
    cod_parroquia INTEGER,
    nom_parroquia VARCHAR,
    tickets_asignados INTEGER
) AS $$
DECLARE
    v_territorios_count INTEGER;
    v_tickets_por_territorio INTEGER;
    v_tickets_restantes INTEGER;
BEGIN
    -- Contar cuántos territorios se seleccionaron
    v_territorios_count := array_length(p_territorio_ids, 1);
    
    -- Si no hay territorios, salir
    IF v_territorios_count IS NULL OR v_territorios_count = 0 THEN
        RETURN;
    END IF;

    -- Calcular tickets por territorio (división entera)
    v_tickets_por_territorio := p_total_tickets / v_territorios_count;
    
    -- Calcular tickets restantes para distribuir
    v_tickets_restantes := p_total_tickets - (v_tickets_por_territorio * v_territorios_count);
    
    -- Distribución para niveles diferentes
    IF p_nivel_detalle = 'estado' THEN
        RETURN QUERY
        SELECT 
            e.cod_estado,
            e.nom_estado,
            NULL::INTEGER AS cod_municipio,
            NULL::VARCHAR AS nom_municipio,
            NULL::INTEGER AS cod_parroquia,
            NULL::VARCHAR AS nom_parroquia,
            CASE 
                WHEN e.cod_estado = ANY(p_territorio_ids) AND v_tickets_restantes > 0 THEN
                    v_tickets_por_territorio + 1
                WHEN e.cod_estado = ANY(p_territorio_ids) THEN
                    v_tickets_por_territorio
                ELSE 0
            END AS tickets_asignados
        FROM 
            estados e
        WHERE 
            e.activo = TRUE AND e.cod_estado = ANY(p_territorio_ids)
        ORDER BY 
            e.nom_estado;
            
    ELSIF p_nivel_detalle = 'municipio' THEN
        RETURN QUERY
        SELECT 
            e.cod_estado,
            e.nom_estado,
            m.cod_municipio,
            m.nom_municipio,
            NULL::INTEGER AS cod_parroquia,
            NULL::VARCHAR AS nom_parroquia,
            CASE 
                WHEN m.cod_municipio = ANY(p_territorio_ids) AND v_tickets_restantes > 0 THEN
                    v_tickets_por_territorio + 1
                WHEN m.cod_municipio = ANY(p_territorio_ids) THEN
                    v_tickets_por_territorio
                ELSE 0
            END AS tickets_asignados
        FROM 
            municipios m
        JOIN 
            estados e ON m.cod_estado = e.cod_estado
        WHERE 
            m.activo = TRUE AND e.activo = TRUE AND m.cod_municipio = ANY(p_territorio_ids)
        ORDER BY 
            e.nom_estado, m.nom_municipio;
            
    ELSIF p_nivel_detalle = 'parroquia' THEN
        RETURN QUERY
        SELECT 
            e.cod_estado,
            e.nom_estado,
            m.cod_municipio,
            m.nom_municipio,
            p.cod_parroquia,
            p.nom_parroquia,
            CASE 
                WHEN p.cod_parroquia = ANY(p_territorio_ids) AND v_tickets_restantes > 0 THEN
                    v_tickets_por_territorio + 1
                WHEN p.cod_parroquia = ANY(p_territorio_ids) THEN
                    v_tickets_por_territorio
                ELSE 0
            END AS tickets_asignados
        FROM 
            parroquias p
        JOIN 
            municipios m ON p.cod_municipio = m.cod_municipio AND p.cod_estado = m.cod_estado
        JOIN 
            estados e ON m.cod_estado = e.cod_estado
        WHERE 
            p.activo = TRUE AND m.activo = TRUE AND e.activo = TRUE AND p.cod_parroquia = ANY(p_territorio_ids)
        ORDER BY 
            e.nom_estado, m.nom_municipio, p.nom_parroquia;
    END IF;
END;
$$ LANGUAGE plpgsql; 