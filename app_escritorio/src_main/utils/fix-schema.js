const { query, config } = require('../database/connection');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

/**
 * Repara el esquema de la base de datos usando el script SQL
 * @returns {Promise<Object>} Resultado de la reparación
 */
async function fixDatabaseSchema() {
  return new Promise((resolve, reject) => {
    try {
      console.log('Iniciando reparación del esquema de la base de datos...');
      
      // Ruta al script SQL (2 posibles ubicaciones)
      const scriptPaths = [
        path.join(process.cwd(), 'scripts', 'fix-schema.sql'),
        path.join(__dirname, '..', '..', '..', 'scripts', 'fix-schema.sql')
      ];
      
      // Encontrar script existente
      let scriptPath = null;
      for (const path of scriptPaths) {
        if (fs.existsSync(path)) {
          scriptPath = path;
          break;
        }
      }
      
      if (!scriptPath) {
        reject(new Error('Script de reparación SQL no encontrado'));
        return;
      }
      
      console.log('Script SQL encontrado en:', scriptPath);
      
      // Leer contenido del script
      const sqlScript = fs.readFileSync(scriptPath, 'utf8');
      
      // La mejor opción es ejecutar directo con query en lugar de psql
      console.log('Ejecutando script de reparación...');
      
      query(sqlScript)
        .then(result => {
          console.log('Script de reparación ejecutado correctamente');
          resolve({
            success: true,
            message: 'Esquema de base de datos reparado correctamente'
          });
        })
        .catch(error => {
          console.error('Error al ejecutar script SQL:', error);
          reject(new Error(`Error al reparar esquema: ${error.message}`));
        });
    } catch (error) {
      console.error('Error al intentar reparar esquema:', error);
      reject(new Error(`Error al intentar reparar esquema: ${error.message}`));
    }
  });
}

// Si se ejecuta directamente
if (require.main === module) {
  fixDatabaseSchema()
    .then(result => {
      console.log('✅ Resultado:', result.message);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error:', error.message);
      process.exit(1);
    });
}

module.exports = { fixDatabaseSchema }; 