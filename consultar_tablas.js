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

    // Consultar los esquemas disponibles
    const schemasQuery = `
      SELECT nspname
      FROM pg_catalog.pg_namespace
      WHERE nspname !~ '^pg_' AND nspname <> 'information_schema'
      ORDER BY nspname;
    `;
    
    const schemasResult = await client.query(schemasQuery);
    console.log('Esquemas disponibles:');
    schemasResult.rows.forEach(row => {
      console.log(`- ${row.nspname}`);
    });
    console.log();

    // Consultar las tablas en el esquema 'sorteos_23_052025'
    const tablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'sorteos_23_052025'
      ORDER BY table_name;
    `;
    
    const tablesResult = await client.query(tablesQuery);
    console.log('Tablas en sorteos_23_052025:');
    tablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });

    // Consultar las tablas en el esquema 'public'
    const publicTablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    const publicTablesResult = await client.query(publicTablesQuery);
    console.log('\nTablas en public:');
    publicTablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
    console.log('\nConexión cerrada');
  }
}

consultarTablas(); 