-- =============================================================
-- SCRIPT PARA VERIFICAR INTEGRIDAD DE DATOS - SORTEO PUEBLO VALIENTE
-- =============================================================
-- Este script realiza verificaciones de integridad en la base de datos

-- Crear función temporal para formatear resultados
CREATE OR REPLACE FUNCTION temp_format_result(test_name text, result boolean, details text DEFAULT NULL) 
RETURNS TABLE(prueba text, estado text, detalles text) AS $$
BEGIN
    RETURN QUERY SELECT 
        test_name, 
        CASE WHEN result THEN 'CORRECTO ✓' ELSE 'ERROR ✗' END,
        details;
END;
$$ LANGUAGE plpgsql;

-- Iniciar verificaciones
SELECT '==== VERIFICACIÓN DE INTEGRIDAD DE DATOS - SORTEO PUEBLO VALIENTE ====' AS mensaje;
SELECT now()::timestamp(0) AS fecha_verificacion;
SELECT '';

-- 1. Verificar presencia de tablas principales
SELECT * FROM temp_format_result(
    'Presencia de tablas principales',
    (SELECT COUNT(*) = 5 FROM information_schema.tables 
     WHERE table_schema = 'public' 
     AND table_name IN ('usuarios', 'sorteos', 'participantes', 'premios', 'ganadores')),
    'Tablas verificadas: usuarios, sorteos, participantes, premios, ganadores'
);

-- 2. Verificar integridad referencial de sorteos
SELECT * FROM temp_format_result(
    'Integridad referencial de sorteos',
    NOT EXISTS (
        SELECT 1 FROM sorteos s 
        LEFT JOIN usuarios u ON s.creado_por = u.id_usuario 
        WHERE u.id_usuario IS NULL
    ),
    'Todos los sorteos tienen un usuario creador válido'
);

-- 3. Verificar integridad referencial de premios
SELECT * FROM temp_format_result(
    'Integridad referencial de premios',
    NOT EXISTS (
        SELECT 1 FROM premios p 
        LEFT JOIN sorteos s ON p.id_sorteo = s.id_sorteo 
        WHERE s.id_sorteo IS NULL
    ),
    'Todos los premios pertenecen a un sorteo válido'
);

-- 4. Verificar integridad referencial de ganadores
SELECT * FROM temp_format_result(
    'Integridad referencial de ganadores (sorteos)',
    NOT EXISTS (
        SELECT 1 FROM ganadores g 
        LEFT JOIN sorteos s ON g.id_sorteo = s.id_sorteo 
        WHERE s.id_sorteo IS NULL
    ),
    'Todos los ganadores pertenecen a un sorteo válido'
);

SELECT * FROM temp_format_result(
    'Integridad referencial de ganadores (participantes)',
    NOT EXISTS (
        SELECT 1 FROM ganadores g 
        LEFT JOIN participantes p ON g.id_participante = p.id_participante 
        WHERE p.id_participante IS NULL
    ),
    'Todos los ganadores tienen un participante válido'
);

SELECT * FROM temp_format_result(
    'Integridad referencial de ganadores (premios)',
    NOT EXISTS (
        SELECT 1 FROM ganadores g 
        LEFT JOIN premios p ON g.id_premio = p.id_premio 
        WHERE p.id_premio IS NULL
    ),
    'Todos los ganadores tienen un premio válido'
);

-- 5. Verificar unicidad de premios asignados
SELECT * FROM temp_format_result(
    'Unicidad de premios asignados',
    NOT EXISTS (
        SELECT id_sorteo, id_premio, COUNT(*) 
        FROM ganadores 
        GROUP BY id_sorteo, id_premio 
        HAVING COUNT(*) > 1
    ),
    'Cada premio está asignado como máximo a un ganador por sorteo'
);

-- 6. Verificar coherencia en estados de sorteos
SELECT * FROM temp_format_result(
    'Coherencia de estados de sorteos',
    NOT EXISTS (
        SELECT 1 FROM sorteos s
        LEFT JOIN ganadores g ON s.id_sorteo = g.id_sorteo
        WHERE s.estado = 'finalizado' AND g.id_ganador IS NULL
    ),
    'Todos los sorteos finalizados tienen al menos un ganador'
);

