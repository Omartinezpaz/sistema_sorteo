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

async function ejecutarMigracion() {
  const client = await pool.connect();
  
  try {
    console.log('Iniciando migración de municipios y parroquias...');
    
    // Leer el archivo SQL
    const sqlFilePath = path.join(__dirname, '../migrations/municipios_parroquias.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Ejecutar las instrucciones SQL
    await client.query('BEGIN');
    await client.query(sqlContent);
    await client.query('COMMIT');
    
    console.log('Migración completada exitosamente.');
    
    // Verificar la creación de tablas
    const tablas = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('municipios', 'parroquias')
    `);
    
    console.log(`Tablas creadas: ${tablas.rows.map(row => row.table_name).join(', ')}`);
    
    // Verificar la creación de la función
    const funciones = await client.query(`
      SELECT proname 
      FROM pg_proc 
      WHERE proname = 'distribuir_tickets_por_territorio'
    `);
    
    console.log(`Funciones creadas: ${funciones.rows.map(row => row.proname).join(', ')}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error durante la migración:', error);
  } finally {
    client.release();
  }
}

ejecutarMigracion()
  .then(() => {
    console.log('Proceso de migración finalizado');
    pool.end();
  })
  .catch(err => {
    console.error('Error en el proceso general:', err);
    pool.end();
  }); 