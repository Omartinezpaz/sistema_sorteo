const { ipcMain } = require('electron');
const db = require('../database/db');

function setupGanadoresHandlers() {
  // Obtener todos los ganadores de un sorteo
  ipcMain.handle('ganadores:getGanadoresBySorteo', async (event, sorteoId) => {
    try {
      const result = await db.query(`
        SELECT g.*, 
               p.nombre as participante_nombre, 
               p.apellido as participante_apellido,
               p.documento_identidad, 
               p.estado as participante_estado,
               pr.nombre as premio_nombre, 
               pr.valor as premio_valor
        FROM ganadores g
        JOIN participantes p ON g.participante_id = p.id
        JOIN premios pr ON g.premio_id = pr.id
        WHERE g.sorteo_id = $1
        ORDER BY g.fecha_sorteo
      `, [sorteoId]);
      
      return result.rows;
    } catch (error) {
      console.error(`Error al obtener ganadores del sorteo ${sorteoId}:`, error);
      throw error;
    }
  });

  // Obtener un ganador por ID
  ipcMain.handle('ganadores:getGanadorById', async (event, ganadorId) => {
    try {
      const result = await db.query(`
        SELECT g.*, 
               p.nombre as participante_nombre, 
               p.apellido as participante_apellido,
               p.documento_identidad, 
               p.estado as participante_estado,
               pr.nombre as premio_nombre, 
               pr.valor as premio_valor
        FROM ganadores g
        JOIN participantes p ON g.participante_id = p.id
        JOIN premios pr ON g.premio_id = pr.id
        WHERE g.id = $1
      `, [ganadorId]);
      
      if (result.rows.length === 0) {
        throw new Error(`Ganador con ID ${ganadorId} no encontrado`);
      }
      
      return result.rows[0];
    } catch (error) {
      console.error(`Error al obtener ganador con ID ${ganadorId}:`, error);
      throw error;
    }
  });

  // Registrar un nuevo ganador
  ipcMain.handle('ganadores:registrarGanador', async (event, ganadorData) => {
    try {
      const { 
        sorteo_id, 
        participante_id, 
        premio_id, 
        numero_ganador, 
        fecha_sorteo = new Date(),
        metadata = {}
      } = ganadorData;
      
      // Verificar que el participante exista y tenga tique asignado
      const participanteResult = await db.query(`
        SELECT id, codigo_tique, tique_asignado 
        FROM participantes 
        WHERE id = $1
      `, [participante_id]);
      
      if (participanteResult.rows.length === 0) {
        throw new Error(`Participante con ID ${participante_id} no encontrado`);
      }
      
      if (!participanteResult.rows[0].tique_asignado) {
        throw new Error(`El participante con ID ${participante_id} no tiene un tique asignado`);
      }
      
      // Verificar que el premio exista
      const premioResult = await db.query(`
        SELECT id FROM premios WHERE id = $1
      `, [premio_id]);
      
      if (premioResult.rows.length === 0) {
        throw new Error(`Premio con ID ${premio_id} no encontrado`);
      }
      
      // Registrar al ganador
      const result = await db.query(`
        INSERT INTO ganadores (
          sorteo_id, 
          participante_id, 
          premio_id, 
          numero_ganador, 
          fecha_sorteo, 
          metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, sorteo_id, participante_id, premio_id, numero_ganador, fecha_sorteo
      `, [
        sorteo_id, 
        participante_id, 
        premio_id, 
        numero_ganador, 
        fecha_sorteo,
        metadata
      ]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error al registrar ganador:', error);
      throw error;
    }
  });

  // Eliminar un ganador
  ipcMain.handle('ganadores:deleteGanador', async (event, ganadorId) => {
    try {
      // Primero verificar que exista el ganador
      const checkResult = await db.query('SELECT id FROM ganadores WHERE id = $1', [ganadorId]);
      
      if (checkResult.rows.length === 0) {
        throw new Error(`Ganador con ID ${ganadorId} no encontrado`);
      }
      
      // Eliminar el ganador
      await db.query('DELETE FROM ganadores WHERE id = $1', [ganadorId]);
      
      return { success: true, message: `Ganador con ID ${ganadorId} eliminado correctamente` };
    } catch (error) {
      console.error(`Error al eliminar ganador con ID ${ganadorId}:`, error);
      throw error;
    }
  });

  // Realizar sorteo automático para un premio
  ipcMain.handle('ganadores:realizarSorteoAutomatico', async (event, sorteoId, premioId) => {
    try {
      // 1. Verificar que el sorteo exista y esté en estado 'en_progreso'
      const sorteoResult = await db.query(`
        SELECT id, estado_actual FROM sorteos WHERE id = $1
      `, [sorteoId]);
      
      if (sorteoResult.rows.length === 0) {
        throw new Error(`Sorteo con ID ${sorteoId} no encontrado`);
      }
      
      if (sorteoResult.rows[0].estado_actual !== 'en_progreso') {
        throw new Error(`El sorteo debe estar en estado 'en_progreso' para realizar un sorteo automático (estado actual: ${sorteoResult.rows[0].estado_actual})`);
      }
      
      // 2. Verificar que el premio exista
      const premioResult = await db.query(`
        SELECT id, nombre FROM premios WHERE id = $1 AND sorteo_id = $2
      `, [premioId, sorteoId]);
      
      if (premioResult.rows.length === 0) {
        throw new Error(`Premio con ID ${premioId} no encontrado para el sorteo ${sorteoId}`);
      }
      
      // 3. Obtener participantes validados con tique asignado que no hayan ganado aún
      const participantesResult = await db.query(`
        SELECT p.id, p.nombre, p.apellido, p.documento_identidad, p.estado, p.numero_tique, p.codigo_tique
        FROM participantes p
        LEFT JOIN ganadores g ON p.id = g.participante_id AND g.sorteo_id = $1
        WHERE p.sorteo_id = $1 
          AND p.validado = true 
          AND p.tique_asignado = true
          AND g.id IS NULL
        ORDER BY RANDOM()
        LIMIT 10
      `, [sorteoId]);
      
      if (participantesResult.rows.length === 0) {
        throw new Error('No hay participantes elegibles para el sorteo');
      }
      
      // 4. Seleccionar un ganador aleatorio
      const indiceGanador = Math.floor(Math.random() * participantesResult.rows.length);
      const ganador = participantesResult.rows[indiceGanador];
      
      // 5. Registrar al ganador
      const resultado = await db.query(`
        INSERT INTO ganadores (
          sorteo_id, 
          participante_id, 
          premio_id, 
          numero_ganador, 
          fecha_sorteo
        )
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        RETURNING id
      `, [
        sorteoId,
        ganador.id,
        premioId,
        ganador.numero_tique
      ]);
      
      // 6. Obtener datos completos del ganador
      const ganadorCompleto = await db.query(`
        SELECT g.*, 
               p.nombre as participante_nombre, 
               p.apellido as participante_apellido,
               p.documento_identidad, 
               p.estado as participante_estado,
               p.codigo_tique,
               pr.nombre as premio_nombre, 
               pr.valor as premio_valor
        FROM ganadores g
        JOIN participantes p ON g.participante_id = p.id
        JOIN premios pr ON g.premio_id = pr.id
        WHERE g.id = $1
      `, [resultado.rows[0].id]);
      
      return {
        success: true,
        ganador: ganadorCompleto.rows[0],
        mensaje: `¡Se ha seleccionado un ganador para el premio ${premioResult.rows[0].nombre}!`
      };
    } catch (error) {
      console.error(`Error al realizar sorteo automático para premio ${premioId}:`, error);
      throw error;
    }
  });

  // Finalizar un sorteo (actualizar a estado finalizado)
  ipcMain.handle('ganadores:finalizarSorteo', async (event, sorteoId) => {
    try {
      // 1. Verificar que el sorteo exista y esté en estado 'en_progreso'
      const sorteoResult = await db.query(`
        SELECT id, estado_actual FROM sorteos WHERE id = $1
      `, [sorteoId]);
      
      if (sorteoResult.rows.length === 0) {
        throw new Error(`Sorteo con ID ${sorteoId} no encontrado`);
      }
      
      if (sorteoResult.rows[0].estado_actual !== 'en_progreso') {
        throw new Error(`El sorteo debe estar en estado 'en_progreso' para finalizarlo (estado actual: ${sorteoResult.rows[0].estado_actual})`);
      }
      
      // 2. Verificar que todos los premios tengan un ganador asignado
      const premiosResult = await db.query(`
        SELECT p.id, p.nombre
        FROM premios p
        LEFT JOIN ganadores g ON p.id = g.premio_id AND g.sorteo_id = $1
        WHERE p.sorteo_id = $1 AND g.id IS NULL
      `, [sorteoId]);
      
      if (premiosResult.rows.length > 0) {
        // Hay premios sin asignar
        return {
          success: false,
          premiosPendientes: premiosResult.rows.length,
          premios: premiosResult.rows,
          mensaje: `Hay ${premiosResult.rows.length} premios sin asignar ganadores`
        };
      }
      
      // 3. Actualizar el estado del sorteo a 'finalizado'
      await db.query(`
        UPDATE sorteos
        SET estado_actual = 'finalizado',
            es_publico = true,
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [sorteoId]);
      
      return {
        success: true,
        mensaje: 'El sorteo ha sido finalizado correctamente'
      };
    } catch (error) {
      console.error(`Error al finalizar el sorteo ${sorteoId}:`, error);
      throw error;
    }
  });
}

module.exports = setupGanadoresHandlers; 