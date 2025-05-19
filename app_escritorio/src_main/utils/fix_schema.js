/**
 * Módulo de utilidades para verificar y corregir el esquema de la base de datos
 */

const { pool } = require('../database/connection');
const fs = require('fs').promises;
const path = require('path');

/**
 * Verifica y corrige problemas conocidos en el esquema de la base de datos
 * @returns {Promise<Object>} Resultado con los cambios aplicados
 */
async function fixSchema() {
  const client = await pool.connect();
  try {
    console.log('Iniciando corrección del esquema de la base de datos...');
    
    await client.query('BEGIN');

    // Leer y ejecutar el script fix_tables.sql
    const fixTablesPath = path.join(__dirname, '..', 'database', 'migrations', 'fix_tables.sql');
    console.log('Leyendo script SQL desde:', fixTablesPath);
    
    const fixTablesSQL = await fs.readFile(fixTablesPath, 'utf8');
    console.log('Script SQL cargado, ejecutando...');
    
    await client.query(fixTablesSQL);
    console.log('Script SQL ejecutado correctamente');

    await client.query('COMMIT');
    
    console.log('Corrección del esquema completada exitosamente');
    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al ejecutar corrección del esquema:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

/**
 * Verifica si una columna existe en una tabla
 * @param {string} tableName Nombre de la tabla
 * @param {string} columnName Nombre de la columna
 * @returns {Promise<boolean>} Verdadero si la columna existe
 */
async function checkColumnExists(tableName, columnName) {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1 
        AND column_name = $2
      );
    `, [tableName, columnName]);
    
    return result.rows[0].exists;
  } catch (error) {
    console.error(`Error al verificar columna ${columnName} en tabla ${tableName}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Verificar problemas de esquema como handler IPC
 */
function setupSchemaChecks(ipcMain) {
  // Configurar punto de entrada IPC para arreglar esquema de la BD
  ipcMain.handle('fix-schema', async () => {
    try {
      const result = await fixSchema();
      return result;
    } catch (error) {
      console.error('Error en handler fix-schema:', error);
      return {
        success: false,
        changes: [],
        errors: [`Error al corregir esquema: ${error.message}`]
      };
    }
  });
  
  // Ejecutar verificación automática al inicio
  setTimeout(async () => {
    try {
      const result = await fixSchema();
      console.log('Resultado de verificación automática de esquema:', result);
    } catch (error) {
      console.error('Error en verificación automática de esquema:', error);
    }
  }, 5000); // Esperar 5 segundos después del inicio para ejecutar
}

module.exports = {
  fixSchema,
  checkColumnExists,
  setupSchemaChecks
}; 