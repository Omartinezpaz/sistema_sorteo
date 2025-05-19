const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración de conexión a la base de datos
const dbConfig = {
  user: 'omarte',
  host: 'localhost',
  database: 'sorteo_db',
  password: 'Ap3r1t1v02025',
  port: 5432
};

// Crear una nueva conexión a la base de datos
const pool = new Pool(dbConfig);

// Función que simula el comportamiento del handler participantes:generarTiquesPorEstado
async function generarTiquesPorEstado(sorteoId, prefijo = 'TIQ') {
  try {
    // Crear directorio de salida si no existe
    const userDownloads = path.join(process.env.USERPROFILE, 'Downloads');
    const outputDir = path.join(userDownloads, 'sorteo_tiques');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Generar nombre de archivo con fecha y hora
    const fecha = new Date().toISOString().replace(/:/g, '-').substring(0, 19);
    const archivoSalida = path.join(outputDir, `tiques_sorteo_${sorteoId}_${fecha}.csv`);
    
    console.log('Generando tiques con los siguientes parámetros:');
    console.log('- Sorteo ID:', sorteoId);
    console.log('- Prefijo:', prefijo);
    console.log('- Archivo de salida:', archivoSalida);
    
    // Ejecutar la función SQL
    const result = await pool.query(
      'SELECT * FROM generar_tiques_por_estado($1, $2, $3)',
      [sorteoId, prefijo, archivoSalida]
    );
    
    console.log('Resultado:');
    console.log(result.rows[0]);
    
    return {
      resultado: result.rows[0],
      archivoSalida: archivoSalida
    };
  } catch (error) {
    console.error('Error al generar tiques por estado:', error);
    throw new Error(`Error al generar tiques: ${error.message}`);
  }
}

// Ejecutar la prueba con un sorteo específico (cambiar el ID si es necesario)
const sorteoId = 1; // ID del sorteo a utilizar para la prueba
const prefijo = 'TIQ'; // Prefijo para los tiques

generarTiquesPorEstado(sorteoId, prefijo)
  .then(resultado => {
    console.log('Test completado con éxito');
    console.log('Resultado final:', resultado);
  })
  .catch(error => {
    console.error('El test falló:', error);
  })
  .finally(async () => {
    // Cerrar la conexión a la base de datos
    await pool.end();
    console.log('Conexión cerrada');
  }); 