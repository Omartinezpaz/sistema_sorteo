SELECT id, nombre, fecha_creacion, fecha_sorteo, estado, descripcion
	FROM public.sorteos;

	
--  Usuarios/Administradores

   CREATE TABLE public.usuarios (
       id SERIAL PRIMARY KEY,
       username VARCHAR(50) UNIQUE NOT NULL,
       password_hash VARCHAR(255) NOT NULL,
       nombre_completo VARCHAR(100) NOT NULL,
       email VARCHAR(100) UNIQUE NOT NULL,
       rol VARCHAR(20) NOT NULL DEFAULT 'operador',
       activo BOOLEAN DEFAULT TRUE,
       ultimo_acceso TIMESTAMP,
       created_at TIMESTAMP DEFAULT NOW(),
       updated_at TIMESTAMP DEFAULT NOW()
   );

INSERT INTO public.usuarios (username, password_hash, nombre_completo, email, rol)
VALUES ('admin', '$2a$10$YnvJ0I3BMJUBlVKT8YG4DOFj5MlKwxBp0sG9JxEU4Z8M6J1QiCpMG', 'Administrador', 'admin@sorteo.com', 'admin');

-- Categorías de Premios (separada del JSON actual):

    CREATE TABLE public.categorias_premios (
       id SERIAL PRIMARY KEY,
       nombre VARCHAR(100) UNIQUE NOT NULL,
       descripcion TEXT,
       created_at TIMESTAMP DEFAULT NOW()
   );

INSERT INTO public.categorias_premios (nombre, descripcion)
VALUES 
('Electrodomésticos', 'Equipos para el hogar'),
('Electrónica', 'Equipos electrónicos y gadgets'),
('Vehículos', 'Carros, automoviles, camionetas cuatro ruedas'),
('Motos', 'motos, de cambios y automaticas diferentes cilindradas'),
('Viajes', 'Paquetes turísticos y viajes'),
('Efectivo', 'Premios en efectivo');

-- Estados/Municipios/Parroquias

   CREATE TABLE public.estados (
       id SERIAL PRIMARY KEY,
       nom_estado VARCHAR(100) NOT NULL,
       cod_estado integer  NOT NULL,
       nom_municipio VARCHAR(100) NOT NULL,
       cod_municipio integer NOT NULL,
       nom_parroquia VARCHAR(100) NOT NULL,
       cod_parroquia integer NOT NULL,
       activo BOOLEAN DEFAULT TRUE
   ); 

-- Ganadores (para seguimiento oficial)

   CREATE TABLE public.ganadores (
       id SERIAL PRIMARY KEY,
       sorteo_id INTEGER REFERENCES sorteos(id),
       participante_id INTEGER REFERENCES participantes(id),
       premio_id INTEGER REFERENCES premios(id),
       fecha_sorteo TIMESTAMP NOT NULL,
       validado BOOLEAN DEFAULT FALSE,
       informacion_contacto JSONB,
       created_at TIMESTAMP DEFAULT NOW()
   );

-- Registro de Actividades

   CREATE TABLE public.actividades (
       id SERIAL PRIMARY KEY,
       usuario_id INTEGER REFERENCES usuarios(id),
       accion VARCHAR(50) NOT NULL,
       tabla_afectada VARCHAR(50),
       registro_id INTEGER,
       detalles JSONB,
       ip_address VARCHAR(45),
       created_at TIMESTAMP DEFAULT NOW()
   );

--  Mejoras en tabla sorteos:

   ALTER TABLE public.sorteos 
   ADD COLUMN creado_por INTEGER REFERENCES public.usuarios(id),
   ADD COLUMN estado_actual VARCHAR(30) DEFAULT 'borrador',
   ADD COLUMN es_publico BOOLEAN DEFAULT FALSE,
   ADD COLUMN reglas TEXT,
   ADD COLUMN imagenes_json JSONB,
   ADD COLUMN metadata JSONB;

--  Mejoras en tabla premios

   ALTER TABLE public.premios
   ADD COLUMN categoria_id INTEGER REFERENCES public.categorias_premios(id),
   ADD COLUMN patrocinador VARCHAR(100),
   ADD COLUMN condiciones TEXT,
   ADD COLUMN fecha_entrega TIMESTAMP,
   ADD COLUMN images_json JSONB;

--  Mejoras en tabla participantes:

   ALTER TABLE public.participantes
   ADD COLUMN validado BOOLEAN DEFAULT FALSE,
   ADD COLUMN validado_por INTEGER REFERENCES public.usuarios(id),
   ADD COLUMN fecha_validacion TIMESTAMP,
   ADD COLUMN metodo_registro VARCHAR(30) DEFAULT 'manual',
   ADD COLUMN datos_adicionales JSONB;

   CREATE INDEX idx_estados_estado ON estados(nom_estado, cod_estado);
   CREATE INDEX idx_estados_municipio ON estados(nom_municipio, cod_municipio);
   CREATE INDEX idx_sorteos_fecha ON sorteos(fecha_sorteo);

