const { ipcMain } = require('electron');
const { query } = require('../database/db');

function setupDistribucionTiquesHandlers() {
  // Obtener la distribución de tiques para un sorteo específico
  ipcMain.handle('distribucion:getBySorteo', async (event, sorteoId) => {
    try {
      const result = await query(`
        SELECT dt.id, dt.sorteo_id, dt.cod_estado, e.nom_estado, 
               dt.rango_desde, dt.rango_hasta, dt.cantidad, dt.porcentaje
        FROM distribucion_tiques dt
        JOIN estados e ON dt.cod_estado = e.cod_estado
        WHERE dt.sorteo_id = $1
        ORDER BY e.nom_estado
      `, [sorteoId]);
      
      return result.rows;
    } catch (error) {
      console.error('Error al obtener distribución de tiques:', error);
      throw new Error(`Error al obtener distribución de tiques: ${error.message}`);
    }
  });

  // Guardar la distribución de tiques para un sorteo
  ipcMain.handle('distribucion:guardar', async (event, distribucion) => {
    const client = await query('BEGIN');
    
    try {
      const { sorteoId, distribuciones } = distribucion;
      
      // Eliminar distribuciones anteriores del mismo sorteo
      await query('DELETE FROM distribucion_tiques WHERE sorteo_id = $1', [sorteoId]);
      
      // Insertar las nuevas distribuciones
      for (const dist of distribuciones) {
        await query(`
          INSERT INTO distribucion_tiques 
            (sorteo_id, cod_estado, rango_desde, rango_hasta, cantidad, porcentaje)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          sorteoId,
          dist.cod_estado,
          dist.rango_desde,
          dist.rango_hasta,
          dist.cantidad,
          dist.porcentaje
        ]);
      }
      
      // Confirmar la transacción
      await query('COMMIT');
      
      return {
        success: true,
        mensaje: 'Distribución de tiques guardada correctamente',
        total: distribuciones.length
      };
    } catch (error) {
      // Revertir la transacción en caso de error
      await query('ROLLBACK');
      console.error('Error al guardar distribución de tiques:', error);
      throw new Error(`Error al guardar distribución de tiques: ${error.message}`);
    }
  });

  // Eliminar la distribución de tiques de un sorteo
  ipcMain.handle('distribucion:eliminar', async (event, sorteoId) => {
    try {
      const result = await query('DELETE FROM distribucion_tiques WHERE sorteo_id = $1 RETURNING id', [sorteoId]);
      
      return {
        success: true,
        mensaje: `Se eliminaron ${result.rowCount} registros de distribución de tiques`
      };
    } catch (error) {
      console.error('Error al eliminar distribución de tiques:', error);
      throw new Error(`Error al eliminar distribución de tiques: ${error.message}`);
    }
  });
  
  // Verificar si existe distribución para un sorteo
  ipcMain.handle('distribucion:existeParaSorteo', async (event, sorteoId) => {
    try {
      const result = await query(
        'SELECT COUNT(*) as total FROM distribucion_tiques WHERE sorteo_id = $1',
        [sorteoId]
      );
      
      return {
        existe: result.rows[0].total > 0,
        total: parseInt(result.rows[0].total)
      };
    } catch (error) {
      console.error('Error al verificar existencia de distribución:', error);
      throw new Error(`Error al verificar existencia de distribución: ${error.message}`);
    }
  });
}

module.exports = setupDistribucionTiquesHandlers; 