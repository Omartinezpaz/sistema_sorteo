const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Función para limpiar la caché
function limpiarCache() {
  console.log('Limpiando caché...');
  
  // Obtener ruta del directorio de caché
  const userDataPath = app.getPath('userData');
  console.log('Ruta de datos de usuario:', userDataPath);
  
  // Ruta de la caché
  const cachePath = path.join(userDataPath, 'Cache');
  const codeCache = path.join(userDataPath, 'Code Cache');
  
  // Limpiar directorios de caché si existen
  if (fs.existsSync(cachePath)) {
    console.log('Eliminando directorio de caché:', cachePath);
    try {
      fs.rmSync(cachePath, { recursive: true });
      console.log('Caché eliminada correctamente');
    } catch (err) {
      console.error('Error al eliminar caché:', err);
    }
  }
  
  if (fs.existsSync(codeCache)) {
    console.log('Eliminando directorio de caché de código:', codeCache);
    try {
      fs.rmSync(codeCache, { recursive: true });
      console.log('Caché de código eliminada correctamente');
    } catch (err) {
      console.error('Error al eliminar caché de código:', err);
    }
  }
}

// Inicializar y limpiar caché cuando la app esté lista
app.whenReady().then(() => {
  limpiarCache();
  
  // Iniciar la aplicación principal
  console.log('Iniciando aplicación principal...');
  try {
    // Activar las correcciones de triggers inmediatamente
    setTimeout(async () => {
      try {
        // Importar la función desde main.js
        const { corregirTriggerTimestamp } = require('./src_main/main.js');
        
        // Ejecutar corrección
        console.log('Ejecutando corrección de triggers...');
        const resultado = await corregirTriggerTimestamp();
        console.log('Resultado de corrección:', resultado);
      } catch (err) {
        console.error('Error al ejecutar corrección:', err);
      }
    }, 2000);
    
    // Crear ventana
    const mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'src_main/preload.js')
      },
      show: false // No mostrar hasta que esté lista
    });
    
    // Mostrar ventana cuando esté lista
    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
    });
    
    // Cargar interfaz
    mainWindow.loadFile(path.join(__dirname, 'public/index.html'));
    
    // Abrir herramientas de desarrollo
    mainWindow.webContents.openDevTools();
  } catch (err) {
    console.error('Error al iniciar aplicación:', err);
  }
});

// Salir cuando todas las ventanas estén cerradas
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Manejar reactivación en macOS
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
}); 