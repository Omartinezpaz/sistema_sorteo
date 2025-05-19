/**
 * Script para aplicar manualmente la migración que corrige los triggers de timestamp
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'pueblo_valiente',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || ''
};

console.log('Configuración de la base de datos:');
console.log(`Host: ${dbConfig.host}`);
console.log(`Puerto: ${dbConfig.port}`);
console.log(`Base de datos: ${dbConfig.database}`);
console.log(`Usuario: ${dbConfig.user}`);

async function aplicarMigracion() {
  const client = new Client(dbConfig);
  
  try {
    // Conectar a la base de datos
    await client.connect();
    console.log('Conexión exitosa a la base de datos');
    
    // Leer el archivo de migración
    const rutaMigracion = path.join(__dirname, '..', 'database', 'migrations', 'corregir_trigger_timestamp.sql');
    console.log(`Leyendo archivo de migración: ${rutaMigracion}`);
    
    const sqlMigracion = fs.readFileSync(rutaMigracion, 'utf8');
    console.log('Archivo de migración leído correctamente');
    
    // Ejecutar la migración
    console.log('Aplicando migración...');
    await client.query(sqlMigracion);
    
    console.log('Migración aplicada correctamente');
  } catch (error) {
    console.error('Error al aplicar la migración:', error);
  } finally {
    // Cerrar la conexión
    await client.end();
    console.log('Conexión cerrada');
  }
}

// Ejecutar la función
aplicarMigracion(); 