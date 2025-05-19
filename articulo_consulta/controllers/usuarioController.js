const Usuario = require('../models/Usuario');

const usuarioController = {
  // Obtener todos los usuarios (solo accesible para admins)
  getAll: async (req, res) => {
    try {
      const usuarios = await Usuario.getAll();
      res.json({
        success: true,
        usuarios
      });
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener la lista de usuarios' 
      });
    }
  },

  // Obtener un usuario por ID
  getById: async (req, res) => {
    try {
      const id = req.params.id;
      
      // Verificar permisos (solo el propio usuario o admin puede ver detalles)
      if (req.user.rol !== 'admin' && req.user.id !== parseInt(id)) {
        return res.status(403).json({
          success: false,
          message: 'No tiene permisos para ver este usuario'
        });
      }
      
      const usuario = await Usuario.getById(id);
      
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      // No devolver el hash de la contraseña
      delete usuario.password_hash;
      
      res.json({
        success: true,
        usuario
      });
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener información del usuario' 
      });
    }
  },

  // Actualizar usuario
  update: async (req, res) => {
    try {
      const id = req.params.id;
      const { nombre_completo, email, rol, activo } = req.body;
      
      // Verificar permisos (solo el propio usuario o admin puede actualizar)
      if (req.user.rol !== 'admin' && req.user.id !== parseInt(id)) {
        return res.status(403).json({
          success: false,
          message: 'No tiene permisos para actualizar este usuario'
        });
      }
      
      // Solo admin puede actualizar el rol o estado activo
      if (req.user.rol !== 'admin' && (rol !== undefined || activo !== undefined)) {
        return res.status(403).json({
          success: false,
          message: 'Solo administradores pueden actualizar el rol o estado del usuario'
        });
      }
      
      // Verificar si el usuario existe
      const usuario = await Usuario.getById(id);
      
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      // Preparar datos a actualizar
      const userData = {};
      
      if (nombre_completo) userData.nombre_completo = nombre_completo;
      if (email) userData.email = email;
      if (req.user.rol === 'admin' && rol) userData.rol = rol;
      if (req.user.rol === 'admin' && activo !== undefined) userData.activo = activo;
      
      // Actualizar usuario
      const usuarioActualizado = await Usuario.update(id, userData);
      
      // No devolver el hash de la contraseña
      delete usuarioActualizado.password_hash;
      
      res.json({
        success: true,
        message: 'Usuario actualizado correctamente',
        usuario: usuarioActualizado
      });
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al actualizar el usuario' 
      });
    }
  },

  // Cambiar contraseña
  cambiarPassword: async (req, res) => {
    try {
      const id = req.params.id;
      const { password_actual, password_nueva } = req.body;
      
      // Verificar permisos (solo el propio usuario puede cambiar su contraseña)
      // Los admins pueden hacerlo sin conocer la contraseña actual
      if (req.user.rol !== 'admin' && req.user.id !== parseInt(id)) {
        return res.status(403).json({
          success: false,
          message: 'No tiene permisos para cambiar la contraseña de este usuario'
        });
      }
      
      // Verificar si el usuario existe
      const usuario = await Usuario.getById(id);
      
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      // Si no es admin, verificar contraseña actual
      if (req.user.rol !== 'admin') {
        const isMatch = await Usuario.verifyPassword(password_actual, usuario.password_hash);
        
        if (!isMatch) {
          return res.status(400).json({
            success: false,
            message: 'Contraseña actual incorrecta'
          });
        }
      }
      
      // Cambiar contraseña
      await Usuario.updatePassword(id, password_nueva);
      
      res.json({
        success: true,
        message: 'Contraseña actualizada correctamente'
      });
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al cambiar la contraseña' 
      });
    }
  },

  // Eliminar usuario (solo admin)
  delete: async (req, res) => {
    try {
      const id = req.params.id;
      
      // Solo admin puede eliminar usuarios
      if (req.user.rol !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Solo administradores pueden eliminar usuarios'
        });
      }
      
      // No permitir eliminar al propio usuario administrador
      if (req.user.id === parseInt(id)) {
        return res.status(403).json({
          success: false,
          message: 'No puede eliminar su propio usuario administrador'
        });
      }
      
      // Verificar si el usuario existe
      const usuario = await Usuario.getById(id);
      
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      // Eliminar usuario
      await Usuario.delete(id);
      
      res.json({
        success: true,
        message: 'Usuario eliminado correctamente'
      });
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al eliminar el usuario' 
      });
    }
  }
};

module.exports = usuarioController; 