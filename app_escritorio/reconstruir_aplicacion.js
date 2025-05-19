const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

console.log('======= RECONSTRUCCIÓN COMPLETA DE LA APLICACIÓN ELECTRON =======');

// Función para ejecutar comandos con salida bonita
function ejecutar(comando, descripcion) {
  console.log(`\n>> ${descripcion}...`);
  try {
    const resultado = execSync(comando, { encoding: 'utf8', stdio: 'inherit' });
    return { exito: true, resultado };
  } catch (error) {
    console.error(`Error al ejecutar "${comando}":`, error.message);
    return { exito: false, error };
  }
}

// 1. Limpiar caché y archivos temporales
console.log('\n1️⃣ LIMPIANDO CACHÉ Y ARCHIVOS TEMPORALES');

// Directorios a limpiar si existen
const directoriosALimpiar = [
  path.join(__dirname, 'node_modules', '.cache'),
  path.join(__dirname, 'dist'),
  path.join(__dirname, '.temp')
];

// Limpiar directorios
directoriosALimpiar.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`Eliminando: ${dir}`);
    rimraf.sync(dir);
  }
});

// 2. Limpiar caché de Electron y aplicación
console.log('\n2️⃣ LIMPIANDO CACHÉ DE ELECTRON');

// Obtener la ruta de userData de Electron (específico por plataforma)
let electronUserDataPath;
try {
  // Intentar obtener la ruta desde el electron instalado
  const electron = require('electron');
  electronUserDataPath = electron.app ? electron.app.getPath('userData') : null;
} catch (err) {
  // Rutas predeterminadas por plataforma
  const homedir = require('os').homedir();
  if (process.platform === 'win32') {
    electronUserDataPath = path.join(homedir, 'AppData', 'Roaming', 'app_escritorio');
  } else if (process.platform === 'darwin') {
    electronUserDataPath = path.join(homedir, 'Library', 'Application Support', 'app_escritorio');
  } else {
    electronUserDataPath = path.join(homedir, '.config', 'app_escritorio');
  }
}

if (electronUserDataPath && fs.existsSync(electronUserDataPath)) {
  console.log(`Directorio de datos de Electron encontrado: ${electronUserDataPath}`);
  
  // Directorios específicos de caché dentro de userData
  const cacheEspecificos = [
    path.join(electronUserDataPath, 'Cache'),
    path.join(electronUserDataPath, 'Code Cache'),
    path.join(electronUserDataPath, 'GPUCache')
  ];
  
  cacheEspecificos.forEach(cachePath => {
    if (fs.existsSync(cachePath)) {
      console.log(`Eliminando caché: ${cachePath}`);
      rimraf.sync(cachePath);
    }
  });
} else {
  console.log('No se encontró el directorio de datos de Electron');
}

// 3. Verificar el archivo HTML principal
console.log('\n3️⃣ VERIFICANDO ARCHIVO HTML PRINCIPAL');

const archivoHTML = path.join(__dirname, 'public', 'index.html');
if (fs.existsSync(archivoHTML)) {
  console.log('Archivo HTML principal encontrado');
  
  // Leer el contenido actual
  let contenidoHTML = fs.readFileSync(archivoHTML, 'utf8');
  
  // Verificar si contiene el div#root
  if (!contenidoHTML.includes('<div id="root"></div>')) {
    console.log('⚠️ El archivo HTML no contiene el elemento <div id="root"></div>');
    
    // Corregir el HTML
    contenidoHTML = contenidoHTML.replace('<body>', '<body>\n    <div id="root"></div>');
    fs.writeFileSync(archivoHTML, contenidoHTML);
    console.log('✅ Se ha añadido el elemento root al HTML');
  }
  
  // Verificar y corregir la ruta del script
  if (contenidoHTML.includes('../dist/renderer.js')) {
    console.log('⚠️ Ruta incorrecta al script renderer.js');
    contenidoHTML = contenidoHTML.replace('../dist/renderer.js', './dist/renderer.js');
    fs.writeFileSync(archivoHTML, contenidoHTML);
    console.log('✅ Ruta al script renderer.js corregida');
  } else if (!contenidoHTML.includes('./dist/renderer.js')) {
    console.log('⚠️ No se encontró la referencia a renderer.js');
  } else {
    console.log('✅ Ruta al script renderer.js es correcta');
  }
} else {
  console.error(`❌ ERROR: No se encontró el archivo HTML principal: ${archivoHTML}`);
  process.exit(1);
}

// 4. Reconstruir la aplicación
console.log('\n4️⃣ RECONSTRUYENDO LA APLICACIÓN');

// Asegurarse de que el directorio dist existe
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Ejecutar npm install y webpack
ejecutar('npm install', 'Instalando dependencias');
ejecutar('npx webpack --config webpack.config.js', 'Compilando con webpack');

console.log('\n✅ RECONSTRUCCIÓN COMPLETADA');
console.log('\nAhora puedes iniciar la aplicación con:');
console.log('npm start');

// Crear un script para iniciar la aplicación con depuración
const iniciarConDepuracion = `
const { spawn } = require('child_process');
const electron = require('electron');

console.log('Iniciando aplicación con depuración habilitada...');

// Establecer variables de entorno para depuración
process.env.ELECTRON_ENABLE_LOGGING = true;
process.env.ELECTRON_DEBUG = true;
process.env.DEBUG = 'electron:*';
process.env.NODE_ENV = 'development';

// Iniciar Electron con argumentos de depuración
const electronProcess = spawn(electron, ['.'], {
  stdio: 'inherit',
  env: process.env
});

electronProcess.on('close', (code) => {
  console.log(\`Electron se cerró con código: \${code}\`);
});
`;

fs.writeFileSync(path.join(__dirname, 'iniciar_con_depuracion.js'), iniciarConDepuracion);
console.log('\nSe ha creado un script para iniciar con depuración:');
console.log('node iniciar_con_depuracion.js'); 