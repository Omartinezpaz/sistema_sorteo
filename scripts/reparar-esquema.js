const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { config } = require('../app_escritorio/src_main/database/connection');

// Ruta al script SQL de reparación
const scriptPath = path.join(__dirname, 'fix-schema.sql');

// Verificar que el script existe
if (!fs.existsSync(scriptPath)) {
  console.error('Error: Script de reparación no encontrado en:', scriptPath);
  process.exit(1);
}

// Comando para ejecutar el script con PSQL
const psqlCommand = 'psql';
const psqlArgs = [
  '-U', config.user,
  '-h', config.host,
  '-p', String(config.port),
  '-d', config.database,
  '-f', scriptPath
];

console.log('Ejecutando reparación de esquema de base de datos...');
console.log(`Comando: ${psqlCommand} ${psqlArgs.join(' ')}`);

// Ejecutar PSQL
const psql = spawn(psqlCommand, psqlArgs, {
  stdio: 'inherit', // Mostrar salida en la consola
  shell: true // Necesario en Windows
});

// Manejar finalización del proceso
psql.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Reparación de esquema completada con éxito');
    console.log('Ahora puede ejecutar nuevamente la verificación previa al sorteo');
  } else {
    console.error(`\n❌ Error al reparar esquema (código: ${code})`);
    console.error('Verifique que PostgreSQL esté instalado y accesible, y que las credenciales sean correctas');
  }
  
  process.exit(code);
}); 