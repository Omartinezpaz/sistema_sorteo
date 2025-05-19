-- =============================================================
-- SCRIPT PARA CARGAR DATOS DE PRUEBA - SORTEO PUEBLO VALIENTE
-- =============================================================
-- Este script carga datos de prueba en la base de datos para poder
-- realizar pruebas del sistema. Ejecutar después de adecuar_bd_pgadmin.sql

-- Verificación previa
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM usuarios) > 10 OR
       (SELECT COUNT(*) FROM sorteos) > 5 OR
       (SELECT COUNT(*) FROM participantes) > 50 THEN
        RAISE EXCEPTION 'La base de datos ya parece contener datos. Por seguridad, este script no se ejecutará. Si desea cargar datos de prueba, primero limpie las tablas o confirme manualmente este script.';
    END IF;
END $$;

-- Iniciar transacción
BEGIN;

-- Ajustar secuencias y limpiar datos existentes si hay pocos
TRUNCATE TABLE ganadores CASCADE;
TRUNCATE TABLE premios CASCADE;
TRUNCATE TABLE participantes CASCADE;
TRUNCATE TABLE sorteos CASCADE;
TRUNCATE TABLE usuarios CASCADE;

-- Reiniciar secuencias
ALTER SEQUENCE usuarios_id_usuario_seq RESTART WITH 1;
ALTER SEQUENCE sorteos_id_sorteo_seq RESTART WITH 1;
ALTER SEQUENCE participantes_id_participante_seq RESTART WITH 1;
ALTER SEQUENCE premios_id_premio_seq RESTART WITH 1;
ALTER SEQUENCE ganadores_id_ganador_seq RESTART WITH 1;

-- Insertar usuarios
INSERT INTO usuarios (nombre, apellido, email, password, rol, fecha_creacion, ultimo_acceso, activo)
VALUES 
    ('Admin', 'Sistema', 'admin@sorteo.com', '$2a$10$1qAz2wSx3eDc4rFv5tGb5ekACxA/eu2yXUCQhPJXJ9jf3e1D9Jqw2', 'administrador', NOW(), NOW(), TRUE),
    ('Operador', 'Principal', 'operador@sorteo.com', '$2a$10$1qAz2wSx3eDc4rFv5tGb5ekACxA/eu2yXUCQhPJXJ9jf3e1D9Jqw2', 'operador', NOW(), NOW(), TRUE),
    ('Usuario', 'Consulta', 'consulta@sorteo.com', '$2a$10$1qAz2wSx3eDc4rFv5tGb5ekACxA/eu2yXUCQhPJXJ9jf3e1D9Jqw2', 'consulta', NOW(), NOW(), TRUE);

