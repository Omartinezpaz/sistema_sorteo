-- Crear tabla de premios
CREATE TABLE IF NOT EXISTS public.premios (
    id SERIAL PRIMARY KEY,
    sorteo_id INTEGER NOT NULL REFERENCES sorteos(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    valor DECIMAL(15,2) NOT NULL,
    categoria_id VARCHAR(50) NOT NULL,
    ambito VARCHAR(50) NOT NULL DEFAULT 'nacional',
    estado VARCHAR(50) NOT NULL DEFAULT 'activo',
    orden INTEGER DEFAULT 0,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE,
    CONSTRAINT premios_ambito_check CHECK (ambito IN ('nacional', 'regional')),
    CONSTRAINT premios_estado_check CHECK (estado IN ('activo', 'inactivo', 'entregado'))
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_premios_sorteo ON public.premios(sorteo_id);
CREATE INDEX IF NOT EXISTS idx_premios_ambito ON public.premios(ambito);
CREATE INDEX IF NOT EXISTS idx_premios_estado ON public.premios(estado);

-- Comentarios de la tabla y columnas
COMMENT ON TABLE public.premios IS 'Tabla que almacena los premios de los sorteos';
COMMENT ON COLUMN public.premios.id IS 'Identificador único del premio';
COMMENT ON COLUMN public.premios.sorteo_id IS 'ID del sorteo al que pertenece el premio';
COMMENT ON COLUMN public.premios.nombre IS 'Nombre o título del premio';
COMMENT ON COLUMN public.premios.descripcion IS 'Descripción detallada del premio';
COMMENT ON COLUMN public.premios.valor IS 'Valor monetario del premio';
COMMENT ON COLUMN public.premios.categoria_id IS 'Categoría del premio (principal, secundario, especial)';
COMMENT ON COLUMN public.premios.ambito IS 'Ámbito del premio (nacional o regional)';
COMMENT ON COLUMN public.premios.estado IS 'Estado del premio (activo, inactivo, entregado)';
COMMENT ON COLUMN public.premios.orden IS 'Orden de visualización del premio';
COMMENT ON COLUMN public.premios.fecha_creacion IS 'Fecha y hora de creación del registro';
COMMENT ON COLUMN public.premios.fecha_actualizacion IS 'Fecha y hora de la última actualización'; 