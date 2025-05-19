/**
 * Script mejorado para generar tiques para el sorteo 28
 * con más información de depuración
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
  console.log('Iniciando generación de tiques para el sorteo 28 (modo depuración)...');
  
  try {
    // Conectar a la base de datos
    console.log('Conectando a la base de datos...');
    await client.connect();
    console.log('Conexión establecida correctamente ✅');
    
    // Verificar tipo de datos en re_723
    console.log('\n1. Verificando tipo de datos en re_723:');
    const re723Result = await client.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns 
      WHERE table_name = 're_723' AND column_name = 'cod_estado'
    `);
    
    if (re723Result.rows.length > 0) {
      console.log('Tipo de cod_estado en re_723:', re723Result.rows[0].data_type, '(', re723Result.rows[0].udt_name, ')');
    } else {
      console.log('❌ No se encontró la columna cod_estado en re_723');
      await client.end();
      return;
    }
    
    // Verificar tipo de datos en distribucion_tiques
    console.log('\n2. Verificando tipo de datos en distribucion_tiques:');
    const distResult = await client.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns 
      WHERE table_name = 'distribucion_tiques' AND column_name = 'cod_estado'
    `);
    
    if (distResult.rows.length > 0) {
      console.log('Tipo de cod_estado en distribucion_tiques:', distResult.rows[0].data_type, '(', distResult.rows[0].udt_name, ')');
    } else {
      console.log('❌ No se encontró la columna cod_estado en distribucion_tiques');
      await client.end();
      return;
    }
    
    // Verificar si el sorteo 28 existe
    console.log('\n3. Verificando si el sorteo 28 existe:');
    const sorteoResult = await client.query('SELECT EXISTS(SELECT 1 FROM sorteos WHERE id = 28) as existe');
    
    if (!sorteoResult.rows[0].existe) {
      console.log('❌ El sorteo 28 no existe en la base de datos');
      await client.end();
      return;
    }
    
    console.log('✅ El sorteo 28 existe en la base de datos');
    
    // Verificar distribución para el sorteo 28
    console.log('\n4. Verificando distribución para el sorteo 28:');
    const distCountResult = await client.query('SELECT COUNT(*) as total FROM distribucion_tiques WHERE sorteo_id = 28');
    
    const totalDistribuciones = parseInt(distCountResult.rows[0].total);
    console.log(`Distribuciones para sorteo 28: ${totalDistribuciones}`);
    
    if (totalDistribuciones === 0) {
      console.log('❌ No hay distribución de tiques configurada para el sorteo 28');
      await client.end();
      return;
    }
    
    // Mostrar ejemplo de distribución
    console.log('\nEjemplo de distribución para el sorteo 28:');
    const ejemploDistResult = await client.query('SELECT * FROM distribucion_tiques WHERE sorteo_id = 28 LIMIT 3');
    console.log(ejemploDistResult.rows);
    
    // Verificar ejemplo de participantes en re_723
    console.log('\n5. Verificando ejemplo de participantes en re_723:');
    try {
      // Intentar con la primera distribución como ejemplo
      const codEstadoEjemplo = ejemploDistResult.rows[0].cod_estado;
      
      // Mostrar la consulta que se ejecutará
      console.log(`Consultando participantes para cod_estado = ${codEstadoEjemplo}:`);
      
      // Consulta de prueba para verificar conversion explícita
      const testQuery = `
        SELECT count(*) as total
        FROM public.re_723
        WHERE cod_estado::TEXT = $1::TEXT
      `;
      
      const testResult = await client.query(testQuery, [codEstadoEjemplo.toString()]);
      console.log(`Participantes encontrados con conversión explícita: ${testResult.rows[0].total}`);
      
      // Mostrar algunos participantes de ejemplo
      const participantesResult = await client.query(`
        SELECT nac, cedula_ch, p_nombre, p_apellido, cod_estado
        FROM public.re_723
        WHERE cod_estado::TEXT = $1::TEXT
        LIMIT 3
      `, [codEstadoEjemplo.toString()]);
      
      console.log('Ejemplos de participantes:');
      console.log(participantesResult.rows);
    } catch (err) {
      console.error('Error al verificar participantes:', err);
    }
    
    // Verificar definición de la función
    console.log('\n6. Verificando definición de la función generar_tiques_desde_distribucion:');
    const funcionResult = await client.query(`
      SELECT proname, pronargs, prorettype::regtype as tipo_retorno
      FROM pg_proc
      WHERE proname = 'generar_tiques_desde_distribucion'
      AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    `);
    
    if (funcionResult.rows.length > 0) {
      console.log('Función encontrada:', funcionResult.rows[0]);
    } else {
      console.log('❌ La función generar_tiques_desde_distribucion no existe');
      await client.end();
      return;
    }
    
    // Ejecutar la función de generación de tiques
    console.log('\n7. Ejecutando generación de tiques...');
    try {
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
    } catch (generacionError) {
      console.error('Error durante la generación de tiques:');
      console.error(generacionError);
      
      // Intentar mostrar más detalles del error
      if (generacionError.detail) console.log('Detalle:', generacionError.detail);
      if (generacionError.hint) console.log('Hint:', generacionError.hint);
      if (generacionError.where) console.log('Ubicación:', generacionError.where);
      if (generacionError.internalQuery) console.log('Consulta interna:', generacionError.internalQuery);
    }
    
    // Cerrar la conexión a la base de datos
    await client.end();
    console.log('\nConexión a la base de datos cerrada.');
    
  } catch (error) {
    console.error('Error general durante la ejecución del script:', error);
    try {
      await client.end();
    } catch (err) {}
  }
}

// Ejecutar la función principal
main().catch(console.error); 