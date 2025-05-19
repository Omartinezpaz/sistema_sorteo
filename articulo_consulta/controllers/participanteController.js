const Participante = require('../../models/Participante');
const Sorteo = require('../../models/Sorteo');

const participanteController = {
  // Obtener todos los participantes
  getAll: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      
      const result = await Participante.getPaginated(page, limit);
      
      res.json({
        success: true,
        participantes: result.participantes,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error al obtener participantes:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener los participantes' 
      });
    }
  },

  // Obtener participantes por sorteo
  getBySorteo: async (req, res) => {
    try {
      const { sorteoId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      
      // Verificar que el sorteo existe
      const sorteo = await Sorteo.getById(sorteoId);
      
      if (!sorteo) {
        return res.status(404).json({ 
          success: false, 
          message: 'Sorteo no encontrado' 
        });
      }
      
      const result = await Participante.getBySorteo(sorteoId, page, limit);
      
      res.json({
        success: true,
        participantes: result.participantes,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error al obtener participantes del sorteo:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener los participantes del sorteo' 
      });
    }
  },

  // Obtener un participante por ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const participante = await Participante.getById(id);
      
      if (!participante) {
        return res.status(404).json({ 
          success: false, 
          message: 'Participante no encontrado' 
        });
      }
      
      res.json({
        success: true,
        participante
      });
    } catch (error) {
      console.error('Error al obtener participante:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener el participante' 
      });
    }
  },

  // Crear un nuevo participante
  create: async (req, res) => {
    try {
      const participanteData = req.body;
      
      // Validar datos
      if (!participanteData.sorteo_id || !participanteData.nombre) {
        return res.status(400).json({
          success: false,
          message: 'El sorteo y el nombre del participante son requeridos'
        });
      }
      
      // Verificar que el sorteo existe
      const sorteo = await Sorteo.getById(participanteData.sorteo_id);
      
      if (!sorteo) {
        return res.status(404).json({ 
          success: false, 
          message: 'Sorteo no encontrado' 
        });
      }
      
      // Verificar si el email ya está registrado en el sorteo
      if (participanteData.email) {
        const emailExistente = await Participante.verificarEmailEnSorteo(
          participanteData.email, 
          participanteData.sorteo_id
        );
        
        if (emailExistente) {
          return res.status(400).json({
            success: false,
            message: 'Este email ya está registrado en el sorteo'
          });
        }
      }
      
      const nuevoParticipante = await Participante.create(participanteData);
      
      // Emitir evento de socket.io
      const io = req.app.get('io');
      if (io) {
        io.to(`sorteo:${req.body.sorteo_id}`).emit('nuevo-participante', {
          participante: nuevoParticipante,
          mensaje: `Nuevo participante registrado: ${nuevoParticipante.nombre}`
        });
      }
      
      res.status(201).json({
        success: true,
        message: 'Participante registrado exitosamente',
        participante: nuevoParticipante
      });
    } catch (error) {
      console.error('Error al crear participante:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al registrar el participante' 
      });
    }
  },

  // Actualizar un participante
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const participanteData = req.body;
      
      // Verificar que el participante existe
      const participanteExistente = await Participante.getById(id);
      
      if (!participanteExistente) {
        return res.status(404).json({ 
          success: false, 
          message: 'Participante no encontrado' 
        });
      }
      
      // Verificar que el sorteo existe
      const sorteo = await Sorteo.getById(participanteExistente.sorteo_id);
      
      if (!sorteo) {
        return res.status(404).json({ 
          success: false, 
          message: 'Sorteo no encontrado' 
        });
      }
      
      // Verificar permisos (solo el creador del sorteo o admin puede editar participantes)
      if (req.user.rol !== 'admin' && sorteo.creado_por !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tiene permisos para editar este participante' 
        });
      }
      
      // Verificar si está cambiando el email y si ya existe
      if (participanteData.email && 
          participanteData.email !== participanteExistente.email) {
        const emailExistente = await Participante.verificarEmailEnSorteo(
          participanteData.email, 
          participanteExistente.sorteo_id
        );
        
        if (emailExistente) {
          return res.status(400).json({
            success: false,
            message: 'Este email ya está registrado en el sorteo'
          });
        }
      }
      
      const participanteActualizado = await Participante.update(id, participanteData);
      
      res.json({
        success: true,
        message: 'Participante actualizado exitosamente',
        participante: participanteActualizado
      });
    } catch (error) {
      console.error('Error al actualizar participante:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al actualizar el participante' 
      });
    }
  },

  // Validar un participante
  validar: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar que el participante existe
      const participanteExistente = await Participante.getById(id);
      
      if (!participanteExistente) {
        return res.status(404).json({ 
          success: false, 
          message: 'Participante no encontrado' 
        });
      }
      
      // Verificar que el sorteo existe
      const sorteo = await Sorteo.getById(participanteExistente.sorteo_id);
      
      if (!sorteo) {
        return res.status(404).json({ 
          success: false, 
          message: 'Sorteo no encontrado' 
        });
      }
      
      // Verificar permisos (solo el creador del sorteo o admin puede validar participantes)
      if (req.user.rol !== 'admin' && sorteo.creado_por !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tiene permisos para validar este participante' 
        });
      }
      
      const participanteValidado = await Participante.validar(id, req.user.id);
      
      res.json({
        success: true,
        message: 'Participante validado exitosamente',
        participante: participanteValidado
      });
    } catch (error) {
      console.error('Error al validar participante:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al validar el participante' 
      });
    }
  },

  // Eliminar un participante
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar que el participante existe
      const participanteExistente = await Participante.getById(id);
      
      if (!participanteExistente) {
        return res.status(404).json({ 
          success: false, 
          message: 'Participante no encontrado' 
        });
      }
      
      // Verificar que el sorteo existe
      const sorteo = await Sorteo.getById(participanteExistente.sorteo_id);
      
      if (!sorteo) {
        return res.status(404).json({ 
          success: false, 
          message: 'Sorteo no encontrado' 
        });
      }
      
      // Verificar permisos (solo el creador del sorteo o admin puede eliminar participantes)
      if (req.user.rol !== 'admin' && sorteo.creado_por !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tiene permisos para eliminar este participante' 
        });
      }
      
      const result = await Participante.delete(id);
      
      if (result.rowCount === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Participante no encontrado' 
        });
      }
      
      res.json({
        success: true,
        message: 'Participante eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar participante:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al eliminar el participante' 
      });
    }
  },

  // Buscar participantes
  buscar: async (req, res) => {
    try {
      const { texto } = req.query;
      const { sorteoId } = req.params;
      
      if (!texto) {
        return res.status(400).json({
          success: false,
          message: 'El texto de búsqueda es requerido'
        });
      }
      
      const participantes = await Participante.buscar(texto, sorteoId || null);
      
      res.json({
        success: true,
        participantes
      });
    } catch (error) {
      console.error('Error al buscar participantes:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al buscar participantes' 
      });
    }
  },

  // Importar participantes en lote
  importarLote: async (req, res) => {
    try {
      const { sorteoId } = req.params;
      const { participantes } = req.body;
      
      // Verificar que el sorteo existe
      const sorteo = await Sorteo.getById(sorteoId);
      
      if (!sorteo) {
        return res.status(404).json({ 
          success: false, 
          message: 'Sorteo no encontrado' 
        });
      }
      
      // Verificar permisos (solo el creador del sorteo o admin puede importar participantes)
      if (req.user.rol !== 'admin' && sorteo.creado_por !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tiene permisos para importar participantes a este sorteo' 
        });
      }
      
      // Verificar que hay participantes para importar
      if (!participantes || !Array.isArray(participantes) || participantes.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No hay participantes para importar'
        });
      }
      
      // Agregar el sorteo_id a cada participante
      const participantesConSorteo = participantes.map(p => ({
        ...p,
        sorteo_id: sorteoId,
        metodo_registro: 'importacion'
      }));
      
      const participantesImportados = await Participante.importarLote(participantesConSorteo);
      
      // Emitir evento de socket.io para cada participante agregado
      const io = req.app.get('io');
      if (io && participantesImportados.length > 0) {
        io.to(`sorteo:${sorteoId}`).emit('lote-participantes', {
          cantidad: participantesImportados.length,
          mensaje: `Se han importado ${participantesImportados.length} participantes`
        });
      }
      
      res.status(201).json({
        success: true,
        participantes: participantesImportados,
        message: `Se importaron ${participantesImportados.length} participantes exitosamente`
      });
    } catch (error) {
      console.error('Error al importar participantes:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al importar participantes' 
      });
    }
  }
};

module.exports = participanteController; 