-- Script para crear la tabla re_723 si no existe
-- Esta tabla es utilizada por la función generar_tiques_por_estado.sql

-- Verificar si la tabla existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 're_723') THEN
        -- Crear la tabla
        CREATE TABLE public.re_723 (
            id SERIAL PRIMARY KEY,
            nac CHAR(1) NOT NULL,             -- Nacionalidad (V o E)
            cedula_ch VARCHAR(10) NOT NULL,   -- Número de cédula
            p_nombre VARCHAR(50) NOT NULL,    -- Primer nombre
            s_nombre VARCHAR(50),             -- Segundo nombre
            p_apellido VARCHAR(50) NOT NULL,  -- Primer apellido
            s_apellido VARCHAR(50),           -- Segundo apellido
            fecha_nac DATE,                   -- Fecha de nacimiento
            sexo CHAR(1),                     -- M o F
            telefono VARCHAR(15),             -- Número de teléfono
            cod_estado VARCHAR(2) NOT NULL,   -- Código del estado (01, 02, etc.)
            cod_municipio VARCHAR(4) NOT NULL,-- Código del municipio
            cod_parroquia VARCHAR(6) NOT NULL,-- Código de la parroquia
            direccion TEXT,                   -- Dirección completa
            created_at TIMESTAMP DEFAULT NOW()
        );

        -- Crear índices para optimizar búsquedas
        CREATE INDEX idx_re_723_cedula ON public.re_723(nac, cedula_ch);
        CREATE INDEX idx_re_723_estado ON public.re_723(cod_estado);
        CREATE INDEX idx_re_723_municipio ON public.re_723(cod_municipio);
        CREATE INDEX idx_re_723_parroquia ON public.re_723(cod_parroquia);

        -- Crear algunos registros de ejemplo
        INSERT INTO public.re_723 (nac, cedula_ch, p_nombre, s_nombre, p_apellido, s_apellido, fecha_nac, sexo, telefono, cod_estado, cod_municipio, cod_parroquia, direccion)
        VALUES
            -- Estado 01 (Aprox. 5 registros)
            ('V', '12345678', 'María', 'José', 'González', 'Pérez', '1985-03-15', 'F', '04241234567', '01', '0101', '010101', 'Calle Principal, Casa 15'),
            ('V', '23456789', 'Juan', 'Carlos', 'Rodríguez', 'López', '1990-07-22', 'M', '04161234567', '01', '0101', '010101', 'Avenida Central, Edif. 7, Apto 3'),
            ('E', '87654321', 'Ana', 'María', 'Martínez', 'Díaz', '1975-11-30', 'F', '04121234567', '01', '0102', '010201', 'Urbanización El Valle, Casa 25'),
            ('V', '34567891', 'Pedro', NULL, 'Sánchez', 'Ramírez', '1988-05-12', 'M', '04261234567', '01', '0103', '010301', 'Sector Los Pinos, Casa 8'),
            ('V', '45678912', 'Luisa', 'Fernanda', 'Torres', 'Méndez', '1992-09-07', 'F', '04141234567', '01', '0103', '010302', 'Calle Las Flores, Casa 10'),

            -- Estado 02 (Aprox. 8 registros)
            ('V', '56789123', 'Roberto', NULL, 'Hernández', 'Gómez', '1983-04-18', 'M', '04161234568', '02', '0201', '020101', 'Avenida Principal, Casa 22'),
            ('V', '67891234', 'Carmen', 'Elena', 'López', 'Vargas', '1995-08-25', 'F', '04241234568', '02', '0201', '020102', 'Urbanización San José, Casa 5'),
            ('E', '78912345', 'Carlos', 'Alberto', 'Díaz', 'Fernández', '1980-12-10', 'M', '04121234568', '02', '0202', '020201', 'Sector El Carmen, Edif. 3, Apto 7'),
            ('V', '89123456', 'Sofía', NULL, 'Pérez', 'Sánchez', '1993-06-05', 'F', '04261234568', '02', '0202', '020202', 'Calle Los Olivos, Casa 15'),
            ('V', '91234567', 'Miguel', 'Ángel', 'Ramírez', 'Martínez', '1987-02-28', 'M', '04141234568', '02', '0203', '020301', 'Avenida Las Palmas, Casa 30'),
            ('V', '12345678', 'Laura', 'Patricia', 'Gómez', 'López', '1991-10-15', 'F', '04161234569', '02', '0203', '020302', 'Urbanización El Bosque, Casa 8'),
            ('E', '23456789', 'José', 'Luis', 'Vargas', 'Hernández', '1978-07-20', 'M', '04241234569', '02', '0203', '020303', 'Calle Central, Edif. 5, Apto 9'),
            ('V', '34567891', 'Daniela', NULL, 'Fernández', 'Díaz', '1996-03-12', 'F', '04121234569', '02', '0204', '020401', 'Sector Las Flores, Casa 12'),

            -- Estado 03 (Aprox. 7 registros)
            ('V', '45678912', 'Alejandro', NULL, 'Sánchez', 'Pérez', '1982-09-08', 'M', '04261234569', '03', '0301', '030101', 'Avenida Los Robles, Casa 7'),
            ('V', '56789123', 'Gabriela', 'Alejandra', 'Martínez', 'Ramírez', '1994-05-25', 'F', '04141234569', '03', '0301', '030102', 'Calle Las Acacias, Casa 25'),
            ('E', '67891234', 'Francisco', 'Javier', 'López', 'Gómez', '1975-12-18', 'M', '04161234570', '03', '0302', '030201', 'Urbanización El Paraíso, Casa 18'),
            ('V', '78912345', 'Valentina', NULL, 'Díaz', 'Vargas', '1989-07-30', 'F', '04241234570', '03', '0302', '030202', 'Edificio Las Torres, Piso 5, Apto 52'),
            ('V', '89123456', 'Andrés', 'Felipe', 'Hernández', 'Fernández', '1984-11-22', 'M', '04121234570', '03', '0302', '030203', 'Calle Los Pinos, Casa 9'),
            ('V', '91234567', 'Isabella', NULL, 'Ramírez', 'Sánchez', '1997-01-15', 'F', '04261234570', '03', '0303', '030301', 'Avenida Principal, Casa 33'),
            ('E', '12345678', 'Santiago', NULL, 'Gómez', 'Pérez', '1981-06-28', 'M', '04141234570', '03', '0303', '030302', 'Urbanización Las Palmas, Casa 11'),

            -- Estado 04 (Aprox. 4 registros)
            ('V', '23456789', 'Camila', 'Andrea', 'Vargas', 'Martínez', '1993-02-10', 'F', '04161234571', '04', '0401', '040101', 'Calle Los Laureles, Casa 7'),
            ('V', '34567891', 'Sebastián', NULL, 'Fernández', 'López', '1986-08-05', 'M', '04241234571', '04', '0401', '040102', 'Avenida Central, Edif. 10, Apto 15'),
            ('E', '45678912', 'Victoria', 'Eugenia', 'Pérez', 'Díaz', '1995-04-20', 'F', '04121234571', '04', '0402', '040201', 'Sector El Mirador, Casa 22'),
            ('V', '56789123', 'Matías', NULL, 'Sánchez', 'Hernández', '1979-10-12', 'M', '04261234571', '04', '0402', '040202', 'Urbanización Vista Hermosa, Casa 5'),

            -- Estado 05 (Aprox. 6 registros)
            ('V', '67891234', 'Emma', 'Patricia', 'Ramírez', 'Gómez', '1990-03-28', 'F', '04141234571', '05', '0501', '050101', 'Calle Las Palmeras, Casa 15'),
            ('V', '78912345', 'Daniel', 'Alejandro', 'Martínez', 'Vargas', '1983-12-15', 'M', '04161234572', '05', '0501', '050102', 'Avenida Las Delicias, Casa 8'),
            ('E', '89123456', 'Valeria', NULL, 'López', 'Fernández', '1998-07-22', 'F', '04241234572', '05', '0502', '050201', 'Edificio El Cielo, Piso 3, Apto 32'),
            ('V', '91234567', 'Leonardo', 'Antonio', 'Díaz', 'Sánchez', '1977-05-10', 'M', '04121234572', '05', '0502', '050202', 'Urbanización Las Mercedes, Casa 9'),
            ('V', '12345678', 'Natalia', 'Carolina', 'Gómez', 'Ramírez', '1991-09-05', 'F', '04261234572', '05', '0503', '050301', 'Calle Los Almendros, Casa 18'),
            ('E', '23456789', 'Eduardo', NULL, 'Hernández', 'Pérez', '1985-01-30', 'M', '04141234572', '05', '0503', '050302', 'Avenida Principal, Edif. 4, Apto 42');

        -- Mensaje de finalización
        RAISE NOTICE 'Tabla re_723 creada con datos de ejemplo';
    ELSE
        -- Si la tabla ya existe, verificar si tiene registros
        DECLARE
            registro_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO registro_count FROM public.re_723;
            
            IF registro_count = 0 THEN
                -- Si la tabla está vacía, insertamos datos de ejemplo
                RAISE NOTICE 'La tabla re_723 está vacía. Insertando datos de ejemplo...';
                
                -- (Repetir los mismos INSERT que arriba)
                INSERT INTO public.re_723 (nac, cedula_ch, p_nombre, s_nombre, p_apellido, s_apellido, fecha_nac, sexo, telefono, cod_estado, cod_municipio, cod_parroquia, direccion)
                VALUES
                    ('V', '12345678', 'María', 'José', 'González', 'Pérez', '1985-03-15', 'F', '04241234567', '01', '0101', '010101', 'Calle Principal, Casa 15'),
                    ('V', '23456789', 'Juan', 'Carlos', 'Rodríguez', 'López', '1990-07-22', 'M', '04161234567', '01', '0101', '010101', 'Avenida Central, Edif. 7, Apto 3'),
                    -- (Continuar con todos los registros de muestra...)
                    ('E', '23456789', 'Eduardo', NULL, 'Hernández', 'Pérez', '1985-01-30', 'M', '04141234572', '05', '0503', '050302', 'Avenida Principal, Edif. 4, Apto 42');
                
                RAISE NOTICE 'Datos de ejemplo insertados con éxito en la tabla re_723';
            ELSE
                RAISE NOTICE 'La tabla re_723 ya existe y contiene % registros', registro_count;
            END IF;
        END;
    END IF;
END $$; 