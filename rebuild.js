const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

console.log(`${colors.bright}${colors.blue}=== RECONSTRUCCIÓN COMPLETA DE LA APLICACIÓN ===${colors.reset}`);

// 1. Limpiar caché y archivos temporales
console.log(`\n${colors.yellow}Paso 1: Limpiando caché y archivos temporales...${colors.reset}`);

// Directorios a limpiar si existen
const dirsToClean = [
  path.join(__dirname, 'app_escritorio', 'node_modules', '.cache'),
  path.join(__dirname, 'app_escritorio', 'dist')
];

// Verificar y limpiar directorios
dirsToClean.forEach(dir => {
  try {
    if (fs.existsSync(dir)) {
      console.log(`Eliminando directorio: ${dir}`);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  } catch (err) {
    console.error(`Error al eliminar ${dir}:`, err.message);
  }
});

// 2. Corregir los triggers en la base de datos
console.log(`\n${colors.yellow}Paso 2: Corrigiendo los triggers en la base de datos...${colors.reset}`);
try {
  console.log('Ejecutando corrección de triggers...');
  execSync('node corregir_triggers_directo.js', { stdio: 'inherit' });
  console.log(`${colors.green}Corrección de triggers completada${colors.reset}`);
} catch (err) {
  console.error(`${colors.red}Error al corregir triggers:${colors.reset}`, err.message);
}

// 3. Reconstruir el frontend
console.log(`\n${colors.yellow}Paso 3: Reconstruyendo el frontend...${colors.reset}`);
try {
  console.log('Cambiando al directorio de la aplicación...');
  process.chdir(path.join(__dirname, 'app_escritorio'));
  console.log(`Directorio actual: ${process.cwd()}`);
  
  console.log('Limpiando caché de npm...');
  execSync('npm cache clean --force', { stdio: 'inherit' });
  
  console.log('Instalando dependencias...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('Compilando frontend...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log(`${colors.green}Reconstrucción del frontend completada${colors.reset}`);
} catch (err) {
  console.error(`${colors.red}Error al reconstruir el frontend:${colors.reset}`, err.message);
}

// 4. Iniciar la aplicación
console.log(`\n${colors.yellow}Paso 4: Iniciando la aplicación...${colors.reset}`);
console.log(`${colors.green}Todo listo. Para iniciar la aplicación, ejecuta:${colors.reset}`);
console.log(`${colors.bright}cd app_escritorio && npm start${colors.reset}`);

console.log(`\n${colors.bright}${colors.blue}=== PROCESO DE RECONSTRUCCIÓN COMPLETADO ===${colors.reset}`); 