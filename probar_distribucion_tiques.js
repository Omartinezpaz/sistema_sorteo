/**
 * Script para probar la función generar_tiques_por_estado
 * 
 * Este script ejecuta la función SQL generar_tiques_por_estado con diferentes
 * parámetros para probar su funcionamiento.
 * 
 * Uso: node probar_distribucion_tiques.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuración de la conexión a la base de datos
const pool = new Pool({
  user: process.env.DB_USER || 'omarte',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'sorteo_db',
  password: process.env.DB_PASSWORD || 'omarte',
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

// Ruta para el archivo de salida CSV
const outputDir = process.env.OUTPUT_DIR || path.join(__dirname, 'output');
const csvFilePath = path.join(outputDir, `tiques_generados_${new Date().toISOString().replace(/:/g, '-')}.csv`);

// Asegurar que el directorio de salida exista
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function main() {
  const client = await pool.connect();
  
  try {
    console.log('1. Probando la creación/actualización de la función...');
    
    // Leer el archivo SQL con la definición de la función
    const functionSql = fs.readFileSync(path.join(__dirname, 'generar_tiques_por_estado.sql'), 'utf8');
    
    // Ejecutar el SQL para crear/actualizar la función
    await client.query(functionSql);
    console.log('✅ Función actualizada correctamente');
    
    // Obtener ID de sorteo existente o crear uno nuevo
    console.log('2. Buscando un sorteo para usar o creando uno nuevo...');
    
    let sorteoId;
    const sorteoResult = await client.query(`
      SELECT id FROM sorteos 
      WHERE estado_actual = 'borrador' OR estado_actual = 'programado'
      ORDER BY id DESC LIMIT 1
    `);
    
    if (sorteoResult.rows.length > 0) {
      sorteoId = sorteoResult.rows[0].id;
      console.log(`✅ Usando sorteo existente con ID: ${sorteoId}`);
    } else {
      // Crear un nuevo sorteo
      const nuevoSorteo = await client.query(`
        INSERT INTO sorteos (nombre, descripcion, fecha_sorteo, estado_actual)
        VALUES ('Sorteo de prueba automatizado', 'Creado para probar la distribución de tiques', 
                NOW() + INTERVAL '7 days', 'borrador')
        RETURNING id
      `);
      sorteoId = nuevoSorteo.rows[0].id;
      console.log(`✅ Creado nuevo sorteo con ID: ${sorteoId}`);
    }
    
    // Probar la función con un archivo de salida
    console.log('3. Probando generar_tiques_por_estado con archivo de salida...');
    console.log(`   Archivo de salida: ${csvFilePath}`);
    
    const resultado1 = await client.query(`
      SELECT * FROM generar_tiques_por_estado($1, $2, $3)
    `, [sorteoId, 'TIQ', csvFilePath]);
    
    console.log('✅ Resultado de la generación con archivo:');
    console.table(resultado1.rows[0]);
    
    // Verificar si el archivo fue creado
    if (fs.existsSync(csvFilePath)) {
      const fileStats = fs.statSync(csvFilePath);
      console.log(`✅ Archivo CSV creado correctamente (${(fileStats.size / 1024).toFixed(2)} KB)`);
      
      // Mostrar las primeras 5 líneas del archivo
      const fileContent = fs.readFileSync(csvFilePath, 'utf8');
      const lines = fileContent.split('\n').slice(0, 6);
      console.log('Primeras líneas del archivo:');
      lines.forEach(line => console.log(`   ${line}`));
    } else {
      console.error('❌ El archivo CSV no fue creado');
    }
    
    // Verificar la distribución de tiques
    console.log('4. Verificando distribución de tiques por estado...');
    
    const distribucion = await client.query(`
      SELECT * FROM verificar_distribucion_tiques($1)
    `, [sorteoId]);
    
    console.log('✅ Distribución de tiques por estado:');
    console.table(distribucion.rows);
    
    // Contar participantes insertados
    const countResult = await client.query(`
      SELECT COUNT(*) FROM participantes WHERE sorteo_id = $1
    `, [sorteoId]);
    
    console.log(`✅ Total de participantes insertados: ${countResult.rows[0].count}`);
    
    console.log('Prueba completada con éxito!');
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error); 