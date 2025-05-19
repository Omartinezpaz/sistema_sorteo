-- Table: public.actividades

-- DROP TABLE IF EXISTS public.actividades;

CREATE TABLE IF NOT EXISTS public.actividades
(
    id integer NOT NULL DEFAULT nextval('actividades_id_seq'::regclass),
    usuario_id integer,
    accion character varying(50) COLLATE pg_catalog."default" NOT NULL,
    tabla_afectada character varying(50) COLLATE pg_catalog."default",
    registro_id integer,
    detalles jsonb,
    ip_address character varying(45) COLLATE pg_catalog."default",
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT actividades_pkey PRIMARY KEY (id),
    CONSTRAINT actividades_usuario_id_fkey FOREIGN KEY (usuario_id)
        REFERENCES public.usuarios (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.actividades
    OWNER to postgres;
-- Index: idx_actividades_usuario_fecha

-- DROP INDEX IF EXISTS public.idx_actividades_usuario_fecha;

CREATE INDEX IF NOT EXISTS idx_actividades_usuario_fecha
    ON public.actividades USING btree
    (usuario_id ASC NULLS LAST, created_at ASC NULLS LAST)
    TABLESPACE pg_default;


-- Table: public.categorias_premios

-- DROP TABLE IF EXISTS public.categorias_premios;

CREATE TABLE IF NOT EXISTS public.categorias_premios
(
    id integer NOT NULL DEFAULT nextval('categorias_premios_id_seq'::regclass),
    nombre character varying(100) COLLATE pg_catalog."default" NOT NULL,
    descripcion text COLLATE pg_catalog."default",
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT categorias_premios_pkey PRIMARY KEY (id),
    CONSTRAINT categorias_premios_nombre_key UNIQUE (nombre)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.categorias_premios
    OWNER to postgres;

-- Table: public.estados

-- DROP TABLE IF EXISTS public.estados;

CREATE TABLE IF NOT EXISTS public.estados
(
    id integer NOT NULL DEFAULT nextval('estados_nuevos_id_seq'::regclass),
    cod_estado integer NOT NULL,
    nom_estado character varying(100) COLLATE pg_catalog."default" NOT NULL,
    activo boolean DEFAULT true,
    fecha_creacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT estados_nuevos_pkey PRIMARY KEY (id),
    CONSTRAINT uk_estados_codigo UNIQUE (cod_estado)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.estados
    OWNER to postgres;

GRANT ALL ON TABLE public.estados TO omarte WITH GRANT OPTION;

GRANT ALL ON TABLE public.estados TO postgres;

-- Trigger: actualizar_fecha_actualizacion_trigger

-- DROP TRIGGER IF EXISTS actualizar_fecha_actualizacion_trigger ON public.estados;

CREATE OR REPLACE TRIGGER actualizar_fecha_actualizacion_trigger
    BEFORE UPDATE 
    ON public.estados
    FOR EACH ROW
    EXECUTE FUNCTION public.actualizar_fecha_actualizacion();

-- Table: public.estados_old

-- DROP TABLE IF EXISTS public.estados_old;

CREATE TABLE IF NOT EXISTS public.estados_old
(
    id integer NOT NULL DEFAULT nextval('estados_id_seq'::regclass),
    nom_estado character varying(100) COLLATE pg_catalog."default" NOT NULL,
    cod_estado integer NOT NULL,
    nom_municipio character varying(100) COLLATE pg_catalog."default" NOT NULL,
    cod_municipio integer NOT NULL,
    nom_parroquia character varying(100) COLLATE pg_catalog."default" NOT NULL,
    cod_parroquia integer NOT NULL,
    activo boolean DEFAULT true,
    CONSTRAINT estados_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.estados_old
    OWNER to postgres;
-- Index: idx_estados_estado

-- DROP INDEX IF EXISTS public.idx_estados_estado;

CREATE INDEX IF NOT EXISTS idx_estados_estado
    ON public.estados_old USING btree
    (nom_estado COLLATE pg_catalog."default" ASC NULLS LAST, cod_estado ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_estados_municipio

-- DROP INDEX IF EXISTS public.idx_estados_municipio;

CREATE INDEX IF NOT EXISTS idx_estados_municipio
    ON public.estados_old USING btree
    (nom_municipio COLLATE pg_catalog."default" ASC NULLS LAST, cod_municipio ASC NULLS LAST)
    TABLESPACE pg_default;

-- Table: public.ganadores

-- DROP TABLE IF EXISTS public.ganadores;

CREATE TABLE IF NOT EXISTS public.ganadores
(
    id integer NOT NULL DEFAULT nextval('ganadores_id_seq'::regclass),
    sorteo_id integer,
    participante_id integer,
    premio_id integer,
    fecha_sorteo timestamp without time zone NOT NULL,
    validado boolean DEFAULT false,
    informacion_contacto jsonb,
    created_at timestamp without time zone DEFAULT now(),
    numero_ticket character varying(50) COLLATE pg_catalog."default",
    certificado_generado boolean DEFAULT false,
    notificado boolean DEFAULT false,
    fecha_notificacion timestamp without time zone,
    CONSTRAINT ganadores_pkey PRIMARY KEY (id),
    CONSTRAINT ganadores_participante_id_fkey FOREIGN KEY (participante_id)
        REFERENCES public.participantes (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT ganadores_premio_id_fkey FOREIGN KEY (premio_id)
        REFERENCES public.premios (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT ganadores_sorteo_id_fkey FOREIGN KEY (sorteo_id)
        REFERENCES public.sorteos (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.ganadores
    OWNER to postgres;
-- Index: idx_ganadores_sorteo

-- DROP INDEX IF EXISTS public.idx_ganadores_sorteo;

CREATE INDEX IF NOT EXISTS idx_ganadores_sorteo
    ON public.ganadores USING btree
    (sorteo_id ASC NULLS LAST)
    TABLESPACE pg_default;

-- Trigger: trg_registro_actividades_ganadores

-- DROP TRIGGER IF EXISTS trg_registro_actividades_ganadores ON public.ganadores;

CREATE OR REPLACE TRIGGER trg_registro_actividades_ganadores
    AFTER INSERT OR DELETE OR UPDATE 
    ON public.ganadores
    FOR EACH ROW
    EXECUTE FUNCTION public.registrar_actividad();


-- Table: public.municipios

-- DROP TABLE IF EXISTS public.municipios;

CREATE TABLE IF NOT EXISTS public.municipios
(
    id integer NOT NULL DEFAULT nextval('municipios_id_seq'::regclass),
    cod_municipio integer NOT NULL,
    nom_municipio character varying(100) COLLATE pg_catalog."default" NOT NULL,
    cod_estado integer NOT NULL,
    activo boolean DEFAULT true,
    fecha_creacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT municipios_pkey PRIMARY KEY (id),
    CONSTRAINT uk_municipios UNIQUE (cod_estado, cod_municipio),
    CONSTRAINT municipios_cod_estado_fkey FOREIGN KEY (cod_estado)
        REFERENCES public.estados (cod_estado) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.municipios
    OWNER to postgres;

GRANT ALL ON TABLE public.municipios TO omarte WITH GRANT OPTION;

GRANT ALL ON TABLE public.municipios TO postgres;

-- Trigger: actualizar_fecha_actualizacion_trigger

-- DROP TRIGGER IF EXISTS actualizar_fecha_actualizacion_trigger ON public.municipios;

CREATE OR REPLACE TRIGGER actualizar_fecha_actualizacion_trigger
    BEFORE UPDATE 
    ON public.municipios
    FOR EACH ROW
    EXECUTE FUNCTION public.actualizar_fecha_actualizacion();

-- Table: public.parroquias

-- DROP TABLE IF EXISTS public.parroquias;

CREATE TABLE IF NOT EXISTS public.parroquias
(
    id integer NOT NULL DEFAULT nextval('parroquias_id_seq'::regclass),
    cod_parroquia integer NOT NULL,
    nom_parroquia character varying(100) COLLATE pg_catalog."default" NOT NULL,
    cod_municipio integer NOT NULL,
    cod_estado integer NOT NULL,
    activo boolean DEFAULT true,
    fecha_creacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT parroquias_pkey PRIMARY KEY (id),
    CONSTRAINT uk_parroquias UNIQUE (cod_estado, cod_municipio, cod_parroquia),
    CONSTRAINT parroquias_cod_estado_cod_municipio_fkey FOREIGN KEY (cod_estado, cod_municipio)
        REFERENCES public.municipios (cod_estado, cod_municipio) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.parroquias
    OWNER to postgres;

GRANT ALL ON TABLE public.parroquias TO omarte WITH GRANT OPTION;

GRANT ALL ON TABLE public.parroquias TO postgres;

-- Trigger: actualizar_fecha_actualizacion_trigger

-- DROP TRIGGER IF EXISTS actualizar_fecha_actualizacion_trigger ON public.parroquias;

CREATE OR REPLACE TRIGGER actualizar_fecha_actualizacion_trigger
    BEFORE UPDATE 
    ON public.parroquias
    FOR EACH ROW
    EXECUTE FUNCTION public.actualizar_fecha_actualizacion();


-- Table: public.participantes

-- DROP TABLE IF EXISTS public.participantes;

CREATE TABLE IF NOT EXISTS public.participantes
(
    id integer NOT NULL DEFAULT nextval('participantes_id_seq'::regclass),
    sorteo_id integer,
    nombre character varying(255) COLLATE pg_catalog."default" NOT NULL,
    email character varying(255) COLLATE pg_catalog."default",
    telefono character varying(50) COLLATE pg_catalog."default",
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    validado boolean DEFAULT false,
    validado_por integer,
    fecha_validacion timestamp without time zone,
    metodo_registro character varying(30) COLLATE pg_catalog."default" DEFAULT 'manual'::character varying,
    datos_adicionales jsonb,
    apellido character varying(100) COLLATE pg_catalog."default",
    documento_identidad character varying(20) COLLATE pg_catalog."default",
    estado character varying(50) COLLATE pg_catalog."default",
    municipio character varying(100) COLLATE pg_catalog."default",
    parroquia character varying(100) COLLATE pg_catalog."default",
    direccion text COLLATE pg_catalog."default",
    CONSTRAINT participantes_pkey PRIMARY KEY (id),
    CONSTRAINT participantes_sorteo_id_fkey FOREIGN KEY (sorteo_id)
        REFERENCES public.sorteos (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT participantes_validado_por_fkey FOREIGN KEY (validado_por)
        REFERENCES public.usuarios (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.participantes
    OWNER to postgres;
-- Index: idx_participantes_documento

-- DROP INDEX IF EXISTS public.idx_participantes_documento;

CREATE INDEX IF NOT EXISTS idx_participantes_documento
    ON public.participantes USING btree
    (documento_identidad COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_participantes_estado

-- DROP INDEX IF EXISTS public.idx_participantes_estado;

CREATE INDEX IF NOT EXISTS idx_participantes_estado
    ON public.participantes USING btree
    (estado COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_participantes_sorteo

-- DROP INDEX IF EXISTS public.idx_participantes_sorteo;

CREATE INDEX IF NOT EXISTS idx_participantes_sorteo
    ON public.participantes USING btree
    (sorteo_id ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_participantes_validado

-- DROP INDEX IF EXISTS public.idx_participantes_validado;

CREATE INDEX IF NOT EXISTS idx_participantes_validado
    ON public.participantes USING btree
    (validado ASC NULLS LAST)
    TABLESPACE pg_default;


-- Table: public.plantillas_tiques

-- DROP TABLE IF EXISTS public.plantillas_tiques;

CREATE TABLE IF NOT EXISTS public.plantillas_tiques
(
    id integer NOT NULL DEFAULT nextval('plantillas_tiques_id_seq'::regclass),
    nombre_plantilla character varying(150) COLLATE pg_catalog."default" NOT NULL,
    usuario_id integer,
    configuracion jsonb NOT NULL,
    imagen_preview_url character varying(255) COLLATE pg_catalog."default",
    es_publica boolean DEFAULT false,
    tipo_tique character varying(50) COLLATE pg_catalog."default" DEFAULT 'general'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT plantillas_tiques_pkey PRIMARY KEY (id),
    CONSTRAINT plantillas_tiques_usuario_id_fkey FOREIGN KEY (usuario_id)
        REFERENCES public.usuarios (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE SET NULL
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.plantillas_tiques
    OWNER to postgres;

-- Table: public.premios

-- DROP TABLE IF EXISTS public.premios;

CREATE TABLE IF NOT EXISTS public.premios
(
    id integer NOT NULL DEFAULT nextval('premios_id_seq'::regclass),
    sorteo_id integer,
    nombre character varying(255) COLLATE pg_catalog."default" NOT NULL,
    descripcion text COLLATE pg_catalog."default",
    valor numeric(10,2),
    orden integer,
    categoria_id integer,
    patrocinador character varying(100) COLLATE pg_catalog."default",
    condiciones text COLLATE pg_catalog."default",
    fecha_entrega timestamp without time zone,
    images_json jsonb,
    ambito character varying(50) COLLATE pg_catalog."default",
    estado character varying(50) COLLATE pg_catalog."default",
    fecha_creacion timestamp without time zone DEFAULT now(),
    CONSTRAINT premios_pkey PRIMARY KEY (id),
    CONSTRAINT premios_categoria_id_fkey FOREIGN KEY (categoria_id)
        REFERENCES public.categorias_premios (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT premios_sorteo_id_fkey FOREIGN KEY (sorteo_id)
        REFERENCES public.sorteos (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.premios
    OWNER to postgres;
-- Index: idx_premios_sorteo

-- DROP INDEX IF EXISTS public.idx_premios_sorteo;

CREATE INDEX IF NOT EXISTS idx_premios_sorteo
    ON public.premios USING btree
    (sorteo_id ASC NULLS LAST)
    TABLESPACE pg_default;


-- Table: public.sorteos

-- DROP TABLE IF EXISTS public.sorteos;

CREATE TABLE IF NOT EXISTS public.sorteos
(
    id integer NOT NULL DEFAULT nextval('sorteos_id_seq'::regclass),
    nombre character varying(255) COLLATE pg_catalog."default" NOT NULL,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_sorteo timestamp without time zone,
    estado character varying(50) COLLATE pg_catalog."default",
    descripcion text COLLATE pg_catalog."default",
    creado_por integer,
    estado_actual character varying(30) COLLATE pg_catalog."default" DEFAULT 'borrador'::character varying,
    es_publico boolean DEFAULT false,
    reglas text COLLATE pg_catalog."default",
    imagenes_json jsonb,
    metadata jsonb,
    configuracion_diseno_tique jsonb,
    CONSTRAINT sorteos_pkey PRIMARY KEY (id),
    CONSTRAINT sorteos_creado_por_fkey FOREIGN KEY (creado_por)
        REFERENCES public.usuarios (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.sorteos
    OWNER to postgres;
-- Index: idx_sorteos_fecha

-- DROP INDEX IF EXISTS public.idx_sorteos_fecha;

CREATE INDEX IF NOT EXISTS idx_sorteos_fecha
    ON public.sorteos USING btree
    (fecha_sorteo ASC NULLS LAST)
    TABLESPACE pg_default;

-- Trigger: trg_registro_actividades_sorteos

-- DROP TRIGGER IF EXISTS trg_registro_actividades_sorteos ON public.sorteos;

CREATE OR REPLACE TRIGGER trg_registro_actividades_sorteos
    AFTER INSERT OR DELETE OR UPDATE 
    ON public.sorteos
    FOR EACH ROW
    EXECUTE FUNCTION public.registrar_actividad();

-- Trigger: trg_validar_estado_sorteo

-- DROP TRIGGER IF EXISTS trg_validar_estado_sorteo ON public.sorteos;

CREATE OR REPLACE TRIGGER trg_validar_estado_sorteo
    BEFORE UPDATE OF estado_actual
    ON public.sorteos
    FOR EACH ROW
    EXECUTE FUNCTION public.validar_estado_sorteo();

-- Table: public.usuarios

-- DROP TABLE IF EXISTS public.usuarios;

CREATE TABLE IF NOT EXISTS public.usuarios
(
    id integer NOT NULL DEFAULT nextval('usuarios_id_seq'::regclass),
    username character varying(50) COLLATE pg_catalog."default" NOT NULL,
    password_hash character varying(255) COLLATE pg_catalog."default" NOT NULL,
    nombre_completo character varying(100) COLLATE pg_catalog."default" NOT NULL,
    email character varying(100) COLLATE pg_catalog."default" NOT NULL,
    rol character varying(20) COLLATE pg_catalog."default" NOT NULL DEFAULT 'operador'::character varying,
    activo boolean DEFAULT true,
    ultimo_acceso timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT usuarios_pkey PRIMARY KEY (id),
    CONSTRAINT usuarios_email_key UNIQUE (email),
    CONSTRAINT usuarios_username_key UNIQUE (username)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.usuarios
    OWNER to postgres;

-- Type: tipo_distribucion

-- DROP TYPE IF EXISTS public.tipo_distribucion;

CREATE TYPE public.tipo_distribucion AS
(
	cod_estado integer,
	nom_estado text,
	cod_municipio integer,
	nom_municipio text,
	cod_parroquia integer,
	nom_parroquia text,
	poblacion integer,
	porcentaje numeric,
	tickets_asignados integer
);

ALTER TYPE public.tipo_distribucion
    OWNER TO postgres;

-- SEQUENCE: public.actividades_id_seq

-- DROP SEQUENCE IF EXISTS public.actividades_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.actividades_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.actividades_id_seq
    OWNED BY public.actividades.id;

ALTER SEQUENCE public.actividades_id_seq
    OWNER TO postgres;

-- SEQUENCE: public.categorias_premios_id_seq

-- DROP SEQUENCE IF EXISTS public.categorias_premios_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.categorias_premios_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.categorias_premios_id_seq
    OWNED BY public.categorias_premios.id;

ALTER SEQUENCE public.categorias_premios_id_seq
    OWNER TO postgres;

-- SEQUENCE: public.estados_id_seq

-- DROP SEQUENCE IF EXISTS public.estados_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.estados_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.estados_id_seq
    OWNED BY public.estados_old.id;

ALTER SEQUENCE public.estados_id_seq
    OWNER TO postgres;

-- SEQUENCE: public.estados_nuevos_id_seq

-- DROP SEQUENCE IF EXISTS public.estados_nuevos_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.estados_nuevos_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.estados_nuevos_id_seq
    OWNED BY public.estados.id;

ALTER SEQUENCE public.estados_nuevos_id_seq
    OWNER TO postgres;

-- SEQUENCE: public.ganadores_id_seq

-- DROP SEQUENCE IF EXISTS public.ganadores_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.ganadores_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.ganadores_id_seq
    OWNED BY public.ganadores.id;

ALTER SEQUENCE public.ganadores_id_seq
    OWNER TO postgres;

-- SEQUENCE: public.municipios_id_seq

-- DROP SEQUENCE IF EXISTS public.municipios_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.municipios_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.municipios_id_seq
    OWNED BY public.municipios.id;

ALTER SEQUENCE public.municipios_id_seq
    OWNER TO postgres;


-- SEQUENCE: public.parroquias_id_seq

-- DROP SEQUENCE IF EXISTS public.parroquias_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.parroquias_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.parroquias_id_seq
    OWNED BY public.parroquias.id;

ALTER SEQUENCE public.parroquias_id_seq
    OWNER TO postgres;

-- SEQUENCE: public.participantes_id_seq

-- DROP SEQUENCE IF EXISTS public.participantes_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.participantes_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.participantes_id_seq
    OWNED BY public.participantes.id;

ALTER SEQUENCE public.participantes_id_seq
    OWNER TO postgres;

-- SEQUENCE: public.plantillas_tiques_id_seq

-- DROP SEQUENCE IF EXISTS public.plantillas_tiques_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.plantillas_tiques_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.plantillas_tiques_id_seq
    OWNED BY public.plantillas_tiques.id;

ALTER SEQUENCE public.plantillas_tiques_id_seq
    OWNER TO postgres;

-- SEQUENCE: public.premios_id_seq

-- DROP SEQUENCE IF EXISTS public.premios_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.premios_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.premios_id_seq
    OWNED BY public.premios.id;

ALTER SEQUENCE public.premios_id_seq
    OWNER TO postgres;

-- SEQUENCE: public.sorteos_id_seq

-- DROP SEQUENCE IF EXISTS public.sorteos_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.sorteos_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.sorteos_id_seq
    OWNED BY public.sorteos.id;

ALTER SEQUENCE public.sorteos_id_seq
    OWNER TO postgres;

-- SEQUENCE: public.usuarios_id_seq

-- DROP SEQUENCE IF EXISTS public.usuarios_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.usuarios_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.usuarios_id_seq
    OWNED BY public.usuarios.id;

ALTER SEQUENCE public.usuarios_id_seq
    OWNER TO postgres;

-- FUNCTION: public.contar_participantes_sorteo(integer)

-- DROP FUNCTION IF EXISTS public.contar_participantes_sorteo(integer);

CREATE OR REPLACE FUNCTION public.contar_participantes_sorteo(
	p_sorteo_id integer)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE
    total_participantes INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_participantes
    FROM public.participantes
    WHERE sorteo_id = p_sorteo_id;
    
    RETURN total_participantes;
END;
$BODY$;

ALTER FUNCTION public.contar_participantes_sorteo(integer)
    OWNER TO postgres;


-- FUNCTION: public.distribuir_tickets_con_tipo(integer, text, integer[])

-- DROP FUNCTION IF EXISTS public.distribuir_tickets_con_tipo(integer, text, integer[]);

CREATE OR REPLACE FUNCTION public.distribuir_tickets_con_tipo(
	p_total_tickets integer,
	p_nivel_detalle text,
	p_territorio_ids integer[])
    RETURNS SETOF tipo_distribucion 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
DECLARE
  v_total_poblacion INTEGER := 0;
  v_tickets_asignados INTEGER := 0;
  v_tickets_restantes INTEGER := 0;
  v_territorio tipo_distribucion;
  v_territorio_mayor_poblacion tipo_distribucion;
  v_max_poblacion INTEGER := 0;
  v_temp RECORD;
BEGIN
  -- Calcular la población total de los territorios seleccionados
  IF p_nivel_detalle = 'estado' THEN
    SELECT SUM(poblacion) INTO v_total_poblacion
    FROM estados
    WHERE cod_estado = ANY(p_territorio_ids);
  ELSIF p_nivel_detalle = 'municipio' THEN
    SELECT SUM(m.poblacion) INTO v_total_poblacion
    FROM municipios m
    WHERE m.cod_municipio = ANY(p_territorio_ids);
  ELSIF p_nivel_detalle = 'parroquia' THEN
    SELECT SUM(p.poblacion) INTO v_total_poblacion
    FROM parroquias p
    WHERE p.cod_parroquia = ANY(p_territorio_ids);
  END IF;
  
  -- Si no hay población o es cero, distribuir equitativamente
  IF v_total_poblacion IS NULL OR v_total_poblacion = 0 THEN
    v_total_poblacion := array_length(p_territorio_ids, 1);
    
    -- Distribuir tickets equitativamente
    IF p_nivel_detalle = 'estado' THEN
      FOR v_temp IN 
        SELECT e.cod_estado, e.nom_estado, NULL::INTEGER AS cod_municipio, 
               NULL::TEXT AS nom_municipio, NULL::INTEGER AS cod_parroquia, 
               NULL::TEXT AS nom_parroquia, e.poblacion
        FROM estados e
        WHERE e.cod_estado = ANY(p_territorio_ids)
        ORDER BY e.nom_estado
      LOOP
        -- Preparar el registro para retornar
        v_territorio.cod_estado := v_temp.cod_estado;
        v_territorio.nom_estado := v_temp.nom_estado;
        v_territorio.cod_municipio := v_temp.cod_municipio;
        v_territorio.nom_municipio := v_temp.nom_municipio;
        v_territorio.cod_parroquia := v_temp.cod_parroquia;
        v_territorio.nom_parroquia := v_temp.nom_parroquia;
        v_territorio.poblacion := v_temp.poblacion;
        v_territorio.porcentaje := 1.0 / v_total_poblacion;
        v_territorio.tickets_asignados := floor(p_total_tickets / v_total_poblacion);
        
        v_tickets_asignados := v_tickets_asignados + v_territorio.tickets_asignados;
        
        -- Guardar el territorio con mayor población
        IF v_territorio.poblacion > v_max_poblacion THEN
          v_max_poblacion := v_territorio.poblacion;
          v_territorio_mayor_poblacion := v_territorio;
        END IF;
        
        -- Retornar el registro completo
        RETURN NEXT v_territorio;
      END LOOP;
    ELSIF p_nivel_detalle = 'municipio' THEN
      FOR v_temp IN 
        SELECT e.cod_estado, e.nom_estado, m.cod_municipio, m.nom_municipio, 
               NULL::INTEGER AS cod_parroquia, NULL::TEXT AS nom_parroquia, m.poblacion
        FROM municipios m
        JOIN estados e ON e.cod_estado = m.cod_estado
        WHERE m.cod_municipio = ANY(p_territorio_ids)
        ORDER BY e.nom_estado, m.nom_municipio
      LOOP
        -- Preparar el registro para retornar
        v_territorio.cod_estado := v_temp.cod_estado;
        v_territorio.nom_estado := v_temp.nom_estado;
        v_territorio.cod_municipio := v_temp.cod_municipio;
        v_territorio.nom_municipio := v_temp.nom_municipio;
        v_territorio.cod_parroquia := v_temp.cod_parroquia;
        v_territorio.nom_parroquia := v_temp.nom_parroquia;
        v_territorio.poblacion := v_temp.poblacion;
        v_territorio.porcentaje := 1.0 / v_total_poblacion;
        v_territorio.tickets_asignados := floor(p_total_tickets / v_total_poblacion);
        
        v_tickets_asignados := v_tickets_asignados + v_territorio.tickets_asignados;
        
        -- Guardar el territorio con mayor población
        IF v_territorio.poblacion > v_max_poblacion THEN
          v_max_poblacion := v_territorio.poblacion;
          v_territorio_mayor_poblacion := v_territorio;
        END IF;
        
        -- Retornar el registro completo
        RETURN NEXT v_territorio;
      END LOOP;
    ELSIF p_nivel_detalle = 'parroquia' THEN
      FOR v_temp IN 
        SELECT e.cod_estado, e.nom_estado, m.cod_municipio, m.nom_municipio, 
               p.cod_parroquia, p.nom_parroquia, p.poblacion
        FROM parroquias p
        JOIN municipios m ON m.cod_municipio = p.cod_municipio AND m.cod_estado = p.cod_estado
        JOIN estados e ON e.cod_estado = p.cod_estado
        WHERE p.cod_parroquia = ANY(p_territorio_ids)
        ORDER BY e.nom_estado, m.nom_municipio, p.nom_parroquia
      LOOP
        -- Preparar el registro para retornar
        v_territorio.cod_estado := v_temp.cod_estado;
        v_territorio.nom_estado := v_temp.nom_estado;
        v_territorio.cod_municipio := v_temp.cod_municipio;
        v_territorio.nom_municipio := v_temp.nom_municipio;
        v_territorio.cod_parroquia := v_temp.cod_parroquia;
        v_territorio.nom_parroquia := v_temp.nom_parroquia;
        v_territorio.poblacion := v_temp.poblacion;
        v_territorio.porcentaje := 1.0 / v_total_poblacion;
        v_territorio.tickets_asignados := floor(p_total_tickets / v_total_poblacion);
        
        v_tickets_asignados := v_tickets_asignados + v_territorio.tickets_asignados;
        
        -- Guardar el territorio con mayor población
        IF v_territorio.poblacion > v_max_poblacion THEN
          v_max_poblacion := v_territorio.poblacion;
          v_territorio_mayor_poblacion := v_territorio;
        END IF;
        
        -- Retornar el registro completo
        RETURN NEXT v_territorio;
      END LOOP;
    END IF;
  ELSE
    -- Distribuir tickets proporcionalmente según población
    IF p_nivel_detalle = 'estado' THEN
      FOR v_temp IN 
        SELECT e.cod_estado, e.nom_estado, NULL::INTEGER AS cod_municipio, 
               NULL::TEXT AS nom_municipio, NULL::INTEGER AS cod_parroquia, 
               NULL::TEXT AS nom_parroquia, e.poblacion
        FROM estados e
        WHERE e.cod_estado = ANY(p_territorio_ids)
        ORDER BY e.nom_estado
      LOOP
        -- Preparar el registro para retornar
        v_territorio.cod_estado := v_temp.cod_estado;
        v_territorio.nom_estado := v_temp.nom_estado;
        v_territorio.cod_municipio := v_temp.cod_municipio;
        v_territorio.nom_municipio := v_temp.nom_municipio;
        v_territorio.cod_parroquia := v_temp.cod_parroquia;
        v_territorio.nom_parroquia := v_temp.nom_parroquia;
        v_territorio.poblacion := v_temp.poblacion;
        v_territorio.porcentaje := COALESCE(v_territorio.poblacion::NUMERIC / v_total_poblacion, 0);
        v_territorio.tickets_asignados := floor(p_total_tickets * v_territorio.porcentaje);
        
        v_tickets_asignados := v_tickets_asignados + v_territorio.tickets_asignados;
        
        -- Guardar el territorio con mayor población
        IF v_territorio.poblacion > v_max_poblacion THEN
          v_max_poblacion := v_territorio.poblacion;
          v_territorio_mayor_poblacion := v_territorio;
        END IF;
        
        -- Retornar el registro completo
        RETURN NEXT v_territorio;
      END LOOP;
    ELSIF p_nivel_detalle = 'municipio' THEN
      FOR v_temp IN 
        SELECT e.cod_estado, e.nom_estado, m.cod_municipio, m.nom_municipio, 
               NULL::INTEGER AS cod_parroquia, NULL::TEXT AS nom_parroquia, m.poblacion
        FROM municipios m
        JOIN estados e ON e.cod_estado = m.cod_estado
        WHERE m.cod_municipio = ANY(p_territorio_ids)
        ORDER BY e.nom_estado, m.nom_municipio
      LOOP
        -- Preparar el registro para retornar
        v_territorio.cod_estado := v_temp.cod_estado;
        v_territorio.nom_estado := v_temp.nom_estado;
        v_territorio.cod_municipio := v_temp.cod_municipio;
        v_territorio.nom_municipio := v_temp.nom_municipio;
        v_territorio.cod_parroquia := v_temp.cod_parroquia;
        v_territorio.nom_parroquia := v_temp.nom_parroquia;
        v_territorio.poblacion := v_temp.poblacion;
        v_territorio.porcentaje := COALESCE(v_territorio.poblacion::NUMERIC / v_total_poblacion, 0);
        v_territorio.tickets_asignados := floor(p_total_tickets * v_territorio.porcentaje);
        
        v_tickets_asignados := v_tickets_asignados + v_territorio.tickets_asignados;
        
        -- Guardar el territorio con mayor población
        IF v_territorio.poblacion > v_max_poblacion THEN
          v_max_poblacion := v_territorio.poblacion;
          v_territorio_mayor_poblacion := v_territorio;
        END IF;
        
        -- Retornar el registro completo
        RETURN NEXT v_territorio;
      END LOOP;
    ELSIF p_nivel_detalle = 'parroquia' THEN
      FOR v_temp IN 
        SELECT e.cod_estado, e.nom_estado, m.cod_municipio, m.nom_municipio, 
               p.cod_parroquia, p.nom_parroquia, p.poblacion
        FROM parroquias p
        JOIN municipios m ON m.cod_municipio = p.cod_municipio AND m.cod_estado = p.cod_estado
        JOIN estados e ON e.cod_estado = p.cod_estado
        WHERE p.cod_parroquia = ANY(p_territorio_ids)
        ORDER BY e.nom_estado, m.nom_municipio, p.nom_parroquia
      LOOP
        -- Preparar el registro para retornar
        v_territorio.cod_estado := v_temp.cod_estado;
        v_territorio.nom_estado := v_temp.nom_estado;
        v_territorio.cod_municipio := v_temp.cod_municipio;
        v_territorio.nom_municipio := v_temp.nom_municipio;
        v_territorio.cod_parroquia := v_temp.cod_parroquia;
        v_territorio.nom_parroquia := v_temp.nom_parroquia;
        v_territorio.poblacion := v_temp.poblacion;
        v_territorio.porcentaje := COALESCE(v_territorio.poblacion::NUMERIC / v_total_poblacion, 0);
        v_territorio.tickets_asignados := floor(p_total_tickets * v_territorio.porcentaje);
        
        v_tickets_asignados := v_tickets_asignados + v_territorio.tickets_asignados;
        
        -- Guardar el territorio con mayor población
        IF v_territorio.poblacion > v_max_poblacion THEN
          v_max_poblacion := v_territorio.poblacion;
          v_territorio_mayor_poblacion := v_territorio;
        END IF;
        
        -- Retornar el registro completo
        RETURN NEXT v_territorio;
      END LOOP;
    END IF;
  END IF;
  
  -- Manejar los tickets restantes por redondeo
  v_tickets_restantes := p_total_tickets - v_tickets_asignados;
  
  -- Si hay tickets restantes, agregarlos al territorio con mayor población
  IF v_tickets_restantes > 0 AND v_tickets_asignados > 0 AND v_max_poblacion > 0 THEN
    -- Crear registro adicional para los tickets restantes
    v_territorio := v_territorio_mayor_poblacion;
    v_territorio.tickets_asignados := v_tickets_restantes;
    
    -- Retornar el registro adicional
    RETURN NEXT v_territorio;
  END IF;
  
  RETURN;
END;
$BODY$;

ALTER FUNCTION public.distribuir_tickets_con_tipo(integer, text, integer[])
    OWNER TO postgres;


-- FUNCTION: public.distribuir_tickets_por_territorio(integer, text, integer[])

-- DROP FUNCTION IF EXISTS public.distribuir_tickets_por_territorio(integer, text, integer[]);

CREATE OR REPLACE FUNCTION public.distribuir_tickets_por_territorio(
	p_total_tickets integer,
	p_nivel_detalle text,
	p_territorio_ids integer[],
	OUT cod_estado integer,
	OUT nom_estado text,
	OUT cod_municipio integer,
	OUT nom_municipio text,
	OUT cod_parroquia integer,
	OUT nom_parroquia text,
	OUT poblacion integer,
	OUT porcentaje numeric,
	OUT tickets_asignados integer)
    RETURNS SETOF record 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
DECLARE
  v_total_poblacion INTEGER := 0;
  v_tickets_asignados INTEGER := 0;
  v_tickets_restantes INTEGER := 0;
  v_territorio RECORD;
  v_territorio_mayor_poblacion RECORD;
  v_max_poblacion INTEGER := 0;
BEGIN
  -- Calcular la población total de los territorios seleccionados
  IF p_nivel_detalle = 'estado' THEN
    SELECT SUM(poblacion) INTO v_total_poblacion
    FROM estados
    WHERE cod_estado = ANY(p_territorio_ids);
  ELSIF p_nivel_detalle = 'municipio' THEN
    SELECT SUM(m.poblacion) INTO v_total_poblacion
    FROM municipios m
    WHERE m.cod_municipio = ANY(p_territorio_ids);
  ELSIF p_nivel_detalle = 'parroquia' THEN
    SELECT SUM(p.poblacion) INTO v_total_poblacion
    FROM parroquias p
    WHERE p.cod_parroquia = ANY(p_territorio_ids);
  END IF;
  
  -- Si no hay población o es cero, distribuir equitativamente
  IF v_total_poblacion IS NULL OR v_total_poblacion = 0 THEN
    v_total_poblacion := array_length(p_territorio_ids, 1);
    
    -- Distribuir tickets equitativamente
    IF p_nivel_detalle = 'estado' THEN
      FOR v_territorio IN 
        SELECT e.cod_estado, e.nom_estado, NULL::INTEGER AS cod_municipio, 
               NULL::TEXT AS nom_municipio, NULL::INTEGER AS cod_parroquia, 
               NULL::TEXT AS nom_parroquia, e.poblacion
        FROM estados e
        WHERE e.cod_estado = ANY(p_territorio_ids)
        ORDER BY e.nom_estado
      LOOP
        -- Guardar el territorio con mayor población
        IF v_territorio.poblacion > v_max_poblacion THEN
          v_max_poblacion := v_territorio.poblacion;
          v_territorio_mayor_poblacion := v_territorio;
        END IF;
        
        -- Calcular tickets asignados y asignarlos a la variable OUT
        cod_estado := v_territorio.cod_estado;
        nom_estado := v_territorio.nom_estado;
        cod_municipio := v_territorio.cod_municipio;
        nom_municipio := v_territorio.nom_municipio;
        cod_parroquia := v_territorio.cod_parroquia;
        nom_parroquia := v_territorio.nom_parroquia;
        poblacion := v_territorio.poblacion;
        porcentaje := 1.0 / v_total_poblacion;
        tickets_asignados := floor(p_total_tickets / v_total_poblacion);
        v_tickets_asignados := v_tickets_asignados + tickets_asignados;
        
        RETURN NEXT;
      END LOOP;
    ELSIF p_nivel_detalle = 'municipio' THEN
      FOR v_territorio IN 
        SELECT e.cod_estado, e.nom_estado, m.cod_municipio, m.nom_municipio, 
               NULL::INTEGER AS cod_parroquia, NULL::TEXT AS nom_parroquia, m.poblacion
        FROM municipios m
        JOIN estados e ON e.cod_estado = m.cod_estado
        WHERE m.cod_municipio = ANY(p_territorio_ids)
        ORDER BY e.nom_estado, m.nom_municipio
      LOOP
        -- Guardar el territorio con mayor población
        IF v_territorio.poblacion > v_max_poblacion THEN
          v_max_poblacion := v_territorio.poblacion;
          v_territorio_mayor_poblacion := v_territorio;
        END IF;
        
        -- Calcular tickets asignados y asignarlos a la variable OUT
        cod_estado := v_territorio.cod_estado;
        nom_estado := v_territorio.nom_estado;
        cod_municipio := v_territorio.cod_municipio;
        nom_municipio := v_territorio.nom_municipio;
        cod_parroquia := v_territorio.cod_parroquia;
        nom_parroquia := v_territorio.nom_parroquia;
        poblacion := v_territorio.poblacion;
        porcentaje := 1.0 / v_total_poblacion;
        tickets_asignados := floor(p_total_tickets / v_total_poblacion);
        v_tickets_asignados := v_tickets_asignados + tickets_asignados;
        
        RETURN NEXT;
      END LOOP;
    ELSIF p_nivel_detalle = 'parroquia' THEN
      FOR v_territorio IN 
        SELECT e.cod_estado, e.nom_estado, m.cod_municipio, m.nom_municipio, 
               p.cod_parroquia, p.nom_parroquia, p.poblacion
        FROM parroquias p
        JOIN municipios m ON m.cod_municipio = p.cod_municipio AND m.cod_estado = p.cod_estado
        JOIN estados e ON e.cod_estado = p.cod_estado
        WHERE p.cod_parroquia = ANY(p_territorio_ids)
        ORDER BY e.nom_estado, m.nom_municipio, p.nom_parroquia
      LOOP
        -- Guardar el territorio con mayor población
        IF v_territorio.poblacion > v_max_poblacion THEN
          v_max_poblacion := v_territorio.poblacion;
          v_territorio_mayor_poblacion := v_territorio;
        END IF;
        
        -- Calcular tickets asignados y asignarlos a la variable OUT
        cod_estado := v_territorio.cod_estado;
        nom_estado := v_territorio.nom_estado;
        cod_municipio := v_territorio.cod_municipio;
        nom_municipio := v_territorio.nom_municipio;
        cod_parroquia := v_territorio.cod_parroquia;
        nom_parroquia := v_territorio.nom_parroquia;
        poblacion := v_territorio.poblacion;
        porcentaje := 1.0 / v_total_poblacion;
        tickets_asignados := floor(p_total_tickets / v_total_poblacion);
        v_tickets_asignados := v_tickets_asignados + tickets_asignados;
        
        RETURN NEXT;
      END LOOP;
    END IF;
  ELSE
    -- Distribuir tickets proporcionalmente según población
    IF p_nivel_detalle = 'estado' THEN
      FOR v_territorio IN 
        SELECT e.cod_estado, e.nom_estado, NULL::INTEGER AS cod_municipio, 
               NULL::TEXT AS nom_municipio, NULL::INTEGER AS cod_parroquia, 
               NULL::TEXT AS nom_parroquia, e.poblacion
        FROM estados e
        WHERE e.cod_estado = ANY(p_territorio_ids)
        ORDER BY e.nom_estado
      LOOP
        -- Guardar el territorio con mayor población
        IF v_territorio.poblacion > v_max_poblacion THEN
          v_max_poblacion := v_territorio.poblacion;
          v_territorio_mayor_poblacion := v_territorio;
        END IF;
        
        -- Calcular tickets asignados y asignarlos a la variable OUT
        cod_estado := v_territorio.cod_estado;
        nom_estado := v_territorio.nom_estado;
        cod_municipio := v_territorio.cod_municipio;
        nom_municipio := v_territorio.nom_municipio;
        cod_parroquia := v_territorio.cod_parroquia;
        nom_parroquia := v_territorio.nom_parroquia;
        poblacion := v_territorio.poblacion;
        porcentaje := COALESCE(v_territorio.poblacion::NUMERIC / v_total_poblacion, 0);
        tickets_asignados := floor(p_total_tickets * porcentaje);
        v_tickets_asignados := v_tickets_asignados + tickets_asignados;
        
        RETURN NEXT;
      END LOOP;
    ELSIF p_nivel_detalle = 'municipio' THEN
      FOR v_territorio IN 
        SELECT e.cod_estado, e.nom_estado, m.cod_municipio, m.nom_municipio, 
               NULL::INTEGER AS cod_parroquia, NULL::TEXT AS nom_parroquia, m.poblacion
        FROM municipios m
        JOIN estados e ON e.cod_estado = m.cod_estado
        WHERE m.cod_municipio = ANY(p_territorio_ids)
        ORDER BY e.nom_estado, m.nom_municipio
      LOOP
        -- Guardar el territorio con mayor población
        IF v_territorio.poblacion > v_max_poblacion THEN
          v_max_poblacion := v_territorio.poblacion;
          v_territorio_mayor_poblacion := v_territorio;
        END IF;
        
        -- Calcular tickets asignados y asignarlos a la variable OUT
        cod_estado := v_territorio.cod_estado;
        nom_estado := v_territorio.nom_estado;
        cod_municipio := v_territorio.cod_municipio;
        nom_municipio := v_territorio.nom_municipio;
        cod_parroquia := v_territorio.cod_parroquia;
        nom_parroquia := v_territorio.nom_parroquia;
        poblacion := v_territorio.poblacion;
        porcentaje := COALESCE(v_territorio.poblacion::NUMERIC / v_total_poblacion, 0);
        tickets_asignados := floor(p_total_tickets * porcentaje);
        v_tickets_asignados := v_tickets_asignados + tickets_asignados;
        
        RETURN NEXT;
      END LOOP;
    ELSIF p_nivel_detalle = 'parroquia' THEN
      FOR v_territorio IN 
        SELECT e.cod_estado, e.nom_estado, m.cod_municipio, m.nom_municipio, 
               p.cod_parroquia, p.nom_parroquia, p.poblacion
        FROM parroquias p
        JOIN municipios m ON m.cod_municipio = p.cod_municipio AND m.cod_estado = p.cod_estado
        JOIN estados e ON e.cod_estado = p.cod_estado
        WHERE p.cod_parroquia = ANY(p_territorio_ids)
        ORDER BY e.nom_estado, m.nom_municipio, p.nom_parroquia
      LOOP
        -- Guardar el territorio con mayor población
        IF v_territorio.poblacion > v_max_poblacion THEN
          v_max_poblacion := v_territorio.poblacion;
          v_territorio_mayor_poblacion := v_territorio;
        END IF;
        
        -- Calcular tickets asignados y asignarlos a la variable OUT
        cod_estado := v_territorio.cod_estado;
        nom_estado := v_territorio.nom_estado;
        cod_municipio := v_territorio.cod_municipio;
        nom_municipio := v_territorio.nom_municipio;
        cod_parroquia := v_territorio.cod_parroquia;
        nom_parroquia := v_territorio.nom_parroquia;
        poblacion := v_territorio.poblacion;
        porcentaje := COALESCE(v_territorio.poblacion::NUMERIC / v_total_poblacion, 0);
        tickets_asignados := floor(p_total_tickets * porcentaje);
        v_tickets_asignados := v_tickets_asignados + tickets_asignados;
        
        RETURN NEXT;
      END LOOP;
    END IF;
  END IF;
  
  -- Manejar los tickets restantes por redondeo
  v_tickets_restantes := p_total_tickets - v_tickets_asignados;
  
  -- Si hay tickets restantes, agregarlos al territorio con mayor población
  IF v_tickets_restantes > 0 AND v_tickets_asignados > 0 AND v_max_poblacion > 0 THEN
    -- Asignar valores del territorio con mayor población a las variables OUT
    cod_estado := v_territorio_mayor_poblacion.cod_estado;
    nom_estado := v_territorio_mayor_poblacion.nom_estado;
    cod_municipio := v_territorio_mayor_poblacion.cod_municipio;
    nom_municipio := v_territorio_mayor_poblacion.nom_municipio;
    cod_parroquia := v_territorio_mayor_poblacion.cod_parroquia;
    nom_parroquia := v_territorio_mayor_poblacion.nom_parroquia;
    poblacion := v_territorio_mayor_poblacion.poblacion;
    porcentaje := COALESCE(v_territorio_mayor_poblacion.poblacion::NUMERIC / v_total_poblacion, 0);
    tickets_asignados := v_tickets_restantes;
    
    RETURN NEXT;
  END IF;
  
  RETURN;
END;
$BODY$;

ALTER FUNCTION public.distribuir_tickets_por_territorio(integer, text, integer[])
    OWNER TO postgres;

-- FUNCTION: public.generar_reporte_auditoria(timestamp without time zone, timestamp without time zone, integer)

-- DROP FUNCTION IF EXISTS public.generar_reporte_auditoria(timestamp without time zone, timestamp without time zone, integer);

CREATE OR REPLACE FUNCTION public.generar_reporte_auditoria(
	p_fecha_inicio timestamp without time zone,
	p_fecha_fin timestamp without time zone,
	p_usuario_id integer DEFAULT NULL::integer)
    RETURNS TABLE(fecha_actividad timestamp without time zone, usuario text, accion text, tabla text, registro_id integer, detalles text) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
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
$BODY$;

ALTER FUNCTION public.generar_reporte_auditoria(timestamp without time zone, timestamp without time zone, integer)
    OWNER TO postgres;


-- FUNCTION: public.realizar_sorteo(integer, integer)

-- DROP FUNCTION IF EXISTS public.realizar_sorteo(integer, integer);

CREATE OR REPLACE FUNCTION public.realizar_sorteo(
	p_sorteo_id integer,
	p_usuario_id integer)
    RETURNS jsonb
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
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
$BODY$;

ALTER FUNCTION public.realizar_sorteo(integer, integer)
    OWNER TO postgres;


-- FUNCTION: public.validar_ganador(integer, integer, text)

-- DROP FUNCTION IF EXISTS public.validar_ganador(integer, integer, text);

CREATE OR REPLACE FUNCTION public.validar_ganador(
	p_ganador_id integer,
	p_usuario_validador integer,
	p_comentarios text DEFAULT NULL::text)
    RETURNS boolean
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
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
$BODY$;

ALTER FUNCTION public.validar_ganador(integer, integer, text)
    OWNER TO postgres;


-- FUNCTION: public.actualizar_fecha_actualizacion()

-- DROP FUNCTION IF EXISTS public.actualizar_fecha_actualizacion();

CREATE OR REPLACE FUNCTION public.actualizar_fecha_actualizacion()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
      BEGIN
        -- Verificar si la tabla tiene el campo "fecha_actualizacion"
        IF EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = TG_TABLE_NAME 
          AND column_name = 'fecha_actualizacion'
        ) THEN
          NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
        END IF;
        RETURN NEW;
      END;
      
$BODY$;

ALTER FUNCTION public.actualizar_fecha_actualizacion()
    OWNER TO omarte;


-- FUNCTION: public.registrar_actividad()

-- DROP FUNCTION IF EXISTS public.registrar_actividad();

CREATE OR REPLACE FUNCTION public.registrar_actividad()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
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
$BODY$;

ALTER FUNCTION public.registrar_actividad()
    OWNER TO postgres;


-- FUNCTION: public.validar_estado_sorteo()

-- DROP FUNCTION IF EXISTS public.validar_estado_sorteo();

CREATE OR REPLACE FUNCTION public.validar_estado_sorteo()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
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
$BODY$;

ALTER FUNCTION public.validar_estado_sorteo()
    OWNER TO postgres;


-- View: public.vw_api_geografica

-- DROP VIEW public.vw_api_geografica;

CREATE OR REPLACE VIEW public.vw_api_geografica
 AS
 SELECT cod_estado AS estado_id,
    nom_estado AS estado_nombre,
    jsonb_agg(DISTINCT jsonb_build_object('municipio_id', cod_municipio, 'municipio_nombre', nom_municipio, 'parroquias', ( SELECT jsonb_agg(jsonb_build_object('parroquia_id', p.cod_parroquia, 'parroquia_nombre', p.nom_parroquia, 'activo', p.activo)) AS jsonb_agg
           FROM estados_old p
          WHERE p.cod_estado = e.cod_estado AND p.cod_municipio = e.cod_municipio))) AS estructura
   FROM estados_old e
  GROUP BY cod_estado, nom_estado
  ORDER BY nom_estado;

ALTER TABLE public.vw_api_geografica
    OWNER TO postgres;


-- View: public.vw_busqueda_geografica

-- DROP VIEW public.vw_busqueda_geografica;

CREATE OR REPLACE VIEW public.vw_busqueda_geografica
 AS
 SELECT id,
    (((cod_estado || '-'::text) || cod_municipio) || '-'::text) || cod_parroquia AS codigo_completo,
    (((nom_estado::text || ', '::text) || nom_municipio::text) || ', '::text) || nom_parroquia::text AS nombre_completo,
    nom_estado,
    cod_estado,
    nom_municipio,
    cod_municipio,
    nom_parroquia,
    cod_parroquia,
    activo
   FROM estados_old
  ORDER BY nom_estado, nom_municipio, nom_parroquia;

ALTER TABLE public.vw_busqueda_geografica
    OWNER TO postgres;

-- View: public.vw_conteo_geografico

-- DROP VIEW public.vw_conteo_geografico;

CREATE OR REPLACE VIEW public.vw_conteo_geografico
 AS
 SELECT 'Estados'::text AS nivel,
    count(DISTINCT estados_old.cod_estado) AS total,
    sum(
        CASE
            WHEN estados_old.activo THEN 1
            ELSE 0
        END) AS activos
   FROM estados_old
UNION ALL
 SELECT 'Municipios'::text AS nivel,
    count(DISTINCT ROW(estados_old.cod_estado, estados_old.cod_municipio)) AS total,
    sum(
        CASE
            WHEN estados_old.activo THEN 1
            ELSE 0
        END) AS activos
   FROM estados_old
UNION ALL
 SELECT 'Parroquias'::text AS nivel,
    count(*) AS total,
    sum(
        CASE
            WHEN estados_old.activo THEN 1
            ELSE 0
        END) AS activos
   FROM estados_old;

ALTER TABLE public.vw_conteo_geografico
    OWNER TO postgres;

-- View: public.vw_detalle_ganadores

-- DROP VIEW public.vw_detalle_ganadores;

CREATE OR REPLACE VIEW public.vw_detalle_ganadores
 AS
 SELECT g.id,
    s.nombre AS sorteo,
    pr.nombre AS premio,
    cp.nombre AS categoria_premio,
    g.fecha_sorteo,
    g.validado,
    g.informacion_contacto ->> 'nombre'::text AS nombre_ganador,
    g.informacion_contacto ->> 'contacto'::text AS contacto_ganador,
    u.username AS validador
   FROM ganadores g
     JOIN sorteos s ON g.sorteo_id = s.id
     JOIN premios pr ON g.premio_id = pr.id
     LEFT JOIN categorias_premios cp ON pr.categoria_id = cp.id
     LEFT JOIN usuarios u ON ((g.informacion_contacto ->> 'validador_id'::text)::integer) = u.id;

ALTER TABLE public.vw_detalle_ganadores
    OWNER TO postgres;

-- View: public.vw_estados

-- DROP VIEW public.vw_estados;

CREATE OR REPLACE VIEW public.vw_estados
 AS
 SELECT DISTINCT cod_estado AS id,
    nom_estado AS nombre,
    count(*) OVER (PARTITION BY cod_estado) AS total_municipios,
    sum(
        CASE
            WHEN activo THEN 1
            ELSE 0
        END) OVER (PARTITION BY cod_estado) AS activos
   FROM estados_old
  ORDER BY nom_estado;

ALTER TABLE public.vw_estados
    OWNER TO postgres;

-- View: public.vw_estructura_jerarquica

-- DROP VIEW public.vw_estructura_jerarquica;

CREATE OR REPLACE VIEW public.vw_estructura_jerarquica
 AS
 WITH estados AS (
         SELECT DISTINCT estados_old.cod_estado AS id,
            estados_old.nom_estado AS nombre,
            NULL::integer AS padre_id,
            'estado'::text AS tipo
           FROM estados_old
        ), municipios AS (
         SELECT DISTINCT estados_old.cod_municipio AS id,
            estados_old.nom_municipio AS nombre,
            estados_old.cod_estado AS padre_id,
            'municipio'::text AS tipo
           FROM estados_old
        ), parroquias AS (
         SELECT estados_old.cod_parroquia AS id,
            estados_old.nom_parroquia AS nombre,
            estados_old.cod_municipio AS padre_id,
            'parroquia'::text AS tipo
           FROM estados_old
        )
 SELECT estados.id,
    estados.nombre,
    estados.padre_id,
    estados.tipo
   FROM estados
UNION ALL
 SELECT municipios.id,
    municipios.nombre,
    municipios.padre_id,
    municipios.tipo
   FROM municipios
UNION ALL
 SELECT parroquias.id,
    parroquias.nombre,
    parroquias.padre_id,
    parroquias.tipo
   FROM parroquias
  ORDER BY 4, 3, 2;

ALTER TABLE public.vw_estructura_jerarquica
    OWNER TO postgres;

-- View: public.vw_municipios

-- DROP VIEW public.vw_municipios;

CREATE OR REPLACE VIEW public.vw_municipios
 AS
 SELECT DISTINCT cod_estado,
    nom_estado,
    cod_municipio AS id,
    nom_municipio AS nombre,
    count(*) OVER (PARTITION BY cod_estado, cod_municipio) AS total_parroquias,
    sum(
        CASE
            WHEN activo THEN 1
            ELSE 0
        END) OVER (PARTITION BY cod_estado, cod_municipio) AS activos
   FROM estados_old
  ORDER BY nom_estado, nom_municipio;

ALTER TABLE public.vw_municipios
    OWNER TO postgres;

-- View: public.vw_parroquias_completas

-- DROP VIEW public.vw_parroquias_completas;

CREATE OR REPLACE VIEW public.vw_parroquias_completas
 AS
 SELECT id,
    cod_estado,
    nom_estado,
    cod_municipio,
    nom_municipio,
    cod_parroquia,
    nom_parroquia,
    activo
   FROM estados_old
  ORDER BY nom_estado, nom_municipio, nom_parroquia;

ALTER TABLE public.vw_parroquias_completas
    OWNER TO postgres;

-- View: public.vw_participacion_region

-- DROP VIEW public.vw_participacion_region;

CREATE OR REPLACE VIEW public.vw_participacion_region
 AS
 SELECT e.nom_estado AS estado,
    e.nom_municipio AS municipio,
    count(p.id) AS total_participantes,
    count(g.id) AS total_ganadores,
    round(count(g.id)::numeric * 100.0 / NULLIF(count(p.id), 0)::numeric, 2) AS porcentaje_ganancia
   FROM estados_old e
     LEFT JOIN participantes p ON ((p.datos_adicionales ->> 'cod_estado'::text)::integer) = e.cod_estado AND ((p.datos_adicionales ->> 'cod_municipio'::text)::integer) = e.cod_municipio
     LEFT JOIN ganadores g ON g.participante_id = p.id
  GROUP BY e.nom_estado, e.nom_municipio
  ORDER BY e.nom_estado, e.nom_municipio;

ALTER TABLE public.vw_participacion_region
    OWNER TO postgres;

-- Table: public.distribucion_tiques

-- DROP TABLE IF EXISTS public.distribucion_tiques;

CREATE TABLE IF NOT EXISTS public.distribucion_tiques
(
    id integer NOT NULL DEFAULT nextval('distribucion_tiques_id_seq'::regclass),
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
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.distribucion_tiques
    OWNER to postgres;

-- Index: idx_distribucion_tiques_sorteo

-- DROP INDEX IF EXISTS public.idx_distribucion_tiques_sorteo;

CREATE INDEX IF NOT EXISTS idx_distribucion_tiques_sorteo
    ON public.distribucion_tiques USING btree
    (sorteo_id ASC NULLS LAST)
    TABLESPACE pg_default;

-- Index: idx_distribucion_tiques_estado

-- DROP INDEX IF EXISTS public.idx_distribucion_tiques_estado;

CREATE INDEX IF NOT EXISTS idx_distribucion_tiques_estado
    ON public.distribucion_tiques USING btree
    (cod_estado ASC NULLS LAST)
    TABLESPACE pg_default;

-- Sequence: public.distribucion_tiques_id_seq

-- DROP SEQUENCE IF EXISTS public.distribucion_tiques_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.distribucion_tiques_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.distribucion_tiques_id_seq
    OWNER TO postgres;

-- FUNCTION: public.obtener_progreso_generacion_tiques(integer)

-- DROP FUNCTION IF EXISTS public.obtener_progreso_generacion_tiques(integer);

CREATE OR REPLACE FUNCTION public.obtener_progreso_generacion_tiques(
	p_sorteo_id integer)
    RETURNS json
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE
    v_progreso JSON;
BEGIN
    -- Obtener el progreso de la metadata del sorteo
    SELECT COALESCE(metadata->'progreso_generacion', '{}') INTO v_progreso
    FROM sorteos
    WHERE id = p_sorteo_id;
    
    -- Si no hay progreso, devolver un objeto vacío con valores por defecto
    IF v_progreso IS NULL OR v_progreso::TEXT = '{}' THEN
        v_progreso := json_build_object(
            'generados', 0,
            'total_a_generar', 0,
            'porcentaje', 0,
            'estado_actual', 'No iniciado',
            'estados_procesados', 0,
            'total_estados', 0
        );
    END IF;
    
    RETURN v_progreso;
END;
$BODY$;

ALTER FUNCTION public.obtener_progreso_generacion_tiques(integer)
    OWNER TO postgres;

