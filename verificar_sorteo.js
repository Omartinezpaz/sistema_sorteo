const { Client } = require('pg');

// Configuración correcta de la base de datos
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'sorteo_db',
  user: 'omarte',
  password: 'Ap3r1t1v02025'
});

async function verificarSorteo() {
  try {
    await client.connect();
    console.log('Conectado a la base de datos');

    // Consultar sorteo
    const sorteoQuery = `
      SELECT id, nombre, estado_actual, es_publico
      FROM public.sorteos
      WHERE id = 12
    `;
    
    const sorteoResult = await client.query(sorteoQuery);
    
    if (sorteoResult.rows.length > 0) {
      const sorteo = sorteoResult.rows[0];
      console.log('Información del sorteo:');
      console.log(`- ID: ${sorteo.id}`);
      console.log(`- Nombre: ${sorteo.nombre}`);
      console.log(`- Estado actual: ${sorteo.estado_actual}`);
      console.log(`- Es público: ${sorteo.es_publico}`);
    } else {
      console.log('No se encontró el sorteo con ID 12');
    }
    
    // Consultar premios
    const premiosQuery = `
      SELECT id, sorteo_id, nombre, descripcion, valor, orden, categoria_id
      FROM public.premios
      WHERE sorteo_id = 12
      ORDER BY orden DESC
    `;
    
    const premiosResult = await client.query(premiosQuery);
    
    console.log('\nPremios del sorteo:');
    if (premiosResult.rows.length > 0) {
      premiosResult.rows.forEach(premio => {
        console.log(`- ID: ${premio.id}, Orden: ${premio.orden}, Nombre: ${premio.nombre}`);
        console.log(`  Descripción: ${premio.descripcion}`);
        console.log(`  Valor: ${premio.valor}`);
        console.log('');
      });
      console.log(`Total de premios: ${premiosResult.rows.length}`);
    } else {
      console.log('No se encontraron premios para el sorteo con ID 12');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
    console.log('\nConexión cerrada');
  }
}

verificarSorteo(); 