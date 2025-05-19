-- ============================================================
-- SCRIPT DE ADECUACIÓN DE BASE DE DATOS PARA SORTEO PUEBLO VALIENTE
-- Para ejecutar desde pgAdmin
-- ============================================================

-- Crear funciones auxiliares (se eliminarán al final)
CREATE OR REPLACE FUNCTION column_exists(tab text, col text) RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = tab 
        AND column_name = col
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION table_exists(tab text) RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = tab
    );
END;
$$ LANGUAGE plpgsql;

-- Crear esquema de la base de datos
DO $$
DECLARE
    tabla_creada boolean := false;
BEGIN
    -- Tabla de usuarios
    IF NOT table_exists('usuarios') THEN
        CREATE TABLE usuarios (
            id_usuario SERIAL PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            apellido VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE,
            password VARCHAR(100) NOT NULL,
            rol VARCHAR(50) NOT NULL,
            fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
            ultimo_acceso TIMESTAMPTZ,
            activo BOOLEAN NOT NULL DEFAULT TRUE
        );
        RAISE NOTICE 'Tabla usuarios creada';
        tabla_creada := true;
    ELSE
        RAISE NOTICE 'Tabla usuarios ya existe';
        
        -- Verificar y añadir columnas faltantes
        IF NOT column_exists('usuarios', 'nombre') THEN
            ALTER TABLE usuarios ADD COLUMN nombre VARCHAR(100) NOT NULL DEFAULT 'Pendiente';
            RAISE NOTICE 'Columna nombre añadida a usuarios';
        END IF;
        
        IF NOT column_exists('usuarios', 'apellido') THEN
            ALTER TABLE usuarios ADD COLUMN apellido VARCHAR(100) NOT NULL DEFAULT 'Pendiente';
            RAISE NOTICE 'Columna apellido añadida a usuarios';
        END IF;
        
        IF NOT column_exists('usuarios', 'email') THEN
            ALTER TABLE usuarios ADD COLUMN email VARCHAR(100) NOT NULL DEFAULT 'pendiente@example.com';
            RAISE NOTICE 'Columna email añadida a usuarios';
        END IF;
        
        IF NOT column_exists('usuarios', 'password') THEN
            ALTER TABLE usuarios ADD COLUMN password VARCHAR(100) NOT NULL DEFAULT 'cambiar123';
            RAISE NOTICE 'Columna password añadida a usuarios';
        END IF;
        
        IF NOT column_exists('usuarios', 'rol') THEN
            ALTER TABLE usuarios ADD COLUMN rol VARCHAR(50) NOT NULL DEFAULT 'usuario';
            RAISE NOTICE 'Columna rol añadida a usuarios';
        END IF;
        
        IF NOT column_exists('usuarios', 'fecha_creacion') THEN
            ALTER TABLE usuarios ADD COLUMN fecha_creacion TIMESTAMPTZ DEFAULT NOW();
            RAISE NOTICE 'Columna fecha_creacion añadida a usuarios';
        END IF;
        
        IF NOT column_exists('usuarios', 'ultimo_acceso') THEN
            ALTER TABLE usuarios ADD COLUMN ultimo_acceso TIMESTAMPTZ;
            RAISE NOTICE 'Columna ultimo_acceso añadida a usuarios';
        END IF;
        
        IF NOT column_exists('usuarios', 'activo') THEN
            ALTER TABLE usuarios ADD COLUMN activo BOOLEAN NOT NULL DEFAULT TRUE;
            RAISE NOTICE 'Columna activo añadida a usuarios';
        END IF;
    END IF;

    -- Tabla de sorteos
    IF NOT table_exists('sorteos') THEN
        CREATE TABLE sorteos (
            id_sorteo SERIAL PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            descripcion TEXT,
            fecha_hora TIMESTAMPTZ NOT NULL,
            tipo_sorteo VARCHAR(50) NOT NULL,
            estado VARCHAR(50) NOT NULL,
            creado_por INTEGER NOT NULL,
            fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
            fecha_modificacion TIMESTAMPTZ
        );
        ALTER TABLE sorteos ADD CONSTRAINT fk_sorteos_usuarios 
            FOREIGN KEY (creado_por) REFERENCES usuarios(id_usuario);
        RAISE NOTICE 'Tabla sorteos creada';
        tabla_creada := true;
    ELSE
        RAISE NOTICE 'Tabla sorteos ya existe';
        
        -- Verificar y añadir columnas faltantes
        IF NOT column_exists('sorteos', 'nombre') THEN
            ALTER TABLE sorteos ADD COLUMN nombre VARCHAR(100) NOT NULL DEFAULT 'Sorteo sin nombre';
            RAISE NOTICE 'Columna nombre añadida a sorteos';
        END IF;
        
        IF NOT column_exists('sorteos', 'descripcion') THEN
            ALTER TABLE sorteos ADD COLUMN descripcion TEXT;
            RAISE NOTICE 'Columna descripcion añadida a sorteos';
        END IF;
        
        IF NOT column_exists('sorteos', 'fecha_hora') THEN
            ALTER TABLE sorteos ADD COLUMN fecha_hora TIMESTAMPTZ NOT NULL DEFAULT NOW();
            RAISE NOTICE 'Columna fecha_hora añadida a sorteos';
        END IF;
        
        IF NOT column_exists('sorteos', 'tipo_sorteo') THEN
            ALTER TABLE sorteos ADD COLUMN tipo_sorteo VARCHAR(50) NOT NULL DEFAULT 'nacional';
            RAISE NOTICE 'Columna tipo_sorteo añadida a sorteos';
        END IF;
        
        IF NOT column_exists('sorteos', 'estado') THEN
            ALTER TABLE sorteos ADD COLUMN estado VARCHAR(50) NOT NULL DEFAULT 'pendiente';
            RAISE NOTICE 'Columna estado añadida a sorteos';
        END IF;
        
        IF NOT column_exists('sorteos', 'creado_por') THEN
            ALTER TABLE sorteos ADD COLUMN creado_por INTEGER;
            RAISE NOTICE 'Columna creado_por añadida a sorteos';
            
            -- Intentar añadir la clave foránea
            BEGIN
                ALTER TABLE sorteos ADD CONSTRAINT fk_sorteos_usuarios 
                    FOREIGN KEY (creado_por) REFERENCES usuarios(id_usuario);
                RAISE NOTICE 'Restricción de clave foránea añadida a sorteos.creado_por';
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'No se pudo añadir restricción de clave foránea a sorteos.creado_por: %', SQLERRM;
            END;
        END IF;
        
        IF NOT column_exists('sorteos', 'fecha_creacion') THEN
            ALTER TABLE sorteos ADD COLUMN fecha_creacion TIMESTAMPTZ DEFAULT NOW();
            RAISE NOTICE 'Columna fecha_creacion añadida a sorteos';
        END IF;
        
        IF NOT column_exists('sorteos', 'fecha_modificacion') THEN
            ALTER TABLE sorteos ADD COLUMN fecha_modificacion TIMESTAMPTZ;
            RAISE NOTICE 'Columna fecha_modificacion añadida a sorteos';
        END IF;
    END IF;

    -- Tabla de participantes
    IF NOT table_exists('participantes') THEN
        CREATE TABLE participantes (
            id_participante SERIAL PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            apellido VARCHAR(100) NOT NULL,
            documento_identidad VARCHAR(20) NOT NULL,
            email VARCHAR(100),
            telefono VARCHAR(20),
            estado VARCHAR(50) NOT NULL,
            municipio VARCHAR(100),
            parroquia VARCHAR(100),
            direccion TEXT,
            fecha_registro TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX idx_participantes_documento ON participantes(documento_identidad);
        CREATE INDEX idx_participantes_estado ON participantes(estado);
        RAISE NOTICE 'Tabla participantes creada';
        tabla_creada := true;
    ELSE
        RAISE NOTICE 'Tabla participantes ya existe';
        
        -- Verificar y añadir columnas faltantes
        IF NOT column_exists('participantes', 'nombre') THEN
            ALTER TABLE participantes ADD COLUMN nombre VARCHAR(100) NOT NULL DEFAULT 'Sin nombre';
            RAISE NOTICE 'Columna nombre añadida a participantes';
        END IF;
        
        IF NOT column_exists('participantes', 'apellido') THEN
            ALTER TABLE participantes ADD COLUMN apellido VARCHAR(100) NOT NULL DEFAULT 'Sin apellido';
            RAISE NOTICE 'Columna apellido añadida a participantes';
        END IF;
        
        IF NOT column_exists('participantes', 'documento_identidad') THEN
            ALTER TABLE participantes ADD COLUMN documento_identidad VARCHAR(20) NOT NULL DEFAULT '00000000';
            RAISE NOTICE 'Columna documento_identidad añadida a participantes';
        END IF;
        
        IF NOT column_exists('participantes', 'email') THEN
            ALTER TABLE participantes ADD COLUMN email VARCHAR(100);
            RAISE NOTICE 'Columna email añadida a participantes';
        END IF;
        
        IF NOT column_exists('participantes', 'telefono') THEN
            ALTER TABLE participantes ADD COLUMN telefono VARCHAR(20);
            RAISE NOTICE 'Columna telefono añadida a participantes';
        END IF;
        
        IF NOT column_exists('participantes', 'estado') THEN
            ALTER TABLE participantes ADD COLUMN estado VARCHAR(50) NOT NULL DEFAULT 'No especificado';
            RAISE NOTICE 'Columna estado añadida a participantes';
        END IF;
        
        IF NOT column_exists('participantes', 'municipio') THEN
            ALTER TABLE participantes ADD COLUMN municipio VARCHAR(100);
            RAISE NOTICE 'Columna municipio añadida a participantes';
        END IF;
        
        IF NOT column_exists('participantes', 'parroquia') THEN
            ALTER TABLE participantes ADD COLUMN parroquia VARCHAR(100);
            RAISE NOTICE 'Columna parroquia añadida a participantes';
        END IF;
        
        IF NOT column_exists('participantes', 'direccion') THEN
            ALTER TABLE participantes ADD COLUMN direccion TEXT;
            RAISE NOTICE 'Columna direccion añadida a participantes';
        END IF;
        
        IF NOT column_exists('participantes', 'fecha_registro') THEN
            ALTER TABLE participantes ADD COLUMN fecha_registro TIMESTAMPTZ DEFAULT NOW();
            RAISE NOTICE 'Columna fecha_registro añadida a participantes';
        END IF;
    END IF;

    -- Tabla de premios
    IF NOT table_exists('premios') THEN
        CREATE TABLE premios (
            id_premio SERIAL PRIMARY KEY,
            id_sorteo INTEGER NOT NULL,
            nombre VARCHAR(100) NOT NULL,
            descripcion TEXT,
            categoria VARCHAR(50) NOT NULL,
            orden INTEGER NOT NULL,
            imagen_url VARCHAR(255),
            ambito VARCHAR(50) NOT NULL,
            estado VARCHAR(50),
            fecha_creacion TIMESTAMPTZ DEFAULT NOW()
        );
        ALTER TABLE premios ADD CONSTRAINT fk_premios_sorteos 
            FOREIGN KEY (id_sorteo) REFERENCES sorteos(id_sorteo);
        CREATE INDEX idx_premios_sorteo ON premios(id_sorteo);
        CREATE INDEX idx_premios_categoria ON premios(categoria);
        RAISE NOTICE 'Tabla premios creada';
        tabla_creada := true;
    ELSE
        RAISE NOTICE 'Tabla premios ya existe';
        
        -- Verificar y añadir columnas faltantes
        IF NOT column_exists('premios', 'id_sorteo') THEN
            ALTER TABLE premios ADD COLUMN id_sorteo INTEGER;
            RAISE NOTICE 'Columna id_sorteo añadida a premios';
            
            -- Intentar añadir la clave foránea
            BEGIN
                ALTER TABLE premios ADD CONSTRAINT fk_premios_sorteos 
                    FOREIGN KEY (id_sorteo) REFERENCES sorteos(id_sorteo);
                RAISE NOTICE 'Restricción de clave foránea añadida a premios.id_sorteo';
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'No se pudo añadir restricción de clave foránea a premios.id_sorteo: %', SQLERRM;
            END;
        END IF;
        
        IF NOT column_exists('premios', 'nombre') THEN
            ALTER TABLE premios ADD COLUMN nombre VARCHAR(100) NOT NULL DEFAULT 'Premio sin nombre';
            RAISE NOTICE 'Columna nombre añadida a premios';
        END IF;
        
        IF NOT column_exists('premios', 'descripcion') THEN
            ALTER TABLE premios ADD COLUMN descripcion TEXT;
            RAISE NOTICE 'Columna descripcion añadida a premios';
        END IF;
        
        IF NOT column_exists('premios', 'categoria') THEN
            ALTER TABLE premios ADD COLUMN categoria VARCHAR(50) NOT NULL DEFAULT 'principal';
            RAISE NOTICE 'Columna categoria añadida a premios';
        END IF;
        
        IF NOT column_exists('premios', 'orden') THEN
            ALTER TABLE premios ADD COLUMN orden INTEGER NOT NULL DEFAULT 1;
            RAISE NOTICE 'Columna orden añadida a premios';
        END IF;
        
        IF NOT column_exists('premios', 'imagen_url') THEN
            ALTER TABLE premios ADD COLUMN imagen_url VARCHAR(255);
            RAISE NOTICE 'Columna imagen_url añadida a premios';
        END IF;
        
        IF NOT column_exists('premios', 'ambito') THEN
            ALTER TABLE premios ADD COLUMN ambito VARCHAR(50) NOT NULL DEFAULT 'nacional';
            RAISE NOTICE 'Columna ambito añadida a premios';
        END IF;
        
        IF NOT column_exists('premios', 'estado') THEN
            ALTER TABLE premios ADD COLUMN estado VARCHAR(50);
            RAISE NOTICE 'Columna estado añadida a premios';
        END IF;
        
        IF NOT column_exists('premios', 'fecha_creacion') THEN
            ALTER TABLE premios ADD COLUMN fecha_creacion TIMESTAMPTZ DEFAULT NOW();
            RAISE NOTICE 'Columna fecha_creacion añadida a premios';
        END IF;
    END IF;

    -- Tabla de ganadores
    IF NOT table_exists('ganadores') THEN
        CREATE TABLE ganadores (
            id_ganador SERIAL PRIMARY KEY,
            id_sorteo INTEGER NOT NULL,
            id_participante INTEGER NOT NULL,
            id_premio INTEGER NOT NULL,
            numero_ticket VARCHAR(50) NOT NULL,
            fecha_seleccion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            certificado_generado BOOLEAN NOT NULL DEFAULT FALSE,
            notificado BOOLEAN NOT NULL DEFAULT FALSE,
            fecha_notificacion TIMESTAMPTZ
        );
        ALTER TABLE ganadores ADD CONSTRAINT fk_ganadores_sorteos 
            FOREIGN KEY (id_sorteo) REFERENCES sorteos(id_sorteo);
        ALTER TABLE ganadores ADD CONSTRAINT fk_ganadores_participantes 
            FOREIGN KEY (id_participante) REFERENCES participantes(id_participante);
        ALTER TABLE ganadores ADD CONSTRAINT fk_ganadores_premios 
            FOREIGN KEY (id_premio) REFERENCES premios(id_premio);
        CREATE INDEX idx_ganadores_sorteo ON ganadores(id_sorteo);
        CREATE INDEX idx_ganadores_participante ON ganadores(id_participante);
        CREATE INDEX idx_ganadores_premio ON ganadores(id_premio);
        RAISE NOTICE 'Tabla ganadores creada';
        tabla_creada := true;
    ELSE
        RAISE NOTICE 'Tabla ganadores ya existe';
        
        -- Verificar y añadir columnas faltantes
        IF NOT column_exists('ganadores', 'id_sorteo') THEN
            ALTER TABLE ganadores ADD COLUMN id_sorteo INTEGER;
            RAISE NOTICE 'Columna id_sorteo añadida a ganadores';
            
            -- Intentar añadir la clave foránea
            BEGIN
                ALTER TABLE ganadores ADD CONSTRAINT fk_ganadores_sorteos 
                    FOREIGN KEY (id_sorteo) REFERENCES sorteos(id_sorteo);
                RAISE NOTICE 'Restricción de clave foránea añadida a ganadores.id_sorteo';
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'No se pudo añadir restricción de clave foránea a ganadores.id_sorteo: %', SQLERRM;
            END;
        END IF;
        
        IF NOT column_exists('ganadores', 'id_participante') THEN
            ALTER TABLE ganadores ADD COLUMN id_participante INTEGER;
            RAISE NOTICE 'Columna id_participante añadida a ganadores';
            
            -- Intentar añadir la clave foránea
            BEGIN
                ALTER TABLE ganadores ADD CONSTRAINT fk_ganadores_participantes 
                    FOREIGN KEY (id_participante) REFERENCES participantes(id_participante);
                RAISE NOTICE 'Restricción de clave foránea añadida a ganadores.id_participante';
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'No se pudo añadir restricción de clave foránea a ganadores.id_participante: %', SQLERRM;
            END;
        END IF;
        
        IF NOT column_exists('ganadores', 'id_premio') THEN
            ALTER TABLE ganadores ADD COLUMN id_premio INTEGER;
            RAISE NOTICE 'Columna id_premio añadida a ganadores';
            
            -- Intentar añadir la clave foránea
            BEGIN
                ALTER TABLE ganadores ADD CONSTRAINT fk_ganadores_premios 
                    FOREIGN KEY (id_premio) REFERENCES premios(id_premio);
                RAISE NOTICE 'Restricción de clave foránea añadida a ganadores.id_premio';
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'No se pudo añadir restricción de clave foránea a ganadores.id_premio: %', SQLERRM;
            END;
        END IF;
        
        IF NOT column_exists('ganadores', 'numero_ticket') THEN
            ALTER TABLE ganadores ADD COLUMN numero_ticket VARCHAR(50) NOT NULL DEFAULT '000000000';
            RAISE NOTICE 'Columna numero_ticket añadida a ganadores';
        END IF;
        
        IF NOT column_exists('ganadores', 'fecha_seleccion') THEN
            ALTER TABLE ganadores ADD COLUMN fecha_seleccion TIMESTAMPTZ NOT NULL DEFAULT NOW();
            RAISE NOTICE 'Columna fecha_seleccion añadida a ganadores';
        END IF;
        
        IF NOT column_exists('ganadores', 'certificado_generado') THEN
            ALTER TABLE ganadores ADD COLUMN certificado_generado BOOLEAN NOT NULL DEFAULT FALSE;
            RAISE NOTICE 'Columna certificado_generado añadida a ganadores';
        END IF;
        
        IF NOT column_exists('ganadores', 'notificado') THEN
            ALTER TABLE ganadores ADD COLUMN notificado BOOLEAN NOT NULL DEFAULT FALSE;
            RAISE NOTICE 'Columna notificado añadida a ganadores';
        END IF;
        
        IF NOT column_exists('ganadores', 'fecha_notificacion') THEN
            ALTER TABLE ganadores ADD COLUMN fecha_notificacion TIMESTAMPTZ;
            RAISE NOTICE 'Columna fecha_notificacion añadida a ganadores';
        END IF;
    END IF;
    
    -- Crear datos de muestra si se crearon tablas nuevas y no hay datos
    IF tabla_creada THEN
        -- Verificar si hay usuarios
        IF (SELECT COUNT(*) FROM usuarios) = 0 THEN
            -- Insertar usuario administrador
            INSERT INTO usuarios (nombre, apellido, email, password, rol)
            VALUES ('Admin', 'Sistema', 'admin@sorteo.com', 'admin123', 'administrador');
            RAISE NOTICE 'Usuario administrador creado';
            
            -- Insertar estados/regiones
            DECLARE
                estados TEXT[] := ARRAY[
                    'Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas',
                    'Bolívar', 'Carabobo', 'Cojedes', 'Delta Amacuro', 'Distrito Capital',
                    'Falcón', 'Guárico', 'Lara', 'Mérida', 'Miranda',
                    'Monagas', 'Nueva Esparta', 'Portuguesa', 'Sucre', 'Táchira',
                    'Trujillo', 'Vargas', 'Yaracuy', 'Zulia'
                ];
                estado TEXT;
            BEGIN
                -- Crear un sorteo de ejemplo
                INSERT INTO sorteos (nombre, fecha_hora, tipo_sorteo, estado, creado_por)
                VALUES ('Sorteo Nacional', NOW() + INTERVAL '30 days', 'nacional', 'pendiente', 1)
                RETURNING id_sorteo INTO STRICT estado;
                
                RAISE NOTICE 'Sorteo de ejemplo creado';
                
                -- Crear premios de ejemplo
                INSERT INTO premios (id_sorteo, nombre, categoria, orden, ambito)
                VALUES 
                    (1, 'Vehículo 0 Km', 'principal', 1, 'nacional'),
                    (1, 'Motocicleta', 'secundario', 2, 'nacional'),
                    (1, 'Televisor', 'terciario', 3, 'nacional');
                    
                RAISE NOTICE 'Premios de ejemplo creados';
                
                -- Crear participantes de ejemplo (uno por estado)
                FOREACH estado IN ARRAY estados
                LOOP
                    INSERT INTO participantes (
                        nombre, 
                        apellido, 
                        documento_identidad, 
                        email, 
                        telefono, 
                        estado
                    )
                    VALUES (
                        'Participante', 
                        estado, 
                        'V' || (1000000 + ascii(estado)), 
                        'participante.' || lower(regexp_replace(estado, '[^a-zA-Z0-9]', '', 'g')) || '@example.com',
                        '0412' || (1000000 + ascii(estado)),
                        estado
                    );
                END LOOP;
                
                RAISE NOTICE 'Participantes de ejemplo creados (uno por estado)';
            EXCEPTION 
                WHEN OTHERS THEN
                    RAISE NOTICE 'Error al crear datos de ejemplo: %', SQLERRM;
            END;
        END IF;
    END IF;
END;
$$;

-- Crear índices faltantes
DO $$
BEGIN
    -- Índices para tabla participantes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'participantes' AND indexname = 'idx_participantes_documento') THEN
        CREATE INDEX idx_participantes_documento ON participantes(documento_identidad);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'participantes' AND indexname = 'idx_participantes_estado') THEN
        CREATE INDEX idx_participantes_estado ON participantes(estado);
    END IF;
    
    -- Índices para tabla premios
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'premios' AND indexname = 'idx_premios_sorteo') THEN
        CREATE INDEX idx_premios_sorteo ON premios(id_sorteo);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'premios' AND indexname = 'idx_premios_categoria') THEN
        CREATE INDEX idx_premios_categoria ON premios(categoria);
    END IF;
    
    -- Índices para tabla ganadores
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'ganadores' AND indexname = 'idx_ganadores_sorteo') THEN
        CREATE INDEX idx_ganadores_sorteo ON ganadores(id_sorteo);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'ganadores' AND indexname = 'idx_ganadores_participante') THEN
        CREATE INDEX idx_ganadores_participante ON ganadores(id_participante);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'ganadores' AND indexname = 'idx_ganadores_premio') THEN
        CREATE INDEX idx_ganadores_premio ON ganadores(id_premio);
    END IF;
