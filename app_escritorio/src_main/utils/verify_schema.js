const { pool } = require('../database/connection');

async function verifySchema() {
  const client = await pool.connect();
  try {
    console.log('Verificando esquema de la base de datos...');

    // Verificar tabla premios
    const premiosResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'premios'
      ORDER BY column_name;
    `);
    
    console.log('\nColumnas en tabla premios:');
    premiosResult.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });

    // Verificar tabla participantes
    const participantesResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'participantes'
      ORDER BY column_name;
    `);
    
    console.log('\nColumnas en tabla participantes:');
    participantesResult.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });

    // Verificar triggers
    const triggersResult = await client.query(`
      SELECT 
        event_object_table as tabla,
        trigger_name as trigger
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table;
    `);
    
    console.log('\nTriggers existentes:');
    triggersResult.rows.forEach(row => {
      console.log(`- Tabla ${row.tabla}: ${row.trigger}`);
    });

    // Verificar funciones
    const functionsResult = await client.query(`
      SELECT 
        routine_name as funcion,
        data_type as tipo_retorno
      FROM information_schema.routines 
      WHERE routine_schema = 'public'
      ORDER BY routine_name;
    `);
    
    console.log('\nFunciones existentes:');
    functionsResult.rows.forEach(row => {
      console.log(`- ${row.funcion} (retorna: ${row.tipo_retorno})`);
    });

    console.log('\nVerificación completada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('Error al verificar esquema:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

// Ejecutar la verificación
verifySchema(); 