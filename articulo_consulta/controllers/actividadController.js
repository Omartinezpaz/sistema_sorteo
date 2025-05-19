const db = require('../config/database');

const actividadController = {
  // Obtener todas las actividades (admin)
  getAll: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;
      
      const actividades = await db.any(`
        SELECT a.*, u.username as usuario 
        FROM actividades a
        LEFT JOIN usuarios u ON a.usuario_id = u.id
        ORDER BY a.created_at DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]);
      
      const total = await db.one(`
        SELECT COUNT(*) as total FROM actividades
      `);
      
      res.json({
        success: true,
        actividades,
        pagination: {
          total: parseInt(total.total),
          current_page: page,
          per_page: limit,
          last_page: Math.ceil(parseInt(total.total) / limit)
        }
      });
    } catch (error) {
      console.error('Error al obtener actividades:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener el registro de actividades'
      });
    }
  },

  // Obtener reporte de auditoría (rango de fechas)
  getReporteAuditoria: async (req, res) => {
    try {
      const { fecha_inicio, fecha_fin, usuario_id } = req.query;
      
      if (!fecha_inicio || !fecha_fin) {
        return res.status(400).json({
          success: false,
          message: 'Debe especificar fecha de inicio y fin'
        });
      }
      
      // Llamar a la funciu00f3n de reporte de auditoría
      const reporte = await db.any(`
        SELECT * FROM generar_reporte_auditoria($1, $2, $3)
      `, [fecha_inicio, fecha_fin, usuario_id || null]);
      
      res.json({
        success: true,
        reporte
      });
    } catch (error) {
      console.error('Error al generar reporte de auditoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error al generar reporte de auditoría'
      });
    }
  },

  // Registrar una actividad manualmente (rara vez necesario)
  registrar: async (req, res) => {
    try {
      const { accion, tabla_afectada, registro_id, detalles } = req.body;
      
      if (!accion) {
        return res.status(400).json({
          success: false,
          message: 'La acción es obligatoria'
        });
      }
      
      await db.none(`
        INSERT INTO actividades(usuario_id, accion, tabla_afectada, registro_id, detalles, ip_address)
        VALUES($1, $2, $3, $4, $5, $6)
      `, [req.user.id, accion, tabla_afectada, registro_id, detalles, req.ip]);
      
      res.json({
        success: true,
        message: 'Actividad registrada correctamente'
      });
    } catch (error) {
      console.error('Error al registrar actividad:', error);
      res.status(500).json({
        success: false,
        message: 'Error al registrar actividad'
      });
    }
  }
};

module.exports = actividadController; 