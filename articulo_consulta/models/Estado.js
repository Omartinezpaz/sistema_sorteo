const db = require('../config/database');

// Modelo de Estado
const Estado = {
  // Obtener todos los estados activos
  getAllEstados: async () => {
    return db.any('SELECT DISTINCT nom_estado, cod_estado FROM estados WHERE activo = true ORDER BY nom_estado');
  },

  // Obtener municipios por estado
  getMunicipiosByEstado: async (nomEstado) => {
    return db.any('SELECT DISTINCT nom_municipio, cod_municipio FROM estados WHERE nom_estado = $1 AND activo = true ORDER BY nom_municipio', [nomEstado]);
  },

  // Obtener parroquias por municipio
  getParroquiasByMunicipio: async (nomEstado, nomMunicipio) => {
    return db.any('SELECT nom_parroquia, cod_parroquia FROM estados WHERE nom_estado = $1 AND nom_municipio = $2 AND activo = true ORDER BY nom_parroquia', [nomEstado, nomMunicipio]);
  },

  // Obtener detalles de una parroquia específica
  getParroquia: async (id) => {
    return db.oneOrNone('SELECT * FROM estados WHERE id = $1', [id]);
  },

  // Buscar por nombre (útil para autocompletado)
  buscarPorNombre: async (query) => {
    const likeQuery = `%${query}%`;
    return db.any(`
      SELECT id, nom_estado, cod_estado, nom_municipio, cod_municipio, nom_parroquia, cod_parroquia 
      FROM estados 
      WHERE 
        (nom_estado ILIKE $1 OR 
         nom_municipio ILIKE $1 OR 
         nom_parroquia ILIKE $1) AND
        activo = true
      ORDER BY nom_estado, nom_municipio, nom_parroquia
      LIMIT 20
    `, [likeQuery]);
  },
  
  // Obtener todas las ubicaciones completas (para el frontend)
  getAllUbicaciones: async () => {
    return db.any(`
      SELECT 
        nom_estado, 
        cod_estado, 
        nom_municipio, 
        cod_municipio, 
        nom_parroquia, 
        cod_parroquia 
      FROM estados 
      WHERE activo = true
      ORDER BY nom_estado, nom_municipio, nom_parroquia
    `);
  }
};

module.exports = Estado; 