const db = require('../config/database');

// Modelo de Participante
const Participante = {
  // Obtener todos los participantes
  getAll: async () => {
    return db.any('SELECT * FROM participantes ORDER BY fecha_registro DESC');
  },

  // Obtener participantes paginados
  getPaginated: async (page = 1, limit = 20) => {
    const offset = (page - 1) * limit;
    const participantes = await db.any('SELECT * FROM participantes ORDER BY fecha_registro DESC LIMIT $1 OFFSET $2', [limit, offset]);
    const total = await db.one('SELECT COUNT(*) FROM participantes');
    
    return {
      participantes,
      pagination: {
        total: parseInt(total.count),
        page,
        limit,
        pages: Math.ceil(parseInt(total.count) / limit)
      }
    };
  },

  // Obtener participantes por sorteo
  getBySorteo: async (sorteoId, page = 1, limit = 20) => {
    const offset = (page - 1) * limit;
    const participantes = await db.any(
      'SELECT * FROM participantes WHERE sorteo_id = $1 ORDER BY fecha_registro DESC LIMIT $2 OFFSET $3', 
      [sorteoId, limit, offset]
    );
    const total = await db.one('SELECT COUNT(*) FROM participantes WHERE sorteo_id = $1', [sorteoId]);
    
    return {
      participantes,
      pagination: {
        total: parseInt(total.count),
        page,
        limit,
        pages: Math.ceil(parseInt(total.count) / limit)
      }
    };
  },

  // Obtener un participante por ID
  getById: async (id) => {
    return db.oneOrNone('SELECT * FROM participantes WHERE id = $1', [id]);
  },

  // Crear un nuevo participante
  create: async (participanteData) => {
    const { 
      sorteo_id, 
      nombre, 
      email, 
      telefono,
      validado = false,
      validado_por = null,
      fecha_validacion = null,
      metodo_registro = 'manual',
      datos_adicionales = null
    } = participanteData;
    
    return db.one(
      `INSERT INTO participantes(
        sorteo_id, nombre, email, telefono, validado, 
        validado_por, fecha_validacion, metodo_registro, datos_adicionales
      ) 
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
      [sorteo_id, nombre, email, telefono, validado, validado_por, fecha_validacion, metodo_registro, datos_adicionales]
    );
  },

  // Actualizar un participante
  update: async (id, participanteData) => {
    const { 
      nombre, 
      email, 
      telefono,
      validado,
      validado_por,
      fecha_validacion,
      metodo_registro,
      datos_adicionales
    } = participanteData;
    
    return db.oneOrNone(
      `UPDATE participantes SET 
        nombre = $1, 
        email = $2, 
        telefono = $3,
        validado = $4,
        validado_por = $5,
        fecha_validacion = $6,
        metodo_registro = $7,
        datos_adicionales = $8
      WHERE id = $9 
      RETURNING *`,
      [nombre, email, telefono, validado, validado_por, fecha_validacion, metodo_registro, datos_adicionales, id]
    );
  },

  // Validar un participante
  validar: async (id, usuarioId) => {
    return db.oneOrNone(
      `UPDATE participantes SET 
        validado = true, 
        validado_por = $1, 
        fecha_validacion = NOW() 
      WHERE id = $2 
      RETURNING *`,
      [usuarioId, id]
    );
  },

  // Eliminar un participante
  delete: async (id) => {
    return db.result('DELETE FROM participantes WHERE id = $1', [id]);
  },

  // Obtener participantes validados por sorteo
  getValidadosBySorteo: async (sorteoId) => {
    return db.any('SELECT * FROM participantes WHERE sorteo_id = $1 AND validado = true ORDER BY fecha_registro', [sorteoId]);
  },

  // Buscar participantes por nombre o email
  buscar: async (texto, sorteoId = null) => {
    const query = sorteoId 
      ? `SELECT * FROM participantes 
         WHERE (nombre ILIKE $1 OR email ILIKE $1) AND sorteo_id = $2 
         ORDER BY fecha_registro DESC`
      : `SELECT * FROM participantes 
         WHERE nombre ILIKE $1 OR email ILIKE $1 
         ORDER BY fecha_registro DESC`;
    
    const params = sorteoId 
      ? [`%${texto}%`, sorteoId]
      : [`%${texto}%`];
    
    return db.any(query, params);
  },

  // Contar participantes por sorteo
  contarPorSorteo: async (sorteoId) => {
    return db.one('SELECT COUNT(*) FROM participantes WHERE sorteo_id = $1', [sorteoId]);
  },

  // Verificar si un email ya está registrado en un sorteo
  verificarEmailEnSorteo: async (email, sorteoId) => {
    return db.oneOrNone('SELECT * FROM participantes WHERE email = $1 AND sorteo_id = $2', [email, sorteoId]);
  },

  // Importar participantes en lote
  importarLote: async (participantes) => {
    const columnas = {
      sorteo_id: 'sorteo_id',
      nombre: 'nombre',
      email: 'email',
      telefono: 'telefono',
      validado: 'validado',
      validado_por: 'validado_por',
      metodo_registro: 'metodo_registro',
      datos_adicionales: 'datos_adicionales'
    };
    
    const cs = new db.$config.pgp.helpers.ColumnSet(
      Object.keys(columnas),
      { table: 'participantes' }
    );
    
    const query = db.$config.pgp.helpers.insert(participantes, cs) + 
                 ' RETURNING id, nombre, email';
    
    return db.many(query);
  }
};

module.exports = Participante; 