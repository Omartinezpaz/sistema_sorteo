-- Función mejorada para generar tiques por estado (versión corregida)
CREATE OR REPLACE FUNCTION public.generar_tiques_por_estado(
    p_sorteo_id INTEGER,         -- ID del sorteo
    p_prefijo VARCHAR(10) DEFAULT 'TIQ',  -- Prefijo para los tiques
    p_archivo_salida VARCHAR(255) DEFAULT '/tmp/tiques_generados.csv', -- Ruta del archivo de salida
    p_fecha_sorteo TIMESTAMP DEFAULT NULL -- Fecha del sorteo (opcional)
)
RETURNS TABLE(
    mensaje TEXT,
    total_tiques INTEGER,
    tiques_por_estado JSON
) AS $$
DECLARE
    v_total_tiques INTEGER := 0;
    v_numero_tique INTEGER := 1;
    v_estado_record RECORD;
    v_participante RECORD;
    v_tiques_por_estado JSONB := '{}';
    v_cant_participantes INTEGER;
    v_fecha_actual TIMESTAMP := COALESCE(p_fecha_sorteo, NOW());
    v_archivo_salida TEXT;
    v_sorteo_existe BOOLEAN;
BEGIN
    -- Verificar si el sorteo existe
    IF p_sorteo_id IS NOT NULL THEN
        SELECT EXISTS(SELECT 1 FROM sorteos WHERE id = p_sorteo_id) INTO v_sorteo_existe;
        IF NOT v_sorteo_existe THEN
            RAISE EXCEPTION 'El sorteo con ID % no existe', p_sorteo_id;
        END IF;
    END IF;

    -- Obtener cantidad de participantes por estado
    CREATE TEMP TABLE IF NOT EXISTS temp_conteo_estados AS
    SELECT 
        cod_estado, 
        COUNT(*) as cantidad 
    FROM 
        public.re_723 
    GROUP BY 
        cod_estado
    ORDER BY
        cod_estado;
    
    -- Obtener cantidad total de participantes
    SELECT SUM(cantidad) INTO v_cant_participantes FROM temp_conteo_estados;
    
    -- Si no hay participantes, retornar mensaje de error
    IF v_cant_participantes IS NULL OR v_cant_participantes = 0 THEN
        DROP TABLE IF EXISTS temp_conteo_estados;
        RETURN QUERY SELECT 
            'No se encontraron participantes en la tabla re_723'::TEXT, 
            0::INTEGER, 
            '{}'::JSON;
        RETURN;
    END IF;
    
    -- Abrir archivo para escritura
    IF p_archivo_salida IS NOT NULL THEN
        v_archivo_salida := p_archivo_salida;
        PERFORM pg_advisory_lock(hashtext(v_archivo_salida));
        
        -- Escribir encabezado CSV
        EXECUTE format('COPY (SELECT ''cedula,nombre,apellido,estado,municipio,parroquia,telefono,email,prefijo_tique,numero_tique,codigo_tique'') TO %L', v_archivo_salida);
    END IF;
    
    -- Por cada estado distribuir tiques
    FOR v_estado_record IN SELECT cod_estado, cantidad FROM temp_conteo_estados ORDER BY cod_estado LOOP
        -- Guardar cantidad de tiques por estado en el JSON
        v_tiques_por_estado := v_tiques_por_estado || jsonb_build_object(v_estado_record.cod_estado, v_estado_record.cantidad);
        
        -- Para cada participante en el estado, asignar un tique
        FOR v_participante IN 
            SELECT 
                nac || cedula_ch AS cedula,
                p_nombre AS nombre,         -- Nombre del participante de re_723
                p_apellido AS apellido,     -- Apellido del participante de re_723
                cod_estado AS estado,
                cod_municipio AS municipio,
                cod_parroquia AS parroquia,
                telefono,
                '' AS email -- campo vacío para email
            FROM 
                public.re_723
            WHERE 
                cod_estado = v_estado_record.cod_estado
            ORDER BY 
                RANDOM() -- Ordenar aleatoriamente para distribución justa
        LOOP
            -- Generar código de tique
            -- Formato: PREFIJO-ESTADO-NUMERO (ej: TIQ-01-00001)
            v_participante.prefijo_tique := p_prefijo;
            v_participante.numero_tique := v_numero_tique;
            v_participante.codigo_tique := p_prefijo || '-' || 
                                          LPAD(v_participante.estado, 2, '0') || '-' || 
                                          LPAD(v_numero_tique::TEXT, 5, '0');
            
            -- Escribir al archivo CSV si se proporcionó una ruta
            IF p_archivo_salida IS NOT NULL THEN
                EXECUTE format(
                    'COPY (SELECT %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L) TO %L CSV DELIMITER '','' APPEND',
                    v_participante.cedula,
                    v_participante.nombre,
                    v_participante.apellido,
                    v_participante.estado,
                    v_participante.municipio,
                    v_participante.parroquia,
                    v_participante.telefono,
                    v_participante.email,
                    v_participante.prefijo_tique,
                    v_participante.numero_tique,
                    v_participante.codigo_tique,
                    v_archivo_salida
                );
            END IF;
            
            -- Incrementar contador de tiques
            v_numero_tique := v_numero_tique + 1;
            v_total_tiques := v_total_tiques + 1;
        END LOOP;
    END LOOP;
    
    -- Liberar bloqueo del archivo
    IF p_archivo_salida IS NOT NULL THEN
        PERFORM pg_advisory_unlock(hashtext(v_archivo_salida));
    END IF;
    
    -- Insertar en tabla participantes del sistema si se proporciona ID de sorteo
    IF p_sorteo_id IS NOT NULL AND p_sorteo_id > 0 THEN
        INSERT INTO participantes (
            sorteo_id, nombre, apellido, documento_identidad, 
            estado, municipio, parroquia, telefono, email,
            prefijo_tique, numero_tique, codigo_tique, 
            tique_asignado, fecha_asignacion_tique, 
            validado, fecha_creacion, fecha_registro
        )
        SELECT 
            p_sorteo_id,
            p_nombre,           -- Nombre del participante de re_723
            p_apellido,         -- Apellido del participante de re_723
            nac || cedula_ch,
            cod_estado,
            cod_municipio, 
            cod_parroquia, 
            telefono,
            '', -- email vacío
            p_prefijo,
            ROW_NUMBER() OVER (ORDER BY RANDOM()),
            p_prefijo || '-' || LPAD(cod_estado, 2, '0') || '-' || LPAD((ROW_NUMBER() OVER (ORDER BY RANDOM()))::TEXT, 5, '0'),
            TRUE,
            v_fecha_actual,
            TRUE,
            v_fecha_actual,
            v_fecha_actual
        FROM 
            public.re_723;
        
        -- Actualizar el conteo de participantes en el sorteo
        UPDATE sorteos 
        SET metadata = COALESCE(metadata, '{}'::jsonb) || 
                      jsonb_build_object(
                          'total_participantes', v_total_tiques,
                          'tiques_por_estado', v_tiques_por_estado,
                          'ultima_actualizacion', v_fecha_actual
                      )
        WHERE id = p_sorteo_id;
    END IF;
    
    -- Limpiar tabla temporal
    DROP TABLE IF EXISTS temp_conteo_estados;
    
    -- Retornar resultados
    RETURN QUERY SELECT
        'Se generaron ' || v_total_tiques || ' tiques distribuidos entre ' || 
        (SELECT COUNT(DISTINCT cod_estado) FROM public.re_723) || ' estados' AS mensaje,
        v_total_tiques AS total_tiques,
        v_tiques_por_estado::JSON AS tiques_por_estado;
END;
$$ LANGUAGE plpgsql; 