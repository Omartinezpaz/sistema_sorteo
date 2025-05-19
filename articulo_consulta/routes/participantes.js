const express = require('express');
const router = express.Router();
const participanteController = require('../controllers/participanteController');
const { auth, checkRole } = require('../middlewares/auth');

// GET /api/participantes
router.get('/', auth, participanteController.getAll);

// GET /api/participantes/buscar
router.get('/buscar', auth, participanteController.buscar);

// GET /api/participantes/:id
router.get('/:id', auth, participanteController.getById);

// POST /api/participantes
router.post('/', auth, participanteController.create);

// PUT /api/participantes/:id
router.put('/:id', auth, participanteController.update);

// PATCH /api/participantes/:id/validar
router.patch('/:id/validar', auth, participanteController.validar);

// DELETE /api/participantes/:id
router.delete('/:id', auth, participanteController.delete);

// GET /api/participantes/sorteo/:sorteoId
router.get('/sorteo/:sorteoId', auth, participanteController.getBySorteo);

// GET /api/participantes/sorteo/:sorteoId/buscar
router.get('/sorteo/:sorteoId/buscar', auth, participanteController.buscar);

// POST /api/participantes/sorteo/:sorteoId/importar
router.post('/sorteo/:sorteoId/importar', auth, participanteController.importarLote);

module.exports = router; 