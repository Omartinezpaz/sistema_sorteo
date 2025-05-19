# Guía de Verificación Previa al Sorteo

## Introducción

El Sistema de Sorteos Pueblo Valiente incluye un proceso automático de verificación previa que garantiza que todos los componentes técnicos necesarios estén correctamente configurados antes de iniciar un sorteo. Esta guía explica cómo ejecutar estas verificaciones y cómo interpretar sus resultados.

## Requisitos previos

Para que las verificaciones se ejecuten correctamente, el sistema requiere:

1. Node.js instalado (versión 14 o superior)
2. PostgreSQL instalado y configurado
3. Acceso a los archivos de la aplicación

## Ejecutar verificaciones previas

### En Windows

1. Abra PowerShell
2. Navegue al directorio raíz de la aplicación
3. Ejecute el script de verificación:
   ```
   .\preparar-sorteo.ps1
   ```

### En Linux/macOS

1. Abra una terminal
2. Navegue al directorio raíz de la aplicación
3. Ejecute el script de verificación:
   ```bash
   ./preparar-sorteo.sh
   ```
   
   > **Nota**: Es posible que necesite hacer el script ejecutable:
   > ```bash
   > chmod +x ./preparar-sorteo.sh
   > ```

## Interpretación de resultados

El sistema mostrará los resultados de las verificaciones con indicadores visuales:

- ✅ **ÉXITO**: El componente está correctamente configurado
- ⚠️ **ADVERTENCIA**: Hay problemas menores que podrían afectar algunas funcionalidades
- ❌ **ERROR**: Existen problemas críticos que impiden realizar el sorteo

### Componentes verificados

1. **Conexión a la base de datos**: Verifica que PostgreSQL esté activo y accesible
2. **Espacio en disco**: Confirma que hay suficiente espacio para almacenar datos del sorteo
3. **Directorios de la aplicación**: Comprueba que los directorios necesarios existan
4. **Tablas de la base de datos**: Verifica la existencia de las tablas requeridas
5. **Estructura de la base de datos**: Valida que las tablas tengan la estructura correcta (columnas, tipos, claves primarias)
6. **Dependencias del sistema**: Confirma que los módulos necesarios estén instalados
7. **Recursos del sistema**: Verifica que la memoria y CPU sean suficientes para el funcionamiento óptimo

## Verificación de la estructura de la base de datos

El sistema realiza una verificación exhaustiva de la estructura de cada tabla en la base de datos, comprobando:

- **Columnas**: Verifica que todas las columnas requeridas existan con el tipo de dato correcto
- **Restricciones de nulidad**: Comprueba que las columnas tengan la configuración correcta de NOT NULL
- **Claves primarias**: Valida que las claves primarias estén correctamente definidas
- **Tipos de datos**: Confirma que los tipos de datos de cada columna sean compatibles con lo esperado

Si se detectan discrepancias, el sistema las reportará de forma detallada, indicando:
- Columnas faltantes
- Columnas con tipos de datos incorrectos
- Problemas con restricciones de nulidad
- Tablas con estructura incorrecta

## Verificación de recursos del sistema

El sistema analiza los recursos de hardware disponibles para asegurar un rendimiento adecuado:

- **Memoria RAM**: Verifica que haya al menos:
  - 2 GB de memoria total
  - 512 MB de memoria libre
  - Menos del 85% de memoria en uso

- **CPU**: Comprueba que el sistema tenga al menos 2 núcleos disponibles

Estas verificaciones garantizan que el sorteo se ejecute sin problemas de rendimiento.

## Solución de problemas comunes

### Conexión a la base de datos fallida

1. Verifique que PostgreSQL esté instalado y ejecutándose:
   - Windows: Servicios > PostgreSQL
   - Linux: `sudo systemctl status postgresql`
   - macOS: `brew services list | grep postgres`

2. Compruebe la configuración en el archivo:
   - `~/.sorteo_pueblo_valiente/config/database.json`

### Tablas faltantes o con estructura incorrecta

Si el sistema reporta tablas faltantes o con estructura incorrecta, ejecute los scripts de inicialización:
```bash
psql -U [usuario] -d sorteo_db -f scripts/init-database.sql
```

Para solucionar problemas específicos de estructura de tablas:
```bash
psql -U [usuario] -d sorteo_db -f scripts/fix-schema.sql
```

### Recursos del sistema insuficientes

1. **Memoria insuficiente**:
   - Cierre aplicaciones que consuman muchos recursos
   - Reinicie el sistema
   - Considere aumentar la memoria RAM del equipo

2. **CPU insuficiente**:
   - Cierre aplicaciones en segundo plano
   - Asegúrese de que no haya procesos intensivos ejecutándose
   - Considere usar un equipo con mejores especificaciones

### Dependencias faltantes

Instale las dependencias manualmente:
```bash
npm install pg exceljs file-saver pdfmake chart.js
```

## Registros (Logs)

Los resultados detallados de cada verificación se guardan en:
- `~/.sorteo_pueblo_valiente/logs/pre-sorteo-check-[fecha].json`

Estos archivos son útiles para diagnóstico y auditoría e incluyen información detallada sobre cada verificación realizada. 