-- Funciones Esenciales

-- 1. Función para registrar actividades automáticamente
 
CREATE OR REPLACE FUNCTION registrar_actividad()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.actividades (
        usuario_id, 
        accion, 
        tabla_afectada, 
        registro_id, 
        detalles,
        ip_address
    )
    VALUES (
        NEW.creado_por,
        TG_OP,  -- Operación que activó el trigger (INSERT, UPDATE, DELETE)
        TG_TABLE_NAME,
        NEW.id,
        to_jsonb(NEW),
        inet_client_addr()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Función para validar ganadores
 
CREATE OR REPLACE FUNCTION validar_ganador(
    p_ganador_id INTEGER,
    p_usuario_validador INTEGER,
    p_comentarios TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.ganadores
    SET 
        validado = TRUE,
        informacion_contacto = informacion_contacto || 
            jsonb_build_object(
                'validador_id', p_usuario_validador,
                'fecha_validacion', NOW(),
                'comentarios', p_comentarios
            )
    WHERE id = p_ganador_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 3. Función para contar participantes por sorteo
 
CREATE OR REPLACE FUNCTION contar_participantes_sorteo(p_sorteo_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    total_participantes INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_participantes
    FROM public.participantes
    WHERE sorteo_id = p_sorteo_id;
    
    RETURN total_participantes;
END;
$$ LANGUAGE plpgsql;
 

-- Triggers Recomendados
-- 1. Trigger para actualizar timestamps
 
CREATE OR REPLACE FUNCTION actualizar_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas las tablas relevantes
CREATE TRIGGER trg_usuarios_timestamps
BEFORE UPDATE ON public.usuarios
FOR EACH ROW EXECUTE FUNCTION actualizar_timestamps();

CREATE TRIGGER trg_sorteos_timestamps
BEFORE UPDATE ON public.sorteos
FOR EACH ROW EXECUTE FUNCTION actualizar_timestamps();
 

-- 2. Trigger para registro de actividades
 
-- Aplicar a tablas clave
CREATE TRIGGER trg_registro_actividades_sorteos
AFTER INSERT OR UPDATE OR DELETE ON public.sorteos
FOR EACH ROW EXECUTE FUNCTION registrar_actividad();

CREATE TRIGGER trg_registro_actividades_ganadores
AFTER INSERT OR UPDATE OR DELETE ON public.ganadores
FOR EACH ROW EXECUTE FUNCTION registrar_actividad();
 

-- 3. Trigger para validar cambios de estado en sorteos
 
CREATE OR REPLACE FUNCTION validar_estado_sorteo()
RETURNS TRIGGER AS $$
BEGIN
    -- No permitir cambiar de 'finalizado' a otros estados
    IF OLD.estado_actual = 'finalizado' AND NEW.estado_actual != 'finalizado' THEN
        RAISE EXCEPTION 'No se puede modificar el estado de un sorteo finalizado';
    END IF;
    
    -- Validar transiciones de estado permitidas
    IF NOT (
        (OLD.estado_actual = 'borrador' AND NEW.estado_actual IN ('programado', 'cancelado')) OR
        (OLD.estado_actual = 'programado' AND NEW.estado_actual IN ('en_progreso', 'cancelado')) OR
        (OLD.estado_actual = 'en_progreso' AND NEW.estado_actual IN ('finalizado', 'suspendido')) OR
        (OLD.estado_actual = 'suspendido' AND NEW.estado_actual IN ('en_progreso', 'cancelado'))
    ) THEN
        RAISE EXCEPTION 'Transición de estado no permitida: % a %', OLD.estado_actual, NEW.estado_actual;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_estado_sorteo
BEFORE UPDATE OF estado_actual ON public.sorteos
FOR EACH ROW EXECUTE FUNCTION validar_estado_sorteo();
 

-- Vistas Útiles para Reportes
-- 1. Vista de resumen de sorteos
 
CREATE OR REPLACE VIEW public.vw_resumen_sorteos AS
SELECT 
    s.id,
    s.nombre,
    s.fecha_sorteo,
    s.estado_actual,
    u.username AS creado_por,
    COUNT(p.id) AS total_participantes,
    COUNT(g.id) AS total_ganadores,
    s.es_publico
FROM 
    public.sorteos s
    LEFT JOIN public.usuarios u ON s.creado_por = u.id
    LEFT JOIN public.participantes p ON p.sorteo_id = s.id
    LEFT JOIN public.ganadores g ON g.sorteo_id = s.id
GROUP BY 
    s.id, u.username;
 

-- 2. Vista de detalle de ganadores
 
CREATE OR REPLACE VIEW public.vw_detalle_ganadores AS
SELECT 
    g.id,
    s.nombre AS sorteo,
    pr.nombre AS premio,
    cp.nombre AS categoria_premio,
    g.fecha_sorteo,
    g.validado,
    g.informacion_contacto->>'nombre' AS nombre_ganador,
    g.informacion_contacto->>'contacto' AS contacto_ganador,
    u.username AS validador
FROM 
    public.ganadores g
    JOIN public.sorteos s ON g.sorteo_id = s.id
    JOIN public.premios pr ON g.premio_id = pr.id
    LEFT JOIN public.categorias_premios cp ON pr.categoria_id = cp.id
    LEFT JOIN public.usuarios u ON (g.informacion_contacto->>'validador_id')::INTEGER = u.id;
 

-- 3. Vista de participación por región
 
CREATE OR REPLACE VIEW public.vw_participacion_region AS
SELECT 
    e.nom_estado AS estado,
    e.nom_municipio AS municipio,
    COUNT(p.id) AS total_participantes,
    COUNT(g.id) AS total_ganadores,
    ROUND(COUNT(g.id) * 100.0 / NULLIF(COUNT(p.id), 0), 2) AS porcentaje_ganancia
FROM 
    public.estados e
    LEFT JOIN public.participantes p ON 
        (p.datos_adicionales->>'cod_estado')::INTEGER = e.cod_estado AND
        (p.datos_adicionales->>'cod_municipio')::INTEGER = e.cod_municipio
    LEFT JOIN public.ganadores g ON g.participante_id = p.id
GROUP BY 
    e.nom_estado, e.nom_municipio
ORDER BY 
    e.nom_estado, e.nom_municipio;


-- Funciones Adicionales Recomendadas
-- 1. Función para realizar sorteos
 
CREATE OR REPLACE FUNCTION realizar_sorteo(
    p_sorteo_id INTEGER,
    p_usuario_id INTEGER
)
RETURNS JSONB AS $$
DECLARE
    v_resultado JSONB;
    v_premio RECORD;
    v_ganador RECORD;
BEGIN
    -- Verificar que el sorteo está en estado apropiado
    IF (SELECT estado_actual FROM public.sorteos WHERE id = p_sorteo_id) != 'en_progreso' THEN
        RAISE EXCEPTION 'El sorteo no está en estado "en_progreso"';
    END IF;
    
    -- Seleccionar un premio aleatorio disponible
    SELECT * INTO v_premio
    FROM public.premios
    WHERE sorteo_id = p_sorteo_id
    AND (fecha_entrega IS NULL OR fecha_entrega > NOW())
    ORDER BY RANDOM()
    LIMIT 1;
    
    IF v_premio IS NULL THEN
        RAISE EXCEPTION 'No hay premios disponibles para este sorteo';
    END IF;
    
    -- Seleccionar un participante aleatorio
    SELECT * INTO v_ganador
    FROM public.participantes
    WHERE sorteo_id = p_sorteo_id
    AND validado = TRUE
    ORDER BY RANDOM()
    LIMIT 1;
    
    IF v_ganador IS NULL THEN
        RAISE EXCEPTION 'No hay participantes válidos para este sorteo';
    END IF;
    
    -- Registrar al ganador
    INSERT INTO public.ganadores (
        sorteo_id,
        participante_id,
        premio_id,
        fecha_sorteo,
        informacion_contacto
    )
    VALUES (
        p_sorteo_id,
        v_ganador.id,
        v_premio.id,
        NOW(),
        jsonb_build_object(
            'nombre', v_ganador.nombre_completo,
            'contacto', v_ganador.email,
            'sorteo_realizado_por', p_usuario_id
        )
    )
    RETURNING jsonb_build_object(
        'ganador_id', id,
        'participante', v_ganador.nombre_completo,
        'premio', v_premio.nombre
    ) INTO v_resultado;
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;
 

-- 2. Función para generar reportes de auditoría
 
CREATE OR REPLACE FUNCTION generar_reporte_auditoria(
    p_fecha_inicio TIMESTAMP,
    p_fecha_fin TIMESTAMP,
    p_usuario_id INTEGER DEFAULT NULL
)
RETURNS TABLE (
    fecha_actividad TIMESTAMP,
    usuario TEXT,
    accion TEXT,
    tabla TEXT,
    registro_id INTEGER,
    detalles TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.created_at AS fecha_actividad,
        u.username AS usuario,
        a.accion,
        a.tabla_afectada AS tabla,
        a.registro_id,
        a.detalles::TEXT AS detalles
    FROM 
        public.actividades a
        JOIN public.usuarios u ON a.usuario_id = u.id
    WHERE 
        a.created_at BETWEEN p_fecha_inicio AND p_fecha_fin
        AND (p_usuario_id IS NULL OR a.usuario_id = p_usuario_id)
    ORDER BY 
        a.created_at DESC;
END;
$$ LANGUAGE plpgsql;
 
-- 1. **Índices adicionales**:
 
   CREATE INDEX idx_ganadores_sorteo ON ganadores(sorteo_id);
   CREATE INDEX idx_participantes_validado ON participantes(validado);
   CREATE INDEX idx_actividades_usuario_fecha ON actividades(usuario_id, created_at);


