const db = require('../config/database');

const estadisticaController = {
  // Obtener estadísticas demográficas por estado
  getDemograficas: async (req, res) => {
    try {
      const estadisticas = await db.any('SELECT * FROM vw_estadisticas_demograficas ORDER BY total_participantes DESC');
      
      res.json({
        success: true,
        estadisticas
      });
    } catch (error) {
      console.error('Error al obtener estadísticas demográficas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener las estadísticas demográficas'
      });
    }
  },

  // Obtener estados por cuota
  getEstadosPorCuota: async (req, res) => {
    try {
      const { limite } = req.query;
      const limitePorEstado = limite ? parseInt(limite) : 5;
      
      const estadosPorCuota = await db.func('obtener_estados_por_cuota', [limitePorEstado]);
      
      res.json({
        success: true,
        estadosPorCuota
      });
    } catch (error) {
      console.error('Error al obtener estados por cuota:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener los estados por cuota'
      });
    }
  },

  // Obtener sorteos por ubicación
  getSorteosPorUbicacion: async (req, res) => {
    try {
      const { estado, municipio } = req.query;
      
      let query = 'SELECT * FROM vw_sorteos_por_ubicacion';
      const params = [];
      
      if (estado) {
        query += ' WHERE nom_estado = $1';
        params.push(estado);
        
        if (municipio) {
          query += ' AND nom_municipio = $2';
          params.push(municipio);
        }
      }
      
      query += ' ORDER BY fecha_sorteo DESC';
      
      const sorteosPorUbicacion = await db.any(query, params);
      
      res.json({
        success: true,
        sorteosPorUbicacion
      });
    } catch (error) {
      console.error('Error al obtener sorteos por ubicación:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener los sorteos por ubicación'
      });
    }
  },

  // Obtener conteo geográfico
  getConteoGeografico: async (req, res) => {
    try {
      const conteo = await db.any('SELECT * FROM vw_conteo_geografico');
      
      res.json({
        success: true,
        conteo
      });
    } catch (error) {
      console.error('Error al obtener conteo geográfico:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener el conteo geográfico'
      });
    }
  }
};

module.exports = estadisticaController; 