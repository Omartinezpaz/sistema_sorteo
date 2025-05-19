# Guía para la Gestión de Base de Datos con PgAdmin - Sorteo Pueblo Valiente

## Introducción

Esta guía proporciona instrucciones paso a paso para configurar, mantener y utilizar la base de datos PostgreSQL del sistema de sorteos Pueblo Valiente utilizando la herramienta pgAdmin.

## Requisitos Previos

- PostgreSQL instalado (versión 12 o superior)
- pgAdmin 4 instalado
- Acceso como administrador a PostgreSQL

## 1. Preparación Inicial de la Base de Datos

### 1.1. Crear la Base de Datos

1. Abra pgAdmin 4
2. En el panel de navegación, expanda **Servers**
3. Haga clic derecho en **PostgreSQL** y seleccione **Connect Server**
4. Si se solicita, ingrese su contraseña maestra
5. Haga clic derecho en **Databases** y seleccione **Create > Database**
6. En el campo **Database**, escriba `sorteo_db`
7. Haga clic en **Save**

### 1.2. Adecuar la Estructura de la Base de Datos

1. En pgAdmin, seleccione la base de datos `sorteo_db`
2. Presione el botón **Query Tool** (icono de lupa) en la barra de herramientas
3. En el editor de consultas, haga clic en el botón **Open File** (icono de carpeta)
4. Navegue hasta la ubicación del proyecto y abra `scripts/adecuar_bd_pgadmin.sql`
5. Haga clic en el botón **Execute/Refresh** (icono de reproducción) para ejecutar el script
6. Verifique en la pestaña **Messages** que no haya errores

Este script realiza las siguientes tareas:
- Crea todas las tablas necesarias si no existen
- Añade columnas faltantes si las tablas ya existen
- Establece restricciones y claves foráneas
- Crea índices para optimizar el rendimiento
- Crea vistas útiles para consultas frecuentes

## 2. Cargar Datos de Prueba

Si necesita datos de prueba para realizar evaluaciones del sistema:

1. En pgAdmin, seleccione la base de datos `sorteo_db`
2. Abra una nueva **Query Tool**
3. Abra el archivo `scripts/cargar_datos_prueba.sql`
4. Ejecute el script con el botón **Execute/Refresh**

**Nota importante**: Este script primero verifica si la base de datos ya contiene datos importantes. Si detecta datos existentes, el script se detendrá para evitar sobrescribir información real.

Los datos de prueba incluyen:
- Usuarios con diferentes roles
- Sorteos en diferentes estados (pendientes y finalizados)
- Participantes de diferentes regiones
- Premios para cada sorteo
- Ganadores para sorteos finalizados

## 3. Respaldo de la Base de Datos

### 3.1. Utilizando el Script de Respaldo

1. En pgAdmin, seleccione la base de datos `sorteo_db`
2. Abra una nueva **Query Tool**
3. Abra el archivo `scripts/respaldar_bd.sql`
4. Ejecute el script con el botón **Execute/Refresh**
5. El script generará vistas de respaldo y mostrará instrucciones detalladas en los mensajes

### 3.2. Completar el Proceso de Respaldo

Después de ejecutar el script, siga estas instrucciones:

1. En pgAdmin, vaya a **Tools > Backup...**
2. Configure los siguientes parámetros:
   - **Filename**: Elija una ubicación y nombre (preferiblemente el sugerido en los mensajes)
   - **Format**: Seleccione "Plain"
   - **Encoding**: UTF8
   - **Role name**: Deje en blanco
   - En la pestaña **Dump Options > Sections**, seleccione solo "Pre-data" y "Data"
   - En la pestaña **Queries**, marque "Use Column Inserts" y "Use Insert Commands"
3. Haga clic en **Backup**

## 4. Restauración de la Base de Datos

### 4.1. Restaurar desde un Archivo de Respaldo

1. Si es necesario, cree una nueva base de datos vacía
2. Seleccione la base de datos en pgAdmin
3. Vaya a **Tools > Restore...**
4. Configure los siguientes parámetros:
   - **Filename**: Seleccione el archivo de respaldo
   - **Format**: Plain
   - **Role name**: Deje en blanco
5. Haga clic en **Restore**

## 5. Solución de Problemas Comunes

### 5.1. Problemas de Conexión

Si tiene problemas para conectarse a PostgreSQL:

1. Verifique que el servicio de PostgreSQL esté ejecutándose
   - En Windows: Servicios > PostgreSQL
   - En Linux: `sudo systemctl status postgresql`
2. Confirme que está utilizando las credenciales correctas
3. Asegúrese de que el servidor permita conexiones (archivo pg_hba.conf)

### 5.2. Errores en la Estructura

Si el script de adecuación reporta errores:

1. Revise los mensajes de error detalladamente
2. Si hay conflictos con claves primarias o foráneas, es posible que necesite ejecutar:
   ```sql
   ALTER TABLE [nombre_tabla] DROP CONSTRAINT [nombre_constraint];
   ```
   antes de ejecutar nuevamente el script de adecuación

### 5.3. Problemas con Datos de Prueba

Si no puede cargar los datos de prueba:

1. Verifique si el script se detiene por la presencia de datos existentes
2. Si desea sobrescribir los datos existentes, puede modificar la condición de verificación
3. Alternativamente, puede limpiar manualmente las tablas con:
   ```sql
   TRUNCATE TABLE ganadores, premios, participantes, sorteos, usuarios CASCADE;
   ```

## 6. Consultas Útiles

### 6.1. Ver Todos los Sorteos Activos

```sql
SELECT id_sorteo, nombre, fecha_hora, tipo_sorteo
FROM sorteos
WHERE estado = 'pendiente'
ORDER BY fecha_hora;
```

### 6.2. Ver Distribución de Participantes por Estado

```sql
SELECT estado, COUNT(*) AS total_participantes
FROM participantes
GROUP BY estado
ORDER BY total_participantes DESC;
```

### 6.3. Ver Ganadores de un Sorteo Específico

```sql
SELECT 
    p.nombre AS participante,
    p.apellido,
    p.documento_identidad,
    pr.nombre AS premio,
    g.numero_ticket,
    g.fecha_seleccion
FROM 
    ganadores g
    JOIN participantes p ON g.id_participante = p.id_participante
    JOIN premios pr ON g.id_premio = pr.id_premio
WHERE 
    g.id_sorteo = [ID_SORTEO];
```

## 7. Mantenimiento Regular

Para mantener la base de datos funcionando correctamente:

1. Ejecute análisis y vacuum periódicamente:
   ```sql
   VACUUM ANALYZE;
   ```

2. Mantenga respaldos regulares, preferiblemente automatizados
3. Compruebe el espacio disponible en disco para la base de datos
4. Revise los logs de PostgreSQL para detectar problemas potenciales

## 8. Migración a Producción

Cuando esté listo para migrar a un entorno de producción:

1. Prepare un servidor PostgreSQL dedicado
2. Configure seguridad adecuada (firewall, autenticación)
3. Cree un respaldo completo de la base de datos de desarrollo
4. Restaure el respaldo en el servidor de producción
5. Actualice la configuración de conexión en la aplicación
6. Realice pruebas exhaustivas antes de permitir acceso a usuarios finales

## Recursos Adicionales

- [Documentación oficial de PostgreSQL](https://www.postgresql.org/docs/)
- [Documentación de pgAdmin](https://www.pgadmin.org/docs/)
- Guía de verificación previa al sorteo: `docs/guia-verificacion-previa.md` 