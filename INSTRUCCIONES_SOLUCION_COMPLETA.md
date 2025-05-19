# Instrucciones: Solución del problema de distribución de tiques

## Resumen del problema

El sistema presenta error al intentar generar tiques (tickets) para un sorteo. Los mensajes de error son:

1. **Error inicial**: "No hay distribución de tiques configurada para este sorteo"
2. **Error actual**: "Cannot read properties of undefined (reading 'total')"
3. **Nuevos errores detectados**: 
   - "La llave (sorteo_id)=(27) no está presente en la tabla «sorteos»"
   - "El operador no existe: character varying = integer"

## Causas identificadas

1. La tabla `distribucion_tiques` no tenía registros para el sorteo ID 27
2. La función de base de datos `generar_tiques_desde_distribucion` tenía errores o no existía
3. El manejador en `participantes_handlers.js` accede incorrectamente a la propiedad `total` (línea 778)
4. **Los sorteos con IDs 27 y 28 no existen en la tabla `sorteos`**
5. **Hay un error de incompatibilidad de tipos en la función `generar_tiques_desde_distribucion`**

## Soluciones implementadas

Se han preparado varias soluciones complementarias:

1. **Corrección del manejador de IPC en Node.js** (archivo `app_escritorio/src_main/ipc/participantes_handlers.js`)
   - Se ha implementado una verificación más robusta para manejar diferentes formatos de resultados de consultas
   - Se agregaron logs para facilitar el diagnóstico

2. **Scripts SQL para configurar la base de datos**:
   - `solucion_completa_distribucion_tiques.sql`: Crea la tabla, la función y configura datos para el sorteo 27
   - `solo_configurar_distribucion.sql`: Solo configura los datos para el sorteo 27
   - `actualizar_distribucion_sorteo28.sql`: Diagnóstico para el sorteo 28

3. **Scripts de Node.js para solucionar problemas específicos**:
   - `crear_sorteos_faltantes.js`: Verifica y crea los sorteos con IDs 27 y 28 si no existen
   - `corregir_funcion_tiques.js`: Corrige el error de incompatibilidad de tipos en la función
   - `ejecutar_script.js`: Automatiza la aplicación de algunas soluciones y permite generar tiques
   - `solucion_completa.js`: Script principal que ejecuta todos los pasos en secuencia

## Instrucciones paso a paso

### Opción 1: Solución completamente automatizada (recomendada)

1. **Verificar que el servidor PostgreSQL esté en ejecución**

2. **Ejecutar el script de solución completa**:
   ```
   node solucion_completa.js
   ```
   
   Este script ejecutará automáticamente todos los pasos necesarios en secuencia:
   1. Creará los sorteos faltantes (IDs 27 y 28) si no existen
   2. Corregirá la función `generar_tiques_desde_distribucion`
   3. Configurará la distribución de tiques para el sorteo seleccionado
   4. Generará los tiques para el sorteo seleccionado

   Sólo necesitas seleccionar para qué sorteo (27 o 28) quieres generar los tiques cuando se te pregunte.

### Opción 2: Solución paso a paso

Si prefieres ejecutar los pasos individualmente:

1. **Crear los sorteos necesarios**:
   ```
   node crear_sorteos_faltantes.js
   ```
   Este script verificará si los sorteos con IDs 27 y 28 existen y los creará si es necesario.

2. **Corregir la función de generación de tiques**:
   ```
   node corregir_funcion_tiques.js
   ```
   Este script corregirá el error de incompatibilidad de tipos en la función `generar_tiques_desde_distribucion`.

3. **Ejecutar el script principal**:
   ```
   node ejecutar_script.js
   ```
   
   Este script realizará las siguientes acciones:
   - Comprobará si la tabla `distribucion_tiques` existe y la creará si es necesario
   - Verificará si existen registros de distribución para los sorteos 27 y 28
   - Le preguntará para cuál sorteo desea generar tiques (27 o 28)
   - Ejecutará la generación de tiques

