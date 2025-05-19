# Implementación de Distribución de Tiques

Este documento contiene las instrucciones para implementar la nueva funcionalidad de distribución de tiques por estado.

## 1. Estructura de Base de Datos

### 1.1. Corrección de Problemas con la Tabla Distribución de Tiques

Se han creado nuevos scripts para solucionar problemas con la tabla `distribucion_tiques`. Ejecute estos scripts en el siguiente orden:

1. `scripts/setup_distribucion_tiques.sql` - Crea la secuencia y tabla correctamente si no existen
2. `scripts/fix_distribucion_tiques.sql` - Corrige la función `generar_tiques_desde_distribucion` con la sintaxis adecuada

Para ejecutar estos scripts:

```bash
# Desde pgAdmin: Abrir los scripts y ejecutarlos en el orden indicado
# O desde consola (si tiene psql disponible):
psql -U postgres -d [nombre_base_datos] -f scripts/setup_distribucion_tiques.sql
```

### 1.2. Verificación de la Estructura

Para verificar que la estructura se ha creado correctamente, puede utilizar:

```bash
# Desde pgAdmin: 
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'distribucion_tiques'
) AS tabla_existe;
```

### 1.3. Scripts existentes

Los archivos `scripts/distribucion_tiques.sql` y `scripts/base_datos.sql` contienen las definiciones originales para:
- La secuencia `distribucion_tiques_id_seq`
- La tabla `distribucion_tiques`
- La función `generar_tiques_desde_distribucion`
- La función `obtener_progreso_generacion_tiques`

## 2. Configuración de Preload.js

Añadir los siguientes canales al archivo `app_escritorio/src_main/preload.js`:

```javascript
// En validInvokeChannels, asegurarse de que están estos canales:
'participantes:generarTiquesDesdeDistribucion',

// En validListenerChannels, asegurarse de que están estos canales:
'generacion-tiques:inicio',
'generacion-tiques:progreso',
'generacion-tiques:completado',
'generacion-tiques:error'
```

## 3. Componentes de la Interfaz de Usuario

Se ha creado un nuevo componente llamado `ProgresoGeneracionTiques.jsx` que muestra el progreso de generación de tiques en tiempo real. Este componente se utiliza en la página `GestionTiques.jsx`.

## 4. Resumen de Cambios y Mejoras

Los cambios realizados incluyen:

1. Creación de una tabla `distribucion_tiques` que almacena la información de distribución de tiques por estado
2. Implementación de una función `generar_tiques_desde_distribucion` que genera tiques basándose en la distribución configurada
3. Incorporación de un sistema de monitoreo de progreso para la generación de tiques
4. Adición de un componente de interfaz de usuario para mostrar el progreso de generación

## 5. Solución de Problemas Comunes

### Tabla distribucion_tiques no existe

Si recibe el error "la relación distribucion_tiques no existe", ejecute el script:
```
scripts/setup_distribucion_tiques.sql
```

### Error de sintaxis en la función

Si recibe un error de sintaxis en la función `generar_tiques_desde_distribucion`, específicamente relacionado con `LOOP` faltante, ejecute:
```
scripts/fix_distribucion_tiques.sql
```

### Errores en las relaciones con otras tablas

Si encuentra errores relacionados con claves foráneas, asegúrese de que las tablas `sorteos` y `estados` existan y contengan los datos necesarios antes de intentar crear la tabla `distribucion_tiques`.

## 6. Uso de la Funcionalidad

### Flujo de trabajo:

1. Al crear un sorteo, guardar la distribución de tiques por estado en la tabla `distribucion_tiques`
2. Para generar los tiques, usar el nuevo manejador:

```javascript
const resultado = await window.electronAPI.invoke(
  'participantes:generarTiquesDesdeDistribucion', 
  sorteoId, 
  prefijo
);
```

3. Para mostrar el progreso en tiempo real:

```jsx
<ProgresoGeneracionTiques 
  sorteoId={sorteoId} 
  onComplete={(data) => {
    // Manejar la finalización
  }}
/>
```

La nueva implementación:
- Utiliza la distribución guardada en la base de datos
- Respeta los rangos de numeración por estado
- Solo genera la cantidad especificada de tiques por estado
- Procesa un estado a la vez, lo que mejora el rendimiento y control
- Muestra progreso en tiempo real al usuario final

## 7. Beneficios para el Usuario Final

- **Transparencia**: El usuario puede ver el progreso en tiempo real durante la generación
- **Mayor información**: Se muestra el estado actual, porcentaje completado y estadísticas detalladas
- **Experiencia mejorada**: El usuario tiene una mejor percepción del tiempo de espera
- **Control preciso**: Distribución exacta de tiques según lo configurado
- **Menor uso de recursos**: Se procesan solo los registros necesarios 