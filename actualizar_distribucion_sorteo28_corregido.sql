-- Script para diagnosticar y verificar la función generar_tiques_desde_distribucion
-- con el sorteo 28

-- 1. Verificar que la función existe con la firma correcta
SELECT 
    proname AS nombre_funcion,
    pg_get_function_result(oid) AS firma_retorno
FROM 
    pg_proc 
WHERE 
    proname = 'generar_tiques_desde_distribucion' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 2. Verificar que hay registros en la tabla de distribución para el sorteo 28
SELECT COUNT(*) FROM distribucion_tiques WHERE sorteo_id = 28;

-- 3. Verificar que el sorteo 28 existe
SELECT id, nombre, estado, fecha_sorteo FROM sorteos WHERE id = 28;

-- 4. Verificar que la tabla re_723 existe y contiene datos
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 're_723'
) AS tabla_existe;

SELECT COUNT(*) FROM re_723 LIMIT 1;

-- 5. Verificar campos requeridos en la tabla re_723
SELECT 
    column_name, 
    data_type
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' AND 
    table_name = 're_723'
ORDER BY 
    ordinal_position;

-- 6. Probar una llamada directa a la función con un límite pequeño
-- Esto nos ayudará a diagnosticar si hay problemas con la función
WITH dist AS (
    SELECT 
        dt.sorteo_id,
        dt.cod_estado,
        e.nom_estado,
        dt.rango_desde,
        dt.rango_hasta,
        dt.cantidad
    FROM 
        distribucion_tiques dt
        JOIN estados e ON dt.cod_estado = e.cod_estado
    WHERE 
        dt.sorteo_id = 28
    LIMIT 1
)
SELECT 
    d.sorteo_id,
    d.cod_estado,
    d.nom_estado,
    d.rango_desde,
    d.rango_hasta,
    d.cantidad,
    EXISTS (
        SELECT 1 FROM re_723 
        WHERE cod_estado = d.cod_estado
        LIMIT 1
    ) AS existen_datos_estado,
    (
        SELECT COUNT(*) FROM re_723 
        WHERE cod_estado = d.cod_estado
        LIMIT 100
    ) AS muestra_datos_estado
FROM 
    dist d;

-- 7. Verificar si la tabla participantes existe y tiene la estructura correcta
SELECT 
    column_name, 
    data_type
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' AND 
    table_name = 'participantes'
ORDER BY 
    ordinal_position;

-- 8. Crear una función simple para probar la generación limitada de tiques
-- Esta función solo procesa el primer estado de la distribución y un máximo de 10 tiques
CREATE OR REPLACE FUNCTION test_generar_tiques_limitado(
    p_sorteo_id INTEGER
)
RETURNS TABLE(
    mensaje TEXT,
    registros_procesados INTEGER,
    estado TEXT,
    campo_nac TEXT,
    campo_cedula TEXT,
    campo_nombre TEXT,
    campo_apellido TEXT
) AS $$
DECLARE
    v_distribucion_record RECORD;
    v_participante_record RECORD;
    v_procesados INTEGER := 0;
    v_error TEXT;
BEGIN
    -- Obtener solo el primer estado de la distribución
    SELECT dt.*, e.nom_estado 
    INTO v_distribucion_record
    FROM distribucion_tiques dt
    JOIN estados e ON dt.cod_estado = e.cod_estado
    WHERE dt.sorteo_id = p_sorteo_id
    LIMIT 1;
    
    IF v_distribucion_record IS NULL THEN
        RETURN QUERY SELECT 'No se encontró distribución para el sorteo'::TEXT, 0::INTEGER, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT;
        RETURN;
    END IF;
    
    mensaje := 'Procesando estado: ' || v_distribucion_record.nom_estado;
    estado := v_distribucion_record.nom_estado;
    
    -- Procesar hasta 10 registros del primer estado
    BEGIN
        FOR v_participante_record IN 
            SELECT 
                nac,
                cedula_ch,
                p_nombre,
                p_apellido,
                cod_estado
            FROM 
                public.re_723
            WHERE 
                cod_estado = v_distribucion_record.cod_estado
            LIMIT 10
        LOOP
            v_procesados := v_procesados + 1;
            
            -- Devolver el primer registro completo como muestra
            IF v_procesados = 1 THEN
                campo_nac := v_participante_record.nac;
                campo_cedula := v_participante_record.cedula_ch;
                campo_nombre := v_participante_record.p_nombre;
                campo_apellido := v_participante_record.p_apellido;
                
                RETURN QUERY SELECT 
                    mensaje::TEXT, 
                    v_procesados::INTEGER, 
                    estado::TEXT,
                    campo_nac::TEXT,
                    campo_cedula::TEXT,
                    campo_nombre::TEXT,
                    campo_apellido::TEXT;
            END IF;
        END LOOP;
        
        -- Si no hubo registros procesados
        IF v_procesados = 0 THEN
            RETURN QUERY SELECT 'No se encontraron registros para el estado ' || v_distribucion_record.nom_estado::TEXT, 
                0::INTEGER, estado::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_error := SQLSTATE || ': ' || SQLERRM;
        RETURN QUERY SELECT 'Error procesando registros: ' || v_error::TEXT, 
            v_procesados::INTEGER, estado::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT;
    END;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar la función de prueba para el sorteo 28
SELECT * FROM test_generar_tiques_limitado(28);

-- 9. Limpiar la función de prueba
DROP FUNCTION IF EXISTS test_generar_tiques_limitado;

-- 10. Si se confirma que hay algún problema con los datos del sorteo 28,
-- crear una entrada en la tabla distribucion_tiques para el sorteo 27 (como copia de seguridad)
INSERT INTO distribucion_tiques (
    sorteo_id, cod_estado, rango_desde, rango_hasta, cantidad, porcentaje
)
SELECT 
    27 as sorteo_id, cod_estado, rango_desde, rango_hasta, cantidad, porcentaje
FROM 
    distribucion_tiques
WHERE 
    sorteo_id = 28
ON CONFLICT (id) DO NOTHING;

-- 11. Verificar que la copia se realizó correctamente
SELECT COUNT(*) FROM distribucion_tiques WHERE sorteo_id = 27; 