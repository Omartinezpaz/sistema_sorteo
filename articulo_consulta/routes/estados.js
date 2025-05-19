const express = require('express');
const router = express.Router();
const db = require('../config/db');

/**
 * @route   GET /api/estados
 * @desc    Obtener todos los estados
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT DISTINCT cod_estado, nom_estado
       FROM estados
       WHERE activo = true
       ORDER BY nom_estado`,
      []
    );
    
    const estados = result.rows.map(estado => ({
      codigo: estado.cod_estado,
      nombre: estado.nom_estado
    }));
    
    res.json({ success: true, estados });
  } catch (error) {
    console.error('Error al obtener estados:', error);
    res.status(500).json({ success: false, message: 'Error al obtener estados' });
  }
});

/**
 * @route   GET /api/estados/:codEstado/municipios
 * @desc    Obtener municipios de un estado
 * @access  Public
 */
router.get('/:codEstado/municipios', async (req, res) => {
  try {
    const { codEstado } = req.params;
    
    const result = await db.query(
      `SELECT DISTINCT cod_municipio, nom_municipio
       FROM estados
       WHERE cod_estado = $1 AND activo = true
       ORDER BY nom_municipio`,
      [codEstado]
    );
    
    const municipios = result.rows.map(municipio => ({
      codigo: municipio.cod_municipio,
      nombre: municipio.nom_municipio
    }));
    
    res.json({ success: true, municipios });
  } catch (error) {
    console.error(`Error al obtener municipios del estado ${req.params.codEstado}:`, error);
    res.status(500).json({ success: false, message: 'Error al obtener municipios' });
  }
});

/**
 * @route   GET /api/estados/:codEstado/municipios/:codMunicipio/parroquias
 * @desc    Obtener parroquias de un municipio
 * @access  Public
 */
router.get('/:codEstado/municipios/:codMunicipio/parroquias', async (req, res) => {
  try {
    const { codEstado, codMunicipio } = req.params;
    
    const result = await db.query(
      `SELECT cod_parroquia, nom_parroquia
       FROM estados
       WHERE cod_estado = $1 AND cod_municipio = $2 AND activo = true
       ORDER BY nom_parroquia`,
      [codEstado, codMunicipio]
    );
    
    const parroquias = result.rows.map(parroquia => ({
      codigo: parroquia.cod_parroquia,
      nombre: parroquia.nom_parroquia
    }));
    
    res.json({ success: true, parroquias });
  } catch (error) {
    console.error(`Error al obtener parroquias del municipio ${req.params.codMunicipio}:`, error);
    res.status(500).json({ success: false, message: 'Error al obtener parroquias' });
  }
});

/**
 * @route   GET /api/estados/buscar
 * @desc    Buscar ubicaciones (estados, municipios, parroquias)
 * @access  Public
 */
router.get('/buscar', async (req, res) => {
  try {
    const { termino } = req.query;
    
    if (!termino || termino.length < 3) {
      return res.json({ success: true, resultados: [] });
    }
    
    // Buscar estados, municipios y parroquias que coincidan con el término
    const result = await db.query(
      `SELECT id, 
              cod_estado, 
              nom_estado, 
              cod_municipio, 
              nom_municipio, 
              cod_parroquia, 
              nom_parroquia,
              'estado' as tipo
       FROM estados
       WHERE nom_estado ILIKE $1 AND activo = true
       UNION
       SELECT id, 
              cod_estado, 
              nom_estado, 
              cod_municipio, 
              nom_municipio, 
              cod_parroquia, 
              nom_parroquia,
              'municipio' as tipo
       FROM estados
       WHERE nom_municipio ILIKE $1 AND activo = true
       UNION
       SELECT id, 
              cod_estado, 
              nom_estado, 
              cod_municipio, 
              nom_municipio, 
              cod_parroquia, 
              nom_parroquia,
              'parroquia' as tipo
       FROM estados
       WHERE nom_parroquia ILIKE $1 AND activo = true
       LIMIT 50`,
      [`%${termino}%`]
    );
    
    // Dar formato a los resultados para una fácil visualización
    const resultados = result.rows.map(item => {
      return {
        id: item.id,
        tipo: item.tipo,
        estado: {
          codigo: item.cod_estado,
          nombre: item.nom_estado
        },
        municipio: {
          codigo: item.cod_municipio,
          nombre: item.nom_municipio
        },
        parroquia: {
          codigo: item.cod_parroquia,
          nombre: item.nom_parroquia
        },
        texto: `${item.nom_estado}, ${item.nom_municipio}, ${item.nom_parroquia}`
      };
    });
    
    res.json({ success: true, resultados });
  } catch (error) {
    console.error(`Error al buscar ubicaciones con término "${req.query.termino}":`, error);
    res.status(500).json({ success: false, message: 'Error al buscar ubicaciones' });
  }
});

/**
 * @route   GET /api/estados/estructura
 * @desc    Obtener estructura jerárquica completa
 * @access  Public
 */
router.get('/estructura', async (req, res) => {
  try {
    // Obtener todos los estados
    const estadosResult = await db.query(
      `SELECT DISTINCT cod_estado, nom_estado
       FROM estados
       WHERE activo = true
       ORDER BY nom_estado`,
      []
    );
    
    const estructura = [];
    
    // Para cada estado, obtener sus municipios
    for (const estado of estadosResult.rows) {
      const municipiosResult = await db.query(
        `SELECT DISTINCT cod_municipio, nom_municipio
         FROM estados
         WHERE cod_estado = $1 AND activo = true
         ORDER BY nom_municipio`,
        [estado.cod_estado]
      );
      
      const municipios = [];
      
      // Para cada municipio, obtener sus parroquias
      for (const municipio of municipiosResult.rows) {
        const parroquiasResult = await db.query(
          `SELECT cod_parroquia, nom_parroquia
           FROM estados
           WHERE cod_estado = $1 AND cod_municipio = $2 AND activo = true
           ORDER BY nom_parroquia`,
          [estado.cod_estado, municipio.cod_municipio]
        );
        
        const parroquias = parroquiasResult.rows.map(parroquia => ({
          codigo: parroquia.cod_parroquia,
          nombre: parroquia.nom_parroquia
        }));
        
        municipios.push({
          codigo: municipio.cod_municipio,
          nombre: municipio.nom_municipio,
          parroquias
        });
      }
      
      estructura.push({
        codigo: estado.cod_estado,
        nombre: estado.nom_estado,
        municipios
      });
    }
    
    res.json({ success: true, estados: estructura });
  } catch (error) {
    console.error('Error al obtener estructura jerárquica:', error);
    res.status(500).json({ success: false, message: 'Error al obtener estructura jerárquica' });
  }
});

module.exports = router; 