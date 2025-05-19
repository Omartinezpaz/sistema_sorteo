/**
 * Script para corregir el archivo SQL de distribución para el sorteo 28
 * añadiendo conversiones explícitas de tipos
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración de la conexión a la base de datos
const dbConfig = {
  user: 'omarte',
  host: 'localhost',
  database: 'sorteo_db',
  password: 'Ap3r1t1v02025',
  port: 5432,
};

// Cliente de base de datos
const client = new Client(dbConfig);

// Función para corregir el archivo SQL
async function corregirArchivoSQL() {
  try {
    const archivoOriginal = path.join(__dirname, 'actualizar_distribucion_sorteo28.sql');
    
    if (!fs.existsSync(archivoOriginal)) {
      console.log(`❌ El archivo ${archivoOriginal} no existe`);
      return false;
    }
    
    console.log(`Leyendo archivo ${archivoOriginal}...`);
    let contenido = fs.readFileSync(archivoOriginal, 'utf8');
    
    // Buscar patrones como "cod_estado = 1" y reemplazarlos por "cod_estado::TEXT = '1'"
    const patronBusqueda = /cod_estado\s*=\s*(\d+)/g;
    const contenidoCorregido = contenido.replace(
      patronBusqueda, 
      'cod_estado::TEXT = \'$1\'::TEXT'
    );
    
    // Buscar patrones como "WHERE estado = 1" y reemplazarlos por "WHERE estado::TEXT = '1'::TEXT"
    const patronBusquedaEstado = /WHERE\s+estado\s*=\s*(\d+)/gi;
    const contenidoFinal = contenidoCorregido.replace(
      patronBusquedaEstado, 
      'WHERE estado::TEXT = \'$1\'::TEXT'
    );
    
    // Guardar el archivo corregido
    const archivoCorrecto = path.join(__dirname, 'actualizar_distribucion_sorteo28_corregido.sql');
    fs.writeFileSync(archivoCorrecto, contenidoFinal);
    
    console.log(`✅ Archivo corregido guardado como ${archivoCorrecto}`);
    return true;
  } catch (error) {
    console.error('Error al corregir el archivo SQL:', error);
    return false;
  }
}

// Función para crear una distribución manualmente
async function crearDistribucionManual() {
  try {
    console.log('Limpiando distribuciones existentes para el sorteo 28...');
    await client.query('DELETE FROM distribucion_tiques WHERE sorteo_id = 28');
    
    console.log('Obteniendo datos de estados...');
    const estadosResult = await client.query('SELECT cod_estado, nom_estado FROM estados ORDER BY cod_estado');
    
    const estados = estadosResult.rows;
    const totalEstados = estados.length;
    
    if (totalEstados === 0) {
      console.log('❌ No se encontraron estados');
      return false;
    }
    
    console.log(`Encontrados ${totalEstados} estados`);
    
    // Creación de la nueva distribución
    console.log('Creando nueva distribución para el sorteo 28...');
    
    let rangoDesde = 1;
    let tiquesPorEstado = 1000; // Asignar 1000 tiques por estado para simplificar
    let totalTiques = 0;
    
    for (const estado of estados) {
      const rangoHasta = rangoDesde + tiquesPorEstado - 1;
      
      console.log(`Estado ${estado.cod_estado} (${estado.nom_estado}): desde ${rangoDesde} hasta ${rangoHasta}`);
      
      await client.query(`
        INSERT INTO distribucion_tiques
        (sorteo_id, cod_estado, rango_desde, rango_hasta, cantidad, porcentaje, fecha_creacion)
        VALUES (28, $1, $2, $3, $4, $5, NOW())
      `, [
        estado.cod_estado,
        rangoDesde,
        rangoHasta,
        tiquesPorEstado,
        (tiquesPorEstado / (tiquesPorEstado * totalEstados) * 100).toFixed(2)
      ]);
      
      rangoDesde = rangoHasta + 1;
      totalTiques += tiquesPorEstado;
    }
    
    console.log(`✅ Distribución creada exitosamente. Total tiques: ${totalTiques}`);
    return true;
  } catch (error) {
    console.error('Error al crear distribución manual:', error);
    return false;
  }
}

// Función principal
async function main() {
  console.log('Corrigiendo distribución para el sorteo 28...');
  
  try {
    // Conectar a la base de datos
    console.log('Conectando a la base de datos...');
    await client.connect();
    console.log('Conexión establecida correctamente ✅');
    
    // Verificar si el sorteo 28 existe
    const sorteoResult = await client.query('SELECT EXISTS(SELECT 1 FROM sorteos WHERE id = 28) as existe');
    
    if (!sorteoResult.rows[0].existe) {
      console.log('❌ El sorteo 28 no existe. Creándolo...');
      
      // Crear el sorteo 28 si no existe
      await client.query(`
        INSERT INTO sorteos (id, nombre, fecha_creacion, fecha_sorteo, estado, estado_actual, es_publico)
        VALUES (28, 'Sorteo Especial #28', NOW(), NOW() + INTERVAL '7 days', 'activo', 'configuracion', TRUE)
      `);
      
      console.log('✅ Sorteo 28 creado correctamente');
    } else {
      console.log('✅ El sorteo 28 ya existe');
    }
    
    // Corregir el archivo SQL
    await corregirArchivoSQL();
    
    // Crear distribución manual
    const distribucionCreada = await crearDistribucionManual();
    
    if (distribucionCreada) {
      console.log('\n🔄 Próximos pasos:');
      console.log('1. La distribución para el sorteo 28 ha sido corregida');
      console.log('2. Ahora puedes generar tiques usando el script generar_tiques_sorteo28.js');
    } else {
      console.log('❌ No se pudo crear la distribución para el sorteo 28');
    }
    
    // Cerrar la conexión a la base de datos
    await client.end();
    console.log('Conexión a la base de datos cerrada.');
  } catch (error) {
    console.error('Error durante la ejecución del script:', error);
    try {
      await client.end();
    } catch (err) {}
  }
}

// Ejecutar la función principal
main().catch(console.error); 