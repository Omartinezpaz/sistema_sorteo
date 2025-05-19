/**
 * Script para corregir errores en la función generar_tiques_desde_distribucion
 * 
 * Este script corrige el error de incompatibilidad de tipos en la función
 * generar_tiques_desde_distribucion que causa el mensaje:
 * "el operador no existe: character varying = integer"
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración de la conexión a la base de datos
const dbConfig = {
  user: 'omarte',
  host: 'localhost',
  database: 'sorteo_db',
  password: 'Ap3r1t1v02025',
  port: 5432,
};

// Cliente de base de datos
const client = new Client(dbConfig);

// Función para verificar si la función generar_tiques_desde_distribucion existe
async function verificarFuncionExiste() {
  try {
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_proc 
        WHERE proname = 'generar_tiques_desde_distribucion' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      ) as existe;
    `);
    
    return result.rows[0].existe;
  } catch (error) {
    console.error('Error al verificar si existe la función generar_tiques_desde_distribucion:', error);
    return false;
  }
}

// Función para obtener el cuerpo actual de la función
async function obtenerCuerpoFuncion() {
  try {
    const result = await client.query(`
      SELECT prosrc 
      FROM pg_proc 
      WHERE proname = 'generar_tiques_desde_distribucion' 
      AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    `);
    
    if (result.rows.length > 0) {
      return result.rows[0].prosrc;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error al obtener el cuerpo de la función:', error);
    return null;
  }
}

// Función para crear o actualizar la función con el código corregido
async function actualizarFuncion() {
  try {
    // Definición de la función corregida
    const funcionCorregida = `
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
                cod_estado::TEXT, -- Convertir explícitamente a TEXT
                cod_municipio::TEXT, -- Convertir explícitamente a TEXT
                cod_parroquia::TEXT, -- Convertir explícitamente a TEXT
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
                LPAD(v_participante_record.cod_estado, 2, '0') || '-' || 
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
    `;
    
    // Eliminar la función si existe
    await client.query(`DROP FUNCTION IF EXISTS public.generar_tiques_desde_distribucion(INTEGER, VARCHAR, VARCHAR, TIMESTAMP)`);
    
    // Crear la función con el código corregido
    await client.query(funcionCorregida);
    
    console.log('✅ Función generar_tiques_desde_distribucion actualizada correctamente');
    return true;
  } catch (error) {
    console.error('Error al actualizar la función:', error);
    return false;
  }
}

// Función principal
async function main() {
  console.log('Iniciando corrección de la función generar_tiques_desde_distribucion...');
  
  try {
    // Conectar a la base de datos
    console.log('Conectando a la base de datos...');
    await client.connect();
    console.log('Conexión establecida correctamente ✅');
    
    // Verificar si la función existe
    const funcionExiste = await verificarFuncionExiste();
    
    if (funcionExiste) {
      // Obtener el cuerpo actual de la función
      const cuerpoActual = await obtenerCuerpoFuncion();
      
      // Guardar el cuerpo actual en un archivo de respaldo
      if (cuerpoActual) {
        fs.writeFileSync('backup_funcion_tiques.sql', cuerpoActual);
        console.log('Respaldo de la función guardado en backup_funcion_tiques.sql');
      }
      
      // Actualizar la función
      const actualizado = await actualizarFuncion();
      
      if (actualizado) {
        console.log('\n🔄 Próximos pasos:');
        console.log('1. Ejecuta el script "crear_sorteos_faltantes.js" para asegurarte de que existen los sorteos necesarios');
        console.log('2. Luego, ejecuta "ejecutar_script.js" para configurar la distribución de tiques y generar los tiques');
      } else {
        console.log('❌ No se pudo actualizar la función. Revisa los errores e intenta de nuevo.');
      }
    } else {
      // Si la función no existe, crearla
      const creado = await actualizarFuncion();
      
      if (creado) {
        console.log('\n🔄 La función se ha creado correctamente. Próximos pasos:');
        console.log('1. Ejecuta el script "crear_sorteos_faltantes.js" para asegurarte de que existen los sorteos necesarios');
        console.log('2. Luego, ejecuta "ejecutar_script.js" para configurar la distribución de tiques y generar los tiques');
      } else {
        console.log('❌ No se pudo crear la función. Revisa los errores e intenta de nuevo.');
      }
    }
    
    // Cerrar la conexión a la base de datos
    await client.end();
    console.log('Conexión a la base de datos cerrada.');
  } catch (error) {
    console.error('Error durante la ejecución del script:', error);
    try {
      await client.end();
    } catch (err) {}
  }
}

// Ejecutar la función principal
main().catch(console.error); 