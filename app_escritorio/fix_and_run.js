const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('======= REPARAR Y EJECUTAR APLICACIÓN =======');

// 1. Verificar estructura de carpetas
console.log('\nPaso 1: Verificando estructura de carpetas...');
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  console.log('Creando directorio dist...');
  fs.mkdirSync(distDir, { recursive: true });
}

// 2. Comprobar archivo index.html
console.log('\nPaso 2: Verificando index.html...');
const indexPath = path.join(__dirname, 'public', 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');
if (indexContent.includes('../dist/renderer.js')) {
  console.log('Corrigiendo ruta al archivo renderer.js...');
  indexContent = indexContent.replace('../dist/renderer.js', './dist/renderer.js');
  fs.writeFileSync(indexPath, indexContent);
  console.log('index.html corregido.');
} else {
  console.log('index.html parece correcto.');
}

// 3. Reconstruir la aplicación
console.log('\nPaso 3: Reconstruyendo aplicación...');
try {
  // Compilar frontend
  console.log('Compilando frontend...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Compilación completada.');
} catch (error) {
  console.error('Error al compilar:', error.message);
  process.exit(1);
}

// 4. Iniciar la aplicación
console.log('\nPaso 4: Iniciando aplicación...');
try {
  execSync('npm start', { stdio: 'inherit' });
} catch (error) {
  console.error('Error al iniciar la aplicación:', error.message);
}

console.log('======= PROCESO COMPLETADO ======='); 