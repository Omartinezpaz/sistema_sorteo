const db = require('../config/database');

const ganadorController = {
  // Obtener todos los ganadores
  getAll: async (req, res) => {
    try {
      const ganadores = await db.any('SELECT * FROM ganadores');
      res.json({
        success: true,
        ganadores
      });
    } catch (error) {
      console.error('Error al obtener ganadores:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener ganadores'
      });
    }
  },

  // Obtener ganadores por sorteo
  getBySorteo: async (req, res) => {
    try {
      const sorteoId = req.params.sorteoId;
      
      // Usar la vista para obtener detalles completos
      const ganadores = await db.any(`
        SELECT * FROM vw_detalle_ganadores
        WHERE sorteo_id = $1
      `, [sorteoId]);
      
      res.json({
        success: true,
        ganadores
      });
    } catch (error) {
      console.error('Error al obtener ganadores del sorteo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener ganadores del sorteo'
      });
    }
  },

  // Validar un ganador
  validar: async (req, res) => {
    try {
      const ganadorId = req.params.id;
      const { comentarios } = req.body;
      
      // Llamar a la funciu00f3n de validaciu00f3n de la base de datos
      const resultado = await db.one(`
        SELECT validar_ganador($1, $2, $3) as validado
      `, [ganadorId, req.user.id, comentarios || null]);
      
      if (!resultado.validado) {
        return res.status(404).json({
          success: false,
          message: 'Ganador no encontrado o ya validado'
        });
      }
      
      res.json({
        success: true,
        message: 'Ganador validado correctamente'
      });
    } catch (error) {
      console.error('Error al validar ganador:', error);
      res.status(500).json({
        success: false,
        message: 'Error al validar ganador'
      });
    }
  },

  // Obtener estadu00edsticas de ganadores por regiu00f3n
  getEstadisticasPorRegion: async (req, res) => {
    try {
      // Usar la vista de participaciu00f3n por regiu00f3n
      const estadisticas = await db.any(`
        SELECT * FROM vw_participacion_region
        ORDER BY total_ganadores DESC
      `);
      
      res.json({
        success: true,
        estadisticas
      });
    } catch (error) {
      console.error('Error al obtener estadu00edsticas de ganadores:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadu00edsticas de ganadores'
      });
    }
  }
};

module.exports = ganadorController; 