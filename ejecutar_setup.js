const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Configuración de conexión
const config = {
  user: 'omarte',
  host: 'localhost',
  database: 'sorteo_db', 
  password: 'Ap3r1t1v02025',
  port: 5432,
};

// Crear un pool de conexiones
const pool = new Pool(config);

async function ejecutarScript() {
  try {
    console.log('Conectando a la base de datos...');
    const client = await pool.connect();
    
    try {
      console.log('Ejecutando script de verificación...');
      
      // Verificar si existe la tabla
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'distribucion_tiques'
        ) AS tabla_existe;
      `);
      
      console.log(`¿Existe la tabla distribucion_tiques? ${tableCheck.rows[0].tabla_existe}`);
      
      // Verificar si existe la función
      const funcCheck = await client.query(`
        SELECT proname, pg_get_function_result(oid) AS retorno
        FROM pg_proc 
        WHERE proname = 'generar_tiques_desde_distribucion' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
      `);
      
      if (funcCheck.rows.length > 0) {
        console.log(`La función existe con firma de retorno: ${funcCheck.rows[0].retorno}`);
        
        // Si la función existe pero no tiene el parámetro 'progreso', la eliminamos primero
        if (!funcCheck.rows[0].retorno.includes('progreso')) {
          console.log('La función existente no tiene el parámetro de progreso. Eliminando...');
          await client.query(`DROP FUNCTION IF EXISTS generar_tiques_desde_distribucion(INTEGER, VARCHAR, VARCHAR, TIMESTAMP);`);
          console.log('Función eliminada correctamente.');
        }
      } else {
        console.log('La función no existe y debe ser creada.');
      }
      
      // Leer el contenido del script fix_distribucion_tiques.sql
      const scriptPath = path.join(__dirname, 'scripts', 'fix_distribucion_tiques.sql');
      const scriptSQL = fs.readFileSync(scriptPath, 'utf8');
      
      console.log('Ejecutando script de corrección...');
      await client.query(scriptSQL);
      console.log('Script ejecutado correctamente.');
      
      // Verificar que la función se haya creado correctamente
      const funcCheckAfter = await client.query(`
        SELECT proname, pg_get_function_result(oid) AS retorno
        FROM pg_proc 
        WHERE proname = 'generar_tiques_desde_distribucion' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
      `);
      
      if (funcCheckAfter.rows.length > 0) {
        console.log(`Función creada correctamente con firma de retorno: ${funcCheckAfter.rows[0].retorno}`);
        console.log('Solución aplicada exitosamente.');
      } else {
        console.log('Error: La función no se creó correctamente.');
      }
      
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error al ejecutar el script:', err);
  } finally {
    pool.end();
  }
}

ejecutarScript(); 