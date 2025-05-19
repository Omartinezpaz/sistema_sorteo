const { Client } = require('pg');

// Configuración de la base de datos
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'sorteo_db',
  user: 'omarte',
  password: 'Ap3r1t1v02025'
});

async function verificarPremios() {
  try {
    await client.connect();
    console.log('Conectado a la base de datos');

    // Obtener información del sorteo
    const sorteoResult = await client.query(`
      SELECT 
        id, 
        nombre, 
        fecha_sorteo, 
        estado_actual,
        metadata
      FROM 
        sorteos 
      WHERE 
        id = 15
    `);

    if (sorteoResult.rows.length === 0) {
      console.log('No se encontró el sorteo con ID 15');
      return;
    }

    const sorteo = sorteoResult.rows[0];
    console.log('=========================================');
    console.log(`Sorteo: ${sorteo.nombre}`);
    console.log(`Fecha: ${new Date(sorteo.fecha_sorteo).toLocaleString()}`);
    console.log(`Estado: ${sorteo.estado_actual}`);
    console.log('=========================================');

    // Verificar premios en el metadata
    const metadata = sorteo.metadata;
    if (metadata && metadata.premiosNacionales) {
      console.log(`\n📋 Premios definidos en metadata: ${metadata.premiosNacionales.length}`);
      metadata.premiosNacionales.forEach((premio, index) => {
        console.log(`  ${index + 1}. ${premio.nombre}: ${premio.descripcion} (Valor: ${premio.valor})`);
      });
    } else {
      console.log('\n❌ No hay premios definidos en el metadata');
    }

    // Verificar premios en la tabla premios
    const premiosResult = await client.query(`
      SELECT 
        id, 
        nombre, 
        descripcion, 
        valor, 
        orden, 
        categoria_id,
        ambito,
        estado,
        fecha_creacion
      FROM 
        premios 
      WHERE 
        sorteo_id = 15
      ORDER BY
        orden DESC
    `);

    console.log(`\n📋 Premios en la tabla 'premios': ${premiosResult.rows.length}`);
    
    if (premiosResult.rows.length > 0) {
      console.table(premiosResult.rows);
    } else {
      console.log('❌ No hay premios en la tabla de premios para este sorteo');
    }

    // Verificar categorías de premios
    const categoriasResult = await client.query(`
      SELECT 
        id, 
        nombre, 
        descripcion
      FROM 
        categorias_premios
      ORDER BY
        id
    `);

    console.log(`\n📋 Categorías de premios disponibles:`);
    console.table(categoriasResult.rows);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
    console.log('\nConexión cerrada');
  }
}

// Ejecutar verificación
verificarPremios(); 