### Opción 3: Solución manual (paso a paso)

Si prefieres aplicar las soluciones manualmente:

1. **Crear los sorteos necesarios**:
   ```
   node crear_sorteos_faltantes.js
   ```

2. **Corregir la función de generación de tiques**:
   ```
   node corregir_funcion_tiques.js
   ```

3. **Corregir el manejador de IPC**:
   - Abra el archivo `app_escritorio/src_main/ipc/participantes_handlers.js`
   - Busque el manejador `participantes:generarTiquesDesdeDistribucion` (aproximadamente línea 770)
   - Reemplace el código según las instrucciones del archivo `correccion_manejador_tiques.js`

4. **Ejecutar la solución SQL para configurar la distribución**:
   ```
   psql -U omarte -d sorteo_db -f solo_configurar_distribucion.sql
   ```
   
   O a través de Node.js:
   ```
   node -e "require('fs').readFileSync('solo_configurar_distribucion.sql', 'utf8').split(';').forEach(q => { if(q.trim()) require('pg').Pool({user: 'omarte', database: 'sorteo_db', password: 'Ap3r1t1v02025'}).query(q) })"
   ```

5. **Reiniciar la aplicación Electron**:
   ```
   cd app_escritorio
   npm run start
   ```

## Verificación de la solución

Para verificar que la solución se ha aplicado correctamente:

1. **Verificar que los sorteos existen**:
   ```sql
   SELECT id, nombre, estado, fecha_sorteo FROM sorteos WHERE id IN (27, 28);
   ```

2. **Verificar la existencia de la tabla y la función**:
   ```sql
   SELECT EXISTS (
     SELECT FROM information_schema.tables 
     WHERE table_schema = 'public' AND table_name = 'distribucion_tiques'
   );
   
   SELECT proname FROM pg_proc WHERE proname = 'generar_tiques_desde_distribucion';
   ```

3. **Verificar que existen distribuciones para los sorteos**:
   ```sql
   SELECT sorteo_id, cod_estado, count(*) 
   FROM distribucion_tiques 
   GROUP BY sorteo_id, cod_estado 
   ORDER BY sorteo_id, cod_estado;
   ```

4. **Generar tiques a través de la aplicación**:
   - Iniciar la aplicación
   - Seleccionar el sorteo correspondiente (ID 27 o 28)
   - Ir a la opción de generar tiques
   - Verificar que no aparezca el error

## Recuperación en caso de error

Si aún experimenta problemas después de aplicar las soluciones anteriores:

1. **Diagnosticar los errores**:
   - Revisar la consola de la aplicación Electron (Ctrl+Shift+I)
   - Verificar los logs de la base de datos PostgreSQL

2. **Verificar la estructura de la tabla re_723**:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 're_723' 
   ORDER BY ordinal_position;
   ```

3. **Verificar permisos de la base de datos**:
   - Asegurar que el usuario `omarte` tenga permisos adecuados para todas las tablas y funciones

## Notas adicionales

- La corrección del manejador `participantes:generarTiquesDesdeDistribucion` permite manejar diferentes formatos de resultados que puede devolver el driver de PostgreSQL, mejorando la robustez del código.

- Las conversiones explícitas de tipo en la función `generar_tiques_desde_distribucion` (como `cod_estado::TEXT`) solucionan el problema de incompatibilidad de tipos que causaba el error "el operador no existe: character varying = integer".

- La tabla `distribucion_tiques` contiene la configuración de cuántos tiques debe generar el sistema para cada estado, por lo que es esencial para el funcionamiento correcto del sorteo.

- La función `generar_tiques_desde_distribucion` es la encargada de crear los tiques según la distribución configurada y asignarlos a participantes aleatorios de la tabla `re_723`.

---

## Datos de conexión a la base de datos

- **Base de datos**: sorteo_db
- **Usuario**: omarte
- **Contraseña**: Ap3r1t1v02025
- **Puerto**: 5432 (valor predeterminado de PostgreSQL) 