-- 7. Verificar datos requeridos en participantes
SELECT * FROM temp_format_result(
    'Datos requeridos en participantes',
    NOT EXISTS (
        SELECT 1 FROM participantes
        WHERE nombre IS NULL OR nombre = ''
        OR apellido IS NULL OR apellido = ''
        OR documento_identidad IS NULL OR documento_identidad = ''
        OR estado IS NULL OR estado = ''
    ),
    'Todos los participantes tienen nombre, apellido, documento y estado'
);

-- 8. Verificar valores duplicados en participantes
WITH duplicados AS (
    SELECT documento_identidad, COUNT(*) as total
    FROM participantes
    GROUP BY documento_identidad
    HAVING COUNT(*) > 1
)
SELECT * FROM temp_format_result(
    'Unicidad de documentos de identidad',
    (SELECT COUNT(*) = 0 FROM duplicados),
    CASE 
        WHEN (SELECT COUNT(*) = 0 FROM duplicados) THEN 'No hay documentos de identidad duplicados'
        ELSE 'Hay ' || (SELECT COUNT(*) FROM duplicados) || ' documentos de identidad duplicados'
    END
);

-- 9. Verificar fechas coherentes en sorteos
SELECT * FROM temp_format_result(
    'Coherencia de fechas en sorteos',
    NOT EXISTS (
        SELECT 1 FROM sorteos
        WHERE fecha_creacion > fecha_hora
        OR (fecha_modificacion IS NOT NULL AND fecha_modificacion > fecha_hora)
    ),
    'Las fechas de creación y modificación son anteriores a la fecha del sorteo'
);

-- 10. Verificar fechas coherentes en ganadores
SELECT * FROM temp_format_result(
    'Coherencia de fechas en ganadores',
    NOT EXISTS (
        SELECT 1 FROM ganadores g
        JOIN sorteos s ON g.id_sorteo = s.id_sorteo
        WHERE g.fecha_seleccion < s.fecha_creacion
        OR (g.fecha_notificacion IS NOT NULL AND g.fecha_notificacion < g.fecha_seleccion)
    ),
    'Las fechas de selección y notificación son coherentes'
);

-- 11. Estadísticas generales
SELECT '';
SELECT '==== ESTADÍSTICAS GENERALES ====' AS mensaje;

SELECT 'Total de usuarios' AS concepto, COUNT(*) AS cantidad FROM usuarios
UNION ALL
SELECT 'Total de sorteos', COUNT(*) FROM sorteos
UNION ALL
SELECT 'Sorteos pendientes', COUNT(*) FROM sorteos WHERE estado = 'pendiente'
UNION ALL
SELECT 'Sorteos finalizados', COUNT(*) FROM sorteos WHERE estado = 'finalizado'
UNION ALL
SELECT 'Total de participantes', COUNT(*) FROM participantes
UNION ALL
SELECT 'Total de premios', COUNT(*) FROM premios
UNION ALL
SELECT 'Total de ganadores', COUNT(*) FROM ganadores;

-- 12. Verificar si existen sorteos pendientes en el pasado
WITH sorteos_pasados AS (
    SELECT id_sorteo, nombre, fecha_hora
    FROM sorteos
    WHERE estado = 'pendiente' AND fecha_hora < CURRENT_TIMESTAMP
)
SELECT '';
SELECT '==== ADVERTENCIAS ====' AS mensaje;
SELECT CASE 
    WHEN (SELECT COUNT(*) = 0 FROM sorteos_pasados) 
    THEN 'No hay sorteos pendientes en el pasado'
    ELSE 'ATENCIÓN: Hay ' || (SELECT COUNT(*) FROM sorteos_pasados) || ' sorteos pendientes con fecha en el pasado'
END AS advertencia;

-- Mostrar sorteos pendientes en el pasado si existen
SELECT id_sorteo, nombre, fecha_hora
FROM sorteos
WHERE estado = 'pendiente' AND fecha_hora < CURRENT_TIMESTAMP;

-- Limpiar función temporal
DROP FUNCTION IF EXISTS temp_format_result(text, boolean, text);