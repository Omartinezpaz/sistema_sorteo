# Solución para problemas con la tabla distribucion_tiques

Se han detectado errores relacionados con la tabla `distribucion_tiques` y la función `generar_tiques_desde_distribucion`. Estos errores son:

1. La tabla `distribucion_tiques` no existe
2. Errores sintácticos en la función `generar_tiques_desde_distribucion` donde falta un `LOOP` después del `FOR`

## Solución rápida

Siga estos pasos para solucionar ambos problemas:

1. Abra pgAdmin y conéctese a su base de datos
2. Ejecute el script `scripts/setup_distribucion_tiques.sql` que:
   - Verifica si la secuencia existe y la crea si no existe
   - Verifica si la tabla existe y la crea si no existe 
   - Importa la función corregida desde `fix_distribucion_tiques.sql`
3. Verifique que la tabla y la función se hayan creado correctamente

## Verificación manual

Puede verificar que la tabla exista ejecutando:

```sql
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'distribucion_tiques'
) AS tabla_existe;
```

Y que la función esté correctamente definida:

```sql
SELECT 
    proname AS nombre_funcion,
    prosrc AS codigo_fuente
FROM 
    pg_proc 
WHERE 
    proname = 'generar_tiques_desde_distribucion' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
```

## Archivos de solución

Se han creado los siguientes archivos:

- `scripts/setup_distribucion_tiques.sql`: Script principal que verifica y crea la secuencia y tabla si no existen
- `scripts/fix_distribucion_tiques.sql`: Contiene la función corregida con la sintaxis adecuada
- `verificar_distribucion_tiques.sql`: Script de diagnóstico para verificar la existencia de la tabla
- `instrucciones_instalacion.md`: Documentación detallada sobre la implementación

Para más detalles, consulte el archivo `instrucciones_instalacion.md`. 