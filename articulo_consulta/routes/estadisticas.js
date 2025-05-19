const express = require('express');
const router = express.Router();
const estadisticaController = require('../controllers/estadisticaController');

// GET /api/estadisticas/demograficas
// Obtener estadísticas demográficas por estado
router.get('/demograficas', estadisticaController.getDemograficas);

// GET /api/estadisticas/estados-por-cuota
// Obtener estados por cuota
router.get('/estados-por-cuota', estadisticaController.getEstadosPorCuota);

// GET /api/estadisticas/sorteos-por-ubicacion
// Obtener sorteos por ubicación
router.get('/sorteos-por-ubicacion', estadisticaController.getSorteosPorUbicacion);

// GET /api/estadisticas/conteo-geografico
// Obtener conteo geográfico
router.get('/conteo-geografico', estadisticaController.getConteoGeografico);

module.exports = router; 