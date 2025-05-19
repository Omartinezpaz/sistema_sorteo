-- Script para corregir problemas de estructura en la base de datos
-- Este script debe ejecutarse cuando la verificación de esquema reporta problemas

-- IMPORTANTE: Ejecutar este script puede modificar la estructura de las tablas
-- y podría causar pérdida de datos si se usan incorrectamente.
-- SE RECOMIENDA HACER UNA COPIA DE SEGURIDAD ANTES DE EJECUTAR ESTE SCRIPT.

-- Función para verificar si una columna existe
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

-- Función para verificar si una tabla existe
CREATE OR REPLACE FUNCTION table_exists(tab text) RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = tab
    );
END;
$$ LANGUAGE plpgsql;

-- ============= CORRECCIONES DE TABLAS =============

-- Tabla de usuarios
DO $$
BEGIN
    -- Crear tabla si no existe
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
    ELSE
        -- Añadir columnas faltantes
        IF NOT column_exists('usuarios', 'id_usuario') THEN
            ALTER TABLE usuarios ADD COLUMN id_usuario SERIAL PRIMARY KEY;
        END IF;
        
        IF NOT column_exists('usuarios', 'nombre') THEN
            ALTER TABLE usuarios ADD COLUMN nombre VARCHAR(100) NOT NULL DEFAULT 'Pendiente';
        END IF;
        
        IF NOT column_exists('usuarios', 'apellido') THEN
            ALTER TABLE usuarios ADD COLUMN apellido VARCHAR(100) NOT NULL DEFAULT 'Pendiente';
        END IF;
        
        IF NOT column_exists('usuarios', 'email') THEN
            ALTER TABLE usuarios ADD COLUMN email VARCHAR(100) NOT NULL DEFAULT 'pendiente@example.com';
        END IF;
        
        IF NOT column_exists('usuarios', 'password') THEN
            ALTER TABLE usuarios ADD COLUMN password VARCHAR(100) NOT NULL DEFAULT 'cambiar';
        END IF;
        
        IF NOT column_exists('usuarios', 'rol') THEN
            ALTER TABLE usuarios ADD COLUMN rol VARCHAR(50) NOT NULL DEFAULT 'usuario';
        END IF;
        
        IF NOT column_exists('usuarios', 'fecha_creacion') THEN
            ALTER TABLE usuarios ADD COLUMN fecha_creacion TIMESTAMPTZ DEFAULT NOW();
        END IF;
        
        IF NOT column_exists('usuarios', 'ultimo_acceso') THEN
            ALTER TABLE usuarios ADD COLUMN ultimo_acceso TIMESTAMPTZ;
        END IF;
        
        IF NOT column_exists('usuarios', 'activo') THEN
            ALTER TABLE usuarios ADD COLUMN activo BOOLEAN NOT NULL DEFAULT TRUE;
        END IF;
    END IF;
END $$;

