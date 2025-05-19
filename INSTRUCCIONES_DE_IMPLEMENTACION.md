# Instrucciones para implementar la solución de generación de tiques

Este documento proporciona las instrucciones paso a paso para implementar la solución al problema de generación de tiques en el sistema de sorteos.

## Resumen de la solución

La solución consiste en aplicar una serie de correcciones para solucionar los siguientes problemas:

1. **Sorteos inexistentes**: Crear los sorteos 27 y 28 que no existían en la base de datos.
2. **Incompatibilidad de tipos**: Corregir la incompatibilidad entre los tipos de `cod_estado` en `re_723` (VARCHAR) y `distribucion_tiques` (INTEGER).
3. **Problemas de permisos**: Eliminar la funcionalidad `COPY TO` que intentaba escribir archivos desde PostgreSQL.
4. **Manejo de resultados de consulta**: Mejorar el código para manejar diferentes formatos de resultados.

## Pasos de implementación

### 1. Crear sorteos faltantes

Ejecute el siguiente script para verificar si los sorteos 27 y 28 existen, y crearlos si es necesario:

```bash
node crear_sorteos_faltantes.js
```

### 2. Corregir la incompatibilidad de tipos

Ejecute este script para modificar la función `generar_tiques_desde_distribucion` y añadir conversiones explícitas de tipos:

```bash
node corregir_funcion_tipos.js
```

### 3. Eliminar la funcionalidad COPY TO

Ejecute este script para eliminar la funcionalidad que intentaba escribir archivos directamente desde PostgreSQL:

```bash
node corregir_funcion_tiques_v2.js
```

### 4. Configurar la distribución de tiques para el sorteo 28

Ejecute este script para crear una distribución simplificada para el sorteo 28:

```bash
node corregir_distribucion_sorteo28.js
```

### 5. Generar tiques para el sorteo 28

Ejecute este script para generar tiques de prueba para el sorteo 28:

```bash
node generar_tiques_simple.js
```

Si estos tiques de prueba funcionan correctamente, puede ejecutar el script completo para generar todos los tiques:

```bash
node generar_tiques_final.js
```

### 6. Verificar la generación de tiques

Para verificar que los tiques se han generado correctamente, ejecute:

```bash
node verificar_tiques_generados.js
```

## Implementación en la aplicación

Para implementar la solución en la aplicación completa, es necesario actualizar el manejador de IPC en el archivo `app_escritorio/src_main/ipc/participantes_handlers.js`. 

Busque la sección correspondiente al manejador `participantes:generarTiquesDesdeDistribucion` y modifíquela según se indica en `correccion_manejador_tiques.js`:

```javascript
// Verificación más robusta para manejar diferentes formatos de resultado
let totalDistribuciones = 0;

if (verificacion) {
  // Si el resultado es un array de objetos (formato típico)
  if (Array.isArray(verificacion) && verificacion.length > 0 && verificacion[0] && typeof verificacion[0].total !== 'undefined') {
    totalDistribuciones = parseInt(verificacion[0].total);
  } 
  // Si el resultado es un objeto con propiedad rows (formato node-postgres)
  else if (verificacion.rows && verificacion.rows.length > 0) {
    totalDistribuciones = parseInt(verificacion.rows[0].total);
  }
}

if (totalDistribuciones === 0) {
  throw new Error('No hay distribución de tiques configurada para este sorteo');
}
```

## Solución de problemas

Si encuentra algún problema durante la implementación, verifique los siguientes aspectos:

1. **Errores de incompatibilidad de tipos**: Asegúrese de que se estén realizando conversiones explícitas al comparar campos con diferentes tipos de datos.
2. **Errores de permisos**: Verifique que la función no esté intentando escribir archivos directamente desde PostgreSQL.
3. **Sorteos inexistentes**: Confirme que los sorteos 27 y 28 existen en la tabla `sorteos`.
4. **Distribución de tiques**: Verifique que existan registros en la tabla `distribucion_tiques` para los sorteos 27 y 28.

## Verificaciones adicionales

Para verificaciones adicionales, puede ejecutar consultas SQL directamente:

```sql
-- Verificar sorteos
SELECT id, nombre, estado FROM sorteos WHERE id IN (27, 28);

-- Verificar distribución de tiques
SELECT sorteo_id, cod_estado, rango_desde, rango_hasta, cantidad
FROM distribucion_tiques
WHERE sorteo_id IN (27, 28)
ORDER BY sorteo_id, cod_estado;

-- Verificar tiques generados
SELECT COUNT(*) FROM participantes WHERE sorteo_id IN (27, 28);
```

## Notas importantes

1. **Tipos de datos**: Asegúrese de que futuras modificaciones del esquema de base de datos mantengan la consistencia en los tipos de datos, o que incluyan conversiones explícitas en las consultas.
2. **Permisos de PostgreSQL**: No intente escribir archivos directamente desde PostgreSQL. Es mejor gestionar la escritura de archivos desde la aplicación.
3. **Manejo de resultados**: Al trabajar con diferentes versiones de drivers de base de datos, implemente un código robusto que maneje diferentes formatos de resultados. 