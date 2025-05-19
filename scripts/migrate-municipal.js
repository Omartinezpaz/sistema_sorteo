const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración de la conexión
const pool = new Pool({
  user: 'omarte',
  host: 'localhost',
  database: 'sorteo_db',
  password: 'Ap3r1t1v02025',
  port: 5432,
});

async function migrarFuncionDistribuirTickets() {
  const client = await pool.connect();
  
  try {
    console.log('Iniciando migración de la función distribuir_tickets_por_territorio...');
    
    // Leer el archivo SQL con la función
    const sqlFilePath = path.join(__dirname, '../database/migrations/distribuir_tickets_por_territorio.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Ejecutar las instrucciones SQL
    await client.query('BEGIN');
    await client.query(sqlContent);
    await client.query('COMMIT');
    
    console.log('Función distribuir_tickets_por_territorio creada exitosamente.');
    
    // Verificar que la función existe
    const funciones = await client.query(`
      SELECT proname 
      FROM pg_proc 
      WHERE proname = 'distribuir_tickets_por_territorio'
    `);
    
    if (funciones.rows.length > 0) {
      console.log('Función distribuir_tickets_por_territorio verificada.');
    } else {
      console.log('¡Advertencia! No se encontró la función distribuir_tickets_por_territorio.');
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error durante la migración de la función:', error);
  } finally {
    client.release();
  }
}

migrarFuncionDistribuirTickets()
  .then(() => {
    console.log('Proceso de migración finalizado');
    pool.end();
  })
  .catch(err => {
    console.error('Error en el proceso general:', err);
    pool.end();
  }); 