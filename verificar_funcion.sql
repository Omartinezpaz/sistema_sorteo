-- Verificar si la función existe
SELECT 
    proname AS nombre_funcion,
    prorettype::regtype::text AS tipo_retorno,
    pg_get_function_result(oid) AS firma_retorno,
    pg_get_functiondef(oid) AS definicion,
    prosrc AS codigo_fuente
FROM 
    pg_proc 
WHERE 
    proname = 'generar_tiques_desde_distribucion' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    
-- Verificar si la tabla distribucion_tiques existe
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'distribucion_tiques'
) AS tabla_existe;

-- Ver las columnas de la tabla distribucion_tiques
SELECT 
    column_name,
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' AND 
    table_name = 'distribucion_tiques'
ORDER BY 
    ordinal_position; 