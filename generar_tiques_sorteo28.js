/**
 * Script simple para generar tiques para el sorteo 28
 * utilizando la función corregida generar_tiques_desde_distribucion
 */

const { Client } = require('pg');

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

async function main() {
  console.log('Iniciando generación de tiques para el sorteo 28...');
  
  try {
    // Conectar a la base de datos
    console.log('Conectando a la base de datos...');
    await client.connect();
    console.log('Conexión establecida correctamente ✅');
    
    // Verificar si el sorteo 28 existe
    const sorteoResult = await client.query('SELECT EXISTS(SELECT 1 FROM sorteos WHERE id = 28) as existe');
    
    if (!sorteoResult.rows[0].existe) {
      console.log('❌ El sorteo 28 no existe en la base de datos');
      await client.end();
      return;
    }
    
    console.log('✅ El sorteo 28 existe en la base de datos');
    
    // Verificar distribución para el sorteo 28
    const distResult = await client.query('SELECT COUNT(*) as total FROM distribucion_tiques WHERE sorteo_id = 28');
    
    const totalDistribuciones = parseInt(distResult.rows[0].total);
    console.log(`Distribuciones para sorteo 28: ${totalDistribuciones}`);
    
    if (totalDistribuciones === 0) {
      console.log('❌ No hay distribución de tiques configurada para el sorteo 28');
      await client.end();
      return;
    }
    
    // Ejecutar la función de generación de tiques
    console.log('Ejecutando generación de tiques...');
    const result = await client.query(
      'SELECT * FROM generar_tiques_desde_distribucion($1, $2)',
      [28, 'TIQ']
    );
    
    if (result.rows.length > 0) {
      console.log('\n✅ GENERACIÓN EXITOSA');
      console.log('Mensaje:', result.rows[0].mensaje);
      console.log('Total tiques:', result.rows[0].total_tiques);
      
      // Mostrar detalles por estado si están disponibles
      if (result.rows[0].tiques_por_estado) {
        console.log('\nDetalle por estado:');
        const tiquesPorEstado = result.rows[0].tiques_por_estado;
        
        if (typeof tiquesPorEstado === 'object') {
          for (const [codEstado, cantidad] of Object.entries(tiquesPorEstado)) {
            console.log(`- Estado ${codEstado}: ${cantidad} tiques`);
          }
        } else {
          console.log(tiquesPorEstado); // Mostrar como texto si no es un objeto
        }
      }
    } else {
      console.log('❌ No se obtuvo resultado de la generación de tiques');
    }
    
    // Cerrar la conexión a la base de datos
    await client.end();
    console.log('\nConexión a la base de datos cerrada.');
    
  } catch (error) {
    console.error('Error durante la ejecución del script:', error);
    try {
      await client.end();
    } catch (err) {}
  }
}

// Ejecutar la función principal
main().catch(console.error); 