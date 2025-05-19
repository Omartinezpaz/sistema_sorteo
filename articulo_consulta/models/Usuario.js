const db = require('../config/database');
const bcrypt = require('bcryptjs');

// Modelo de Usuario
const Usuario = {
  // Obtener todos los usuarios
  getAll: async () => {
    return db.any('SELECT id, username, nombre_completo, email, rol, activo, ultimo_acceso, created_at FROM usuarios');
  },

  // Obtener un usuario por ID
  getById: async (id) => {
    return db.oneOrNone('SELECT id, username, nombre_completo, email, rol, activo, ultimo_acceso, created_at FROM usuarios WHERE id = $1', [id]);
  },

  // Obtener un usuario por username
  getByUsername: async (username) => {
    return db.oneOrNone('SELECT * FROM usuarios WHERE username = $1', [username]);
  },

  // Obtener un usuario por email
  getByEmail: async (email) => {
    return db.oneOrNone('SELECT * FROM usuarios WHERE email = $1', [email]);
  },

  // Crear un nuevo usuario
  create: async (userData) => {
    const { username, password, nombre_completo, email, rol = 'operador' } = userData;
    
    // Generar hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    
    return db.one(
      'INSERT INTO usuarios(username, password_hash, nombre_completo, email, rol) VALUES($1, $2, $3, $4, $5) RETURNING id, username, nombre_completo, email, rol',
      [username, password_hash, nombre_completo, email, rol]
    );
  },

  // Actualizar un usuario
  update: async (id, userData) => {
    // Preparar las partes de la consulta SQL
    let updateColumns = [];
    let queryParams = [];
    let paramCounter = 1;
    
    // Construir la sentencia SQL dinámicamente
    if (userData.nombre_completo !== undefined) {
      updateColumns.push(`nombre_completo = $${paramCounter}`);
      queryParams.push(userData.nombre_completo);
      paramCounter++;
    }
    
    if (userData.email !== undefined) {
      updateColumns.push(`email = $${paramCounter}`);
      queryParams.push(userData.email);
      paramCounter++;
    }
    
    if (userData.rol !== undefined) {
      updateColumns.push(`rol = $${paramCounter}`);
      queryParams.push(userData.rol);
      paramCounter++;
    }
    
    if (userData.activo !== undefined) {
      updateColumns.push(`activo = $${paramCounter}`);
      queryParams.push(userData.activo);
      paramCounter++;
    }
    
    // Añadir la actualización de timestamp
    updateColumns.push(`updated_at = NOW()`);
    
    // Si no hay nada que actualizar
    if (updateColumns.length === 1) { // Solo tiene updated_at
      return db.oneOrNone('SELECT * FROM usuarios WHERE id = $1', [id]);
    }
    
    // Añadir el id al final de los parámetros
    queryParams.push(id);
    
    // Construir la consulta completa
    const query = `
      UPDATE usuarios 
      SET ${updateColumns.join(', ')} 
      WHERE id = $${paramCounter} 
      RETURNING id, username, nombre_completo, email, rol, activo
    `;
    
    return db.oneOrNone(query, queryParams);
  },

  // Cambiar contraseña de un usuario
  updatePassword: async (id, newPassword) => {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);
    
    return db.none(
      'UPDATE usuarios SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [password_hash, id]
    );
  },

  // Actualizar el último acceso
  updateLastLogin: async (id) => {
    return db.none(
      'UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = $1',
      [id]
    );
  },

  // Verificar contraseña
  verifyPassword: async (providedPassword, storedPasswordHash) => {
    return bcrypt.compare(providedPassword, storedPasswordHash);
  },
  
  // Eliminar un usuario
  delete: async (id) => {
    return db.none('DELETE FROM usuarios WHERE id = $1', [id]);
  }
};

module.exports = Usuario; 