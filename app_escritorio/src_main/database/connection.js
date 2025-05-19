const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Detectar si estamos en Electron o en Node.js puro
const isElectron = process.versions && process.versions.electron;

// Función para obtener rutas según el entorno
function getPaths() {
  if (isElectron) {
    // En Electron, usar la API app
    const { app } = require('electron');
    return {
      userData: app.getPath('userData'),
      temp: app.getPath('temp')
    };
  } else {
    // En Node.js puro, usar alternativas
    return {
      userData: path.join(os.homedir(), '.sorteo_pueblo_valiente'),
      temp: path.join(os.tmpdir(), 'sorteo_pueblo_valiente')
    };
  }
}

// Obtener rutas
const paths = getPaths();

// Directorio para almacenar configuración
const configDir = path.join(paths.userData, 'config');

// Asegurar que el directorio existe
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

// Archivo de configuración de BD
const dbConfigPath = path.join(configDir, 'database.json');

// Configuración por defecto
const defaultConfig = {
  user: 'omarte',
  host: 'localhost',
  database: 'sorteo_db',
  password: 'Ap3r1t1v02025',
  port: 5432,
  max: 20, // máximo de conexiones en el pool
  idleTimeoutMillis: 30000, // tiempo máximo que una conexión puede estar inactiva antes de ser cerrada
  connectionTimeoutMillis: 2000, // tiempo de espera para establecer conexión
};

// Cargar configuración o usar valores por defecto
let dbConfig;
try {
  if (fs.existsSync(dbConfigPath)) {
    const configFile = fs.readFileSync(dbConfigPath, 'utf8');
    dbConfig = JSON.parse(configFile);
    console.log('Configuración de base de datos cargada desde:', dbConfigPath);
  } else {
    dbConfig = defaultConfig;
    // Guardar configuración por defecto
    fs.writeFileSync(dbConfigPath, JSON.stringify(defaultConfig, null, 2));
    console.log('Configuración por defecto creada en:', dbConfigPath);
  }
} catch (error) {
  console.error('Error al cargar configuración de BD:', error);
  dbConfig = defaultConfig;
}

// Crear pool de conexiones
const pool = new Pool(dbConfig);

// Evento para cuando se crea una conexión
pool.on('connect', (client) => {
  console.log('Nueva conexión a PostgreSQL establecida');
});

// Evento para cuando hay un error en una conexión
pool.on('error', (err, client) => {
  console.error('Error inesperado en el cliente de PostgreSQL:', err);
});

/**
 * Verifica la conexión a la base de datos
 * @returns {Promise<boolean>} true si la conexión es exitosa, false en caso contrario
 */
async function testConnection() {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('Conexión a PostgreSQL exitosa:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Error al conectar a PostgreSQL:', error);
    return false;
  } finally {
    if (client) client.release();
  }
}

/**
 * Actualiza la configuración de la base de datos
 * @param {Object} newConfig - Nueva configuración
 * @returns {Promise<boolean>} true si se actualizó correctamente
 */
async function updateConfig(newConfig) {
  try {
    // Combinar con configuración actual
    const updatedConfig = { ...dbConfig, ...newConfig };
    
    // Guardar en archivo
    fs.writeFileSync(dbConfigPath, JSON.stringify(updatedConfig, null, 2));
    
    // Reiniciar el pool con la nueva configuración
    await pool.end();
    
    // Actualizar configuración en memoria
    Object.assign(dbConfig, newConfig);
    
    // Crear nuevo pool
    Object.assign(pool, new Pool(dbConfig));
    
    console.log('Configuración de base de datos actualizada');
    return true;
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    return false;
  }
}

/**
 * Ejecuta una consulta en la base de datos
 * @param {string} text - Consulta SQL
 * @param {Array} params - Parámetros para la consulta
 * @returns {Promise<Object>} Resultado de la consulta
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Consulta ejecutada', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error en consulta:', error);
    throw error;
  }
}

/**
 * Obtiene un cliente del pool para transacciones
 * @returns {Promise<Object>} Cliente de PostgreSQL
 */
async function getClient() {
  const client = await pool.connect();
  const originalQuery = client.query;
  const release = client.release;
  
  // Sobrescribir query para añadir logs
  client.query = (...args) => {
    console.log('Consulta en transacción:', args[0]);
    return originalQuery.apply(client, args);
  };
  
  // Sobrescribir release para evitar liberación doble
  client.release = () => {
    client.query = originalQuery;
    client.release = release;
    return release.apply(client);
  };
  
  return client;
}

module.exports = {
  query,
  getClient,
  testConnection,
  updateConfig,
  pool,
  config: dbConfig,
  paths
};
