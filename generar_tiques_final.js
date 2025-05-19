/**
 * Script final para generar tiques para el sorteo 28
 * utilizando la función corregida y la distribución corregida
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
  console.log('Iniciando generación de tiques para el sorteo 28 (versión final)...');
  
  try {
    // Conectar a la base de datos
    console.log('Conectando a la base de datos...');
    await client.connect();
    console.log('Conexión establecida correctamente ✅');
    
    // Verificar distribución para el sorteo 28
    console.log('\nVerificando distribución para el sorteo 28:');
    const distResult = await client.query('SELECT COUNT(*) as total FROM distribucion_tiques WHERE sorteo_id = 28');
    
    const totalDistribuciones = parseInt(distResult.rows[0].total);
    console.log(`Distribuciones para sorteo 28: ${totalDistribuciones}`);
    
    if (totalDistribuciones === 0) {
      console.log('❌ No hay distribución de tiques configurada para el sorteo 28');
      console.log('Ejecute primero el script corregir_distribucion_sorteo28.js');
      await client.end();
      return;
    }
    
    // Limpiar tiques existentes del sorteo 28
    console.log('\nLimpiando tiques existentes para el sorteo 28...');
    await client.query('DELETE FROM participantes WHERE sorteo_id = 28');
    console.log('✅ Tiques anteriores eliminados');
    
    // Ejecutar la función de generación de tiques
    console.log('\nEjecutando generación de tiques...');
    console.log('Este proceso puede tardar unos minutos...');
    
    const result = await client.query(
      'SELECT * FROM generar_tiques_desde_distribucion($1, $2)',
      [28, 'TIQ']
    );
    
    if (result.rows.length > 0) {
      console.log('\n✅ GENERACIÓN DE TIQUES EXITOSA');
      console.log('Mensaje:', result.rows[0].mensaje);
      console.log('Total tiques:', result.rows[0].total_tiques);
      
      // Mostrar detalles por estado
      if (result.rows[0].tiques_por_estado) {
        console.log('\nDetalle por estado:');
        
        try {
          const tiquesPorEstado = JSON.parse(
            typeof result.rows[0].tiques_por_estado === 'string' 
            ? result.rows[0].tiques_por_estado 
            : JSON.stringify(result.rows[0].tiques_por_estado)
          );
          
          for (const [codEstado, cantidad] of Object.entries(tiquesPorEstado)) {
            console.log(`- Estado ${codEstado}: ${cantidad} tiques`);
          }
        } catch (err) {
          console.log(result.rows[0].tiques_por_estado);
        }
      }
      
      // Verificar tiques generados
      const countResult = await client.query('SELECT COUNT(*) as total FROM participantes WHERE sorteo_id = 28');
      console.log(`\nTotal de tiques guardados en la base de datos: ${countResult.rows[0].total}`);
      
      console.log('\n🔄 Próximo paso:');
      console.log('1. Ya puede utilizar la aplicación para visualizar los tiques generados.');
      console.log('2. Verifique los tiques generados usando el script verificar_tiques_generados.js.');
    } else {
      console.log('❌ No se obtuvo resultado de la generación de tiques');
    }
    
    // Cerrar la conexión a la base de datos
    await client.end();
    console.log('\nConexión a la base de datos cerrada.');
    
  } catch (error) {
    console.error('Error durante la ejecución del script:', error);
    
    // Mostrar detalles adicionales del error si están disponibles
    if (error.detail) console.log('Detalle:', error.detail);
    if (error.hint) console.log('Hint:', error.hint);
    if (error.where) console.log('Ubicación:', error.where);
    
    try {
      await client.end();
    } catch (err) {}
  }
}

// Ejecutar la función principal
main().catch(console.error); 