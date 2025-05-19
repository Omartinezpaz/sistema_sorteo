# Funcionalidades implementadas del archivo initial.sql

Este documento detalla todas las funcionalidades que hemos implementado basadas en las tablas, vistas, funciones y triggers definidos en el archivo `initial.sql`.

## Tabla de Contenido
1. [Endpoints por Recurso](#endpoints-por-recurso)
2. [Funcionalidades PL/pgSQL](#funcionalidades-plpgsql)
3. [Vistas SQL](#vistas-sql)
4. [Triggers y Automaciones](#triggers-y-automaciones)

## Endpoints por Recurso

### Autenticación y Usuarios
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar un nuevo usuario (solo admin)
- `GET /api/auth/me` - Obtener usuario actual
- `GET /api/usuarios` - Listar todos los usuarios (solo admin)
- `GET /api/usuarios/:id` - Obtener un usuario por ID
- `PUT /api/usuarios/:id` - Actualizar datos de usuario
- `PATCH /api/usuarios/:id/password` - Cambiar contraseña
- `DELETE /api/usuarios/:id` - Eliminar un usuario (solo admin)

### Sorteos
- `GET /api/sorteos` - Listar todos los sorteos
- `GET /api/sorteos/mis-sorteos` - Obtener los sorteos del usuario autenticado
- `GET /api/sorteos/publicos` - Obtener sorteos públicos (accesible sin autenticación)
- `GET /api/sorteos/resumen` - Obtener resumen de sorteos usando la vista SQL
- `GET /api/sorteos/:id` - Obtener un sorteo por ID
- `POST /api/sorteos` - Crear un nuevo sorteo
- `PUT /api/sorteos/:id` - Actualizar un sorteo
- `PATCH /api/sorteos/:id/estado` - Actualizar el estado de un sorteo (con validación de estados según el trigger)
- `DELETE /api/sorteos/:id` - Eliminar un sorteo
- `POST /api/sorteos/:id/realizar-sorteo` - Realizar un sorteo utilizando la función PL/pgSQL

### Premios
- `GET /api/premios` - Listar todos los premios
- `GET /api/premios/categorias` - Obtener categorías de premios
- `GET /api/premios/:id` - Obtener un premio por ID
- `GET /api/premios/sorteo/:sorteoId` - Obtener premios de un sorteo
- `GET /api/premios/sorteo/:sorteoId/disponibles` - Obtener premios disponibles
- `POST /api/premios` - Crear un nuevo premio
- `PUT /api/premios/:id` - Actualizar un premio
- `DELETE /api/premios/:id` - Eliminar un premio

### Participantes
- `GET /api/participantes` - Listar todos los participantes
- `GET /api/participantes/buscar` - Buscar participantes
- `GET /api/participantes/:id` - Obtener un participante por ID
- `GET /api/participantes/sorteo/:sorteoId` - Obtener participantes de un sorteo
- `POST /api/participantes` - Crear un nuevo participante
- `PUT /api/participantes/:id` - Actualizar un participante
- `PATCH /api/participantes/:id/validar` - Validar un participante
- `DELETE /api/participantes/:id` - Eliminar un participante
- `POST /api/participantes/sorteo/:sorteoId/importar` - Importar participantes en lote

### Ganadores (Nueva implementación)
- `GET /api/ganadores` - Obtener todos los ganadores
- `GET /api/ganadores/sorteo/:sorteoId` - Obtener ganadores por sorteo utilizando vista SQL
- `PATCH /api/ganadores/:id/validar` - Validar un ganador utilizando función PL/pgSQL
- `GET /api/ganadores/estadisticas/region` - Obtener estadísticas por región usando vista SQL

### Actividades y Auditoría (Nueva implementación)
- `GET /api/actividades` - Obtener registro de actividades (solo admin)
- `GET /api/actividades/auditoria` - Obtener reporte de auditoría utilizando función PL/pgSQL
- `POST /api/actividades` - Registrar actividad manualmente

### Estados/Regiones (Nueva implementación)
- `GET /api/estados` - Obtener todos los estados/regiones
- `GET /api/estados/lista` - Obtener lista agrupada de estados
- `GET /api/estados/:codEstado` - Obtener por estado
- `GET /api/estados/:codEstado/municipios` - Obtener municipios por estado
- `GET /api/estados/:codEstado/:codMunicipio` - Obtener por municipio
- `GET /api/estados/:codEstado/:codMunicipio/parroquias` - Obtener parroquias

### Reportes
- `GET /api/reportes/sorteo/:id/excel` - Generar reporte Excel de un sorteo
- `GET /api/reportes/sorteo/:id/csv` - Generar reporte CSV de un sorteo
- `GET /api/reportes/sorteo/:id/pdf` - Generar reporte PDF de un sorteo

## Funcionalidades PL/pgSQL

Se implementaron las siguientes funciones PL/pgSQL definidas en `initial.sql`:

### 1. Función `registrar_actividad()`
Usada por triggers para registrar automáticamente actividades en el sistema.

```sql
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
```

### 2. Función `validar_ganador()`
Utilizada para validar ganadores con información adicional.

```sql
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
```

### 3. Función `realizar_sorteo()`
Implementada para realizar sorteos aleatorios con validaciones.

```sql
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
```

### 4. Función `generar_reporte_auditoria()`
Para generar reportes de auditoría en rangos de fechas.

```sql
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
```

## Vistas SQL

Se implementaron las siguientes vistas SQL definidas en `initial.sql`:

### 1. Vista `vw_resumen_sorteos`
Utilizada para mostrar un resumen de todos los sorteos.

```sql
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
```

### 2. Vista `vw_detalle_ganadores`
Utilizada para mostrar detalles completos de ganadores.

```sql
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
```

### 3. Vista `vw_participacion_region`
Utilizada para mostrar estadísticas de participación por región.

```sql
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
```

## Triggers y Automaciones

Se implementaron los siguientes triggers definidos en `initial.sql`:

### 1. Trigger para actualizar timestamps
```sql
CREATE OR REPLACE FUNCTION actualizar_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuarios_timestamps
BEFORE UPDATE ON public.usuarios
FOR EACH ROW EXECUTE FUNCTION actualizar_timestamps();

CREATE TRIGGER trg_sorteos_timestamps
BEFORE UPDATE ON public.sorteos
FOR EACH ROW EXECUTE FUNCTION actualizar_timestamps();
```

### 2. Trigger para registro de actividades
```sql
CREATE TRIGGER trg_registro_actividades_sorteos
AFTER INSERT OR UPDATE OR DELETE ON public.sorteos
FOR EACH ROW EXECUTE FUNCTION registrar_actividad();

CREATE TRIGGER trg_registro_actividades_ganadores
AFTER INSERT OR UPDATE OR DELETE ON public.ganadores
FOR EACH ROW EXECUTE FUNCTION registrar_actividad();
```

### 3. Trigger para validar cambios de estado en sorteos
```sql
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
```
