# Solución al Problema de Distribución de Tiques en el Sorteo 27

## Problema detectado

Se ha detectado que al intentar generar tiques para el sorteo "Pueblo Activo" (ID: 27), aparece el siguiente error:

> No hay distribución de tiques configurada para este sorteo. Configure la distribución en la sección de configuración de sorteos.

Este error se debe a dos problemas principales:

1. **No existen registros en la tabla `distribucion_tiques` para el sorteo 27**, a pesar de que la configuración de rangos está presente en el campo `metadata` del sorteo.
2. **La función `generar_tiques_desde_distribucion` no está instalada correctamente** en la base de datos o tiene errores sintácticos.

## Solución

Hemos creado un script SQL completo que soluciona ambos problemas. El script realiza las siguientes acciones:

1. Verifica y crea la tabla `distribucion_tiques` si no existe
2. Elimina la función anterior (si existe) y crea una nueva versión corregida de `generar_tiques_desde_distribucion`
3. Configura la distribución de tiques para el sorteo 27 basándose en los datos del campo `metadata`

## Instrucciones para aplicar la solución

### Opción 1: Usando pgAdmin (Recomendado)

1. Abra pgAdmin y conéctese a la base de datos `sorteo_db` con el usuario `omarte`
2. Abra una nueva ventana de consulta (Query Tool)
3. Copie y pegue el contenido del archivo `solucion_completa_distribucion_tiques.sql`
4. Ejecute el script completo
5. Verifique en los mensajes de salida que no haya errores

### Opción 2: Usando PSQL (línea de comandos)

Si tiene acceso a la línea de comandos y PSQL está en su PATH:

```
psql -U omarte -d sorteo_db -f solucion_completa_distribucion_tiques.sql
```

Cuando se le solicite, introduzca la contraseña: `Ap3r1t1v02025`

### Opción 3: Usando Node.js (con script proporcionado)

También puede ejecutar el script Node.js que hemos creado:

```
node ejecutar_setup.js
```

Este script se conectará automáticamente a la base de datos con las credenciales correctas y aplicará la solución.

## Verificación

Después de ejecutar el script, puede verificar que todo se haya configurado correctamente ejecutando las siguientes consultas:

1. Verificar que la función existe con la firma correcta:
```sql
SELECT 
    proname AS nombre_funcion,
    pg_get_function_result(oid) AS firma_retorno
FROM 
    pg_proc 
WHERE 
    proname = 'generar_tiques_desde_distribucion' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
```

2. Verificar que hay registros en la tabla de distribución para el sorteo 27:
```sql
SELECT COUNT(*) FROM distribucion_tiques WHERE sorteo_id = 27;
```
El resultado debe ser 24 (correspondiente a los 24 estados configurados).

## Generación de tiques

Una vez aplicada la solución, podrá generar los tiques para el sorteo desde la interfaz de la aplicación. La generación seguirá estos pasos:

1. Leerá la distribución configurada desde la tabla `distribucion_tiques`
2. Creará los tiques según los rangos y cantidades configurados
3. Guardará los resultados en la tabla `participantes`
4. Actualizará el progreso en el campo `metadata` del sorteo

## Solución de problemas

Si al ejecutar la aplicación sigue viendo el error, intente reiniciar la aplicación para que reconozca los cambios en la base de datos.

## Soporte adicional

Si encuentra algún problema después de aplicar esta solución, por favor contacte al equipo de soporte técnico con los siguientes detalles:

- Mensajes de error completos
- Hora en que se ejecutó el script
- Capturas de pantalla de cualquier problema que persista en la interfaz

---

*Nota: Esta solución fue creada específicamente para el sorteo "Pueblo Activo" (ID: 27). Si necesita configurar otros sorteos, siga el mismo patrón pero ajustando los valores de acuerdo a la configuración deseada.* 