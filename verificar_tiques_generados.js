/**
 * Script para verificar los tiques generados para el sorteo 28
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
  console.log('Verificando tiques generados para el sorteo 28...');
  
  try {
    // Conectar a la base de datos
    console.log('Conectando a la base de datos...');
    await client.connect();
    console.log('Conexión establecida correctamente ✅');
    
    // Verificar cantidad total de tiques generados para el sorteo 28
    const countResult = await client.query(
      'SELECT COUNT(*) as total FROM participantes WHERE sorteo_id = 28'
    );
    
    const totalTiques = parseInt(countResult.rows[0].total);
    console.log(`\nTotal de tiques generados para el sorteo 28: ${totalTiques}`);
    
    if (totalTiques === 0) {
      console.log('❌ No se han generado tiques para el sorteo 28');
      await client.end();
      return;
    }
    
    // Verificar metadata del sorteo con la información de tiques
    const metadataResult = await client.query(
      'SELECT metadata FROM sorteos WHERE id = 28'
    );
    
    if (metadataResult.rows.length > 0 && metadataResult.rows[0].metadata) {
      const metadata = metadataResult.rows[0].metadata;
      console.log('\nMetadata del sorteo 28:');
      
      if (metadata.total_participantes) {
        console.log(`- Total participantes: ${metadata.total_participantes}`);
      }
      
      if (metadata.tiques_por_estado) {
        console.log('\nDistribución por estado:');
        for (const [codEstado, cantidad] of Object.entries(metadata.tiques_por_estado)) {
          console.log(`- Estado ${codEstado}: ${cantidad} tiques`);
        }
      }
      
      if (metadata.ultima_actualizacion) {
        console.log(`\nÚltima actualización: ${new Date(metadata.ultima_actualizacion).toLocaleString()}`);
      }
    } else {
      console.log('❌ No se encontró metadata para el sorteo 28');
    }
    
    // Mostrar algunos tiques de ejemplo
    console.log('\nEjemplos de tiques generados:');
    const ejemploResult = await client.query(
      'SELECT codigo_tique, documento_identidad, nombre, apellido, estado FROM participantes WHERE sorteo_id = 28 LIMIT 10'
    );
    
    ejemploResult.rows.forEach((tique, index) => {
      console.log(`${index + 1}. ${tique.codigo_tique} - ${tique.documento_identidad} - ${tique.nombre} ${tique.apellido} - Estado: ${tique.estado}`);
    });
    
    // Agrupar por estado para verificar distribución
    console.log('\nDistribución real por estado:');
    const distribucionResult = await client.query(
      'SELECT estado, COUNT(*) as cantidad FROM participantes WHERE sorteo_id = 28 GROUP BY estado ORDER BY estado'
    );
    
    distribucionResult.rows.forEach(grupo => {
      console.log(`- Estado ${grupo.estado}: ${grupo.cantidad} tiques`);
    });
    
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