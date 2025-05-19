-- Actualización de la función de validación de estados de sorteos
-- Esta función asegura que las transiciones entre estados sean válidas
-- y previene cambios de estado no permitidos

CREATE OR REPLACE FUNCTION validar_estado_sorteo()
RETURNS TRIGGER AS $$
BEGIN
    -- No permitir cambiar de 'finalizado' a otros estados
    IF OLD.estado_actual = 'finalizado' AND NEW.estado_actual != 'finalizado' THEN
        RAISE EXCEPTION 'No se puede modificar el estado de un sorteo finalizado';
    END IF;
    
    -- Validar transiciones de estado permitidas
    IF NOT (
        -- De borrador se puede pasar a programado o cancelado
        (OLD.estado_actual = 'borrador' AND NEW.estado_actual IN ('programado', 'cancelado')) OR
        
        -- De programado se puede pasar a en_progreso o cancelado
        (OLD.estado_actual = 'programado' AND NEW.estado_actual IN ('en_progreso', 'cancelado', 'borrador')) OR
        
        -- De en_progreso se puede pasar a finalizado, suspendido o cancelado
        (OLD.estado_actual = 'en_progreso' AND NEW.estado_actual IN ('finalizado', 'suspendido', 'programado')) OR
        
        -- De suspendido se puede volver a en_progreso o pasar a cancelado
        (OLD.estado_actual = 'suspendido' AND NEW.estado_actual IN ('en_progreso', 'cancelado')) OR
        
        -- Un sorteo cancelado puede volver a borrador para rehacerlo
        (OLD.estado_actual = 'cancelado' AND NEW.estado_actual = 'borrador') OR
        
        -- Si no se cambia el estado, permitir la actualización
        (OLD.estado_actual = NEW.estado_actual)
    ) THEN
        RAISE EXCEPTION 'Transición de estado no permitida: % a %', OLD.estado_actual, NEW.estado_actual;
    END IF;
    
    -- Registrar el cambio en el historial si existe la tabla
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'historial_estados'
    ) THEN
        INSERT INTO historial_estados (
            sorteo_id, 
            estado_anterior, 
            estado_nuevo, 
            fecha_cambio, 
            usuario_id
        ) VALUES (
            NEW.id,
            OLD.estado_actual,
            NEW.estado_actual,
            CURRENT_TIMESTAMP,
            COALESCE(current_setting('app.usuario_id', true)::integer, 1)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'La función de validación de estados ha sido actualizada correctamente.';
    RAISE NOTICE 'Las transiciones permitidas son:';
    RAISE NOTICE '* borrador -> programado, cancelado';
    RAISE NOTICE '* programado -> en_progreso, cancelado, borrador';
    RAISE NOTICE '* en_progreso -> finalizado, suspendido, programado';
    RAISE NOTICE '* suspendido -> en_progreso, cancelado';
    RAISE NOTICE '* cancelado -> borrador';
END $$; 