const db = require('../config/database');

// Modelo de Premio
const Premio = {
  // Obtener todos los premios
  getAll: async () => {
    return db.any('SELECT * FROM premios ORDER BY orden ASC');
  },

  // Obtener premios por sorteo
  getBySorteo: async (sorteoId) => {
    return db.any('SELECT * FROM premios WHERE sorteo_id = $1 ORDER BY orden ASC', [sorteoId]);
  },

  // Obtener un premio por ID
  getById: async (id) => {
    return db.oneOrNone('SELECT * FROM premios WHERE id = $1', [id]);
  },

  // Crear un nuevo premio
  create: async (premioData) => {
    const { 
      sorteo_id, 
      nombre, 
      descripcion, 
      valor,
      orden,
      categoria_id,
      patrocinador,
      condiciones,
      fecha_entrega,
      images_json 
    } = premioData;
    
    return db.one(
      `INSERT INTO premios(
        sorteo_id, nombre, descripcion, valor, orden, 
        categoria_id, patrocinador, condiciones, fecha_entrega, images_json
      ) 
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *`,
      [sorteo_id, nombre, descripcion, valor, orden, categoria_id, patrocinador, condiciones, fecha_entrega, images_json]
    );
  },

  // Actualizar un premio
  update: async (id, premioData) => {
    const { 
      nombre, 
      descripcion, 
      valor,
      orden,
      categoria_id,
      patrocinador,
      condiciones,
      fecha_entrega,
      images_json 
    } = premioData;
    
    return db.oneOrNone(
      `UPDATE premios SET 
        nombre = $1, 
        descripcion = $2, 
        valor = $3,
        orden = $4,
        categoria_id = $5,
        patrocinador = $6,
        condiciones = $7,
        fecha_entrega = $8,
        images_json = $9
      WHERE id = $10 
      RETURNING *`,
      [nombre, descripcion, valor, orden, categoria_id, patrocinador, condiciones, fecha_entrega, images_json, id]
    );
  },

  // Eliminar un premio
  delete: async (id) => {
    return db.result('DELETE FROM premios WHERE id = $1', [id]);
  },

  // Obtener premios por categoría
  getByCategoria: async (categoriaId) => {
    return db.any('SELECT * FROM premios WHERE categoria_id = $1 ORDER BY sorteo_id, orden', [categoriaId]);
  },

  // Obtener premios disponibles para un sorteo (no asignados a ganadores)
  getDisponiblesBySorteo: async (sorteoId) => {
    return db.any(`
      SELECT p.* FROM premios p
      LEFT JOIN ganadores g ON p.id = g.premio_id
      WHERE p.sorteo_id = $1 AND g.id IS NULL
      ORDER BY p.orden ASC
    `, [sorteoId]);
  },

  // Obtener categorías de premios
  getCategorias: async () => {
    return db.any('SELECT * FROM categorias_premios ORDER BY nombre');
  },

  // Obtener premios con información de categoría
  getAllConCategoria: async () => {
    return db.any(`
      SELECT p.*, c.nombre as categoria_nombre, c.descripcion as categoria_descripcion
      FROM premios p
      LEFT JOIN categorias_premios c ON p.categoria_id = c.id
      ORDER BY p.sorteo_id, p.orden
    `);
  }
};

module.exports = Premio; 