const { runAndLogChecks } = require('../app_escritorio/src_main/utils/pre-sorteo-check');

// Ejecutar verificaciones
runAndLogChecks()
  .then(result => {
    process.exit(result.overall === 'error' ? 1 : 0);
  })
  .catch(error => {
    console.error('Error durante la verificación:', error);
    process.exit(1);
  }); 