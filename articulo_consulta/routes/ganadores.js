const express = require('express');
const router = express.Router();
const ganadorController = require('../controllers/ganadorController');
const { auth, checkRole } = require('../middlewares/auth');

// GET /api/ganadores
// Obtener todos los ganadores
router.get('/', auth, ganadorController.getAll);

// GET /api/ganadores/sorteo/:sorteoId
// Obtener ganadores por sorteo
router.get('/sorteo/:sorteoId', auth, ganadorController.getBySorteo);

// PATCH /api/ganadores/:id/validar
// Validar un ganador
router.patch('/:id/validar', auth, checkRole(['admin', 'operador']), ganadorController.validar);

// GET /api/ganadores/estadisticas/region
// Obtener estadu00edsticas de ganadores por regiu00f3n
router.get('/estadisticas/region', auth, ganadorController.getEstadisticasPorRegion);

module.exports = router; 