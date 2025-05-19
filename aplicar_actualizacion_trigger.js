const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración correcta de la base de datos
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'sorteo_db',
  user: 'omarte',
  password: 'Ap3r1t1v02025'
});

async function aplicarActualizacion() {
  try {
    await client.connect();
    console.log('Conectado a la base de datos');

    // Leer el archivo SQL
    const sqlFilePath = path.join(__dirname, 'actualizar_validacion_estados.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('Archivo SQL leído correctamente');
    console.log('Aplicando actualización a la base de datos...');
    
    // Ejecutar el script SQL
    await client.query(sqlContent);
    
    console.log('¡Actualización aplicada correctamente!');
    
    // Verificar que la función se actualizó
    const verificacionQuery = `
      SELECT prosrc 
      FROM pg_proc 
      WHERE proname = 'validar_estado_sorteo'
    `;
    
    const result = await client.query(verificacionQuery);
    
    if (result.rows.length > 0) {
      console.log('\nConfirmación - La función actualizada contiene:');
      // Mostrar solo las primeras líneas para confirmar
      const lineas = result.rows[0].prosrc.split('\n').slice(0, 10);
      lineas.forEach(linea => console.log(`  ${linea}`));
      console.log('  ...');
      
      // Verificar que la transición de programado a en_progreso está incluida
      const tieneTransicion = result.rows[0].prosrc.includes("'programado'") && 
                             result.rows[0].prosrc.includes("'en_progreso'");
      
      if (tieneTransicion) {
        console.log('\n✅ La función permite la transición de "programado" a "en_progreso"');
      } else {
        console.log('\n❌ ADVERTENCIA: No se pudo confirmar que la función permite la transición necesaria');
      }
    } else {
      console.log('\n❌ ERROR: No se encontró la función validar_estado_sorteo después de la actualización');
    }

  } catch (error) {
    console.error('Error al aplicar la actualización:', error);
  } finally {
    await client.end();
    console.log('\nConexión cerrada');
  }
}

aplicarActualizacion(); 