const { ipcMain } = require('electron');
const { pool } = require('../database/connection');

// Handler para guardar la distribución de tiques
ipcMain.handle('distribucion:guardar', async (event, { sorteoId, distribucion }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Eliminar distribución anterior si existe
    await client.query(`
      DELETE FROM distribucion_tiques 
      WHERE sorteo_id = $1
    `, [sorteoId]);

    // Insertar nueva distribución
    for (const rango of distribucion) {
      await client.query(`
        INSERT INTO distribucion_tiques (
          sorteo_id, 
          cod_estado, 
          rango_desde, 
          rango_hasta, 
          cantidad, 
          porcentaje, 
          fecha_creacion
        ) VALUES (
          $1, 
          (SELECT cod_estado FROM estados WHERE nom_estado = $2), 
          $3, 
          $4, 
          $5, 
          $6, 
          NOW()
        )
      `, [
        sorteoId,
        rango.estado,
        parseInt(rango.inicio),
        parseInt(rango.fin),
        rango.cantidad,
        (rango.cantidad / distribucion.reduce((sum, r) => sum + r.cantidad, 0)) * 100
      ]);
    }

    await client.query('COMMIT');
    
    return {
      success: true,
      mensaje: 'Distribución guardada correctamente'
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al guardar distribución:', error);
    throw error;
  } finally {
    client.release();
  }
});

// Handler para verificar si existe distribución para un sorteo
ipcMain.handle('distribucion:existeParaSorteo', async (event, { sorteoId }) => {
  const client = await pool.connect();
  try {
    // Verificar si existe distribución
    const distribucionResult = await client.query(`
      SELECT SUM(cantidad) as total
      FROM distribucion_tiques 
      WHERE sorteo_id = $1
    `, [sorteoId]);

    const total = distribucionResult.rows[0]?.total || 0;
    
    return {
      existe: total > 0,
      total: parseInt(total)
    };
  } catch (error) {
    console.error('Error al verificar distribución:', error);
    throw error;
  } finally {
    client.release();
  }
});

// Handler para contar participantes por sorteo
ipcMain.handle('participantes:contarPorSorteo', async (event, { sorteoId }) => {
  const client = await pool.connect();
  try {
    // Contar total de participantes
    const totalResult = await client.query(`
      SELECT COUNT(*) as total
      FROM participantes 
      WHERE sorteo_id = $1
    `, [sorteoId]);

    // Contar por estado
    const porEstadoResult = await client.query(`
      SELECT estado, COUNT(*) as cantidad
      FROM participantes
      WHERE sorteo_id = $1
      GROUP BY estado
      ORDER BY estado
    `, [sorteoId]);

    const porEstado = {};
    porEstadoResult.rows.forEach(row => {
      porEstado[row.estado] = parseInt(row.cantidad);
    });

    return {
      total: parseInt(totalResult.rows[0].total),
      porEstado
    };
  } catch (error) {
    console.error('Error al contar participantes:', error);
    throw error;
  } finally {
    client.release();
  }
});

// Handler para obtener metadata del sorteo
ipcMain.handle('sorteo:obtenerMetadata', async (event, { sorteoId }) => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT metadata
      FROM sorteos
      WHERE id = $1
    `, [sorteoId]);

    return result.rows[0] || { metadata: null };
  } catch (error) {
    console.error('Error al obtener metadata:', error);
    throw error;
  } finally {
    client.release();
  }
}); 