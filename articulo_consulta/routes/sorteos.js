const express = require('express');
const router = express.Router();
const sorteoController = require('../controllers/sorteoController');
const { auth, checkRole } = require('../middlewares/auth');
const { authMiddleware } = require('../middleware/auth');
const db = require('../config/db');

// Rutas públicas
// GET /api/sorteos/publicos
router.get('/publicos', sorteoController.getPublicos);

// Rutas protegidas (requieren autenticación)
// GET /api/sorteos
router.get('/', authMiddleware, async (req, res) => {
  try {
    const sorteos = await db.query(
      `SELECT s.*, 
       (SELECT COUNT(*) FROM participantes p WHERE p.sorteo_id = s.id) as total_participantes
       FROM sorteos s
       ORDER BY s.fecha_sorteo DESC`,
      []
    );
    
    res.json({ success: true, sorteos: sorteos.rows });
  } catch (error) {
    console.error('Error al obtener sorteos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener sorteos' });
  }
});

// GET /api/sorteos/mis-sorteos
router.get('/mis-sorteos', auth, sorteoController.getMySorteos);

// GET /api/sorteos/resumen
router.get('/resumen', auth, sorteoController.getResumen);

// GET /api/sorteos/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const sorteoResult = await db.query(
      `SELECT s.*, 
       (SELECT COUNT(*) FROM participantes p WHERE p.sorteo_id = s.id) as total_participantes
       FROM sorteos s
       WHERE s.id = $1`,
      [id]
    );
    
    if (sorteoResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Sorteo no encontrado' });
    }
    
    const sorteo = sorteoResult.rows[0];
    
    // Obtener premios si existen
    const premiosResult = await db.query(
      `SELECT * FROM premios WHERE sorteo_id = $1`,
      [id]
    );
    
    // Combinar datos
    sorteo.premios = premiosResult.rows;
    
    res.json({ success: true, sorteo });
  } catch (error) {
    console.error(`Error al obtener sorteo ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Error al obtener sorteo' });
  }
});

// POST /api/sorteos
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      fecha_sorteo,
      estado = 'activo',
      estado_actual = 'borrador',
      es_publico = true,
      reglas,
      tipo_sorteo = 'estados',
      estadosSeleccionados,
      cuposEstados
    } = req.body;
    
    // Crear JSON con metadatos adicionales
    const metadata = JSON.stringify({
      estadosSeleccionados,
      cuposEstados,
      configuracionAvanzada: req.body.configuracionAvanzada || {}
    });
    
    // Insertar en la base de datos
    const result = await db.query(
      `INSERT INTO sorteos (
        nombre, descripcion, fecha_sorteo, estado, creado_por, 
        estado_actual, es_publico, reglas, metadata, tipo_sorteo
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *`,
      [
        nombre,
        descripcion,
        fecha_sorteo,
        estado,
        req.user.id,
        estado_actual,
        es_publico,
        reglas,
        metadata,
        tipo_sorteo
      ]
    );
    
    const sorteo = result.rows[0];
    
    // Registrar actividad
    await db.query(
      `INSERT INTO actividades (
        usuario_id, accion, tabla_afectada, registro_id, detalles
      )
      VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        'crear',
        'sorteos',
        sorteo.id,
        JSON.stringify({ sorteo_id: sorteo.id, nombre: sorteo.nombre })
      ]
    );
    
    res.status(201).json({ success: true, sorteo });
  } catch (error) {
    console.error('Error al crear sorteo:', error);
    res.status(500).json({ success: false, message: 'Error al crear sorteo' });
  }
});

// PUT /api/sorteos/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      descripcion,
      fecha_sorteo,
      estado,
      estado_actual,
      es_publico,
      reglas,
      tipo_sorteo,
      estadosSeleccionados,
      cuposEstados
    } = req.body;
    
    // Verificar que el sorteo existe
    const sorteoExistente = await db.query(
      `SELECT * FROM sorteos WHERE id = $1`,
      [id]
    );
    
    if (sorteoExistente.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Sorteo no encontrado' });
    }
    
    // Crear JSON con metadatos actualizados
    const metadata = JSON.stringify({
      estadosSeleccionados: estadosSeleccionados || [],
      cuposEstados: cuposEstados || {},
      configuracionAvanzada: req.body.configuracionAvanzada || {}
    });
    
    // Actualizar en la base de datos
    const result = await db.query(
      `UPDATE sorteos 
       SET nombre = COALESCE($1, nombre),
           descripcion = COALESCE($2, descripcion),
           fecha_sorteo = COALESCE($3, fecha_sorteo),
           estado = COALESCE($4, estado),
           estado_actual = COALESCE($5, estado_actual),
           es_publico = COALESCE($6, es_publico),
           reglas = COALESCE($7, reglas),
           metadata = COALESCE($8, metadata),
           tipo_sorteo = COALESCE($9, tipo_sorteo),
           updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [
        nombre,
        descripcion,
        fecha_sorteo,
        estado,
        estado_actual,
        es_publico,
        reglas,
        metadata,
        tipo_sorteo,
        id
      ]
    );
    
    const sorteo = result.rows[0];
    
    // Registrar actividad
    await db.query(
      `INSERT INTO actividades (
        usuario_id, accion, tabla_afectada, registro_id, detalles
      )
      VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        'actualizar',
        'sorteos',
        sorteo.id,
        JSON.stringify({ sorteo_id: sorteo.id, nombre: sorteo.nombre })
      ]
    );
    
    res.json({ success: true, sorteo });
  } catch (error) {
    console.error(`Error al actualizar sorteo ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Error al actualizar sorteo' });
  }
});

// PATCH /api/sorteos/:id/estado
router.patch('/:id/estado', auth, sorteoController.updateEstado);

// DELETE /api/sorteos/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el sorteo existe
    const sorteoExistente = await db.query(
      `SELECT * FROM sorteos WHERE id = $1`,
      [id]
    );
    
    if (sorteoExistente.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Sorteo no encontrado' });
    }
    
    // Eliminar el sorteo
    await db.query(
      `DELETE FROM sorteos WHERE id = $1`,
      [id]
    );
    
    // Registrar actividad
    await db.query(
      `INSERT INTO actividades (
        usuario_id, accion, tabla_afectada, registro_id, detalles
      )
      VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        'eliminar',
        'sorteos',
        id,
        JSON.stringify({ sorteo_id: id, nombre: sorteoExistente.rows[0].nombre })
      ]
    );
    
    res.json({ success: true, message: 'Sorteo eliminado correctamente' });
  } catch (error) {
    console.error(`Error al eliminar sorteo ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Error al eliminar sorteo' });
  }
});

// POST /api/sorteos/:id/realizar-sorteo
router.post('/:id/realizar-sorteo', auth, sorteoController.realizarSorteo);

/**
 * @route   GET /api/sorteos/:id/participantes
 * @desc    Obtener participantes de un sorteo
 * @access  Private
 */
router.get('/:id/participantes', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const participantes = await db.query(
      `SELECT * FROM participantes WHERE sorteo_id = $1`,
      [id]
    );
    
    res.json({ success: true, participantes: participantes.rows });
  } catch (error) {
    console.error(`Error al obtener participantes del sorteo ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Error al obtener participantes' });
  }
});

module.exports = router; 