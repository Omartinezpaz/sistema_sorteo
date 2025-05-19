const express = require('express');
const router = express.Router();
const premioController = require('../controllers/premioController');
const { auth, checkRole } = require('../middlewares/auth');

// Rutas para las categorías
// GET /api/premios/categorias
router.get('/categorias', premioController.getCategorias);

// Rutas para premios
// GET /api/premios
router.get('/', auth, premioController.getAll);

// GET /api/premios/:id
router.get('/:id', auth, premioController.getById);

// POST /api/premios
router.post('/', auth, premioController.create);

// PUT /api/premios/:id
router.put('/:id', auth, premioController.update);

// DELETE /api/premios/:id
router.delete('/:id', auth, premioController.delete);

// GET /api/premios/sorteo/:sorteoId
router.get('/sorteo/:sorteoId', auth, premioController.getBySorteo);

// GET /api/premios/sorteo/:sorteoId/disponibles
router.get('/sorteo/:sorteoId/disponibles', auth, premioController.getDisponiblesBySorteo);

module.exports = router; 