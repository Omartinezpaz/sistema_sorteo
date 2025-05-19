const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const electron = require('electron');

// Obtener directorio de configuración
const userDataPath = (electron.app || electron.remote.app).getPath('userData');
const configDir = path.join(userDataPath, 'config');
const configFile = path.join(configDir, 'database.json');

// Asegurar que el directorio de configuración exista
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

// Configuración por defecto
let dbConfig = {
  user: 'omarte',
  host: 'localhost',
  database: 'sorteo_db',
  password: 'Ap3r1t1v02025',
  port: 5432
};

// Cargar configuración desde archivo si existe
if (fs.existsSync(configFile)) {
  try {
    console.log(`Configuración de base de datos cargada desde: ${configFile}`);
    const fileContent = fs.readFileSync(configFile, 'utf8');
    const savedConfig = JSON.parse(fileContent);
    dbConfig = { ...dbConfig, ...savedConfig };
  } catch (error) {
    console.error('Error al leer la configuración de la base de datos:', error);
  }
}

// Crear un pool de conexiones
const pool = new Pool(dbConfig);

// Función para ejecutar consultas
async function query(text, params = []) {
  try {
    const start = Date.now();
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (duration > 500) {
      console.log('Consulta lenta:', { text, duration, rows: result.rowCount });
    }
    
    return result;
  } catch (error) {
    // Verificar si es el error específico del trigger de timestamp
    if (error.code === '42703' && 
        error.message.includes('el registro «new» no tiene un campo «updated_at»') && 
        error.where && error.where.includes('actualizar_timestamps()')) {
      
      console.log('Error de actualizar_timestamps() detectado, intentando arreglar el problema...');
      
      try {
        // Eliminar el trigger problemático de la tabla específica
        let tableName = null;
        
        // Intentar extraer el nombre de la tabla del SQL original
        const sqlLower = text.toLowerCase();
        if (sqlLower.includes('update ')) {
          const match = sqlLower.match(/update\s+(\w+)/i);
          if (match && match[1]) {
            tableName = match[1];
          }
        } else if (sqlLower.includes('insert into ')) {
          const match = sqlLower.match(/insert\s+into\s+(\w+)/i);
          if (match && match[1]) {
            tableName = match[1];
          }
        }
        
        if (tableName) {
          console.log(`Intentando eliminar trigger problemático de la tabla ${tableName}...`);
          
          // Eliminar el trigger específico de esta tabla
          await pool.query(`DROP TRIGGER IF EXISTS actualizar_timestamps_trigger ON ${tableName};`);
          
          // Volver a intentar la consulta original
          const result = await pool.query(text, params);
          console.log(`Consulta reintentada con éxito después de eliminar el trigger.`);
          return result;
        }
      } catch (fixError) {
        console.error('Error al intentar arreglar el problema del trigger:', fixError);
      }
    }
    
    console.error('Error en consulta a BD:', error);
    throw error;
  }
}

// Función para obtener un cliente de conexión (para transacciones)
async function getClient() {
  const client = await pool.connect();
  const originalQuery = client.query;
  
  // Sobrescribir el método query para añadir logging
  client.query = async (text, params = []) => {
    try {
      const start = Date.now();
      const result = await originalQuery.apply(client, [text, params]);
      const duration = Date.now() - start;
      
      if (duration > 500) {
        console.log('Consulta lenta (transacción):', { text, duration, rows: result.rowCount });
      }
      
      return result;
    } catch (error) {
      console.error('Error en consulta a BD (transacción):', error);
      throw error;
    }
  };
  
  // Añadir función para ejecutar transacción
  client.transaction = async (callback) => {
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  };
  
  return client;
}

// Exportar funciones y pool
module.exports = {
  query,
  getClient,
  pool
}; 