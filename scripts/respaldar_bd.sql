-- =============================================================
-- SCRIPT PARA RESPALDAR BASE DE DATOS - SORTEO PUEBLO VALIENTE
-- =============================================================
-- Este script genera vistas que contienen los datos para respaldo
-- y crea un archivo SQL que puede ser exportado desde pgAdmin

-- Crear esquema temporal para respaldos
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'respaldo') THEN
        CREATE SCHEMA respaldo;
    END IF;
END $$;

-- Función para generar timestamp
CREATE OR REPLACE FUNCTION respaldo.get_timestamp() RETURNS text AS $$
BEGIN
    RETURN to_char(current_timestamp, 'YYYYMMDD_HH24MISS');
END;
$$ LANGUAGE plpgsql;

-- Crear vistas de respaldo
DO $$
BEGIN
    -- Vista de respaldo de usuarios
    EXECUTE 'CREATE OR REPLACE VIEW respaldo.usuarios_' || respaldo.get_timestamp() || ' AS 
    SELECT * FROM usuarios';
    
    -- Vista de respaldo de sorteos
    EXECUTE 'CREATE OR REPLACE VIEW respaldo.sorteos_' || respaldo.get_timestamp() || ' AS 
    SELECT * FROM sorteos';
    
    -- Vista de respaldo de participantes
    EXECUTE 'CREATE OR REPLACE VIEW respaldo.participantes_' || respaldo.get_timestamp() || ' AS 
    SELECT * FROM participantes';
    
    -- Vista de respaldo de premios
    EXECUTE 'CREATE OR REPLACE VIEW respaldo.premios_' || respaldo.get_timestamp() || ' AS 
    SELECT * FROM premios';
    
    -- Vista de respaldo de ganadores
    EXECUTE 'CREATE OR REPLACE VIEW respaldo.ganadores_' || respaldo.get_timestamp() || ' AS 
    SELECT * FROM ganadores';
    
    -- Vista de respaldo completo (unión de todas las tablas relacionadas)
    EXECUTE 'CREATE OR REPLACE VIEW respaldo.completo_' || respaldo.get_timestamp() || ' AS 
    SELECT 
        s.id_sorteo,
        s.nombre AS nombre_sorteo,
        s.fecha_hora,
        s.tipo_sorteo,
        s.estado AS estado_sorteo,
        u.id_usuario,
        u.nombre AS nombre_usuario,
        u.apellido AS apellido_usuario,
        u.email,
        p.id_premio,
        p.nombre AS nombre_premio,
        p.categoria,
        p.ambito,
        p.estado AS estado_premio,
        g.id_ganador,
        g.numero_ticket,
        g.fecha_seleccion,
        g.certificado_generado,
        g.notificado,
        pa.id_participante,
        pa.nombre AS nombre_participante,
        pa.apellido AS apellido_participante,
        pa.documento_identidad,
        pa.email AS email_participante,
        pa.estado AS estado_participante
    FROM 
        sorteos s
        LEFT JOIN usuarios u ON s.creado_por = u.id_usuario
        LEFT JOIN premios p ON p.id_sorteo = s.id_sorteo
        LEFT JOIN ganadores g ON g.id_sorteo = s.id_sorteo AND g.id_premio = p.id_premio
        LEFT JOIN participantes pa ON g.id_participante = pa.id_participante';
END $$;

-- Generar script para reconstruir los datos
DO $$
DECLARE
    backup_timestamp TEXT;
    backup_file TEXT;
BEGIN
    backup_timestamp := respaldo.get_timestamp();
    backup_file := 'respaldo_sorteo_' || backup_timestamp || '.sql';
    
    -- Instructivo para exportar respaldo
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'INSTRUCCIONES PARA COMPLETAR EL RESPALDO:';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Se han creado vistas de respaldo en el esquema "respaldo"';
    RAISE NOTICE 'Para completar el respaldo, siga estos pasos:';
    RAISE NOTICE '1. En pgAdmin, vaya a Tools -> Backup...';
    RAISE NOTICE '2. Seleccione la base de datos "sorteo_db"';
    RAISE NOTICE '3. En Format, seleccione "Plain"';
    RAISE NOTICE '4. En Filename, escriba "%", backup_file;
    RAISE NOTICE '5. En Sections, seleccione solo "Pre-data" y "Data"';
    RAISE NOTICE '6. En Queries, marque "Use Column Inserts" y "Use Insert Commands"';
    RAISE NOTICE '7. Haga clic en "Backup" para generar el archivo';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'También puede usar este comando desde línea de comandos:';
    RAISE NOTICE 'pg_dump -U [usuario] -d sorteo_db -F p --column-inserts --inserts --section=pre-data --section=data > %', backup_file;
    RAISE NOTICE '============================================================';
    
    -- Mostrar vistas de respaldo creadas
    RAISE NOTICE 'Vistas de respaldo creadas:';
    RAISE NOTICE '- respaldo.usuarios_%', backup_timestamp;
    RAISE NOTICE '- respaldo.sorteos_%', backup_timestamp;
    RAISE NOTICE '- respaldo.participantes_%', backup_timestamp;
    RAISE NOTICE '- respaldo.premios_%', backup_timestamp;
    RAISE NOTICE '- respaldo.ganadores_%', backup_timestamp;
    RAISE NOTICE '- respaldo.completo_%', backup_timestamp;
END $$;

-- Mostrar información de respaldo
SELECT 
    schemaname || '.' || viewname AS vista_respaldo,
    'SELECT * FROM ' || schemaname || '.' || viewname || ';' AS comando_consulta
FROM 
    pg_views
WHERE 
    schemaname = 'respaldo'
ORDER BY 
    viewname; 