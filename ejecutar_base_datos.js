const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración de conexión a la base de datos (ajustar según sea necesario)
const config = {
  user: 'omarte',
  host: 'localhost',
  database: 'sorteo_db',
  password: 'Ap3r1t1v02025', 
  port: 5432
};

async function recrearBaseDatos() {
  console.log('========================================');
  console.log('RECONSTRUCCIÓN COMPLETA DE LA BASE DE DATOS');
  console.log('========================================');
  console.log(`Conectando a: ${config.host}:${config.port}/${config.database} como ${config.user}`);
  
  // Crear cliente PostgreSQL
  const cliente = new Client(config);
  
  try {
    // Conectar a la base de datos
    await cliente.connect();
    console.log('✅ Conexión establecida correctamente');
    
    // Leer el archivo SQL completo
    const scriptPath = path.join(__dirname, 'scripts', 'base_datos.sql');
    console.log(`Leyendo archivo SQL desde: ${scriptPath}`);
    
    const sqlScript = fs.readFileSync(scriptPath, 'utf8');
    console.log(`✅ Archivo SQL leído correctamente (${sqlScript.length} caracteres)`);
    
    // Ejecutar el script SQL completo
    console.log('Ejecutando script SQL...');
    await cliente.query(sqlScript);
    
    console.log('✅ ¡BASE DE DATOS RECONSTRUIDA CON ÉXITO!');
    console.log('El script SQL ha sido ejecutado completamente.');
    console.log('Ahora puedes iniciar la aplicación y debería funcionar correctamente.');
  } catch (error) {
    console.error('❌ ERROR al reconstruir la base de datos:', error);
    console.log('Detalles del error:');
    console.log('- Mensaje:', error.message);
    if (error.position) console.log('- Posición en el SQL:', error.position);
    if (error.line) console.log('- Línea:', error.line);
    
    console.log('\nSugerencias:');
    console.log('1. Verifica que PostgreSQL esté en ejecución');
    console.log('2. Confirma que las credenciales de conexión sean correctas');
    console.log('3. Asegúrate de tener permisos para ejecutar todas las operaciones en la base de datos');
  } finally {
    // Cerrar la conexión
    try {
      await cliente.end();
      console.log('Conexión cerrada');
    } catch (err) {
      console.error('Error al cerrar conexión:', err);
    }
    
    console.log('========================================');
  }
}

// Ejecutar la función principal
recrearBaseDatos(); 