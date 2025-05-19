const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Cargar configuración de la base de datos desde el archivo
function cargarConfiguracionBD() {
  const configPath = path.join(process.env.APPDATA || process.env.HOME, 'app_escritorio', 'config', 'database.json');
  
  try {
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      console.log(`Configuración de base de datos cargada desde: ${configPath}`);
      return JSON.parse(configData);
    } else {
      console.error(`No se encontró el archivo de configuración en: ${configPath}`);
      return {
        user: 'postgres',
        host: 'localhost',
        database: 'sorteo_db',
        password: 'postgres',
        port: 5432,
      };
    }
  } catch (error) {
    console.error(`Error al cargar la configuración: ${error.message}`);
    return {
      user: 'postgres',
      host: 'localhost',
      database: 'sorteo_db',
      password: 'postgres',
      port: 5432,
    };
  }
}

// Función para ejecutar un script SQL desde un archivo
async function ejecutarScriptSQL(rutaArchivo) {
  console.log(`Ejecutando script SQL: ${rutaArchivo}`);
  
  // Verificar si el archivo existe
  if (!fs.existsSync(rutaArchivo)) {
    console.error(`Error: El archivo ${rutaArchivo} no existe.`);
    return { success: false, message: `El archivo ${rutaArchivo} no existe.` };
  }
  
  // Leer el contenido del archivo
  const contenidoSQL = fs.readFileSync(rutaArchivo, 'utf8');
  
  // Cargar configuración de base de datos
  const dbConfig = cargarConfiguracionBD();
  
  // Crear conexión a base de datos
  const pool = new Pool(dbConfig);
  
  try {
    console.log('Conectado a la base de datos. Ejecutando script...');
    
    // Ejecutar el script SQL
    await pool.query(contenidoSQL);
    
    console.log('Script SQL ejecutado correctamente.');
    return { success: true, message: 'Script SQL ejecutado correctamente.' };
  } catch (error) {
    console.error('Error al ejecutar el script SQL:', error);
    return { success: false, message: `Error al ejecutar: ${error.message}` };
  } finally {
    // Cerrar la conexión a la base de datos
    await pool.end();
    console.log('Conexión a la base de datos cerrada.');
  }
}

// Exportar la función para usarla desde otro archivo
module.exports = { ejecutarScriptSQL };

// Si se ejecuta directamente este archivo, ejecutar el script SQL especificado como argumento
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Debe especificar la ruta del archivo SQL a ejecutar.');
    process.exit(1);
  }
  
  const rutaArchivo = args[0];
  ejecutarScriptSQL(rutaArchivo)
    .then(resultado => {
      if (!resultado.success) {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Error inesperado:', error);
      process.exit(1);
    });
} 