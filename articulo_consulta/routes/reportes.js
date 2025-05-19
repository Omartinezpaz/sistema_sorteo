const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const Sorteo = require('../models/Sorteo');
const Premio = require('../models/Premio');
const Participante = require('../models/Participante');
const reportService = require('../services/reportService');
const path = require('path');

// GET /api/reportes/sorteo/:id/excel
router.get('/sorteo/:id/excel', auth, async (req, res) => {
  try {
    const sorteoId = req.params.id;
    
    // Obtener datos del sorteo
    const sorteo = await Sorteo.getById(sorteoId);
    
    if (!sorteo) {
      return res.status(404).json({
        success: false,
        message: 'Sorteo no encontrado'
      });
    }
    
    // Verificar permisos (solo el creador o admin)
    if (req.user.rol !== 'admin' && sorteo.creado_por !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para generar reportes de este sorteo'
      });
    }
    
    // Obtener premios y participantes
    const premios = await Premio.getBySorteo(sorteoId);
    const participantesResponse = await Participante.getBySorteo(sorteoId);
    const participantes = participantesResponse.participantes || [];
    
    // Generar el reporte
    const reporte = await reportService.generateSorteoExcel(sorteo, premios, participantes);
    
    // Enviar archivo
    res.setHeader('Content-Type', reporte.fileType);
    res.setHeader('Content-Disposition', `attachment; filename=${reporte.fileName}`);
    res.sendFile(path.resolve(reporte.filePath));
  } catch (error) {
    console.error('Error al generar reporte Excel:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar el reporte Excel'
    });
  }
});

// GET /api/reportes/sorteo/:id/csv
router.get('/sorteo/:id/csv', auth, async (req, res) => {
  try {
    const sorteoId = req.params.id;
    
    // Obtener datos del sorteo
    const sorteo = await Sorteo.getById(sorteoId);
    
    if (!sorteo) {
      return res.status(404).json({
        success: false,
        message: 'Sorteo no encontrado'
      });
    }
    
    // Verificar permisos (solo el creador o admin)
    if (req.user.rol !== 'admin' && sorteo.creado_por !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para generar reportes de este sorteo'
      });
    }
    
    // Obtener participantes
    const participantesResponse = await Participante.getBySorteo(sorteoId);
    const participantes = participantesResponse.participantes || [];
    
    // Para CSV, no necesitamos los premios pero los enviamos de todas formas para consistencia
    const premios = await Premio.getBySorteo(sorteoId);
    
    // Generar el reporte
    const reporte = await reportService.generateSorteoCSV(sorteo, premios, participantes);
    
    // Enviar archivo
    res.setHeader('Content-Type', reporte.fileType);
    res.setHeader('Content-Disposition', `attachment; filename=${reporte.fileName}`);
    res.sendFile(path.resolve(reporte.filePath));
  } catch (error) {
    console.error('Error al generar reporte CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar el reporte CSV'
    });
  }
});

// GET /api/reportes/sorteo/:id/pdf
router.get('/sorteo/:id/pdf', auth, async (req, res) => {
  try {
    const sorteoId = req.params.id;
    
    // Obtener datos del sorteo
    const sorteo = await Sorteo.getById(sorteoId);
    
    if (!sorteo) {
      return res.status(404).json({
        success: false,
        message: 'Sorteo no encontrado'
      });
    }
    
    // Verificar permisos (solo el creador o admin)
    if (req.user.rol !== 'admin' && sorteo.creado_por !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para generar reportes de este sorteo'
      });
    }
    
    // Obtener premios y participantes
    const premios = await Premio.getBySorteo(sorteoId);
    const participantesResponse = await Participante.getBySorteo(sorteoId);
    const participantes = participantesResponse.participantes || [];
    
    // Generar el reporte
    const reporte = await reportService.generateSorteoPDF(sorteo, premios, participantes);
    
    // Enviar archivo
    res.setHeader('Content-Type', reporte.fileType);
    res.setHeader('Content-Disposition', `attachment; filename=${reporte.fileName}`);
    res.sendFile(path.resolve(reporte.filePath));
  } catch (error) {
    console.error('Error al generar reporte PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar el reporte PDF'
    });
  }
});

module.exports = router; 