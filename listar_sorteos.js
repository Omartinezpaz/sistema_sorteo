/**
 * Script para listar los sorteos existentes en la base de datos
 */

const { Pool } = require('pg');
require('dotenv').config();

// Configuración de conexión
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function listarSorteos() {
  try {
    console.log('Consultando sorteos disponibles...');
    
    const result = await pool.query(`
      SELECT id, nombre, tipo_sorteo, fecha_sorteo, estado_actual, 
             fecha_creacion, ultimo_acceso
      FROM sorteos 
      ORDER BY fecha_creacion DESC 
      LIMIT 10
    `);
    
    if (result.rows.length === 0) {
      console.log('No hay sorteos disponibles en la base de datos.');
      return;
    }
    
    console.log('\nSorteos disponibles:');
    console.log('====================\n');
    
    result.rows.forEach(sorteo => {
      console.log(`ID: ${sorteo.id}`);
      console.log(`Nombre: ${sorteo.nombre}`);
      console.log(`Tipo: ${sorteo.tipo_sorteo}`);
      console.log(`Estado: ${sorteo.estado_actual}`);
      console.log(`Fecha programada: ${new Date(sorteo.fecha_sorteo).toLocaleString()}`);
      console.log(`Creado: ${new Date(sorteo.fecha_creacion).toLocaleString()}`);
      console.log('--------------------');
    });
    
    // Contar participantes por sorteo
    console.log('\nParticipantes por sorteo:');
    console.log('=======================\n');
    
    for (const sorteo of result.rows) {
      const participantesResult = await pool.query(
        'SELECT COUNT(*) FROM participantes WHERE sorteo_id = $1',
        [sorteo.id]
      );
      
      const participantesValidadosResult = await pool.query(
        'SELECT COUNT(*) FROM participantes WHERE sorteo_id = $1 AND validado = true',
        [sorteo.id]
      );
      
      console.log(`Sorteo ID ${sorteo.id} - ${sorteo.nombre}:`);
      console.log(`  Total participantes: ${participantesResult.rows[0].count}`);
      console.log(`  Participantes validados: ${participantesValidadosResult.rows[0].count}`);
      console.log('--------------------');
    }
    
  } catch (error) {
    console.error('Error al consultar sorteos:', error);
  } finally {
    await pool.end();
  }
}

// Ejecutar función principal
listarSorteos()
  .then(() => {
    console.log('Consulta finalizada');
  })
  .catch(err => {
    console.error('Error en la consulta:', err);
    process.exit(1);
  }); 