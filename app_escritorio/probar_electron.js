const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

console.log('=============================');
console.log('INICIANDO PRUEBA DE ELECTRON');
console.log('=============================');

let ventana;

function crearVentanaDeTest() {
  console.log('Creando ventana de prueba...');
  
  // Crear ventana Electron
  ventana = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    title: 'PRUEBA DE RENDERIZADO ELECTRON'
  });
  
  // Cargar la página HTML de prueba
  const rutaHTML = path.join(__dirname, 'public', 'test_login.html');
  console.log('Cargando HTML de prueba:', rutaHTML);
  
  const urlHTML = url.format({
    pathname: rutaHTML,
    protocol: 'file:',
    slashes: true
  });
  
  ventana.loadURL(urlHTML);
  
  // Abrir las herramientas de desarrollo
  ventana.webContents.openDevTools();
  
  // Verificar cuando la página termine de cargar
  ventana.webContents.on('did-finish-load', () => {
    console.log('✅ Página cargada correctamente');
    ventana.setTitle('Prueba de Electron - Cargada Correctamente');
  });
  
  // Capturar errores de carga
  ventana.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('❌ Error al cargar la página:', errorCode, errorDescription);
  });
  
  // Evento para cuando la ventana se cierre
  ventana.on('closed', () => {
    ventana = null;
    console.log('Ventana cerrada.');
  });
}

// Cuando Electron termine de inicializar
app.whenReady().then(() => {
  console.log('Electron listo, creando ventana...');
  crearVentanaDeTest();
});

// Salir cuando todas las ventanas estén cerradas (excepto en macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    console.log('Todas las ventanas cerradas, saliendo de la aplicación...');
    app.quit();
  }
});

// En macOS, recrear la ventana cuando se haga clic en el icono del dock
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    crearVentanaDeTest();
  }
}); 