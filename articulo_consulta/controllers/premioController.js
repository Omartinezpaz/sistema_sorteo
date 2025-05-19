const Premio = require('../models/Premio');
const Sorteo = require('../models/Sorteo');

const premioController = {
  // Obtener todos los premios
  getAll: async (req, res) => {
    try {
      const premios = await Premio.getAll();
      
      res.json({
        success: true,
        premios
      });
    } catch (error) {
      console.error('Error al obtener premios:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener los premios' 
      });
    }
  },

  // Obtener premios por sorteo
  getBySorteo: async (req, res) => {
    try {
      const { sorteoId } = req.params;
      
      // Verificar que el sorteo existe
      const sorteo = await Sorteo.getById(sorteoId);
      
      if (!sorteo) {
        return res.status(404).json({ 
          success: false, 
          message: 'Sorteo no encontrado' 
        });
      }
      
      const premios = await Premio.getBySorteo(sorteoId);
      
      res.json({
        success: true,
        premios
      });
    } catch (error) {
      console.error('Error al obtener premios del sorteo:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener los premios del sorteo' 
      });
    }
  },

  // Obtener un premio por ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const premio = await Premio.getById(id);
      
      if (!premio) {
        return res.status(404).json({ 
          success: false, 
          message: 'Premio no encontrado' 
        });
      }
      
      res.json({
        success: true,
        premio
      });
    } catch (error) {
      console.error('Error al obtener premio:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener el premio' 
      });
    }
  },

  // Crear un nuevo premio
  create: async (req, res) => {
    try {
      const premioData = req.body;
      
      // Validar datos
      if (!premioData.sorteo_id || !premioData.nombre) {
        return res.status(400).json({
          success: false,
          message: 'El sorteo y el nombre del premio son requeridos'
        });
      }
      
      // Verificar que el sorteo existe
      const sorteo = await Sorteo.getById(premioData.sorteo_id);
      
      if (!sorteo) {
        return res.status(404).json({ 
          success: false, 
          message: 'Sorteo no encontrado' 
        });
      }
      
      // Verificar permisos (solo el creador del sorteo o admin puede añadir premios)
      if (req.user.rol !== 'admin' && sorteo.creado_por !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tiene permisos para añadir premios a este sorteo' 
        });
      }
      
      const nuevoPremio = await Premio.create(premioData);
      
      res.status(201).json({
        success: true,
        message: 'Premio creado exitosamente',
        premio: nuevoPremio
      });
    } catch (error) {
      console.error('Error al crear premio:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al crear el premio' 
      });
    }
  },

  // Actualizar un premio
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const premioData = req.body;
      
      // Verificar que el premio existe
      const premioExistente = await Premio.getById(id);
      
      if (!premioExistente) {
        return res.status(404).json({ 
          success: false, 
          message: 'Premio no encontrado' 
        });
      }
      
      // Verificar que el sorteo existe
      const sorteo = await Sorteo.getById(premioExistente.sorteo_id);
      
      if (!sorteo) {
        return res.status(404).json({ 
          success: false, 
          message: 'Sorteo no encontrado' 
        });
      }
      
      // Verificar permisos (solo el creador del sorteo o admin puede editar premios)
      if (req.user.rol !== 'admin' && sorteo.creado_por !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tiene permisos para editar este premio' 
        });
      }
      
      const premioActualizado = await Premio.update(id, premioData);
      
      res.json({
        success: true,
        message: 'Premio actualizado exitosamente',
        premio: premioActualizado
      });
    } catch (error) {
      console.error('Error al actualizar premio:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al actualizar el premio' 
      });
    }
  },

  // Eliminar un premio
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar que el premio existe
      const premioExistente = await Premio.getById(id);
      
      if (!premioExistente) {
        return res.status(404).json({ 
          success: false, 
          message: 'Premio no encontrado' 
        });
      }
      
      // Verificar que el sorteo existe
      const sorteo = await Sorteo.getById(premioExistente.sorteo_id);
      
      if (!sorteo) {
        return res.status(404).json({ 
          success: false, 
          message: 'Sorteo no encontrado' 
        });
      }
      
      // Verificar permisos (solo el creador del sorteo o admin puede eliminar premios)
      if (req.user.rol !== 'admin' && sorteo.creado_por !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tiene permisos para eliminar este premio' 
        });
      }
      
      const result = await Premio.delete(id);
      
      if (result.rowCount === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Premio no encontrado' 
        });
      }
      
      res.json({
        success: true,
        message: 'Premio eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar premio:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al eliminar el premio' 
      });
    }
  },

  // Obtener categorías de premios
  getCategorias: async (req, res) => {
    try {
      const categorias = await Premio.getCategorias();
      
      res.json({
        success: true,
        categorias
      });
    } catch (error) {
      console.error('Error al obtener categorías de premios:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener las categorías de premios' 
      });
    }
  },

  // Obtener premios disponibles para un sorteo
  getDisponiblesBySorteo: async (req, res) => {
    try {
      const { sorteoId } = req.params;
      
      // Verificar que el sorteo existe
      const sorteo = await Sorteo.getById(sorteoId);
      
      if (!sorteo) {
        return res.status(404).json({ 
          success: false, 
          message: 'Sorteo no encontrado' 
        });
      }
      
      const premios = await Premio.getDisponiblesBySorteo(sorteoId);
      
      res.json({
        success: true,
        premios
      });
    } catch (error) {
      console.error('Error al obtener premios disponibles:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener los premios disponibles' 
      });
    }
  }
};

module.exports = premioController; 