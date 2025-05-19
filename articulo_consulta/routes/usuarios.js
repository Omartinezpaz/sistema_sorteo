const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { auth, checkRole } = require('../middlewares/auth');

// GET /api/usuarios
// Obtener todos los usuarios (solo admin)
router.get('/', auth, checkRole(['admin']), usuarioController.getAll);

// GET /api/usuarios/:id
// Obtener un usuario por ID (propio usuario o admin)
router.get('/:id', auth, usuarioController.getById);

// PUT /api/usuarios/:id
// Actualizar datos de usuario (propio usuario o admin)
router.put('/:id', auth, usuarioController.update);

// PATCH /api/usuarios/:id/password
// Cambiar contraseu00f1a (propio usuario o admin)
router.patch('/:id/password', auth, usuarioController.cambiarPassword);

// DELETE /api/usuarios/:id
// Eliminar usuario (solo admin)
router.delete('/:id', auth, checkRole(['admin']), usuarioController.delete);

module.exports = router; 