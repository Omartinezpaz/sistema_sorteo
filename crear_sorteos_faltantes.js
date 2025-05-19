/**
 * Script para crear los sorteos faltantes (IDs 27 y 28) necesarios para la distribución de tiques
 * 
 * Este script verifica si los sorteos con IDs 27 y 28 existen en la base de datos,
 * y los crea si no existen, antes de configurar la distribución de tiques.
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

// Función para verificar si un sorteo existe
async function verificarSorteoExiste(id) {
  try {
    const result = await client.query(
      'SELECT COUNT(*) as total FROM sorteos WHERE id = $1',
      [id]
    );
    return parseInt(result.rows[0].total) > 0;
  } catch (error) {
    console.error(`Error al verificar si existe el sorteo ${id}:`, error);
    return false;
  }
}

// Función para crear un sorteo si no existe
async function crearSorteoSiNoExiste(id, nombre) {
  try {
    const existe = await verificarSorteoExiste(id);
    
    if (existe) {
      console.log(`El sorteo con ID ${id} ya existe ✅`);
      return true;
    }
    
    // Crear el sorteo con los datos mínimos necesarios
    const result = await client.query(
      `INSERT INTO sorteos (
        id, nombre, descripcion, estado, fecha_sorteo, fecha_creacion, 
        creado_por, metadata
      ) VALUES (
        $1, $2, $3, $4, $5, CURRENT_TIMESTAMP, 
        $6, $7::jsonb
      ) RETURNING id`,
      [
        id,
        nombre,
        `Sorteo para pruebas de generación de tiques (ID ${id})`,
        'configuracion', // Estado inicial
        new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // 7 días a partir de hoy
        1, // ID del usuario
        JSON.stringify({
          created_via: 'script',
          is_test: true,
          auto_created: true
        })
      ]
    );
    
    if (result.rowCount > 0) {
      console.log(`✅ Sorteo con ID ${id} creado exitosamente`);
      return true;
    } else {
      console.log(`❌ No se pudo crear el sorteo con ID ${id}`);
      return false;
    }
  } catch (error) {
    console.error(`Error al crear el sorteo ${id}:`, error);
    return false;
  }
}

// Función principal
async function main() {
  console.log('Iniciando creación de sorteos faltantes para la distribución de tiques...');
  
  try {
    // Conectar a la base de datos
    console.log('Conectando a la base de datos...');
    await client.connect();
    console.log('Conexión establecida correctamente ✅');
    
    // Verificar y crear los sorteos necesarios
    console.log('Verificando sorteos necesarios...');
    
    // Verificar y crear el sorteo 27
    const sorteo27Creado = await crearSorteoSiNoExiste(27, 'Sorteo Prueba ID 27');
    
    // Verificar y crear el sorteo 28
    const sorteo28Creado = await crearSorteoSiNoExiste(28, 'Sorteo Prueba ID 28');
    
    // Proporcionar instrucciones sobre los próximos pasos
    if (sorteo27Creado || sorteo28Creado) {
      console.log('\n🔄 Próximos pasos:');
      console.log('1. Ahora puedes ejecutar el script "ejecutar_script.js" para configurar la distribución de tiques');
      console.log('2. Selecciona el sorteo para el que quieres generar tiques (27 o 28)');
      console.log('3. La distribución se configurará automáticamente');
    } else {
      console.log('\n✅ Los sorteos ya existían. Puedes proceder con el script "ejecutar_script.js".');
    }
    
    // Cerrar la conexión a la base de datos
    await client.end();
    console.log('Conexión a la base de datos cerrada.');
  } catch (error) {
    console.error('Error durante la ejecución del script:', error);
    try {
      await client.end();
    } catch (err) {}
  }
}

// Ejecutar la función principal
main().catch(console.error); 