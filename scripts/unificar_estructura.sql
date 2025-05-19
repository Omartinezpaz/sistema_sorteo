-- ============================================================
-- SCRIPT DE UNIFICACIÓN DE ESTRUCTURA - SORTEO PUEBLO VALIENTE
-- ============================================================
-- Este script identifica las diferencias entre los esquemas y aplica cambios
-- para unificar la estructura sin afectar a los datos existentes

-- Iniciar transacción
BEGIN;

-- 1. Unificar nombres de columnas ID en tabla ganadores
DO $$
BEGIN
    -- Verificar si la columna sorteo_id tiene un nombre diferente en algún script
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ganadores'
        AND column_name = 'id_sorteo'
    ) AND NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ganadores'
        AND column_name = 'sorteo_id'
    ) THEN
        EXECUTE 'ALTER TABLE ganadores RENAME COLUMN id_sorteo TO sorteo_id;';
        RAISE NOTICE 'Columna id_sorteo renombrada a sorteo_id en tabla ganadores';
    END IF;
    
    -- Verificar si la columna participante_id tiene un nombre diferente
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ganadores'
        AND column_name = 'id_participante'
    ) AND NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ganadores'
        AND column_name = 'participante_id'
    ) THEN
        EXECUTE 'ALTER TABLE ganadores RENAME COLUMN id_participante TO participante_id;';
        RAISE NOTICE 'Columna id_participante renombrada a participante_id en tabla ganadores';
    END IF;
    
    -- Verificar si la columna premio_id tiene un nombre diferente
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ganadores'
        AND column_name = 'id_premio'
    ) AND NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ganadores'
        AND column_name = 'premio_id'
    ) THEN
        EXECUTE 'ALTER TABLE ganadores RENAME COLUMN id_premio TO premio_id;';
        RAISE NOTICE 'Columna id_premio renombrada a premio_id en tabla ganadores';
    END IF;
END $$;

-- 2. Agregar campos que faltan en tabla premios
DO $$
BEGIN
    -- Verificar si falta la columna valor
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'premios'
        AND column_name = 'valor'
    ) THEN
        EXECUTE 'ALTER TABLE premios ADD COLUMN valor NUMERIC(10,2);';
        RAISE NOTICE 'Columna valor agregada a tabla premios';
    END IF;
    
    -- Verificar si falta la columna ambito
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'premios'
        AND column_name = 'ambito'
    ) THEN
        EXECUTE 'ALTER TABLE premios ADD COLUMN ambito VARCHAR(50);';
        RAISE NOTICE 'Columna ambito agregada a tabla premios';
    END IF;
    
    -- Verificar si falta la columna estado
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'premios'
        AND column_name = 'estado'
    ) THEN
        EXECUTE 'ALTER TABLE premios ADD COLUMN estado VARCHAR(50);';
        RAISE NOTICE 'Columna estado agregada a tabla premios';
    END IF;
    
    -- Verificar si falta la columna fecha_creacion
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'premios'
        AND column_name = 'fecha_creacion'
    ) THEN
        EXECUTE 'ALTER TABLE premios ADD COLUMN fecha_creacion TIMESTAMP DEFAULT NOW();';
        RAISE NOTICE 'Columna fecha_creacion agregada a tabla premios';
    END IF;
END $$;

-- 3. Agregar campos que faltan en tabla ganadores
DO $$
BEGIN
    -- Verificar si falta la columna numero_ticket
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ganadores'
        AND column_name = 'numero_ticket'
    ) THEN
        EXECUTE 'ALTER TABLE ganadores ADD COLUMN numero_ticket VARCHAR(50);';
        RAISE NOTICE 'Columna numero_ticket agregada a tabla ganadores';
    END IF;
    
    -- Verificar si falta la columna certificado_generado
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ganadores'
        AND column_name = 'certificado_generado'
    ) THEN
        EXECUTE 'ALTER TABLE ganadores ADD COLUMN certificado_generado BOOLEAN DEFAULT FALSE;';
        RAISE NOTICE 'Columna certificado_generado agregada a tabla ganadores';
    END IF;
    
    -- Verificar si falta la columna notificado
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ganadores'
        AND column_name = 'notificado'
    ) THEN
        EXECUTE 'ALTER TABLE ganadores ADD COLUMN notificado BOOLEAN DEFAULT FALSE;';
        RAISE NOTICE 'Columna notificado agregada a tabla ganadores';
    END IF;
    
    -- Verificar si falta la columna fecha_notificacion
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ganadores'
        AND column_name = 'fecha_notificacion'
    ) THEN
        EXECUTE 'ALTER TABLE ganadores ADD COLUMN fecha_notificacion TIMESTAMP;';
        RAISE NOTICE 'Columna fecha_notificacion agregada a tabla ganadores';
    END IF;
