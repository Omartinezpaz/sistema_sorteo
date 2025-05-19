/**
 * Script simple para verificar la conexión a la base de datos
 */

const { Client } = require('pg');

// Configuración de la conexión a la base de datos
const dbConfig = {
  user: 'omarte',
  host: 'localhost',
  database: 'sorteo_db',
  password: 'Ap3r1t1v02025',
  port: 5432,
};

// Cliente de base de datos
const client = new Client(dbConfig);

async function main() {
  console.log('Iniciando prueba de conexión a la base de datos...');
  
  try {
    // Conectar a la base de datos
    console.log('Conectando a la base de datos...');
    await client.connect();
    console.log('Conexión establecida correctamente ✅');
    
    // Ejecutar una consulta básica
    console.log('Ejecutando consulta...');
    const result = await client.query('SELECT current_database() AS db, current_user AS usuario');
    console.log('Resultado de la consulta:', result.rows[0]);
    
    // Cerrar la conexión a la base de datos
    await client.end();
    console.log('Conexión a la base de datos cerrada.');
    
  } catch (error) {
    console.error('Error durante la ejecución del script:', error);
    try {
      await client.end();
    } catch (err) {
      console.error('Error al cerrar la conexión:', err);
    }
  }
}

// Ejecutar la función principal
main().catch(console.error); 