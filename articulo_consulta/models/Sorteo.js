const db = require('../config/database');

// Modelo de Sorteo
const Sorteo = {
  // Obtener todos los sorteos
  getAll: async () => {
    return db.any('SELECT * FROM sorteos ORDER BY fecha_creacion DESC');
  },

  // Obtener sorteos paginados
  getPaginated: async (page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    const sorteos = await db.any('SELECT * FROM sorteos ORDER BY fecha_creacion DESC LIMIT $1 OFFSET $2', [limit, offset]);
    const total = await db.one('SELECT COUNT(*) FROM sorteos');
    
    return {
      sorteos,
      pagination: {
        total: parseInt(total.count),
        page,
        limit,
        pages: Math.ceil(parseInt(total.count) / limit)
      }
    };
  },

  // Obtener un sorteo por ID
  getById: async (id) => {
    return db.oneOrNone('SELECT * FROM sorteos WHERE id = $1', [id]);
  },

  // Crear un nuevo sorteo
  create: async (sorteoData) => {
    const { 
      nombre, 
      fecha_sorteo, 
      estado, 
      descripcion, 
      creado_por, 
      estado_actual = 'borrador', 
      es_publico = false,
      reglas = null,
      imagenes_json = null,
      metadata = null
    } = sorteoData;
    
    return db.one(
      `INSERT INTO sorteos(
        nombre, fecha_sorteo, estado, descripcion, creado_por, 
        estado_actual, es_publico, reglas, imagenes_json, metadata
      ) 
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *`,
      [nombre, fecha_sorteo, estado, descripcion, creado_por, estado_actual, es_publico, reglas, imagenes_json, metadata]
    );
  },

  // Actualizar un sorteo
  update: async (id, sorteoData) => {
    const { 
      nombre, 
      fecha_sorteo, 
      estado, 
      descripcion, 
      estado_actual, 
      es_publico,
      reglas,
      imagenes_json,
      metadata
    } = sorteoData;
    
    return db.oneOrNone(
      `UPDATE sorteos SET 
        nombre = $1, 
        fecha_sorteo = $2, 
        estado = $3, 
        descripcion = $4, 
        estado_actual = $5, 
        es_publico = $6,
        reglas = $7,
        imagenes_json = $8,
        metadata = $9
      WHERE id = $10 
      RETURNING *`,
      [nombre, fecha_sorteo, estado, descripcion, estado_actual, es_publico, reglas, imagenes_json, metadata, id]
    );
  },

  // Actualizar el estado de un sorteo
  updateEstado: async (id, nuevoEstado) => {
    return db.oneOrNone(
      'UPDATE sorteos SET estado_actual = $1 WHERE id = $2 RETURNING *',
      [nuevoEstado, id]
    );
  },

  // Eliminar un sorteo
  delete: async (id) => {
    return db.result('DELETE FROM sorteos WHERE id = $1', [id]);
  },

  // Obtener sorteos por usuario creador
  getByUsuario: async (usuarioId) => {
    return db.any('SELECT * FROM sorteos WHERE creado_por = $1 ORDER BY fecha_creacion DESC', [usuarioId]);
  },

  // Obtener sorteos públicos
  getPublicos: async () => {
    return db.any('SELECT * FROM sorteos WHERE es_publico = true AND estado_actual IN (\'programado\', \'en_progreso\') ORDER BY fecha_sorteo ASC');
  },

  // Obtener resumen de sorteos (usando vista)
  getResumen: async () => {
    return db.any('SELECT * FROM public.vw_resumen_sorteos ORDER BY fecha_sorteo DESC');
  },

  // Realizar un sorteo (usando función de la base de datos)
  realizarSorteo: async (sorteoId, usuarioId) => {
    return db.one('SELECT realizar_sorteo($1, $2) as resultado', [sorteoId, usuarioId]);
  }
};

module.exports = Sorteo; 