END $$;

-- 4. Unificar nombres de tablas y columnas en participantes
DO $$
BEGIN
    -- Verificar si la columna nombre_completo existe y nombre no
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'participantes'
        AND column_name = 'nombre_completo'
    ) AND NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'participantes'
        AND column_name = 'nombre'
    ) THEN
        EXECUTE 'ALTER TABLE participantes RENAME COLUMN nombre_completo TO nombre;';
        RAISE NOTICE 'Columna nombre_completo renombrada a nombre en tabla participantes';
    END IF;
    
    -- Verificar si falta la columna apellido
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'participantes'
        AND column_name = 'apellido'
    ) AND EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'participantes'
        AND column_name = 'nombre'
    ) THEN
        EXECUTE 'ALTER TABLE participantes ADD COLUMN apellido VARCHAR(100);';
        RAISE NOTICE 'Columna apellido agregada a tabla participantes';
    END IF;
    
    -- Verificar si falta la columna documento_identidad
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'participantes'
        AND column_name = 'documento_identidad'
    ) THEN
        EXECUTE 'ALTER TABLE participantes ADD COLUMN documento_identidad VARCHAR(20);';
        RAISE NOTICE 'Columna documento_identidad agregada a tabla participantes';
    END IF;
    
    -- Verificar si falta la columna estado en participantes (para reflejar estructura de recrear_tablas.sql)
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'participantes'
        AND column_name = 'estado'
    ) THEN
        EXECUTE 'ALTER TABLE participantes ADD COLUMN estado VARCHAR(50);';
        RAISE NOTICE 'Columna estado agregada a tabla participantes';
    END IF;
    
    -- Verificar si falta la columna municipio en participantes
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'participantes'
        AND column_name = 'municipio'
    ) THEN
        EXECUTE 'ALTER TABLE participantes ADD COLUMN municipio VARCHAR(100);';
        RAISE NOTICE 'Columna municipio agregada a tabla participantes';
    END IF;
    
    -- Verificar si falta la columna parroquia en participantes
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'participantes'
        AND column_name = 'parroquia'
    ) THEN
        EXECUTE 'ALTER TABLE participantes ADD COLUMN parroquia VARCHAR(100);';
        RAISE NOTICE 'Columna parroquia agregada a tabla participantes';
    END IF;
    
    -- Verificar si falta la columna direccion en participantes
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'participantes'
        AND column_name = 'direccion'
    ) THEN
        EXECUTE 'ALTER TABLE participantes ADD COLUMN direccion TEXT;';
        RAISE NOTICE 'Columna direccion agregada a tabla participantes';
    END IF;
END $$;

-- 5. Verificar y crear vistas de recrear_tablas.sql si faltan
DO $$
BEGIN
    -- Verificar si existe la vista vw_participacion_region en el formato de recrear_tablas.sql
    IF NOT EXISTS (
        SELECT FROM pg_views 
        WHERE viewname = 'vw_participacion_region'
    ) THEN
        EXECUTE 'CREATE OR REPLACE VIEW vw_participacion_region AS
            SELECT 
                p.estado, 
                COUNT(p.id) as total_participantes,
                COUNT(g.id) as total_ganadores
            FROM 
                participantes p
                LEFT JOIN ganadores g ON g.participante_id = p.id
            GROUP BY 
                p.estado
            ORDER BY 
                p.estado';
        RAISE NOTICE 'Vista vw_participacion_region creada';
    END IF;
    
    -- Verificar si existe la vista vw_sorteos_stats de recrear_tablas.sql
    IF NOT EXISTS (
        SELECT FROM pg_views 
        WHERE viewname = 'vw_sorteos_stats'
    ) THEN
        EXECUTE 'CREATE OR REPLACE VIEW vw_sorteos_stats AS
            SELECT 
                s.id,
                s.nombre,
                s.fecha_sorteo,
                s.estado,
                COUNT(DISTINCT p.id) as total_premios,
                COUNT(DISTINCT g.id) as total_ganadores,
                COUNT(DISTINCT pa.id) as total_participantes
            FROM 
                sorteos s
                LEFT JOIN premios p ON p.sorteo_id = s.id
                LEFT JOIN ganadores g ON g.sorteo_id = s.id
                LEFT JOIN participantes pa ON pa.id IN (
                    SELECT participante_id FROM ganadores WHERE sorteo_id = s.id
                )
            GROUP BY 
                s.id, s.nombre, s.fecha_sorteo, s.estado
            ORDER BY 
                s.fecha_sorteo DESC';
        RAISE NOTICE 'Vista vw_sorteos_stats creada';
    END IF;
END $$;

