const { ipcMain } = require('electron');
const { query } = require('../database/db');

function setupSorteosHandlers() {
  // Obtener todos los sorteos
  ipcMain.handle('sorteos:getAll', async () => {
    try {
      const result = await query(`
        SELECT 
          id, 
          nombre, 
          fecha_creacion, 
          fecha_sorteo, 
          estado_actual AS estado, 
          descripcion,
          (SELECT COUNT(*) FROM premios WHERE sorteo_id = sorteos.id) AS total_premios,
          (
            SELECT COALESCE(SUM(valor), 0) 
            FROM premios 
            WHERE sorteo_id = sorteos.id
          ) AS valor_premios
        FROM sorteos
        ORDER BY 
          CASE 
            WHEN estado_actual = 'programado' THEN 1
            WHEN estado_actual = 'borrador' THEN 2
            WHEN estado_actual = 'activo' THEN 3
            WHEN estado_actual = 'finalizado' THEN 4
            ELSE 5
          END,
          fecha_sorteo DESC
      `);
      return result.rows;
    } catch (error) {
      console.error('Error al obtener sorteos:', error);
      throw new Error('Error al obtener sorteos');
    }
  });

  // Obtener sorteo por ID
  ipcMain.handle('sorteos:getSorteoById', async (event, id) => {
    try {
      const result = await query(`
        SELECT id, nombre, descripcion, fecha_creacion, fecha_sorteo, estado_actual, metadata
        FROM sorteos
        WHERE id = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        throw new Error(`Sorteo con ID ${id} no encontrado`);
      }
      
      return result.rows[0];
    } catch (error) {
      console.error(`Error al obtener sorteo con ID ${id}:`, error);
      throw error;
    }
  });

  // Crear un nuevo sorteo
  ipcMain.handle('sorteos:createSorteo', async (event, sorteoData) => {
    try {
      const { nombre, descripcion, fecha_sorteo, estado_actual = 'borrador', metadata = {} } = sorteoData;
      
      const result = await query(`
        INSERT INTO sorteos (nombre, descripcion, fecha_sorteo, estado_actual, metadata)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, nombre, fecha_creacion, fecha_sorteo, estado_actual
      `, [nombre, descripcion, fecha_sorteo, estado_actual, metadata]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error al crear sorteo:', error);
      throw error;
    }
  });

  // Actualizar un sorteo existente
  ipcMain.handle('sorteos:updateSorteo', async (event, id, sorteoData) => {
    try {
      const { nombre, descripcion, fecha_sorteo, estado_actual, metadata } = sorteoData;
      
      const result = await query(`
        UPDATE sorteos
        SET nombre = $1, 
            descripcion = $2, 
            fecha_sorteo = $3, 
            estado_actual = $4,
            metadata = $5,
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING id, nombre, descripcion, fecha_creacion, fecha_sorteo, estado_actual, metadata
      `, [nombre, descripcion, fecha_sorteo, estado_actual, metadata, id]);
      
      if (result.rows.length === 0) {
        throw new Error(`Sorteo con ID ${id} no encontrado`);
      }
      
      return result.rows[0];
    } catch (error) {
      console.error(`Error al actualizar sorteo con ID ${id}:`, error);
      throw error;
    }
  });

  // Eliminar un sorteo y sus registros relacionados
  ipcMain.handle('sorteos:eliminarSorteo', async (event, sorteoId) => {
    // Iniciar una transacción para garantizar que se eliminen todos los registros o ninguno
    const client = await query('BEGIN');
    
    try {
      console.log(`Eliminando sorteo ID: ${sorteoId}`);
      
      // 1. Primero eliminar ganadores (tiene referencia a participantes)
      const resultGanadores = await query('DELETE FROM ganadores WHERE sorteo_id = $1 RETURNING id', [sorteoId]);
      console.log(`Eliminados ${resultGanadores.rowCount} registros de ganadores`);
      
      // 2. Eliminar participantes y premios (estos pueden eliminarse en cualquier orden)
      const resultParticipantes = await query('DELETE FROM participantes WHERE sorteo_id = $1 RETURNING id', [sorteoId]);
      console.log(`Eliminados ${resultParticipantes.rowCount} registros de participantes`);
      
      const resultPremios = await query('DELETE FROM premios WHERE sorteo_id = $1 RETURNING id', [sorteoId]);
      console.log(`Eliminados ${resultPremios.rowCount} registros de premios`);
      
      // 3. Finalmente eliminar el sorteo
      const resultSorteo = await query('DELETE FROM sorteos WHERE id = $1 RETURNING id', [sorteoId]);
      console.log(`Eliminado sorteo ID: ${sorteoId}`);
      
      // Confirmar la transacción
      await query('COMMIT');
      
      return {
        success: true,
        eliminados: {
          ganadores: resultGanadores.rowCount,
          participantes: resultParticipantes.rowCount,
          premios: resultPremios.rowCount,
          sorteo: resultSorteo.rowCount
        }
      };
    } catch (error) {
      // Revertir la transacción en caso de error
      await query('ROLLBACK');
      console.error('Error al eliminar sorteo:', error);
      throw new Error(`Error al eliminar sorteo: ${error.message}`);
    }
  });

  // Actualizar el estado de un sorteo
  ipcMain.handle('sorteos:updateSorteoEstado', async (event, id, nuevoEstado) => {
    try {
      const estadosValidos = ['borrador', 'programado', 'en_progreso', 'finalizado', 'cancelado'];
      
      if (!estadosValidos.includes(nuevoEstado)) {
        throw new Error(`Estado "${nuevoEstado}" no válido. Estados permitidos: ${estadosValidos.join(', ')}`);
      }
      
      // Al programar o finalizar un sorteo, hacerlo público automáticamente
      if (nuevoEstado === 'programado' || nuevoEstado === 'finalizado') {
        const result = await query(`
          UPDATE sorteos
          SET estado_actual = $1,
              es_publico = true,
              fecha_actualizacion = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING id, nombre, estado_actual, es_publico
        `, [nuevoEstado, id]);
        
        if (result.rows.length === 0) {
          throw new Error(`Sorteo con ID ${id} no encontrado`);
        }
        
        return result.rows[0];
      } else {
        // Para otros estados, mantener la actualización normal
        const result = await query(`
          UPDATE sorteos
          SET estado_actual = $1,
              fecha_actualizacion = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING id, nombre, estado_actual
        `, [nuevoEstado, id]);
        
        if (result.rows.length === 0) {
          throw new Error(`Sorteo con ID ${id} no encontrado`);
        }
        
        return result.rows[0];
      }
    } catch (error) {
      console.error(`Error al actualizar estado del sorteo con ID ${id}:`, error);
      throw error;
    }
  });

  // Obtener sorteos por estado
  ipcMain.handle('sorteos:getSorteosByEstado', async (event, estados) => {
    try {
      // Verificar que estados sea un array
      if (!Array.isArray(estados)) {
        estados = [estados];
      }
      
      const result = await query(`
        SELECT id, nombre, descripcion, fecha_creacion, fecha_sorteo, estado_actual, metadata
        FROM sorteos
        WHERE estado_actual = ANY($1)
        ORDER BY fecha_sorteo DESC
      `, [estados]);
      
      return result.rows;
    } catch (error) {
      console.error('Error al obtener sorteos por estado:', error);
      throw error;
    }
  });

  // Actualizar metadata de un sorteo
  ipcMain.handle('sorteos:actualizarMetadata', async (event, id, metadata) => {
    try {
      // Primero obtener el sorteo actual
      const sorteoActual = await query(`
        SELECT metadata FROM sorteos WHERE id = $1
      `, [id]);
      
      if (sorteoActual.rows.length === 0) {
        throw new Error(`Sorteo con ID ${id} no encontrado`);
      }
      
      // Combinar la metadata actual con la nueva
      const metadataActual = sorteoActual.rows[0].metadata || {};
      const metadataCombinada = { ...metadataActual, ...metadata };
      
      // Actualizar la metadata
      const result = await query(`
        UPDATE sorteos
        SET metadata = $1,
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, nombre, estado_actual, metadata
      `, [metadataCombinada, id]);
      
      return result.rows[0];
    } catch (error) {
      console.error(`Error al actualizar metadata del sorteo con ID ${id}:`, error);
      throw error;
    }
  });
}

module.exports = setupSorteosHandlers; 