const { ipcMain } = require('electron');
const { pool } = require('../database/connection');

// Función auxiliar para mapear categoría de texto a ID
function obtenerCategoriaId(categoria) {
  switch (categoria && categoria.toLowerCase()) {
    case 'principal': return 1;
    case 'secundario': return 2;
    case 'especial': return 3;
    default: return 1;
  }
}

// Handler para crear un nuevo premio
ipcMain.handle('premios:crear', async (event, premio) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(`
      INSERT INTO public.premios (
        sorteo_id,
        nombre,
        descripcion,
        valor,
        categoria_id,
        ambito,
        estado,
        orden,
        fecha_creacion,
        metadata
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9
      ) RETURNING *
    `, [
      premio.sorteoId,
      premio.nombre,
      premio.descripcion,
      premio.valor,
      premio.categoria,
      premio.ambito || 'nacional',
      'activo',
      premio.orden || 0,
      JSON.stringify(premio.metadata || {})
    ]);

    await client.query('COMMIT');
    
    return {
      success: true,
      id: result.rows[0].id,
      premio: result.rows[0],
      mensaje: 'Premio creado correctamente'
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear premio:', error);
    throw error;
  } finally {
    client.release();
  }
});

// Handler para actualizar un premio existente
ipcMain.handle('premios:actualizar', async (event, premio) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(`
      UPDATE public.premios 
      SET 
        nombre = $1,
        descripcion = $2,
        valor = $3,
        categoria_id = $4,
        ambito = $5,
        orden = $6,
        metadata = $7,
        fecha_actualizacion = NOW()
      WHERE id = $8 AND sorteo_id = $9
      RETURNING *
    `, [
      premio.nombre,
      premio.descripcion,
      premio.valor,
      premio.categoria,
      premio.ambito || 'nacional',
      premio.orden || 0,
      JSON.stringify(premio.metadata || {}),
      premio.id,
      premio.sorteoId
    ]);

    await client.query('COMMIT');
    
    return {
      success: true,
      premio: result.rows[0],
      mensaje: 'Premio actualizado correctamente'
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al actualizar premio:', error);
    throw error;
  } finally {
    client.release();
  }
});

// Handler para eliminar un premio
ipcMain.handle('premios:eliminar', async (event, { premioId, sorteoId }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verificar si el premio está siendo usado en la tabla ganadores
    const ganadoresResult = await client.query(`
      SELECT COUNT(*) FROM ganadores WHERE premio_id = $1
    `, [premioId]);

    if (ganadoresResult.rows[0].count > 0) {
      throw new Error('No se puede eliminar el premio porque ya tiene ganadores asignados');
    }

    const result = await client.query(`
      DELETE FROM public.premios 
      WHERE id = $1 AND sorteo_id = $2
      RETURNING id
    `, [premioId, sorteoId]);

    await client.query('COMMIT');
    
    return {
      success: true,
      id: result.rows[0].id,
      mensaje: 'Premio eliminado correctamente'
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al eliminar premio:', error);
    throw error;
  } finally {
    client.release();
  }
});

// Handler para obtener todos los premios de un sorteo
ipcMain.handle('premios:obtenerPorSorteo', async (event, sorteoId) => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        p.*,
        COALESCE(g.ganador_id, 0) as tiene_ganador
      FROM public.premios p
      LEFT JOIN (
        SELECT premio_id, MAX(id) as ganador_id
        FROM ganadores
        GROUP BY premio_id
      ) g ON p.id = g.premio_id
      WHERE p.sorteo_id = $1
      ORDER BY p.orden ASC, p.fecha_creacion ASC
    `, [sorteoId]);

    // Asegurarse de que metadata sea un objeto JSON válido
    return result.rows.map(premio => ({
      ...premio,
      metadata: typeof premio.metadata === 'string' ? 
        JSON.parse(premio.metadata) : 
        premio.metadata || {}
    }));
  } catch (error) {
    console.error('Error al obtener premios:', error);
    throw error;
  } finally {
    client.release();
  }
});

// Handler para obtener un premio específico
ipcMain.handle('premios:obtenerPorId', async (event, premioId) => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        p.*,
        COALESCE(g.ganador_id, 0) as tiene_ganador
      FROM public.premios p
      LEFT JOIN (
        SELECT premio_id, MAX(id) as ganador_id
        FROM ganadores
        GROUP BY premio_id
      ) g ON p.id = g.premio_id
      WHERE p.id = $1
    `, [premioId]);

    if (result.rows.length === 0) {
      return null;
    }

    const premio = result.rows[0];
    return {
      ...premio,
      metadata: typeof premio.metadata === 'string' ? 
        JSON.parse(premio.metadata) : 
        premio.metadata || {}
    };
  } catch (error) {
    console.error('Error al obtener premio:', error);
    throw error;
  } finally {
    client.release();
  }
});

// Handler para migrar premios desde metadata
ipcMain.handle('premios:migrarDesdeMetadata', async (event, sorteoId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Obtener el sorteo con sus metadatos
    const sorteoResult = await client.query(`
      SELECT metadata FROM sorteos WHERE id = $1
    `, [sorteoId]);

    if (sorteoResult.rows.length === 0) {
      throw new Error('Sorteo no encontrado');
    }

    const metadata = sorteoResult.rows[0].metadata;
    if (!metadata || !metadata.premiosNacionales) {
      throw new Error('No hay premios en los metadatos para migrar');
    }

    const premiosInsertados = [];
    for (const premio of metadata.premiosNacionales) {
      const result = await client.query(`
        INSERT INTO public.premios (
          sorteo_id,
          nombre,
          descripcion,
          valor,
          categoria_id,
          ambito,
          estado,
          orden,
          fecha_creacion,
          metadata
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9
        ) RETURNING *
      `, [
        sorteoId,
        premio.nombre,
        premio.descripcion || '',
        parseFloat(premio.valor) || 0,
        obtenerCategoriaId(premio.categoria),
        'nacional',
        'activo',
        parseInt(premio.orden) || 0,
        JSON.stringify({ origen: 'metadata', detalles: premio })
      ]);

      premiosInsertados.push(result.rows[0]);
    }

    await client.query('COMMIT');

    return {
      success: true,
      mensaje: `${premiosInsertados.length} premios migrados desde metadata`,
      premios: premiosInsertados
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al migrar premios desde metadata:', error);
    throw error;
  } finally {
    client.release();
  }
});

module.exports = {
  obtenerCategoriaId
}; 