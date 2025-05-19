
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
  console.log(`Electron se cerró con código: ${code}`);
});
