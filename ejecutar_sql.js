// Script para ejecutar un archivo SQL directamente con la API de Electron
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// Función para leer el archivo SQL
function leerArchivoSQL(rutaArchivo) {
  try {
    return fs.readFileSync(rutaArchivo, 'utf8');
  } catch (error) {
    console.error(`Error al leer el archivo SQL: ${error.message}`);
    return null;
  }
}

// Ejecutar desde línea de comandos
async function ejecutarSQL() {
  try {
    // Ruta al archivo SQL
    const rutaArchivo = path.join(__dirname, 'corregir_triggers.sql');
    console.log(`Leyendo archivo SQL desde: ${rutaArchivo}`);
    
    // Leer contenido SQL
    const contenidoSQL = leerArchivoSQL(rutaArchivo);
    
    if (!contenidoSQL) {
      console.error('No se pudo leer el contenido SQL');
      process.exit(1);
    }
    
    console.log('Contenido SQL leído correctamente. Ejecutando consulta...');
    
    // Intentar ejecutar la consulta usando la API de Electron
    try {
      // Necesitamos sincronizar para asegurarnos de que la conexión esté lista
      if (global.pool) {
        // Ejecutar la consulta
        const resultado = await global.pool.query(contenidoSQL);
        console.log('SQL ejecutado correctamente');
        console.log(resultado);
      } else {
        console.error('No hay pool de conexión disponible');
      }
    } catch (error) {
      console.error(`Error al ejecutar SQL: ${error.message}`);
    }
    
    console.log('Proceso completado.');
  } catch (error) {
    console.error(`Error general: ${error.message}`);
  }
}

// Exportamos la función para poder usarla
module.exports = { ejecutarSQL };

// Si se ejecuta directamente (no como módulo)
if (require.main === module) {
  ejecutarSQL();
} 