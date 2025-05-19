const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const authController = {
  // Login de usuario
  login: async (req, res) => {
    try {
      const { username, password } = req.body;

      // Validar datos de entrada
      if (!username || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Usuario y contraseña son requeridos' 
        });
      }

      // Buscar usuario
      const usuario = await Usuario.getByUsername(username);
      
      if (!usuario) {
        return res.status(401).json({ 
          success: false, 
          message: 'Credenciales inválidas' 
        });
      }

      // Verificar si está activo
      if (!usuario.activo) {
        return res.status(401).json({ 
          success: false, 
          message: 'Usuario inactivo. Contacte al administrador.' 
        });
      }

      // Verificar contraseña
      const isMatch = await Usuario.verifyPassword(password, usuario.password_hash);
      
      if (!isMatch) {
        return res.status(401).json({ 
          success: false, 
          message: 'Credenciales inválidas' 
        });
      }

      // Actualizar último acceso
      await Usuario.updateLastLogin(usuario.id);

      // Generar token JWT
      const payload = {
        user: {
          id: usuario.id,
          username: usuario.username,
          rol: usuario.rol
        }
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN },
        (err, token) => {
          if (err) throw err;
          
          res.json({
            success: true,
            token,
            user: {
              id: usuario.id,
              username: usuario.username,
              nombre_completo: usuario.nombre_completo,
              email: usuario.email,
              rol: usuario.rol
            }
          });
        }
      );

    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error en el servidor' 
      });
    }
  },

  // Registro de usuario
  register: async (req, res) => {
    try {
      const { username, password, nombre_completo, email, rol } = req.body;

      // Validar datos de entrada
      if (!username || !password || !nombre_completo || !email) {
        return res.status(400).json({ 
          success: false, 
          message: 'Todos los campos son requeridos' 
        });
      }

      // Verificar si el usuario ya existe
      const existingUser = await Usuario.getByUsername(username);
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'El nombre de usuario ya está en uso' 
        });
      }

      // Verificar si el email ya existe
      const existingEmail = await Usuario.getByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ 
          success: false, 
          message: 'El email ya está registrado' 
        });
      }

      // Crear el usuario
      const userData = { username, password, nombre_completo, email, rol };
      const nuevoUsuario = await Usuario.create(userData);

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        user: nuevoUsuario
      });

    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error en el servidor' 
      });
    }
  },

  // Obtener información del usuario actual
  getCurrentUser: async (req, res) => {
    try {
      // Obtener usuario por ID (desde middleware de autenticación)
      const usuario = await Usuario.getById(req.user.id);
      
      if (!usuario) {
        return res.status(404).json({ 
          success: false, 
          message: 'Usuario no encontrado' 
        });
      }

      res.json({
        success: true,
        user: {
          id: usuario.id,
          username: usuario.username,
          nombre_completo: usuario.nombre_completo,
          email: usuario.email,
          rol: usuario.rol,
          ultimo_acceso: usuario.ultimo_acceso
        }
      });

    } catch (error) {
      console.error('Error al obtener usuario actual:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error en el servidor' 
      });
    }
  }
};

module.exports = authController; 