const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

/**
 * @route   POST /api/auth/register
 * @desc    Registrar un nuevo usuario
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password, email, nombre_completo } = req.body;
    
    // Validación básica
    if (!username || !password || !email || !nombre_completo) {
      return res.status(400).json({ 
        success: false, 
        message: 'Todos los campos son obligatorios' 
      });
    }
    
    // Verificar si el usuario ya existe
    const userExistente = await db.query(
      'SELECT * FROM usuarios WHERE username = $1 OR email = $2',
      [username, email]
    );
    
    if (userExistente.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Usuario o email ya existen' 
      });
    }
    
    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Crear usuario
    const result = await db.query(
      `INSERT INTO usuarios (username, password_hash, email, nombre_completo, rol)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, nombre_completo, rol, created_at`,
      [username, passwordHash, email, nombre_completo, 'operador']
    );
    
    const user = result.rows[0];
    
    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      user
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión y obtener token
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validación básica
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Usuario y contraseña son obligatorios' 
      });
    }
    
    // Verificar si el usuario existe
    const userResult = await db.query(
      'SELECT * FROM usuarios WHERE username = $1 AND activo = true',
      [username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciales inválidas' 
      });
    }
    
    const user = userResult.rows[0];
    
    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciales inválidas' 
      });
    }
    
    // Actualizar último acceso
    await db.query(
      'UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = $1',
      [user.id]
    );
    
    // Generar token JWT
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Excluir password_hash de la respuesta
    const { password_hash, ...userInfo } = user;
    
    res.json({
      success: true,
      token,
      user: userInfo
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

/**
 * @route   GET /api/auth/verificar
 * @desc    Verificar token y devolver usuario
 * @access  Private
 */
router.get('/verificar', authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Error al verificar usuario:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

/**
 * @route   PUT /api/auth/cambiar-password
 * @desc    Cambiar contraseña de usuario
 * @access  Private
 */
router.put('/cambiar-password', authMiddleware, async (req, res) => {
  try {
    const { password_actual, password_nueva } = req.body;
    
    // Validación básica
    if (!password_actual || !password_nueva) {
      return res.status(400).json({ 
        success: false, 
        message: 'Las contraseñas son obligatorias' 
      });
    }
    
    // Obtener usuario actual
    const userResult = await db.query(
      'SELECT * FROM usuarios WHERE id = $1',
      [req.user.id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }
    
    const user = userResult.rows[0];
    
    // Verificar contraseña actual
    const passwordMatch = await bcrypt.compare(password_actual, user.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'La contraseña actual es incorrecta' 
      });
    }
    
    // Encriptar nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password_nueva, salt);
    
    // Actualizar contraseña
    await db.query(
      'UPDATE usuarios SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, req.user.id]
    );
    
    res.json({
      success: true,
      message: 'Contraseña actualizada correctamente'
    });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

module.exports = router; 