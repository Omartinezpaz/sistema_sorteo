const { Client } = require('pg');

// Configuración obtenida del archivo .env
const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'sorteo_db',
    user: 'omarte',
    password: 'Ap3r1t1v02025'
});

async function consultarTablas() {
  try {
    await client.connect();
    console.log('Conectado a la base de datos');

    // Consultar todas las tablas
    const allTablesQuery = `
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name;
    `;
    
    const allTablesResult = await client.query(allTablesQuery);
    console.log('Todas las tablas:');
    allTablesResult.rows.forEach(row => {
      console.log(`- ${row.table_schema}.${row.table_name}`);
    });
    console.log();

    // Ver el contenido de la tabla 'premios'
    try {
      const premiosQuery = `
        SELECT * 
        FROM "sorteos_23_052025"."premios"
      `;
      const premiosResult = await client.query(premiosQuery);
      console.log('Contenido de sorteos_23_052025.premios:');
      if (premiosResult.rows.length === 0) {
        console.log('  (tabla vacía)');
      } else {
        console.log(JSON.stringify(premiosResult.rows, null, 2));
      }
      console.log();
    } catch (err) {
      console.log('Error consultando premios:', err.message);
    }

    // Ver el contenido de la tabla 'sorteos' si existe
    try {
      const sorteosQuery = `
        SELECT * 
        FROM information_schema.tables 
        WHERE table_name='sorteos' AND table_schema = 'public'
      `;
      const sorteosTableResult = await client.query(sorteosQuery);
      
      if (sorteosTableResult.rows.length > 0) {
        const sorteosContentQuery = `SELECT * FROM public.sorteos`;
        const sorteosResult = await client.query(sorteosContentQuery);
        console.log('Contenido de public.sorteos:');
        console.log(JSON.stringify(sorteosResult.rows, null, 2));
      } else {
        console.log('La tabla public.sorteos no existe');
      }
    } catch (err) {
      console.log('Error consultando sorteos:', err.message);
    }

    // Ver las tablas que contienen 'sorteo' en el nombre
    try {
      const sorteoTablesQuery = `
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_name ILIKE '%sorteo%'
        ORDER BY table_schema, table_name;
      `;
      const sorteoTablesResult = await client.query(sorteoTablesQuery);
      
      console.log('Tablas relacionadas con sorteos:');
      if (sorteoTablesResult.rows.length === 0) {
        console.log('  (ninguna tabla encontrada)');
      } else {
        sorteoTablesResult.rows.forEach(row => {
          console.log(`- ${row.table_schema}.${row.table_name}`);
        });
      }
    } catch (err) {
      console.log('Error buscando tablas de sorteos:', err.message);
    }

  } catch (error) {
    console.error('Error general:', error);
  } finally {
    await client.end();
    console.log('\nConexión cerrada');
  }
}

consultarTablas(); 