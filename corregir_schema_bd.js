/**
 * Script para corregir problemas en el esquema de la base de datos
 * - Agrega columna metadata a la tabla premios
 * - Agrega columna fecha_creacion a la tabla participantes
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuración de la conexión a PostgreSQL desde .env
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// Consultas SQL para corregir el esquema
const queries = [
  // Agregar columna metadata a la tabla premios (si no existe)
  `ALTER TABLE IF EXISTS premios 
   ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;`,
  
  // Agregar columna fecha_creacion a la tabla participantes (si no existe)
  `ALTER TABLE IF EXISTS participantes 
   ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`,
   
  // Actualizar la columna fecha_creacion para registros existentes
  `UPDATE participantes 
   SET fecha_creacion = CURRENT_TIMESTAMP 
   WHERE fecha_creacion IS NULL;`
];

async function corregirEsquema() {
  const client = await pool.connect();
  
  try {
    // Iniciar una transacción
    await client.query('BEGIN');
    
    console.log('Iniciando corrección del esquema de la base de datos...');
    
    // Ejecutar cada consulta SQL
    for (const query of queries) {
      console.log(`Ejecutando: ${query.split('\n')[0]}...`);
      await client.query(query);
    }
    
    // Confirmar los cambios
    await client.query('COMMIT');
    console.log('¡Esquema corregido exitosamente!');
    
    // Guardar un registro de la corrección
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const logContent = `
// Corrección aplicada: ${new Date().toLocaleString()}
${queries.join('\n\n')}
    `;
    
    const logDir = path.join(__dirname, 'database', 'migrations', 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(logDir, `correccion_esquema_${timestamp}.sql`), 
      logContent,
      'utf8'
    );
    
    console.log(`Log de corrección guardado en database/migrations/logs/correccion_esquema_${timestamp}.sql`);
    
  } catch (error) {
    // En caso de error, revertir los cambios
    await client.query('ROLLBACK');
    console.error('Error al corregir el esquema:', error);
  } finally {
    // Liberar el cliente
    client.release();
    
    // Cerrar el pool
    await pool.end();
  }
}

// Ejecutar corrección
corregirEsquema()
  .then(() => {
    console.log('Proceso completado');
  })
  .catch(err => {
    console.error('Error en el proceso:', err);
    process.exit(1);
  }); 