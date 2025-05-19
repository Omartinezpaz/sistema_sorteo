const express = require('express');
const router = express.Router();
const actividadController = require('../controllers/actividadController');
const { auth, checkRole } = require('../middlewares/auth');

// GET /api/actividades
// Obtener todas las actividades (solo admin)
router.get('/', auth, checkRole(['admin']), actividadController.getAll);

// GET /api/actividades/auditoria
// Obtener reporte de auditoru00eda (solo admin)
router.get('/auditoria', auth, checkRole(['admin']), actividadController.getReporteAuditoria);

// POST /api/actividades
// Registrar una actividad manualmente
router.post('/', auth, actividadController.registrar);

module.exports = router; 