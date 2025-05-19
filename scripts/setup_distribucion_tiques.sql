-- Script para configurar la tabla de distribución de tiques
-- Este script asegura que la secuencia y tabla existan correctamente
-- y también importa la función corregida para generar tiques desde la distribución

-- Verificar y crear la secuencia para distribucion_tiques
DO $$
BEGIN
    -- Verificar si la secuencia existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_sequences 
        WHERE schemaname = 'public' AND sequencename = 'distribucion_tiques_id_seq'
    ) THEN
        -- Crear la secuencia
        EXECUTE 'CREATE SEQUENCE IF NOT EXISTS public.distribucion_tiques_id_seq
            INCREMENT 1
            START 1
            MINVALUE 1
            MAXVALUE 2147483647
            CACHE 1';
        
        EXECUTE 'ALTER SEQUENCE public.distribucion_tiques_id_seq
            OWNER TO postgres';
            
        RAISE NOTICE 'Secuencia distribucion_tiques_id_seq creada correctamente';
    ELSE
        RAISE NOTICE 'La secuencia distribucion_tiques_id_seq ya existe';
    END IF;
    
    -- Verificar si la tabla existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'distribucion_tiques'
    ) THEN
        -- Crear la tabla
        EXECUTE 'CREATE TABLE IF NOT EXISTS public.distribucion_tiques
        (
            id integer NOT NULL DEFAULT nextval(''distribucion_tiques_id_seq''::regclass),
            sorteo_id integer NOT NULL,
            cod_estado integer NOT NULL,
            rango_desde integer NOT NULL,
            rango_hasta integer NOT NULL,
            cantidad integer NOT NULL,
            porcentaje numeric(5,2),
            fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT distribucion_tiques_pkey PRIMARY KEY (id),
            CONSTRAINT distribucion_tiques_sorteo_id_fkey FOREIGN KEY (sorteo_id)
                REFERENCES public.sorteos (id) MATCH SIMPLE
                ON UPDATE NO ACTION
                ON DELETE CASCADE,
            CONSTRAINT distribucion_tiques_cod_estado_fkey FOREIGN KEY (cod_estado)
                REFERENCES public.estados (cod_estado) MATCH SIMPLE
                ON UPDATE NO ACTION
                ON DELETE NO ACTION
        )';
        
        EXECUTE 'ALTER TABLE IF EXISTS public.distribucion_tiques
            OWNER to postgres';
            
        -- Crear los índices para mejorar el rendimiento
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_distribucion_tiques_sorteo
            ON public.distribucion_tiques USING btree
            (sorteo_id ASC NULLS LAST)';
            
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_distribucion_tiques_estado
            ON public.distribucion_tiques USING btree
            (cod_estado ASC NULLS LAST)';
        
        RAISE NOTICE 'Tabla distribucion_tiques creada correctamente';
    ELSE
        RAISE NOTICE 'La tabla distribucion_tiques ya existe';
    END IF;
END $$;

-- Ahora importamos la función corregida desde el archivo fix_distribucion_tiques.sql
\i 'D:/Sorteo_pueblo_valiente/scripts/fix_distribucion_tiques.sql'

-- Verificación final
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'distribucion_tiques'
) AS tabla_existe;

SELECT 
    table_schema AS esquema, 
    table_name AS tabla,
    string_agg(column_name, ', ') AS columnas
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' AND 
    table_name = 'distribucion_tiques'
GROUP BY 
    table_schema, table_name;

-- Verificar si la función existe
SELECT 
    proname AS nombre_funcion,
    pg_get_functiondef(oid) AS definicion
FROM 
    pg_proc 
WHERE 
    proname = 'generar_tiques_desde_distribucion' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'); 