END $$;

-- Crear vistas útiles
DO $$
BEGIN
    -- Vista de participación por región
    IF NOT EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'vw_participacion_region') THEN
        EXECUTE 'CREATE OR REPLACE VIEW vw_participacion_region AS
            SELECT 
                p.estado, 
                COUNT(p.id_participante) as total_participantes,
                COUNT(g.id_ganador) as total_ganadores
            FROM 
                participantes p
                LEFT JOIN ganadores g ON g.id_participante = p.id_participante
            GROUP BY 
                p.estado
            ORDER BY 
                p.estado';
        RAISE NOTICE 'Vista vw_participacion_region creada';
    END IF;
    
    -- Vista de sorteos con estadísticas
    IF NOT EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'vw_sorteos_stats') THEN
        EXECUTE 'CREATE OR REPLACE VIEW vw_sorteos_stats AS
            SELECT 
                s.id_sorteo,
                s.nombre,
                s.fecha_hora,
                s.estado,
                COUNT(DISTINCT p.id_premio) as total_premios,
                COUNT(DISTINCT g.id_ganador) as total_ganadores,
                COUNT(DISTINCT pa.id_participante) as total_participantes
            FROM 
                sorteos s
                LEFT JOIN premios p ON p.id_sorteo = s.id_sorteo
                LEFT JOIN ganadores g ON g.id_sorteo = s.id_sorteo
                LEFT JOIN participantes pa ON pa.id_participante IN (
                    SELECT id_participante FROM ganadores WHERE id_sorteo = s.id_sorteo
                )
            GROUP BY 
                s.id_sorteo, s.nombre, s.fecha_hora, s.estado
            ORDER BY 
                s.fecha_hora DESC';
        RAISE NOTICE 'Vista vw_sorteos_stats creada';
    END IF;
END $$;

-- Limpiar funciones temporales
DROP FUNCTION IF EXISTS column_exists(text, text);
DROP FUNCTION IF EXISTS table_exists(text);

-- Finalización y verificación
SELECT 'SCRIPT COMPLETADO EXITOSAMENTE' AS resultado;
SELECT 
    table_name, 
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as columnas
FROM 
    information_schema.tables t
WHERE 
    table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name IN ('usuarios', 'sorteos', 'participantes', 'premios', 'ganadores')
ORDER BY 
    table_name; 