-- Tabla de sorteos
DO $$
BEGIN
    -- Crear tabla si no existe
    IF NOT table_exists('sorteos') THEN
        CREATE TABLE sorteos (
            id_sorteo SERIAL PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            descripcion TEXT,
            fecha_hora TIMESTAMPTZ NOT NULL,
            tipo_sorteo VARCHAR(50) NOT NULL,
            estado VARCHAR(50) NOT NULL,
            creado_por INTEGER NOT NULL REFERENCES usuarios(id_usuario),
            fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
            fecha_modificacion TIMESTAMPTZ
        );
        RAISE NOTICE 'Tabla sorteos creada';
    ELSE
        -- Añadir columnas faltantes
        IF NOT column_exists('sorteos', 'id_sorteo') THEN
            ALTER TABLE sorteos ADD COLUMN id_sorteo SERIAL PRIMARY KEY;
        END IF;
        
        IF NOT column_exists('sorteos', 'nombre') THEN
            ALTER TABLE sorteos ADD COLUMN nombre VARCHAR(100) NOT NULL DEFAULT 'Sorteo sin nombre';
        END IF;
        
        IF NOT column_exists('sorteos', 'descripcion') THEN
            ALTER TABLE sorteos ADD COLUMN descripcion TEXT;
        END IF;
        
        IF NOT column_exists('sorteos', 'fecha_hora') THEN
            ALTER TABLE sorteos ADD COLUMN fecha_hora TIMESTAMPTZ NOT NULL DEFAULT NOW();
        END IF;
        
        IF NOT column_exists('sorteos', 'tipo_sorteo') THEN
            ALTER TABLE sorteos ADD COLUMN tipo_sorteo VARCHAR(50) NOT NULL DEFAULT 'nacional';
        END IF;
        
        IF NOT column_exists('sorteos', 'estado') THEN
            ALTER TABLE sorteos ADD COLUMN estado VARCHAR(50) NOT NULL DEFAULT 'pendiente';
        END IF;
        
        IF NOT column_exists('sorteos', 'creado_por') THEN
            -- Verificar si hay algún usuario para referenciar
            DECLARE
                id_user INTEGER;
            BEGIN
                SELECT id_usuario INTO id_user FROM usuarios LIMIT 1;
                IF id_user IS NULL THEN
                    INSERT INTO usuarios (nombre, apellido, email, password, rol)
                    VALUES ('Admin', 'Sistema', 'admin@sistema.com', 'cambiar123', 'administrador')
                    RETURNING id_usuario INTO id_user;
                END IF;
                ALTER TABLE sorteos ADD COLUMN creado_por INTEGER NOT NULL DEFAULT id_user;
                ALTER TABLE sorteos ADD CONSTRAINT fk_sorteos_usuarios FOREIGN KEY (creado_por) REFERENCES usuarios(id_usuario);
            END;
        END IF;
        
        IF NOT column_exists('sorteos', 'fecha_creacion') THEN
            ALTER TABLE sorteos ADD COLUMN fecha_creacion TIMESTAMPTZ DEFAULT NOW();
        END IF;
        
        IF NOT column_exists('sorteos', 'fecha_modificacion') THEN
            ALTER TABLE sorteos ADD COLUMN fecha_modificacion TIMESTAMPTZ;
        END IF;
    END IF;
END $$;

-- Tabla de participantes
DO $$
BEGIN
    -- Crear tabla si no existe
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
    ELSE
        -- Añadir columnas faltantes
        IF NOT column_exists('participantes', 'id_participante') THEN
            ALTER TABLE participantes ADD COLUMN id_participante SERIAL PRIMARY KEY;
        END IF;
        
        IF NOT column_exists('participantes', 'nombre') THEN
            ALTER TABLE participantes ADD COLUMN nombre VARCHAR(100) NOT NULL DEFAULT 'Sin nombre';
        END IF;
        
        IF NOT column_exists('participantes', 'apellido') THEN
            ALTER TABLE participantes ADD COLUMN apellido VARCHAR(100) NOT NULL DEFAULT 'Sin apellido';
        END IF;
        
        IF NOT column_exists('participantes', 'documento_identidad') THEN
            ALTER TABLE participantes ADD COLUMN documento_identidad VARCHAR(20) NOT NULL DEFAULT '00000000';
        END IF;
        
        IF NOT column_exists('participantes', 'email') THEN
            ALTER TABLE participantes ADD COLUMN email VARCHAR(100);
        END IF;
        
        IF NOT column_exists('participantes', 'telefono') THEN
            ALTER TABLE participantes ADD COLUMN telefono VARCHAR(20);
        END IF;
        
        IF NOT column_exists('participantes', 'estado') THEN
            ALTER TABLE participantes ADD COLUMN estado VARCHAR(50) NOT NULL DEFAULT 'No especificado';
        END IF;
        
        IF NOT column_exists('participantes', 'municipio') THEN
            ALTER TABLE participantes ADD COLUMN municipio VARCHAR(100);
        END IF;
        
        IF NOT column_exists('participantes', 'parroquia') THEN
            ALTER TABLE participantes ADD COLUMN parroquia VARCHAR(100);
        END IF;
        
        IF NOT column_exists('participantes', 'direccion') THEN
            ALTER TABLE participantes ADD COLUMN direccion TEXT;
        END IF;
        
        IF NOT column_exists('participantes', 'fecha_registro') THEN
            ALTER TABLE participantes ADD COLUMN fecha_registro TIMESTAMPTZ DEFAULT NOW();
        END IF;
    END IF;
