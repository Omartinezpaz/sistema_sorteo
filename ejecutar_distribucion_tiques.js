/**
 * Script para ejecutar la distribución de tiques con tabla re_723 existente
 * 
 * Este script ejecuta en secuencia:
 * 1. Verificación de la tabla re_723 existente
 * 2. Ejecución de la función generar_tiques_por_estado
 * 3. Prueba de la distribución de tiques
 * 
 * Uso: node ejecutar_distribucion_tiques.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
require('dotenv').config();

// Configuración de la conexión a la base de datos
const pool = new Pool({
  user: process.env.DB_USER || 'omarte',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'sorteo_db',
  password: process.env.DB_PASSWORD || 'Ap3r1t1v02025',
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

// Función para ejecutar un archivo SQL
async function ejecutarArchivoSQL(cliente, rutaArchivo) {
  console.log(`Ejecutando archivo SQL: ${rutaArchivo}`);
  const contenidoSQL = fs.readFileSync(rutaArchivo, 'utf8');
  
  try {
    await cliente.query(contenidoSQL);
    console.log(`✅ Archivo SQL ejecutado con éxito: ${rutaArchivo}`);
    return true;
  } catch (error) {
    console.error(`❌ Error al ejecutar el archivo SQL ${rutaArchivo}:`, error.message);
    return false;
  }
}

// Función para ejecutar la generación de tiques directamente
async function ejecutarGeneracionTiques(cliente, sorteoId, prefijo = 'TIQ', rutaArchivo = null) {
  try {
    console.log(`Ejecutando generación de tiques para el sorteo ID: ${sorteoId}`);
    
    // Crear directorio de salida si se especifica ruta
    let archivoSalida = null;
    if (rutaArchivo) {
      const dirSalida = path.dirname(rutaArchivo);
      if (!fs.existsSync(dirSalida)) {
        fs.mkdirSync(dirSalida, { recursive: true });
      }
      archivoSalida = rutaArchivo;
    }
    
    // Ejecutar la función
    const resultado = await cliente.query(`
      SELECT * FROM generar_tiques_por_estado($1, $2, $3)
    `, [sorteoId, prefijo, archivoSalida]);
    
    console.log('✅ Resultado de la generación:');
    console.table(resultado.rows[0]);
    
    // Verificar si el archivo fue creado
    if (archivoSalida && fs.existsSync(archivoSalida)) {
      const fileStats = fs.statSync(archivoSalida);
      console.log(`✅ Archivo CSV creado correctamente (${(fileStats.size / 1024).toFixed(2)} KB)`);
      
      // Mostrar las primeras 5 líneas del archivo
      const fileContent = fs.readFileSync(archivoSalida, 'utf8');
      const lines = fileContent.split('\n').slice(0, 6);
      console.log('Primeras líneas del archivo:');
      lines.forEach(line => console.log(`   ${line}`));
    }
    
    return resultado.rows[0];
  } catch (error) {
    console.error('❌ Error al generar tiques:', error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Iniciando proceso de distribución de tiques con tabla re_723 existente...');
  
  const cliente = await pool.connect();
  
  try {
    // 1. Verificar la tabla re_723 existente
    console.log('\n=========================================');
    console.log('PASO 1: Verificación de la tabla re_723 existente');
    console.log('=========================================');
    
    try {
      const { rows: [{ count: cantidadRegistros }] } = await cliente.query('SELECT COUNT(*) FROM re_723');
      console.log(`✅ Tabla re_723 existe y contiene ${cantidadRegistros} registros.`);
      
      if (parseInt(cantidadRegistros) === 0) {
        console.warn('⚠️ Advertencia: La tabla re_723 existe pero está vacía. Los resultados pueden no ser los esperados.');
      }
      
      // Mostrar datos de muestra
      const { rows: muestraEstados } = await cliente.query(`
        SELECT cod_estado, COUNT(*) as cantidad 
        FROM re_723 
        GROUP BY cod_estado 
        ORDER BY cod_estado
      `);
      
      console.log('📊 Distribución por estados:');
      console.table(muestraEstados);
      
    } catch (error) {
      console.error('❌ Error al verificar la tabla re_723:', error.message);
      console.error('Asegúrese de que la tabla re_723 existe en la base de datos.');
      return;
    }
    
    // 2. Crear/actualizar la función generar_tiques_por_estado
    console.log('\n=========================================');
    console.log('PASO 2: Creación/actualización de la función generar_tiques_por_estado');
    console.log('=========================================');
    
    const resultadoCrearFuncion = await ejecutarArchivoSQL(cliente, path.join(__dirname, 'generar_tiques_final.sql'));
    
    if (!resultadoCrearFuncion) {
      console.error('❌ No se pudo crear la función generar_tiques_por_estado. Abortando proceso.');
      return;
    }
    
    // 3. Buscar o crear un sorteo
    console.log('\n=========================================');
    console.log('PASO 3: Buscar o crear un sorteo para asignar tiques');
    console.log('=========================================');
    
    let sorteoId;
    const sorteoResult = await cliente.query(`
      SELECT id, nombre FROM sorteos 
      WHERE estado_actual = 'borrador' OR estado_actual = 'programado'
      ORDER BY id DESC LIMIT 1
    `);
    
    if (sorteoResult.rows.length > 0) {
      sorteoId = sorteoResult.rows[0].id;
      console.log(`✅ Usando sorteo existente con ID: ${sorteoId} (${sorteoResult.rows[0].nombre})`);
    } else {
      try {
        // Crear un nuevo sorteo
        const nuevoSorteo = await cliente.query(`
          INSERT INTO sorteos (nombre, descripcion, fecha_sorteo, estado_actual)
          VALUES ('Distribución de tiques automática', 'Creado para la distribución automática de tiques', 
                  NOW() + INTERVAL '7 days', 'borrador')
          RETURNING id, nombre
        `);
        sorteoId = nuevoSorteo.rows[0].id;
        console.log(`✅ Creado nuevo sorteo con ID: ${sorteoId} (${nuevoSorteo.rows[0].nombre})`);
      } catch (error) {
        console.error('❌ Error al crear nuevo sorteo:', error.message);
        console.error('Intentando continuar con ID de sorteo = 1...');
        sorteoId = 1;
      }
    }
    
    // 4. Ejecutar la generación de tiques
    console.log('\n=========================================');
    console.log('PASO 4: Ejecutar generación de tiques');
    console.log('=========================================');
    
    // Configurar ruta de salida
    const outputDir = process.env.OUTPUT_DIR || path.join(__dirname, 'output');
    const csvFilePath = path.join(outputDir, `tiques_sorteo_${sorteoId}_${new Date().toISOString().replace(/:/g, '-')}.csv`);
    
    // Ejecutar generación
    const resultadoGeneracion = await ejecutarGeneracionTiques(cliente, sorteoId, 'TIQ', csvFilePath);
    
    if (!resultadoGeneracion) {
      console.error('❌ Error en la generación de tiques.');
      return;
    }
    
    // 5. Verificar distribución
    console.log('\n=========================================');
    console.log('PASO 5: Verificar distribución de tiques');
    console.log('=========================================');
    
    try {
      const distribucion = await cliente.query(`
        SELECT * FROM verificar_distribucion_tiques($1)
      `, [sorteoId]);
      
      console.log('✅ Distribución de tiques por estado:');
      console.table(distribucion.rows);
      
      // Contar participantes insertados
      const countResult = await cliente.query(`
        SELECT COUNT(*) FROM participantes WHERE sorteo_id = $1
      `, [sorteoId]);
      
      console.log(`✅ Total de participantes insertados: ${countResult.rows[0].count}`);
    } catch (error) {
      console.error('❌ Error al verificar distribución:', error.message);
    }
    
    console.log('\n🎉 Proceso de distribución de tiques completado con éxito!');
    console.log('\nResumen:');
    console.log(`- Tabla re_723 verificada (ya existente)`);
    console.log(`- Función generar_tiques_por_estado actualizada`);
    console.log(`- Tiques generados para el sorteo ID: ${sorteoId}`);
    console.log(`- Archivo CSV generado: ${csvFilePath}`);
    
  } catch (error) {
    console.error('❌ Error durante el proceso:', error);
  } finally {
    cliente.release();
    await pool.end();
  }
}

main().catch(console.error); 