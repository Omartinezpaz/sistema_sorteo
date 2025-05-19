const db = require('../config/database');

const estadoController = {
  // Obtener todos los estados/regiones
  getAll: async (req, res) => {
    try {
      // Usar la vista vw_api_geografica que devuelve una estructura JSON jerárquica
      const estados = await db.any('SELECT * FROM vw_api_geografica');
      res.json({
        success: true,
        estados
      });
    } catch (error) {
      console.error('Error al obtener estados:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener los estados'
      });
    }
  },

  // Obtener por estado
  getByEstado: async (req, res) => {
    try {
      const codEstado = req.params.codEstado;
      
      // Usar la vista vw_api_geografica filtrada por estado
      const estado = await db.oneOrNone('SELECT * FROM vw_api_geografica WHERE estado_id = $1', [codEstado]);
      
      res.json({
        success: true,
        estado
      });
    } catch (error) {
      console.error('Error al obtener municipios del estado:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener los municipios del estado'
      });
    }
  },

  // Obtener por municipio
  getByMunicipio: async (req, res) => {
    try {
      const codEstado = req.params.codEstado;
      const codMunicipio = req.params.codMunicipio;
      
      // Usar la vista vw_parroquias_completas
      const parroquias = await db.any(`
        SELECT * FROM vw_parroquias_completas 
        WHERE cod_estado = $1 AND cod_municipio = $2 
        ORDER BY nom_parroquia
      `, [codEstado, codMunicipio]);
      
      res.json({
        success: true,
        parroquias
      });
    } catch (error) {
      console.error('Error al obtener parroquias del municipio:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener las parroquias del municipio'
      });
    }
  },

  // Obtener lista agrupada de estados
  getEstados: async (req, res) => {
    try {
      // Usar la vista vw_estados
      const estados = await db.any('SELECT id as cod_estado, nombre as nom_estado FROM vw_estados WHERE activos > 0');
      
      res.json({
        success: true,
        estados
      });
    } catch (error) {
      console.error('Error al obtener lista de estados:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener la lista de estados'
      });
    }
  },

  // Obtener lista agrupada de municipios por estado
  getMunicipios: async (req, res) => {
    try {
      const codEstado = req.params.codEstado;
      
      // Usar la vista vw_municipios
      const municipios = await db.any(`
        SELECT id as cod_municipio, nombre as nom_municipio 
        FROM vw_municipios 
        WHERE cod_estado = $1 AND activos > 0
        ORDER BY nombre
      `, [codEstado]);
      
      res.json({
        success: true,
        municipios
      });
    } catch (error) {
      console.error('Error al obtener lista de municipios:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener la lista de municipios'
      });
    }
  },

  // Obtener lista agrupada de parroquias por municipio
  getParroquias: async (req, res) => {
    try {
      const codEstado = req.params.codEstado;
      const codMunicipio = req.params.codMunicipio;
      
      // Usar la vista vw_parroquias_completas
      const parroquias = await db.any(`
        SELECT cod_parroquia, nom_parroquia 
        FROM vw_parroquias_completas 
        WHERE cod_estado = $1 AND cod_municipio = $2 AND activo = true
        ORDER BY nom_parroquia
      `, [codEstado, codMunicipio]);
      
      res.json({
        success: true,
        parroquias
      });
    } catch (error) {
      console.error('Error al obtener lista de parroquias:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener la lista de parroquias'
      });
    }
  },

  // Buscar ubicaciones por término
  buscar: async (req, res) => {
    try {
      const { termino } = req.query;
      
      if (!termino || termino.length < 3) {
        return res.json({
          success: true,
          resultados: []
        });
      }
      
      // Usar la vista vw_busqueda_geografica
      const resultados = await db.any(`
        SELECT * FROM vw_busqueda_geografica
        WHERE 
          nombre_completo ILIKE $1 OR 
          nom_estado ILIKE $1 OR 
          nom_municipio ILIKE $1 OR 
          nom_parroquia ILIKE $1
        ORDER BY nom_estado, nom_municipio, nom_parroquia
        LIMIT 20
      `, [`%${termino}%`]);
      
      res.json({
        success: true,
        resultados
      });
    } catch (error) {
      console.error('Error en búsqueda de ubicaciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error al realizar la búsqueda de ubicaciones'
      });
    }
  }
};

module.exports = estadoController; 