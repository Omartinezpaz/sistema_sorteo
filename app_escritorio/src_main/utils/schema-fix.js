const { query } = require('../database/connection');
const fs = require('fs');
const path = require('path');

/**
 * Obtiene el esquema actual de la base de datos y lo guarda como referencia
 * @returns {Promise<Object>} Resultado de la operación
 */
async function saveCurrentSchemaAsValid() {
  try {
    console.log('Obteniendo esquema actual de la base de datos...');
    
    // Tablas a incluir en el esquema
    const tables = ['usuarios', 'sorteos', 'participantes', 'premios', 'ganadores'];
    
    // Obtener información de cada tabla
    const schema = {};
    
    for (const table of tables) {
      console.log(`Obteniendo estructura de tabla: ${table}`);
      
      // Obtener columnas
      const columnsResult = await query(`
        SELECT 
          column_name, 
          data_type, 
          is_nullable,
          column_default
        FROM 
          information_schema.columns
        WHERE 
          table_schema = 'public'
          AND table_name = $1
        ORDER BY 
          ordinal_position
      `, [table]);
      
      if (columnsResult.rows.length === 0) {
        console.log(`Advertencia: La tabla ${table} no existe`);
        continue;
      }
      
      // Obtener clave primaria
      const pkResult = await query(`
        SELECT 
          kcu.column_name
        FROM 
          information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
        WHERE 
          tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = 'public'
          AND tc.table_name = $1
      `, [table]);
      
      // Formato para el esquema
      const columns = columnsResult.rows.map(col => ({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === 'YES',
        default: col.column_default
      }));
      
      // Determinar clave primaria
      let primaryKey = null;
      if (pkResult.rows.length > 0) {
        primaryKey = pkResult.rows.length === 1
          ? pkResult.rows[0].column_name
          : pkResult.rows.map(row => row.column_name);
      }
      
      // Guardar información de la tabla
      schema[table] = {
        columns,
        primaryKey
      };
    }
    
    // Guardar esquema en archivo
    const configDir = path.join(process.cwd(), 'app_escritorio', 'src_main', 'database');
    const schemaPath = path.join(configDir, 'current-schema.json');
    
    fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2));
    console.log(`Esquema actual guardado en: ${schemaPath}`);
    
    // Actualizar el validador para usar este esquema
    console.log('El esquema actual ha sido guardado como válido.');
    console.log('Para usar este esquema como referencia, modifique schema.js para cargar este archivo.');
    
    return {
      success: true,
      message: 'Esquema actual guardado como referencia válida',
      schemaPath
    };
  } catch (error) {
    console.error('Error al guardar esquema:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  saveCurrentSchemaAsValid()
    .then(result => {
      if (result.success) {
        console.log('✅ Esquema guardado correctamente en:', result.schemaPath);
      } else {
        console.error('❌ Error:', result.error);
      }
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Error inesperado:', error);
      process.exit(1);
    });
}

module.exports = { saveCurrentSchemaAsValid }; 