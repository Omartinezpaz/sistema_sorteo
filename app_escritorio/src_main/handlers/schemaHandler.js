const { ipcMain } = require('electron');
const { pool } = require('../database/connection');
const fs = require('fs').promises;
const path = require('path');

// Handler para ejecutar scripts SQL de corrección
ipcMain.handle('schema:fix', async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Leer y ejecutar el script fix_tables.sql
    const fixTablesPath = path.join(__dirname, '..', 'database', 'migrations', 'fix_tables.sql');
    const fixTablesSQL = await fs.readFile(fixTablesPath, 'utf8');
    await client.query(fixTablesSQL);

    await client.query('COMMIT');
    
    return {
      success: true,
      mensaje: 'Corrección de esquema completada exitosamente'
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al ejecutar corrección de esquema:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    client.release();
  }
}); 