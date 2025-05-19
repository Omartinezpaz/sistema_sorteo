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

async function corregirTrigger() {
  const client = await pool.connect();
  
  try {
    console.log('Iniciando corrección del trigger de timestamp...');
    
    // Leer el archivo SQL
    const sqlFilePath = path.join(__dirname, '../migrations/corregir_trigger_timestamp.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Ejecutar las instrucciones SQL
    await client.query('BEGIN');
    await client.query(sqlContent);
    await client.query('COMMIT');
    
    console.log('Corrección del trigger completada exitosamente.');
    
    // Verificar que no queden triggers problemáticos
    const triggers = await client.query(`
      SELECT tgname, relname 
      FROM pg_trigger t 
      JOIN pg_class c ON t.tgrelid = c.oid 
      WHERE tgname LIKE '%timestamp%'
    `);
    
    if (triggers.rows.length > 0) {
      console.log('Triggers relacionados con timestamp restantes:');
      triggers.rows.forEach(row => {
        console.log(`- ${row.tgname} en tabla ${row.relname}`);
      });
    } else {
      console.log('No quedan triggers relacionados con timestamp.');
    }
    
    // Verificar la función actualizar_fecha_actualizacion
    const funciones = await client.query(`
      SELECT proname 
      FROM pg_proc 
      WHERE proname = 'actualizar_fecha_actualizacion'
    `);
    
    if (funciones.rows.length > 0) {
      console.log('Función actualizar_fecha_actualizacion creada correctamente.');
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error durante la corrección del trigger:', error);
  } finally {
    client.release();
  }
}

corregirTrigger()
  .then(() => {
    console.log('Proceso de corrección finalizado');
    pool.end();
  })
  .catch(err => {
    console.error('Error en el proceso general:', err);
    pool.end();
  }); 