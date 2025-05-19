const Sorteo = require('../models/Sorteo');
const Premio = require('../models/Premio');
const Participante = require('../models/Participante');

const sorteoController = {
  // Obtener todos los sorteos
  getAll: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      const result = await Sorteo.getPaginated(page, limit);
      
      res.json({
        success: true,
        sorteos: result.sorteos,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error al obtener sorteos:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener los sorteos' 
      });
    }
  },

  // Obtener sorteos del usuario logueado
  getMySorteos: async (req, res) => {
    try {
      const sorteos = await Sorteo.getByUsuario(req.user.id);
      
      res.json({
        success: true,
        sorteos
      });
    } catch (error) {
      console.error('Error al obtener mis sorteos:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener tus sorteos' 
      });
    }
  },

  // Obtener sorteos públicos
  getPublicos: async (req, res) => {
    try {
      const sorteos = await Sorteo.getPublicos();
      
      res.json({
        success: true,
        sorteos
      });
    } catch (error) {
      console.error('Error al obtener sorteos públicos:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener los sorteos públicos' 
      });
    }
  },

  // Obtener un sorteo por ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const sorteo = await Sorteo.getById(id);
      
      if (!sorteo) {
        return res.status(404).json({ 
          success: false, 
          message: 'Sorteo no encontrado' 
        });
      }

      // Obtener los premios del sorteo
      const premios = await Premio.getBySorteo(id);
      
      // Contar participantes
      const participantes = await Participante.contarPorSorteo(id);
      
      res.json({
        success: true,
        sorteo: {
          ...sorteo,
          premios,
          total_participantes: parseInt(participantes.count)
        }
      });
    } catch (error) {
      console.error('Error al obtener sorteo:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener el sorteo' 
      });
    }
  },

  // Crear un nuevo sorteo
  create: async (req, res) => {
    try {
      const sorteoData = {
        ...req.body,
        creado_por: req.user.id  // Asignar el usuario que crea el sorteo
      };
      
      // Validar datos
      if (!sorteoData.nombre) {
        return res.status(400).json({
          success: false,
          message: 'El nombre del sorteo es requerido'
        });
      }
      
      const nuevoSorteo = await Sorteo.create(sorteoData);
      
      res.status(201).json({
        success: true,
        message: 'Sorteo creado exitosamente',
        sorteo: nuevoSorteo
      });
    } catch (error) {
      console.error('Error al crear sorteo:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al crear el sorteo' 
      });
    }
  },

  // Actualizar un sorteo
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const sorteoData = req.body;
      
      // Verificar que el sorteo existe
      const sorteoExistente = await Sorteo.getById(id);
      
      if (!sorteoExistente) {
        return res.status(404).json({ 
          success: false, 
          message: 'Sorteo no encontrado' 
        });
      }
      
      // Verificar permisos (solo el creador o admin puede editar)
      if (req.user.rol !== 'admin' && sorteoExistente.creado_por !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tiene permisos para editar este sorteo' 
        });
      }
      
      const sorteoActualizado = await Sorteo.update(id, sorteoData);
      
      res.json({
        success: true,
        message: 'Sorteo actualizado exitosamente',
        sorteo: sorteoActualizado
      });
    } catch (error) {
      console.error('Error al actualizar sorteo:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al actualizar el sorteo' 
      });
    }
  },

  // Actualizar estado de un sorteo
  updateEstado: async (req, res) => {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      
      if (!estado) {
        return res.status(400).json({
          success: false,
          message: 'El nuevo estado es requerido'
        });
      }
      
      // Verificar que el estado sea válido
      const estadosValidos = ['borrador', 'programado', 'en_progreso', 'finalizado', 'suspendido', 'cancelado'];
      if (!estadosValidos.includes(estado)) {
        return res.status(400).json({
          success: false,
          message: 'Estado inválido'
        });
      }
      
      // Verificar que el sorteo existe
      const sorteoExistente = await Sorteo.getById(id);
      
      if (!sorteoExistente) {
        return res.status(404).json({ 
          success: false, 
          message: 'Sorteo no encontrado' 
        });
      }
      
      // Verificar permisos (solo el creador o admin puede actualizar)
      if (req.user.rol !== 'admin' && sorteoExistente.creado_por !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tiene permisos para actualizar este sorteo' 
        });
      }
      
      const sorteoActualizado = await Sorteo.updateEstado(id, estado);
      
      res.json({
        success: true,
        message: `Estado actualizado a: ${estado}`,
        sorteo: sorteoActualizado
      });
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al actualizar el estado del sorteo' 
      });
    }
  },

  // Eliminar un sorteo
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar que el sorteo existe
      const sorteoExistente = await Sorteo.getById(id);
      
      if (!sorteoExistente) {
        return res.status(404).json({ 
          success: false, 
          message: 'Sorteo no encontrado' 
        });
      }
      
      // Verificar permisos (solo el creador o admin puede eliminar)
      if (req.user.rol !== 'admin' && sorteoExistente.creado_por !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tiene permisos para eliminar este sorteo' 
        });
      }
      
      const result = await Sorteo.delete(id);
      
      if (result.rowCount === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Sorteo no encontrado' 
        });
      }
      
      res.json({
        success: true,
        message: 'Sorteo eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar sorteo:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al eliminar el sorteo' 
      });
    }
  },

  // Obtener resumen de sorteos
  getResumen: async (req, res) => {
    try {
      // Usar la vista vw_resumen_sorteos
      const db = require('../config/database');
      const resumen = await db.any(`SELECT * FROM vw_resumen_sorteos`);
      
      res.json({
        success: true,
        resumen
      });
    } catch (error) {
      console.error('Error al obtener resumen de sorteos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener el resumen de sorteos'
      });
    }
  },

  // Realizar un sorteo
  realizarSorteo: async (req, res) => {
    try {
      const sorteoId = req.params.id;
      
      // Verificar que el sorteo existe
      const sorteo = await Sorteo.getById(sorteoId);
      
      if (!sorteo) {
        return res.status(404).json({
          success: false,
          message: 'Sorteo no encontrado'
        });
      }
      
      // Verificar que el usuario tiene permisos (creador o admin)
      if (req.user.rol !== 'admin' && sorteo.creado_por !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'No tiene permisos para realizar este sorteo'
        });
      }
      
      // Verificar que el sorteo está en estado "en_progreso"
      if (sorteo.estado_actual !== 'en_progreso') {
        return res.status(400).json({
          success: false,
          message: 'El sorteo debe estar en estado "en_progreso" para poder realizarse'
        });
      }
      
      // Llamar a la función de la base de datos para realizar el sorteo
      const db = require('../config/database');
      const resultado = await db.oneOrNone(`
        SELECT realizar_sorteo($1, $2) as resultado
      `, [sorteoId, req.user.id]);
      
      if (!resultado) {
        return res.status(500).json({
          success: false,
          message: 'Error al realizar el sorteo'
        });
      }
      
      // Notificar a los clientes conectados vía Socket.io
      const io = req.app.get('io');
      io.to(`sorteo:${sorteoId}`).emit('sorteo:resultado', {
        sorteoId: sorteoId,
        resultado: resultado.resultado
      });
      
      // Enviar respuesta
      res.json({
        success: true,
        message: 'Sorteo realizado correctamente',
        resultado: resultado.resultado
      });
      
    } catch (error) {
      console.error('Error al realizar sorteo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al realizar el sorteo',
        error: error.message
      });
    }
  }
};

module.exports = sorteoController; 