END $$;

-- Tabla de premios
DO $$
BEGIN
    -- Crear tabla si no existe
    IF NOT table_exists('premios') THEN
        CREATE TABLE premios (
            id_premio SERIAL PRIMARY KEY,
            id_sorteo INTEGER NOT NULL REFERENCES sorteos(id_sorteo),
            nombre VARCHAR(100) NOT NULL,
            descripcion TEXT,
            categoria VARCHAR(50) NOT NULL,
            orden INTEGER NOT NULL,
            imagen_url VARCHAR(255),
            ambito VARCHAR(50) NOT NULL,
            estado VARCHAR(50),
            fecha_creacion TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX idx_premios_sorteo ON premios(id_sorteo);
        CREATE INDEX idx_premios_categoria ON premios(categoria);
        RAISE NOTICE 'Tabla premios creada';
    ELSE
        -- Añadir columnas faltantes
        IF NOT column_exists('premios', 'id_premio') THEN
            ALTER TABLE premios ADD COLUMN id_premio SERIAL PRIMARY KEY;
        END IF;
        
        IF NOT column_exists('premios', 'id_sorteo') THEN
            -- Verificar si hay algún sorteo para referenciar
            DECLARE
                id_sort INTEGER;
            BEGIN
                SELECT id_sorteo INTO id_sort FROM sorteos LIMIT 1;
                IF id_sort IS NULL THEN
                    -- Verificar si hay usuario para el sorteo
                    DECLARE
                        id_user INTEGER;
                    BEGIN
                        SELECT id_usuario INTO id_user FROM usuarios LIMIT 1;
                        IF id_user IS NULL THEN
                            INSERT INTO usuarios (nombre, apellido, email, password, rol)
                            VALUES ('Admin', 'Sistema', 'admin@sistema.com', 'cambiar123', 'administrador')
                            RETURNING id_usuario INTO id_user;
                        END IF;
                        INSERT INTO sorteos (nombre, fecha_hora, tipo_sorteo, estado, creado_por)
                        VALUES ('Sorteo Automático', NOW() + INTERVAL '7 days', 'nacional', 'pendiente', id_user)
                        RETURNING id_sorteo INTO id_sort;
                    END;
                END IF;
                ALTER TABLE premios ADD COLUMN id_sorteo INTEGER NOT NULL DEFAULT id_sort;
                ALTER TABLE premios ADD CONSTRAINT fk_premios_sorteos FOREIGN KEY (id_sorteo) REFERENCES sorteos(id_sorteo);
            END;
        END IF;
        
        IF NOT column_exists('premios', 'nombre') THEN
            ALTER TABLE premios ADD COLUMN nombre VARCHAR(100) NOT NULL DEFAULT 'Premio sin nombre';
        END IF;
        
        IF NOT column_exists('premios', 'descripcion') THEN
            ALTER TABLE premios ADD COLUMN descripcion TEXT;
        END IF;
        
        IF NOT column_exists('premios', 'categoria') THEN
            ALTER TABLE premios ADD COLUMN categoria VARCHAR(50) NOT NULL DEFAULT 'principal';
        END IF;
        
        IF NOT column_exists('premios', 'orden') THEN
            ALTER TABLE premios ADD COLUMN orden INTEGER NOT NULL DEFAULT 1;
        END IF;
        
        IF NOT column_exists('premios', 'imagen_url') THEN
            ALTER TABLE premios ADD COLUMN imagen_url VARCHAR(255);
        END IF;
        
        IF NOT column_exists('premios', 'ambito') THEN
            ALTER TABLE premios ADD COLUMN ambito VARCHAR(50) NOT NULL DEFAULT 'nacional';
        END IF;
        
        IF NOT column_exists('premios', 'estado') THEN
            ALTER TABLE premios ADD COLUMN estado VARCHAR(50);
        END IF;
        
        IF NOT column_exists('premios', 'fecha_creacion') THEN
            ALTER TABLE premios ADD COLUMN fecha_creacion TIMESTAMPTZ DEFAULT NOW();
        END IF;
    END IF;
END $$;

-- Tabla de ganadores
DO $$
BEGIN
    -- Crear tabla si no existe
    IF NOT table_exists('ganadores') THEN
        CREATE TABLE ganadores (
            id_ganador SERIAL PRIMARY KEY,
            id_sorteo INTEGER NOT NULL REFERENCES sorteos(id_sorteo),
            id_participante INTEGER NOT NULL REFERENCES participantes(id_participante),
            id_premio INTEGER NOT NULL REFERENCES premios(id_premio),
            numero_ticket VARCHAR(50) NOT NULL,
            fecha_seleccion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            certificado_generado BOOLEAN NOT NULL DEFAULT FALSE,
            notificado BOOLEAN NOT NULL DEFAULT FALSE,
            fecha_notificacion TIMESTAMPTZ
        );
        CREATE INDEX idx_ganadores_sorteo ON ganadores(id_sorteo);
        CREATE INDEX idx_ganadores_participante ON ganadores(id_participante);
        CREATE INDEX idx_ganadores_premio ON ganadores(id_premio);
        RAISE NOTICE 'Tabla ganadores creada';
    ELSE
        -- Añadir columnas faltantes
        IF NOT column_exists('ganadores', 'id_ganador') THEN
            ALTER TABLE ganadores ADD COLUMN id_ganador SERIAL PRIMARY KEY;
        END IF;
        
        IF NOT column_exists('ganadores', 'id_sorteo') THEN
            -- Verificar si hay algún sorteo para referenciar
            DECLARE
                id_sort INTEGER;
            BEGIN
                SELECT id_sorteo INTO id_sort FROM sorteos LIMIT 1;
                IF id_sort IS NULL THEN
                    -- Verificar si hay usuario para el sorteo
                    DECLARE
                        id_user INTEGER;
                    BEGIN
                        SELECT id_usuario INTO id_user FROM usuarios LIMIT 1;
                        IF id_user IS NULL THEN
                            INSERT INTO usuarios (nombre, apellido, email, password, rol)
                            VALUES ('Admin', 'Sistema', 'admin@sistema.com', 'cambiar123', 'administrador')
                            RETURNING id_usuario INTO id_user;
                        END IF;
                        INSERT INTO sorteos (nombre, fecha_hora, tipo_sorteo, estado, creado_por)
                        VALUES ('Sorteo Automático', NOW() + INTERVAL '7 days', 'nacional', 'pendiente', id_user)
                        RETURNING id_sorteo INTO id_sort;
                    END;
                END IF;
                ALTER TABLE ganadores ADD COLUMN id_sorteo INTEGER NOT NULL DEFAULT id_sort;
                ALTER TABLE ganadores ADD CONSTRAINT fk_ganadores_sorteos FOREIGN KEY (id_sorteo) REFERENCES sorteos(id_sorteo);
            END;
        END IF;
        
        IF NOT column_exists('ganadores', 'id_participante') THEN
            -- Verificar si hay algún participante para referenciar
            DECLARE
                id_part INTEGER;
            BEGIN
                SELECT id_participante INTO id_part FROM participantes LIMIT 1;
                IF id_part IS NULL THEN
                    INSERT INTO participantes (nombre, apellido, documento_identidad, estado)
                    VALUES ('Participante', 'Temporal', 'V00000000', 'No especificado')
                    RETURNING id_participante INTO id_part;
                END IF;
                ALTER TABLE ganadores ADD COLUMN id_participante INTEGER NOT NULL DEFAULT id_part;
                ALTER TABLE ganadores ADD CONSTRAINT fk_ganadores_participantes FOREIGN KEY (id_participante) REFERENCES participantes(id_participante);
            END;
        END IF;
        
        IF NOT column_exists('ganadores', 'id_premio') THEN
            -- Verificar si hay algún premio para referenciar
            DECLARE
                id_prem INTEGER;
                id_sort INTEGER;
            BEGIN
                SELECT id_premio INTO id_prem FROM premios LIMIT 1;
                IF id_prem IS NULL THEN
                    SELECT id_sorteo INTO id_sort FROM sorteos LIMIT 1;
                    IF id_sort IS NULL THEN
                        -- Verificar si hay usuario para el sorteo
                        DECLARE
                            id_user INTEGER;
                        BEGIN
                            SELECT id_usuario INTO id_user FROM usuarios LIMIT 1;
                            IF id_user IS NULL THEN
                                INSERT INTO usuarios (nombre, apellido, email, password, rol)
                                VALUES ('Admin', 'Sistema', 'admin@sistema.com', 'cambiar123', 'administrador')
                                RETURNING id_usuario INTO id_user;
                            END IF;
                            INSERT INTO sorteos (nombre, fecha_hora, tipo_sorteo, estado, creado_por)
                            VALUES ('Sorteo Automático', NOW() + INTERVAL '7 days', 'nacional', 'pendiente', id_user)
                            RETURNING id_sorteo INTO id_sort;
                        END;
                    END IF;
                    INSERT INTO premios (id_sorteo, nombre, categoria, orden, ambito)
                    VALUES (id_sort, 'Premio Temporal', 'principal', 1, 'nacional')
                    RETURNING id_premio INTO id_prem;
                END IF;
                ALTER TABLE ganadores ADD COLUMN id_premio INTEGER NOT NULL DEFAULT id_prem;
                ALTER TABLE ganadores ADD CONSTRAINT fk_ganadores_premios FOREIGN KEY (id_premio) REFERENCES premios(id_premio);
            END;
        END IF;
        
        IF NOT column_exists('ganadores', 'numero_ticket') THEN
            ALTER TABLE ganadores ADD COLUMN numero_ticket VARCHAR(50) NOT NULL DEFAULT '000000000';
        END IF;
        
        IF NOT column_exists('ganadores', 'fecha_seleccion') THEN
            ALTER TABLE ganadores ADD COLUMN fecha_seleccion TIMESTAMPTZ NOT NULL DEFAULT NOW();
        END IF;
        
        IF NOT column_exists('ganadores', 'certificado_generado') THEN
            ALTER TABLE ganadores ADD COLUMN certificado_generado BOOLEAN NOT NULL DEFAULT FALSE;
        END IF;
        
        IF NOT column_exists('ganadores', 'notificado') THEN
            ALTER TABLE ganadores ADD COLUMN notificado BOOLEAN NOT NULL DEFAULT FALSE;
        END IF;
        
        IF NOT column_exists('ganadores', 'fecha_notificacion') THEN
            ALTER TABLE ganadores ADD COLUMN fecha_notificacion TIMESTAMPTZ;
        END IF;
    END IF;
END $$;

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

-- Limpiar funciones temporales
DROP FUNCTION IF EXISTS column_exists(text, text);
DROP FUNCTION IF EXISTS table_exists(text);

-- Verificación final
SELECT 'Estructura de base de datos corregida. Por favor, ejecute nuevamente la verificación previa al sorteo.' AS resultado; 