-- 6. Unificar nombres de columnas en usuarios
DO $$
BEGIN
    -- Verificar si la tabla usuarios tiene nombre pero no nombre_completo
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios'
        AND column_name = 'nombre'
    ) AND NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios'
        AND column_name = 'nombre_completo'
    ) THEN
        EXECUTE 'ALTER TABLE usuarios RENAME COLUMN nombre TO nombre_completo;';
        RAISE NOTICE 'Columna nombre renombrada a nombre_completo en tabla usuarios';
    END IF;
    
    -- Verificar si la tabla usuarios tiene apellido pero initial.sql usa nombre_completo
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios'
        AND column_name = 'apellido'
    ) THEN
        RAISE NOTICE 'La columna apellido existe en usuarios pero initial.sql usa nombre_completo. Considere migrar los datos.';
    END IF;
    
    -- Verificar si la tabla usuarios tiene password pero no password_hash
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios'
        AND column_name = 'password'
    ) AND NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios'
        AND column_name = 'password_hash'
    ) THEN
        EXECUTE 'ALTER TABLE usuarios RENAME COLUMN password TO password_hash;';
        RAISE NOTICE 'Columna password renombrada a password_hash en tabla usuarios';
    END IF;
END $$;

-- 7. Verificar índices necesarios
DO $$
BEGIN
    -- Índice para participantes.documento_identidad
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'participantes' 
        AND indexname = 'idx_participantes_documento'
    ) THEN
        CREATE INDEX idx_participantes_documento ON participantes(documento_identidad);
        RAISE NOTICE 'Índice idx_participantes_documento creado';
    END IF;
    
    -- Índice para participantes.estado
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'participantes' 
        AND indexname = 'idx_participantes_estado'
    ) THEN
        CREATE INDEX idx_participantes_estado ON participantes(estado);
        RAISE NOTICE 'Índice idx_participantes_estado creado';
    END IF;
END $$;

-- 8. Verificar consistencia en nombres de tabla sorteos
DO $$
BEGIN
    -- Verificar si sorteos tiene fecha_hora pero no fecha_sorteo
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sorteos'
        AND column_name = 'fecha_hora'
    ) AND NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sorteos'
        AND column_name = 'fecha_sorteo'
    ) THEN
        EXECUTE 'ALTER TABLE sorteos RENAME COLUMN fecha_hora TO fecha_sorteo;';
        RAISE NOTICE 'Columna fecha_hora renombrada a fecha_sorteo en tabla sorteos';
    END IF;
    
    -- Verificar si sorteos tiene fecha_creacion pero no fecha_creacion
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sorteos'
        AND column_name = 'fecha_modificacion'
    ) AND NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sorteos'
        AND column_name = 'updated_at'
    ) THEN
        EXECUTE 'ALTER TABLE sorteos RENAME COLUMN fecha_modificacion TO updated_at;';
        RAISE NOTICE 'Columna fecha_modificacion renombrada a updated_at en tabla sorteos';
    END IF;
END $$;

-- 9. Verificar que las vistas funcionan correctamente
DO $$
BEGIN
    -- Verificar que las vistas compilan sin errores
    BEGIN
        EXECUTE 'SELECT * FROM vw_participacion_region LIMIT 0';
        RAISE NOTICE 'Vista vw_participacion_region funciona correctamente';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error en vista vw_participacion_region: %', SQLERRM;
    END;
    
    BEGIN
        EXECUTE 'SELECT * FROM vw_sorteos_stats LIMIT 0';
        RAISE NOTICE 'Vista vw_sorteos_stats funciona correctamente';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error en vista vw_sorteos_stats: %', SQLERRM;
    END;
    
    BEGIN
        EXECUTE 'SELECT * FROM vw_detalle_ganadores LIMIT 0';
        RAISE NOTICE 'Vista vw_detalle_ganadores funciona correctamente';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error en vista vw_detalle_ganadores: %', SQLERRM;
    END;
    
    BEGIN
        EXECUTE 'SELECT * FROM vw_resumen_sorteos LIMIT 0';
        RAISE NOTICE 'Vista vw_resumen_sorteos funciona correctamente';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error en vista vw_resumen_sorteos: %', SQLERRM;
    END;
END $$;

-- Confirmar los cambios
COMMIT;

-- Mostrar resumen del estado actual
SELECT 'Unificación completa. Revisar mensajes para detalles de cambios realizados.' AS resumen;

-- Para diagnosticar problemas persistentes, ejecutar:
-- SELECT table_name, column_name, data_type, character_maximum_length
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
-- AND table_name IN ('sorteos', 'participantes', 'premios', 'ganadores', 'usuarios')
-- ORDER BY table_name, ordinal_position; 