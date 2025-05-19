const { runAndLogChecks } = require('./pre-sorteo-check');
const { testConnection, updateConfig, paths } = require('../database/connection');
const { createAppDirectories } = require('./disk-space');
const path = require('path');
const fs = require('fs');

// Detectar si estamos en Electron o en Node.js puro
const isElectron = process.versions && process.versions.electron;

// Importar dialog solo si estamos en Electron
let dialog;
if (isElectron) {
  try {
    const { dialog: electronDialog } = require('electron');
    dialog = electronDialog;
  } catch (error) {
    console.error('Error al cargar el módulo dialog de Electron:', error);
  }
}

/**
 * Ejecuta todas las verificaciones de preparación previa
 * @param {Object} mainWindow - Ventana principal de Electron (para mostrar diálogos)
 * @returns {Promise<Object>} Resultados de la preparación
 */
async function ejecutarPreparacionPrevia(mainWindow) {
  console.log('🚀 Iniciando preparación previa para el sorteo...');
  
  try {
    // Paso 1: Crear directorios necesarios
    console.log('\n📁 Paso 1: Creando directorios necesarios...');
    const dirInfo = await createAppDirectories();
    
    // Paso 2: Verificar conexión a la base de datos
    console.log('\n🔌 Paso 2: Verificando conexión a la base de datos...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ No se pudo conectar a la base de datos PostgreSQL');
      
      // Si hay una ventana principal y estamos en Electron, mostrar diálogo para configurar la BD
      if (mainWindow && isElectron && dialog) {
        const result = await dialog.showMessageBox(mainWindow, {
          type: 'error',
          title: 'Error de Conexión a la Base de Datos',
          message: 'No se pudo conectar a la base de datos PostgreSQL.',
          detail: 'Verifique que PostgreSQL esté en ejecución y que los datos de conexión sean correctos.',
          buttons: ['Configurar Conexión', 'Cancelar'],
          defaultId: 0,
          cancelId: 1
        });
        
        if (result.response === 0) {
          // Aquí podría abrir un diálogo para configurar la conexión
          console.log('El usuario eligió configurar la conexión a la BD');
          return {
            success: false,
            action: 'configurar_bd',
            error: 'No se pudo conectar a la base de datos'
          };
        }
      }
      
      return {
        success: false,
        error: 'No se pudo conectar a la base de datos PostgreSQL'
      };
    }
    
    // Paso 3: Ejecutar todas las verificaciones
    console.log('\n🔍 Paso 3: Ejecutando verificaciones completas...');
    const checksResult = await runAndLogChecks();
    
    // Paso 4: Crear/verificar directorios para documentación
    console.log('\n📋 Paso 4: Preparando directorios para documentación...');
    
    const docsDir = path.join(paths.userData, 'documentacion');
    const directorios = [
      { path: docsDir, name: 'Principal' },
      { path: path.join(docsDir, 'bases_legales'), name: 'Bases Legales' },
      { path: path.join(docsDir, 'participantes'), name: 'Participantes' },
      { path: path.join(docsDir, 'plantillas'), name: 'Plantillas' },
      { path: path.join(docsDir, 'certificados'), name: 'Certificados' }
    ];
    
    for (const dir of directorios) {
      if (!fs.existsSync(dir.path)) {
        try {
          fs.mkdirSync(dir.path, { recursive: true });
          console.log(`✅ Directorio ${dir.name} creado: ${dir.path}`);
        } catch (error) {
          console.error(`❌ Error al crear directorio ${dir.name}:`, error);
        }
      } else {
        console.log(`✅ Directorio ${dir.name} existente: ${dir.path}`);
      }
    }
    
    // Comprobar plantillas básicas
    const plantillasDir = path.join(docsDir, 'plantillas');
    const plantillasRequeridas = [
      { nombre: 'participantes_template.csv', tipo: 'CSV de Participantes' },
      { nombre: 'certificado_ganador.docx', tipo: 'Certificado de Ganador' },
      { nombre: 'acta_sorteo.docx', tipo: 'Acta de Sorteo' }
    ];
    
    console.log('\n📝 Verificando plantillas necesarias...');
    const plantillasFaltantes = [];
    
    for (const plantilla of plantillasRequeridas) {
      const rutaPlantilla = path.join(plantillasDir, plantilla.nombre);
      if (!fs.existsSync(rutaPlantilla)) {
        console.log(`⚠️ Plantilla faltante: ${plantilla.tipo} (${plantilla.nombre})`);
        plantillasFaltantes.push(plantilla);
      } else {
        console.log(`✅ Plantilla encontrada: ${plantilla.tipo}`);
      }
    }
    
    // Resultado final
    const resultado = {
      success: checksResult.overall === 'success',
      date: new Date().toISOString(),
      checks: checksResult,
      directories: {
        created: dirInfo.directories,
        docs: directorios.map(d => d.path)
      },
      templates: {
        missing: plantillasFaltantes,
        required: plantillasRequeridas
      }
    };
    
    // Resumen final
    console.log('\n🏁 Resumen de Preparación Previa:');
    console.log('----------------------------------------');
    console.log(`Base de datos: ${dbConnected ? '✅ Conectada' : '❌ Error de conexión'}`);
    console.log(`Verificaciones: ${checksResult.overall === 'success' ? '✅ Exitosas' : checksResult.overall === 'warning' ? '⚠️ Con advertencias' : '❌ Con errores'}`);
    console.log(`Directorios: ${dirInfo ? '✅ Creados' : '⚠️ Parcialmente creados'}`);
    console.log(`Plantillas: ${plantillasFaltantes.length === 0 ? '✅ Todas disponibles' : `⚠️ Faltan ${plantillasFaltantes.length} plantillas`}`);
    console.log('----------------------------------------');
    
    if (resultado.success) {
      console.log('✅ PREPARACIÓN PREVIA COMPLETADA CON ÉXITO');
      console.log('   El sistema está listo para realizar sorteos');
    } else if (checksResult.overall === 'warning') {
      console.log('⚠️ PREPARACIÓN PREVIA COMPLETADA CON ADVERTENCIAS');
      console.log('   El sistema puede realizar sorteos pero con limitaciones');
    } else {
      console.log('❌ PREPARACIÓN PREVIA FALLIDA');
      console.log('   Es necesario resolver los problemas antes de realizar sorteos');
    }
    
    return resultado;
    
  } catch (error) {
    console.error('Error durante la preparación previa:', error);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  ejecutarPreparacionPrevia()
    .then(result => {
      console.log('\nPreparación completada.');
      if (!result.success) {
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Error al ejecutar preparación previa:', err);
      process.exit(1);
    });
}

module.exports = {
  ejecutarPreparacionPrevia
}; 