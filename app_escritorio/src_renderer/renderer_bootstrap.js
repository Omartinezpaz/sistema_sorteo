// Este script se ejecuta en el proceso renderer después de que el DOM esté listo.

if (window.electronAPI && window.electronAPI.mountReactApp) {
  window.electronAPI.mountReactApp();
} else {
  console.error('Error: La API de preload (mountReactApp) no está disponible.');
  // Podrías mostrar un mensaje de error en el div#root aquí
  const rootDiv = document.getElementById('root');
  if (rootDiv) {
    rootDiv.innerHTML = '<p style="color: red;">Error crítico al cargar la aplicación. Verifique la consola de DevTools.</p>';
  }
} 