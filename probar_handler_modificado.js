const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const os = require('os');

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

// Función que simula el comportamiento del handler modificado participantes:generarTiquesPorEstado
async function generarTiquesPorEstado(sorteoId, prefijo = 'TIQ') {
  try {
    // Crear directorio de salida si no existe
    const userDownloads = path.join(os.homedir(), 'Downloads');
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
      'SELECT * FROM generar_tiques_por_estado($1, $2)',
      [sorteoId, prefijo]
    );
    
    console.log('Resultado obtenido de la BD:', result.rows[0]);
    
    if (result.rows.length === 0) {
      throw new Error('No se recibió respuesta de la función');
    }
    
    // Escribir archivo CSV manualmente
    const datos = result.rows[0].datos_participantes;
    
    if (Array.isArray(datos) && datos.length > 0) {
      console.log(`Escribiendo ${datos.length} participantes a CSV...`);
      
      // Escribir encabezado
      const encabezado = 'cedula,nombre,apellido,estado,municipio,parroquia,telefono,email,prefijo_tique,numero_tique,codigo_tique\n';
      fs.writeFileSync(archivoSalida, encabezado, 'utf8');
      
      // Escribir datos
      let contenido = '';
      for (const participante of datos) {
        contenido += `${participante.cedula},${participante.nombre},${participante.apellido},${participante.estado},` +
                     `${participante.municipio},${participante.parroquia},${participante.telefono},${participante.email},` +
                     `${participante.prefijo_tique},${participante.numero_tique},${participante.codigo_tique}\n`;
      }
      
      fs.appendFileSync(archivoSalida, contenido, 'utf8');
      console.log('Archivo CSV generado correctamente:', archivoSalida);
    } else {
      console.log('No hay datos para escribir al archivo CSV');
    }
    
    return {
      resultado: {
        mensaje: result.rows[0].mensaje,
        total_generados: result.rows[0].total_generados,
        tiques_por_estado: result.rows[0].tiques_por_estado
      },
      archivoSalida: archivoSalida
    };
  } catch (error) {
    console.error('Error al generar tiques por estado:', error);
    throw new Error(`Error al generar tiques: ${error.message}`);
  }
}

// Ejecutar primero la función SQL modificada
async function aplicarFuncionModificada() {
  try {
    console.log('Aplicando función SQL modificada desde generar_tiques_final.sql...');
    const sqlFilePath = path.join(__dirname, 'generar_tiques_final.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    await pool.query(sql);
    console.log('Función SQL modificada aplicada correctamente');
  } catch (error) {
    console.error('Error al aplicar función SQL modificada:', error);
    throw error;
  }
}

// Ejecutar la prueba con un sorteo específico (cambiar el ID si es necesario)
const sorteoId = 1; // ID del sorteo a utilizar para la prueba
const prefijo = 'TIQ'; // Prefijo para los tiques

aplicarFuncionModificada()
  .then(() => generarTiquesPorEstado(sorteoId, prefijo))
  .then(resultado => {
    console.log('Test completado con éxito');
    console.log('Resumen final:');
    console.log('- Mensaje:', resultado.resultado.mensaje);
    console.log('- Total generados:', resultado.resultado.total_generados);
    console.log('- Archivo CSV:', resultado.archivoSalida);
  })
  .catch(error => {
    console.error('El test falló:', error);
  })
  .finally(async () => {
    // Cerrar la conexión a la base de datos
    await pool.end();
    console.log('Conexión cerrada');
  }); 