-- Insertar sorteos
INSERT INTO sorteos (nombre, descripcion, fecha_hora, tipo_sorteo, estado, creado_por, fecha_creacion, fecha_modificacion)
VALUES 
    ('Sorteo Nacional Aniversario', 'Gran sorteo por el aniversario de la República', NOW() + INTERVAL '30 days', 'nacional', 'pendiente', 1, NOW(), NULL),
    ('Sorteo Regional Zulia', 'Sorteo regional para el estado Zulia', NOW() + INTERVAL '15 days', 'regional', 'pendiente', 1, NOW(), NULL),
    ('Sorteo Nacional Navidad', 'Sorteo especial de Navidad', '2025-12-20 18:00:00', 'nacional', 'pendiente', 1, NOW(), NULL),
    ('Sorteo Piloto', 'Sorteo piloto para pruebas', NOW() - INTERVAL '30 days', 'nacional', 'finalizado', 1, NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days');

-- Definir estados para los participantes
DO $$
DECLARE
    estados TEXT[] := ARRAY[
        'Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas',
        'Bolívar', 'Carabobo', 'Cojedes', 'Delta Amacuro', 'Distrito Capital',
        'Falcón', 'Guárico', 'Lara', 'Mérida', 'Miranda',
        'Monagas', 'Nueva Esparta', 'Portuguesa', 'Sucre', 'Táchira',
        'Trujillo', 'Vargas', 'Yaracuy', 'Zulia'
    ];
    estado TEXT;
    i INTEGER;
    participante_id INTEGER;
BEGIN
    -- Crear participantes de ejemplo (5 por estado)
    FOREACH estado IN ARRAY estados
    LOOP
        FOR i IN 1..5 LOOP
            INSERT INTO participantes (
                nombre, 
                apellido, 
                documento_identidad, 
                email, 
                telefono, 
                estado,
                municipio,
                parroquia,
                direccion,
                fecha_registro
            )
            VALUES (
                'Nombre ' || estado || ' ' || i, 
                'Apellido ' || i,
                'V' || (10000000 + ascii(estado) * 100 + i), 
                'participante_' || lower(regexp_replace(estado, '[^a-zA-Z0-9]', '', 'g')) || i || '@example.com',
                '0412' || (1000000 + ascii(estado) * 100 + i),
                estado,
                'Municipio ' || i,
                'Parroquia ' || i,
                'Dirección ' || i || ', ' || estado,
                NOW() - (random() * INTERVAL '60 days')
            )
            RETURNING id_participante INTO participante_id;
        END LOOP;
    END LOOP;

    -- Crear premios para cada sorteo
    -- Sorteo Nacional Aniversario (ID 1)
    INSERT INTO premios (id_sorteo, nombre, descripcion, categoria, orden, imagen_url, ambito, estado, fecha_creacion)
    VALUES 
        (1, 'Automóvil 0 Km', 'Automóvil sedán último modelo', 'Principal', 1, 'auto.jpg', 'nacional', NULL, NOW()),
        (1, 'Motocicleta', 'Motocicleta 150cc', 'Secundario', 2, 'moto.jpg', 'nacional', NULL, NOW()),
        (1, 'Televisor Smart', 'Televisor LED Smart 55"', 'Terciario', 3, 'tv.jpg', 'nacional', NULL, NOW()),
        (1, 'Tablet', 'Tablet de última generación', 'Adicional', 4, 'tablet.jpg', 'nacional', NULL, NOW()),
        (1, 'Smartphone', 'Teléfono inteligente', 'Adicional', 5, 'smartphone.jpg', 'nacional', NULL, NOW());
    
    -- Sorteo Regional Zulia (ID 2)
    INSERT INTO premios (id_sorteo, nombre, descripcion, categoria, orden, imagen_url, ambito, estado, fecha_creacion)
    VALUES 
        (2, 'Refrigerador', 'Refrigerador de 18 pies', 'Principal', 1, 'refrigerador.jpg', 'regional', 'Zulia', NOW()),
        (2, 'Lavadora', 'Lavadora automática', 'Secundario', 2, 'lavadora.jpg', 'regional', 'Zulia', NOW()),
        (2, 'Microondas', 'Horno microondas digital', 'Terciario', 3, 'microondas.jpg', 'regional', 'Zulia', NOW());
    
    -- Sorteo Nacional Navidad (ID 3)
    INSERT INTO premios (id_sorteo, nombre, descripcion, categoria, orden, imagen_url, ambito, estado, fecha_creacion)
    VALUES 
        (3, 'Casa', 'Casa completamente amoblada', 'Principal', 1, 'casa.jpg', 'nacional', NULL, NOW()),
        (3, 'Viaje', 'Viaje todo incluido para 2 personas', 'Secundario', 2, 'viaje.jpg', 'nacional', NULL, NOW()),
        (3, 'Computadora', 'Laptop de última generación', 'Terciario', 3, 'laptop.jpg', 'nacional', NULL, NOW()),
        (3, 'Bono Navideño', 'Bono en efectivo', 'Adicional', 4, 'bono.jpg', 'nacional', NULL, NOW());
        
    -- Sorteo Piloto (ID 4, ya finalizado)
    INSERT INTO premios (id_sorteo, nombre, descripcion, categoria, orden, imagen_url, ambito, estado, fecha_creacion)
    VALUES 
        (4, 'Electrodoméstico', 'Set de electrodomésticos', 'Principal', 1, 'electro.jpg', 'nacional', NULL, NOW() - INTERVAL '60 days'),
        (4, 'Bono', 'Bono en efectivo', 'Secundario', 2, 'bono.jpg', 'nacional', NULL, NOW() - INTERVAL '60 days');
        
    -- Asignar ganadores para el sorteo piloto (el único finalizado)
    -- Ganador del premio principal
    INSERT INTO ganadores (id_sorteo, id_participante, id_premio, numero_ticket, fecha_seleccion, certificado_generado, notificado, fecha_notificacion)
    VALUES 
        (4, (SELECT id_participante FROM participantes WHERE estado = 'Miranda' LIMIT 1), 11, 'MIR-001-2025', NOW() - INTERVAL '30 days', TRUE, TRUE, NOW() - INTERVAL '29 days'));
        
    -- Ganador del premio secundario
    INSERT INTO ganadores (id_sorteo, id_participante, id_premio, numero_ticket, fecha_seleccion, certificado_generado, notificado, fecha_notificacion)
    VALUES 
        (4, (SELECT id_participante FROM participantes WHERE estado = 'Zulia' LIMIT 1), 12, 'ZUL-002-2025', NOW() - INTERVAL '30 days', TRUE, TRUE, NOW() - INTERVAL '29 days'));
END $$;

-- Confirmar transacción
COMMIT;

-- Mostrar resumen de datos cargados
SELECT 'Usuarios cargados' AS tipo, COUNT(*) AS cantidad FROM usuarios
UNION ALL
SELECT 'Sorteos cargados', COUNT(*) FROM sorteos
UNION ALL
SELECT 'Participantes cargados', COUNT(*) FROM participantes
UNION ALL
SELECT 'Premios cargados', COUNT(*) FROM premios
UNION ALL
SELECT 'Ganadores cargados', COUNT(*) FROM ganadores;

-- Mostrar distribución de participantes por estado
SELECT estado, COUNT(*) AS participantes
FROM participantes
GROUP BY estado
ORDER BY COUNT(*) DESC; 