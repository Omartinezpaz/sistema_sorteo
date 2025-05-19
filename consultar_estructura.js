const { Client } = require('pg');

// Configuración obtenida del archivo .env
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'sorteo_db',
  user: 'omarte',
  password: 'Ap3r1t1v02025'
});

async function consultarEstructura() {
  try {
    await client.connect();
    console.log('Conectado a la base de datos');

    // Consultar estructura de la tabla premios
    const premiosStructureQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'sorteos_23_052025' AND table_name = 'premios'
      ORDER BY ordinal_position;
    `;
    
    const premiosStructure = await client.query(premiosStructureQuery);
    console.log('Estructura de la tabla premios:');
    premiosStructure.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    console.log();

    // Consultar los sorteos existentes
    const sorteosQuery = `
      SELECT *
      FROM sorteos_23_052025.geo_vlz
      WHERE id = 12 OR nombre LIKE '%Pueblo Valiente%'
    `;
    
    const sorteosResult = await client.query(sorteosQuery);
    console.log('Sorteos encontrados:');
    sorteosResult.rows.forEach(row => {
      console.log(JSON.stringify(row, null, 2));
    });
    console.log();
    
    // Consultar premios existentes
    const premiosQuery = `
      SELECT *
      FROM sorteos_23_052025.premios
      WHERE 1=1
    `;
    
    const premiosResult = await client.query(premiosQuery);
    console.log('Premios existentes:');
    premiosResult.rows.forEach(row => {
      console.log(JSON.stringify(row, null, 2));
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
    console.log('\nConexión cerrada');
  }
}

consultarEstructura(); 