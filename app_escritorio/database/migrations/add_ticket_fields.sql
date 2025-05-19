-- Migración para añadir campos relacionados con tiques a la tabla participantes
-- Fecha: 18 de mayo de 2025

-- Agregar campos para manejo de tiques
ALTER TABLE public.participantes 
ADD COLUMN IF NOT EXISTS numero_tique INTEGER,
ADD COLUMN IF NOT EXISTS codigo_tique VARCHAR(50),
ADD COLUMN IF NOT EXISTS prefijo_tique VARCHAR(10),
ADD COLUMN IF NOT EXISTS tique_asignado BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS fecha_asignacion_tique TIMESTAMP;

-- Agregar índices para mejorar rendimiento de búsquedas
CREATE INDEX IF NOT EXISTS idx_participantes_numero_tique ON public.participantes(numero_tique);
CREATE INDEX IF NOT EXISTS idx_participantes_codigo_tique ON public.participantes(codigo_tique);
CREATE INDEX IF NOT EXISTS idx_participantes_prefijo_tique ON public.participantes(prefijo_tique);
CREATE INDEX IF NOT EXISTS idx_participantes_tique_asignado ON public.participantes(tique_asignado);

-- Crear vista para facilitar la visualización de participantes con sus tiques
CREATE OR REPLACE VIEW public.vw_participantes_tiques AS
SELECT 
    p.id,
    p.sorteo_id,
    p.nombre,
    p.apellido,
    p.documento_identidad,
    p.telefono,
    p.email,
    p.estado,
    p.municipio,
    p.parroquia,
    p.numero_tique,
    p.prefijo_tique,
    p.codigo_tique,
    p.tique_asignado,
    p.fecha_asignacion_tique,
    p.validado,
    p.fecha_registro,
    s.nombre AS nombre_sorteo,
    s.estado_actual AS estado_sorteo
FROM 
    public.participantes p
LEFT JOIN 
    public.sorteos s ON p.sorteo_id = s.id
WHERE 
    p.validado = true;

-- Función para generar códigos de tiques automáticamente
CREATE OR REPLACE FUNCTION public.generar_codigo_tique()
RETURNS TRIGGER AS $$
DECLARE
    formato_tique TEXT;
    prefijo TEXT;
    rango_inicio INTEGER;
    rango_fin INTEGER;
    sorteo_record RECORD;
    rangos_estado JSONB;
    estado_participante TEXT;
BEGIN
    -- Obtener información del sorteo
    SELECT * INTO sorteo_record FROM public.sorteos WHERE id = NEW.sorteo_id;
    
    -- Si no hay asignación manual de número de tique, generamos uno
    IF NEW.numero_tique IS NULL AND NEW.estado IS NOT NULL THEN
        -- Extraer formato y rangos del metadata del sorteo
        IF sorteo_record.metadata IS NOT NULL THEN
            -- Obtener formato de numeración si existe
            IF sorteo_record.metadata ? 'formatoNumeracion' THEN
                formato_tique := sorteo_record.metadata->>'formatoNumeracion';
            END IF;
            
            -- Buscar el rango para el estado del participante
            IF sorteo_record.metadata ? 'rangosEstado' THEN
                rangos_estado := sorteo_record.metadata->'rangosEstado';
                estado_participante := NEW.estado;
                
                -- Recorrer el array de rangos para encontrar el estado correspondiente
                FOR i IN 0..jsonb_array_length(rangos_estado)-1 LOOP
                    IF rangos_estado->i->>'estado' = estado_participante THEN
                        -- Extraer datos del rango
                        rango_inicio := (rangos_estado->i->>'desde')::INTEGER;
                        rango_fin := (rangos_estado->i->>'hasta')::INTEGER;
                        prefijo := rangos_estado->i->>'prefijo';
                        
                        -- Encontrar el siguiente número disponible en el rango
                        SELECT COALESCE(MAX(numero_tique), rango_inicio - 1) + 1 INTO NEW.numero_tique
                        FROM public.participantes
                        WHERE sorteo_id = NEW.sorteo_id
                        AND estado = NEW.estado
                        AND numero_tique BETWEEN rango_inicio AND rango_fin;
                        
                        -- Si excedimos el rango, usar el inicio del rango
                        IF NEW.numero_tique > rango_fin OR NEW.numero_tique IS NULL THEN
                            NEW.numero_tique := rango_inicio;
                        END IF;
                        
                        NEW.prefijo_tique := prefijo;
                        EXIT; -- Salir del bucle una vez encontrado
                    END IF;
                END LOOP;
            END IF;
        END IF;
    END IF;
    
    -- Generar código de tique si tenemos número y prefijo
    IF NEW.numero_tique IS NOT NULL AND NEW.prefijo_tique IS NOT NULL THEN
        -- Aplicar formato del sorteo si existe
        IF formato_tique IS NOT NULL AND formato_tique != '' THEN
            NEW.codigo_tique := REPLACE(
                REPLACE(formato_tique, '{PREFIJO}', NEW.prefijo_tique),
                '{NUMERO}', LPAD(NEW.numero_tique::TEXT, 6, '0')
            );
        ELSE
            -- Formato por defecto si no hay formato específico
            NEW.codigo_tique := NEW.prefijo_tique || '-' || LPAD(NEW.numero_tique::TEXT, 6, '0');
        END IF;
        
        NEW.tique_asignado := TRUE;
        NEW.fecha_asignacion_tique := CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para generar códigos de tique automáticamente
DROP TRIGGER IF EXISTS trg_generar_codigo_tique ON public.participantes;
CREATE TRIGGER trg_generar_codigo_tique
BEFORE INSERT OR UPDATE OF estado, numero_tique, prefijo_tique ON public.participantes
FOR EACH ROW
WHEN (NEW.validado = TRUE)
EXECUTE FUNCTION public.generar_codigo_tique();

-- Actualizar registros existentes para generar códigos de tique
DO $$
BEGIN
    RAISE NOTICE 'Actualizando participantes existentes para generar códigos de tique...';
    
    -- Forzar actualización para que se ejecute el trigger
    UPDATE public.participantes
    SET estado = estado
    WHERE validado = TRUE AND tique_asignado IS NOT TRUE;
    
    RAISE NOTICE 'Actualización completada.';
END $$; 