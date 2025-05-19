const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Configuración de conexión a la base de datos
const dbConfig = {
  user: 'omarte',
  host: 'localhost',
  database: 'sorteo_db',
  password: 'Ap3r1t1v02025',
  port: 5432
};

// Crear una nueva conexión a la base de datos
const pool = new Pool(dbConfig);

async function ejecutar() {
  try {
    console.log('Conectando a la base de datos...');
    
    // Verificar si la función existe
    console.log('Verificando existencia de la función generar_tiques_por_estado...');
    const res = await pool.query(
      "SELECT routine_name FROM information_schema.routines WHERE routine_name = 'generar_tiques_por_estado' AND routine_type = 'FUNCTION'"
    );
    
    console.log('Resultado:', res.rows);
    
    if (res.rows.length === 0) {
      console.log('La función no existe. Creándola...');
      
      // Leer el archivo SQL
      const sqlFilePath = path.join(__dirname, 'generar_tiques_por_estado.sql');
      const sql = fs.readFileSync(sqlFilePath, 'utf8');
      
      // Ejecutar el SQL para crear la función
      await pool.query(sql);
      
      console.log('Función creada correctamente');
    } else {
      console.log('La función ya existe');
    }
    
    // Verificar si existe la tabla re_723
    const tableRes = await pool.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 're_723'"
    );
    
    if (tableRes.rows.length === 0) {
      console.log('La tabla re_723 no existe. Esta tabla es necesaria para la función.');
    } else {
      console.log('La tabla re_723 existe. Todo está correcto.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Cerrar la conexión a la base de datos
    await pool.end();
    console.log('Conexión cerrada');
  }
}

ejecutar(); 