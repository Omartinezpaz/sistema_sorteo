-- Función para validar las transiciones de estado de un sorteo
CREATE OR REPLACE FUNCTION public.validar_estado_sorteo()
    RETURNS trigger
    LANGUAGE 'plpgsql'
AS $BODY$
DECLARE
    transiciones_validas jsonb;
    estado_actual text;
    estado_nuevo text;
BEGIN
    -- Definir transiciones válidas
    transiciones_validas := '{
        "borrador": ["programado", "cancelado"],
        "programado": ["en_progreso", "cancelado", "borrador"],
        "en_progreso": ["finalizado", "programado"],
        "finalizado": ["en_progreso"],
        "cancelado": ["borrador"]
    }'::jsonb;
    
    estado_actual := OLD.estado_actual;
    estado_nuevo := NEW.estado_actual;
    
    -- Si no cambia el estado, permitir la actualización
    IF estado_actual = estado_nuevo THEN
        RETURN NEW;
    END IF;
    
    -- Verificar si la transición es válida
    IF estado_nuevo != ALL(transiciones_validas->estado_actual) THEN
        RAISE EXCEPTION 'Transición de estado no permitida: % a %', 
            estado_actual, estado_nuevo;
    END IF;
    
    -- Registrar el cambio en historial_estados si es necesario
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' 
               AND table_name = 'historial_estados') THEN
        INSERT INTO historial_estados (
            sorteo_id, 
            estado_anterior, 
            estado_nuevo, 
            fecha_cambio, 
            usuario_id
        ) VALUES (
            NEW.id,
            estado_actual,
            estado_nuevo,
            CURRENT_TIMESTAMP,
            COALESCE(current_setting('app.usuario_id', true)::integer, 1)
        );
    END IF;
    
    RETURN NEW;
END;
$BODY$;

-- Eliminar el trigger si existe
DROP TRIGGER IF EXISTS validar_estado_sorteo_trigger ON public.sorteos;

-- Crear el trigger
CREATE TRIGGER validar_estado_sorteo_trigger
    BEFORE UPDATE OF estado_actual
    ON public.sorteos
    FOR EACH ROW
    EXECUTE FUNCTION public.validar_estado_sorteo(); 