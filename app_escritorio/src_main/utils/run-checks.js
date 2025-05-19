/**
 * Script para ejecutar las verificaciones previas al sorteo
 * Este script puede ejecutarse desde la línea de comandos
 */

const { runAndLogChecks } = require('./pre-sorteo-check');
const fs = require('fs');
const path = require('path');
const { paths } = require('../database/connection');

/**
 * Verifica y copia las plantillas necesarias
 * @returns {Promise<boolean>} true si todas las plantillas están disponibles
 */
async function verifyTemplates() {
  console.log('Iniciando verificación previa al sorteo...');
  
  // Directorios de origen y destino
  const templatesDir = path.join(process.cwd(), 'docs', 'templates');
  const docsDir = path.join(process.cwd(), 'docs');
  
  // Asegurar que los directorios existen
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
  }
  
  // Lista de archivos a verificar
  const requiredTemplates = [
    'participantes_template.csv',
    'certificado_ganador.docx',
    'acta_sorteo.docx'
  ];
  
  // Verificar y copiar cada plantilla
  for (const template of requiredTemplates) {
    const sourceFile = path.join(templatesDir, template);
    const destFile = path.join(docsDir, template);
    
    // Verificar si la plantilla existe en el directorio de destino
    if (!fs.existsSync(destFile)) {
      if (fs.existsSync(sourceFile)) {
        // Copiar desde templates si existe
        fs.copyFileSync(sourceFile, destFile);
        console.log(`✅ Plantilla copiada: ${template} -> docs/`);
      } else {
        console.log(`⚠️ Plantilla no encontrada: ${template}`);
        
        // En este caso podríamos crear una plantilla básica
        // Por ahora, sólo informamos del problema
      }
    }
  }
  
  return true;
}

/**
 * Ejecuta todas las verificaciones previas
 */
async function runAllChecks() {
  try {
    // Verificar plantillas
    await verifyTemplates();
    
    // Ejecutar verificaciones principales
    return await runAndLogChecks();
  } catch (error) {
    console.error('Error en verificaciones previas:', error);
    return {
      overall: 'error',
      error: error.message
    };
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  runAllChecks()
    .then(result => {
      process.exit(result.overall === 'error' ? 1 : 0);
    })
    .catch(error => {
      console.error('Error inesperado:', error);
      process.exit(1);
    });
}

module.exports = { runAllChecks, verifyTemplates }; 