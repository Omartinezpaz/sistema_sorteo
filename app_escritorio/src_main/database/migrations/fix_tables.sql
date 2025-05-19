-- Asegurar que existan todas las columnas necesarias en la tabla premios
DO $$ 
BEGIN
    -- Agregar columna metadata si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'premios' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.premios ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Asegurar que exista la columna fecha_actualizacion
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'premios' 
        AND column_name = 'fecha_actualizacion'
    ) THEN
        ALTER TABLE public.premios ADD COLUMN fecha_actualizacion TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Asegurar que existan todas las columnas necesarias en la tabla participantes
DO $$ 
BEGIN
    -- Agregar columna fecha_creacion si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'participantes' 
        AND column_name = 'fecha_creacion'
    ) THEN
        ALTER TABLE public.participantes ADD COLUMN fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        -- Actualizar registros existentes
        UPDATE public.participantes SET fecha_creacion = CURRENT_TIMESTAMP WHERE fecha_creacion IS NULL;
    END IF;

    -- Agregar columna estado_id si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'participantes' 
        AND column_name = 'estado_id'
    ) THEN
        ALTER TABLE public.participantes ADD COLUMN estado_id INTEGER;
        -- Agregar la restricción de llave foránea
        ALTER TABLE public.participantes 
        ADD CONSTRAINT fk_participantes_estado 
        FOREIGN KEY (estado_id) REFERENCES estados(id);
    END IF;

    -- Agregar columna estado si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'participantes' 
        AND column_name = 'estado'
    ) THEN
        ALTER TABLE public.participantes ADD COLUMN estado VARCHAR(100);
        -- Actualizar estado basado en estado_id
        UPDATE public.participantes p 
        SET estado = e.nom_estado 
        FROM estados e 
        WHERE p.estado_id = e.id AND p.estado IS NULL;
    END IF;

    -- Agregar columna validado si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'participantes' 
        AND column_name = 'validado'
    ) THEN
        ALTER TABLE public.participantes ADD COLUMN validado BOOLEAN DEFAULT false;
    END IF;

    -- Agregar columna fecha_actualizacion si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'participantes' 
        AND column_name = 'fecha_actualizacion'
    ) THEN
        ALTER TABLE public.participantes ADD COLUMN fecha_actualizacion TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Eliminar participantes huérfanos (sin sorteo válido)
DELETE FROM public.participantes 
WHERE sorteo_id NOT IN (SELECT id FROM public.sorteos);

-- Crear o actualizar función para actualización automática de timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers de actualización de timestamp para cada tabla
DO $$ 
DECLARE
    tabla text;
BEGIN
    FOR tabla IN SELECT unnest(ARRAY['premios', 'participantes', 'sorteos', 'ganadores'])
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%I_timestamp ON public.%I', tabla, tabla);
        EXECUTE format('
            CREATE TRIGGER update_%I_timestamp
            BEFORE UPDATE ON public.%I
            FOR EACH ROW
            EXECUTE FUNCTION update_timestamp();
        ', tabla, tabla);
    END LOOP;
END $$; 