-- Secuencia para distribucion_tiques
CREATE SEQUENCE IF NOT EXISTS public.distribucion_tiques_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.distribucion_tiques_id_seq
    OWNER TO postgres;

-- Tabla de distribución de tiques
CREATE TABLE IF NOT EXISTS public.distribucion_tiques
(
    id integer NOT NULL DEFAULT nextval('distribucion_tiques_id_seq'::regclass),
    sorteo_id integer NOT NULL,
    cod_estado integer NOT NULL,
    rango_desde integer NOT NULL,
    rango_hasta integer NOT NULL,
    cantidad integer NOT NULL,
    porcentaje numeric(5,2),
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT distribucion_tiques_pkey PRIMARY KEY (id),
    CONSTRAINT distribucion_tiques_sorteo_id_fkey FOREIGN KEY (sorteo_id)
        REFERENCES public.sorteos (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT distribucion_tiques_cod_estado_fkey FOREIGN KEY (cod_estado)
        REFERENCES public.estados (cod_estado) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);

ALTER TABLE IF EXISTS public.distribucion_tiques
    OWNER to postgres;

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_distribucion_tiques_sorteo
    ON public.distribucion_tiques USING btree
    (sorteo_id ASC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_distribucion_tiques_estado
    ON public.distribucion_tiques USING btree
    (cod_estado ASC NULLS LAST);

-- Función para generar tiques basándose en la distribución configurada
CREATE OR REPLACE FUNCTION public.generar_tiques_desde_distribucion(
    p_sorteo_id INTEGER,
    p_prefijo VARCHAR(10) DEFAULT 'TIQ',
    p_archivo_salida VARCHAR(255) DEFAULT NULL,
    p_fecha_sorteo TIMESTAMP DEFAULT NULL
)
RETURNS TABLE(
    mensaje TEXT,
    total_tiques INTEGER,
    tiques_por_estado JSON,
    progreso JSON
) AS $$
DECLARE
    v_total_tiques INTEGER := 0;
    v_numero_tique INTEGER := 1;
    v_tiques_por_estado JSONB := '{}';
    v_fecha_actual TIMESTAMP := COALESCE(p_fecha_sorteo, NOW());
    v_archivo_salida TEXT;
    v_sorteo_existe BOOLEAN;
    v_distribucion_existe BOOLEAN;
    v_distribucion_record RECORD;
    v_participante_record RECORD;
    v_desde INTEGER;
    v_hasta INTEGER;
    v_cantidad INTEGER;
    v_tiques_generados INTEGER := 0;
    v_estado_actual TEXT;
    v_total_a_generar INTEGER := 0;
    v_progreso JSONB := '{}';
    v_contador_estados INTEGER := 0;
    v_total_estados INTEGER := 0;
BEGIN
    -- Verificar si el sorteo existe
    SELECT EXISTS(SELECT 1 FROM sorteos WHERE id = p_sorteo_id) INTO v_sorteo_existe;
    IF NOT v_sorteo_existe THEN
        RAISE EXCEPTION 'El sorteo con ID % no existe', p_sorteo_id;
    END IF;

    -- Verificar si existe distribución para este sorteo
    SELECT EXISTS(SELECT 1 FROM distribucion_tiques WHERE sorteo_id = p_sorteo_id) INTO v_distribucion_existe;
    IF NOT v_distribucion_existe THEN
        RAISE EXCEPTION 'No existe distribución de tiques configurada para el sorteo con ID %', p_sorteo_id;
    END IF;
    
    -- Calcular el total de tiques a generar y número de estados
    SELECT SUM(cantidad), COUNT(DISTINCT cod_estado)
    INTO v_total_a_generar, v_total_estados
    FROM distribucion_tiques
    WHERE sorteo_id = p_sorteo_id;
    
    -- Inicializar progreso
    v_progreso := jsonb_build_object(
        'total_a_generar', v_total_a_generar,
        'generados', 0,
        'porcentaje', 0,
        'estado_actual', NULL,
        'estados_procesados', 0,
        'total_estados', v_total_estados
    );
    
    -- Actualizar progreso en la metadata del sorteo
    UPDATE sorteos 
    SET metadata = COALESCE(metadata, '{}'::jsonb) || 
                  jsonb_build_object('progreso_generacion', v_progreso)
    WHERE id = p_sorteo_id;
    
    -- Abrir archivo para escritura si se proporcionó ruta
    IF p_archivo_salida IS NOT NULL THEN
        v_archivo_salida := p_archivo_salida;
        PERFORM pg_advisory_lock(hashtext(v_archivo_salida));
        
        -- Escribir encabezado CSV
        EXECUTE format('COPY (SELECT ''cedula,nombre,apellido,estado,municipio,parroquia,telefono,email,prefijo_tique,numero_tique,codigo_tique'') TO %L', v_archivo_salida);
    END IF;

    -- Crear tabla temporal para almacenar los tiques generados
    CREATE TEMP TABLE IF NOT EXISTS temp_tiques_generados (
        cedula TEXT,
        nombre TEXT,
        apellido TEXT,
        estado TEXT,
        municipio TEXT,
        parroquia TEXT,
        telefono TEXT,
        email TEXT,
        prefijo_tique TEXT,
        numero_tique INTEGER,
        codigo_tique TEXT
    );
    
    -- Crear tabla temporal para conteo
    CREATE TEMP TABLE IF NOT EXISTS temp_conteo_estados (
        cod_estado INTEGER,
        nom_estado TEXT,
        tiques_generados INTEGER DEFAULT 0
    );

    -- Procesar cada estado según la distribución configurada
    FOR v_distribucion_record IN 
        SELECT dt.*, e.nom_estado 
        FROM distribucion_tiques dt
        JOIN estados e ON dt.cod_estado = e.cod_estado
        WHERE dt.sorteo_id = p_sorteo_id
        ORDER BY e.nom_estado
    LOOP
        v_contador_estados := v_contador_estados + 1;
        v_desde := v_distribucion_record.rango_desde;
        v_hasta := v_distribucion_record.rango_hasta;
        v_cantidad := v_distribucion_record.cantidad;
        v_estado_actual := v_distribucion_record.nom_estado;
        
        RAISE NOTICE 'Procesando estado %: Desde % hasta % (%)', 
                     v_estado_actual, v_desde, v_hasta, v_cantidad;
        
        -- Actualizar progreso con el estado actual
        v_progreso := jsonb_set(v_progreso, '{estado_actual}', to_jsonb(v_estado_actual));
        v_progreso := jsonb_set(v_progreso, '{estados_procesados}', to_jsonb(v_contador_estados));
        
        UPDATE sorteos 
        SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), 
                               '{progreso_generacion}', 
                               v_progreso)
        WHERE id = p_sorteo_id;
        
        -- Inicializar contador para este estado
        INSERT INTO temp_conteo_estados (cod_estado, nom_estado, tiques_generados)
        VALUES (v_distribucion_record.cod_estado, v_estado_actual, 0);
        
        -- Seleccionar participantes para este estado (limitado a la cantidad configurada)
        v_tiques_generados := 0;
        
        FOR v_participante_record IN 
            SELECT 
                nac || cedula_ch AS cedula,
                p_nombre AS nombre,
                p_apellido AS apellido,
                cod_estado,
                cod_municipio,
                cod_parroquia,
                telefono
            FROM 
                public.re_723
            WHERE 
                cod_estado = v_distribucion_record.cod_estado
            ORDER BY 
                RANDOM()
            LIMIT v_cantidad
        LOOP
            -- Generar número de tique dentro del rango especificado
            v_numero_tique := v_desde + v_tiques_generados;
            
            -- Verificar que estamos dentro del rango
            IF v_numero_tique > v_hasta THEN
                RAISE WARNING 'Límite de rango excedido para el estado %. Se omitirán los restantes.', v_estado_actual;
                EXIT; -- Salir del bucle si excedemos el rango
            END IF;
            
            -- Generar código de tique
            -- Formato: PREFIJO-ESTADO-NUMERO (ej: TIQ-01-00001)
            INSERT INTO temp_tiques_generados (
                cedula, nombre, apellido, estado, municipio, parroquia, telefono, email,
                prefijo_tique, numero_tique, codigo_tique
            ) VALUES (
                v_participante_record.cedula,
                v_participante_record.nombre,
                v_participante_record.apellido,
                v_participante_record.cod_estado,
                v_participante_record.cod_municipio,
                v_participante_record.cod_parroquia,
                v_participante_record.telefono,
                '', -- email vacío
                p_prefijo,
                v_numero_tique,
                p_prefijo || '-' || 
                LPAD(v_participante_record.cod_estado::TEXT, 2, '0') || '-' || 
                LPAD(v_numero_tique::TEXT, 5, '0')
            );
            
            -- Actualizar contadores
            v_tiques_generados := v_tiques_generados + 1;
            v_total_tiques := v_total_tiques + 1;
            
            -- Actualizar progreso cada 100 tiques
            IF v_total_tiques % 100 = 0 THEN
                v_progreso := jsonb_set(v_progreso, '{generados}', to_jsonb(v_total_tiques));
                v_progreso := jsonb_set(v_progreso, '{porcentaje}', 
                                      to_jsonb(ROUND((v_total_tiques::NUMERIC / v_total_a_generar::NUMERIC) * 100, 2)));
                
                UPDATE sorteos 
                SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), 
                                       '{progreso_generacion}', 
                                       v_progreso)
                WHERE id = p_sorteo_id;
            END IF;
            
            -- Si llegamos al límite de este estado, salir del bucle
            IF v_tiques_generados >= v_cantidad THEN
                EXIT;
            END IF;
        END LOOP;
        
        -- Actualizar contador en la tabla temporal
        UPDATE temp_conteo_estados 
        SET tiques_generados = v_tiques_generados
        WHERE cod_estado = v_distribucion_record.cod_estado;
        
        -- Actualizar JSON de conteo por estado
        v_tiques_por_estado := v_tiques_por_estado || 
                               jsonb_build_object(v_distribucion_record.cod_estado::TEXT, v_tiques_generados);
        
        RAISE NOTICE 'Estado % procesado. Tiques generados: %', v_estado_actual, v_tiques_generados;
    END LOOP;

    -- Si se proporcionó un archivo de salida, escribir los tiques al archivo
    IF p_archivo_salida IS NOT NULL THEN
        EXECUTE format('
            COPY (
                SELECT 
                    cedula, nombre, apellido, estado, municipio, parroquia, 
                    telefono, email, prefijo_tique, numero_tique, codigo_tique
                FROM 
                    temp_tiques_generados
                ORDER BY 
                    estado, numero_tique
            ) TO %L WITH CSV
        ', v_archivo_salida || '.temp');
        
        -- Concatenar el archivo de encabezado con el de datos
        EXECUTE format('SELECT pg_catalog.lo_unlink(lo_import(%L))', v_archivo_salida);
        EXECUTE format('
            COPY (
                SELECT ''cedula,nombre,apellido,estado,municipio,parroquia,telefono,email,prefijo_tique,numero_tique,codigo_tique''
                UNION ALL
                SELECT * FROM pg_read_file(%L) AS t
            ) TO %L
        ', v_archivo_salida || '.temp', v_archivo_salida);
        
        EXECUTE format('SELECT pg_catalog.lo_unlink(lo_import(%L))', v_archivo_salida || '.temp');
        PERFORM pg_advisory_unlock(hashtext(v_archivo_salida));
    END IF;
    
    -- Insertar participantes en la tabla de participantes
    IF v_total_tiques > 0 THEN
        INSERT INTO participantes (
            sorteo_id, nombre, apellido, documento_identidad, 
            estado, municipio, parroquia, telefono, email,
            prefijo_tique, numero_tique, codigo_tique, 
            tique_asignado, fecha_asignacion_tique, 
            validado, fecha_creacion, fecha_registro
        )
        SELECT 
            p_sorteo_id,
            nombre,
            apellido, 
            cedula,
            estado,
            municipio, 
            parroquia, 
            telefono,
            email,
            prefijo_tique,
            numero_tique,
            codigo_tique,
            TRUE,
            v_fecha_actual,
            TRUE,
            v_fecha_actual,
            v_fecha_actual
        FROM 
            temp_tiques_generados;
        
        -- Actualizar progreso a 100%
        v_progreso := jsonb_set(v_progreso, '{generados}', to_jsonb(v_total_tiques));
        v_progreso := jsonb_set(v_progreso, '{porcentaje}', to_jsonb(100));
        v_progreso := jsonb_set(v_progreso, '{estado_actual}', '"Completado"');
        v_progreso := jsonb_set(v_progreso, '{estados_procesados}', to_jsonb(v_total_estados));
        
        -- Actualizar el conteo de participantes en el sorteo
        UPDATE sorteos 
        SET metadata = COALESCE(metadata, '{}'::jsonb) || 
                      jsonb_build_object(
                          'total_participantes', v_total_tiques,
                          'tiques_por_estado', v_tiques_por_estado,
                          'ultima_actualizacion', v_fecha_actual,
                          'progreso_generacion', v_progreso
                      )
        WHERE id = p_sorteo_id;
    END IF;
    
    -- Limpiar tablas temporales
    DROP TABLE IF EXISTS temp_tiques_generados;
    
    -- Crear mensaje de resumen
    DECLARE 
        v_mensaje TEXT;
    BEGIN
        v_mensaje := 'Se generaron ' || v_total_tiques || ' tiques distribuidos entre ' || 
                    (SELECT COUNT(*) FROM temp_conteo_estados WHERE tiques_generados > 0) || ' estados: ';
                    
        -- Agregar detalle de estados
        FOR v_distribucion_record IN 
            SELECT nom_estado, tiques_generados 
            FROM temp_conteo_estados 
            WHERE tiques_generados > 0
            ORDER BY nom_estado
        LOOP
            v_mensaje := v_mensaje || v_distribucion_record.nom_estado || ' (' || 
                         v_distribucion_record.tiques_generados || '), ';
        END LOOP;
        
        -- Eliminar la última coma y espacio
        v_mensaje := SUBSTRING(v_mensaje, 1, LENGTH(v_mensaje) - 2);
        
        DROP TABLE IF EXISTS temp_conteo_estados;
        
        -- Retornar resultados
        RETURN QUERY SELECT
            v_mensaje::TEXT,
            v_total_tiques::INTEGER,
            v_tiques_por_estado::JSON,
            v_progreso::JSON;
    END;
END;
$$ LANGUAGE plpgsql; 