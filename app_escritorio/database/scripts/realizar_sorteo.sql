-- Función para realizar un sorteo y seleccionar ganadores aleatorios
CREATE OR REPLACE FUNCTION public.realizar_sorteo(
    p_sorteo_id integer,
    p_usuario_id integer)
    RETURNS jsonb
    LANGUAGE 'plpgsql'
AS $BODY$
DECLARE
    v_resultado JSONB;
    v_premio RECORD;
    v_participante RECORD;
    v_numero_ganador VARCHAR(10);
    v_estado VARCHAR(50);
    v_metadata JSONB;
BEGIN
    -- Verificar que el sorteo está en estado apropiado
    SELECT estado_actual, metadata::jsonb INTO STRICT v_estado, v_metadata
    FROM public.sorteos 
    WHERE id = p_sorteo_id;
    
    IF v_estado != 'en_progreso' THEN
        -- Actualizar estado automáticamente a "en_progreso"
        UPDATE public.sorteos
        SET estado_actual = 'en_progreso'
        WHERE id = p_sorteo_id;
    END IF;
    
    -- Seleccionar premio disponible según orden (el más valioso primero)
    SELECT * INTO v_premio
    FROM public.premios
    WHERE sorteo_id = p_sorteo_id
    AND id NOT IN (
        SELECT premio_id FROM public.ganadores WHERE sorteo_id = p_sorteo_id
    )
    ORDER BY valor DESC, id
    LIMIT 1;
    
    IF v_premio IS NULL THEN
        RAISE EXCEPTION 'No hay premios disponibles para este sorteo';
    END IF;
    
    -- Determinar si es un premio regional o nacional
    IF v_premio.ambito = 'regional' AND v_premio.estado IS NOT NULL THEN
        -- Para premio regional, seleccionar participante del estado específico
        SELECT * INTO v_participante
        FROM public.participantes
        WHERE sorteo_id = p_sorteo_id
        AND estado = v_premio.estado
        AND id NOT IN (
            SELECT participante_id FROM public.ganadores WHERE sorteo_id = p_sorteo_id
        )
        ORDER BY RANDOM()
        LIMIT 1;
    ELSE
        -- Para premio nacional, seleccionar cualquier participante
        SELECT * INTO v_participante
        FROM public.participantes
        WHERE sorteo_id = p_sorteo_id
        AND id NOT IN (
            SELECT participante_id FROM public.ganadores WHERE sorteo_id = p_sorteo_id
        )
        ORDER BY RANDOM()
        LIMIT 1;
    END IF;
    
    IF v_participante IS NULL THEN
        RAISE EXCEPTION 'No hay participantes válidos para este sorteo';
    END IF;
    
    -- Generar número de ticket ganador aleatorio (6 dígitos)
    v_numero_ganador := LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
    
    -- Registrar ganador
    INSERT INTO public.ganadores (
        sorteo_id,
        participante_id,
        premio_id,
        fecha_sorteo,
        numero_ganador,
        informacion_contacto
    )
    VALUES (
        p_sorteo_id,
        v_participante.id,
        v_premio.id,
        NOW(),
        v_numero_ganador,
        jsonb_build_object(
            'nombre_completo', CONCAT(v_participante.nombre, ' ', v_participante.apellido),
            'documento', v_participante.documento_identidad,
            'email', v_participante.email,
            'telefono', v_participante.telefono,
            'sorteo_realizado_por', p_usuario_id
        )
    )
    RETURNING jsonb_build_object(
        'ganador_id', id,
        'participante_id', participante_id,
        'premio_id', premio_id,
        'premio', (SELECT nombre FROM premios WHERE id = premio_id),
        'numero_ganador', numero_ganador,
        'estado', v_participante.estado,
        'ambito', v_premio.ambito
    ) INTO v_resultado;
    
    -- Verificar si ya no quedan más premios para asignar
    IF NOT EXISTS (
        SELECT 1 
        FROM public.premios 
        WHERE sorteo_id = p_sorteo_id
        AND id NOT IN (
            SELECT premio_id FROM public.ganadores WHERE sorteo_id = p_sorteo_id
        )
    ) THEN
        -- Si no quedan premios, cambiar estado del sorteo a "finalizado"
        UPDATE public.sorteos
        SET estado_actual = 'finalizado'
        WHERE id = p_sorteo_id;
    END IF;
    
    -- Registrar la actividad en el log
    INSERT INTO public.actividades (
        usuario_id, 
        accion, 
        tabla_afectada, 
        registro_id, 
        detalles
    )
    VALUES (
        p_usuario_id,
        'realizar_sorteo',
        'sorteos',
        p_sorteo_id,
        jsonb_build_object(
            'premio_id', v_premio.id,
            'premio_nombre', v_premio.nombre,
            'participante_id', v_participante.id,
            'numero_ganador', v_numero_ganador
        )
    );
    
    RETURN v_resultado;
END;
$BODY$;

-- Asegurar que el propietario sea postgres (o el usuario de BD adecuado)
ALTER FUNCTION public.realizar_sorteo(integer, integer)
    OWNER TO postgres; 