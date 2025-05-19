/**
 * Manejadores de IPC para verificaciones previas al sorteo
 * Permite que la interfaz de usuario interactúe con las verificaciones
 */

const { ipcMain } = require('electron');
const { runPreSorteoChecks } = require('../utils/pre-sorteo-check');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Registra los manejadores de IPC para verificaciones previas al sorteo
 * @param {Electron.App} app - Instancia de la aplicación Electron
 */
function registerPreSorteoHandlers(app) {
  // Manejador para ejecutar verificaciones
  ipcMain.handle('run-checks', async () => {
    try {
      console.log('Ejecutando verificaciones previas desde IPC...');
      const results = await runPreSorteoChecks();
      return results;
    } catch (error) {
      console.error('Error al ejecutar verificaciones previas:', error);
      throw new Error(`Error al ejecutar verificaciones: ${error.message}`);
    }
  });
  
  // Manejador para reparar el esquema de la base de datos
  ipcMain.handle('fix-schema', async () => {
    return new Promise((resolve, reject) => {
      try {
        // Ruta al script SQL de reparación
        const scriptPath = path.join(app.getAppPath(), 'scripts', 'fix-schema.sql');
        
        // Verificar que el script existe
        if (!fs.existsSync(scriptPath)) {
          reject(new Error('Script de reparación no encontrado'));
          return;
        }
        
        // Obtener configuración de la base de datos
        const { config } = require('../database/connection');
        
        // Comando para ejecutar el script
        const command = `psql -U ${config.user} -h ${config.host} -p ${config.port} -d ${config.database} -f "${scriptPath}"`;
        
        console.log(`Ejecutando comando de reparación: ${command}`);
        
        // Ejecutar el comando
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error('Error al ejecutar script de reparación:', error);
            console.error('STDERR:', stderr);
            reject(new Error(`Error al reparar esquema: ${error.message}`));
            return;
          }
          
          console.log('Script de reparación ejecutado exitosamente');
          console.log('STDOUT:', stdout);
          
          // Si hay errores en la salida estándar de PostgreSQL
          if (stderr && stderr.includes('ERROR')) {
            console.error('Error de PostgreSQL:', stderr);
            reject(new Error(`Error de PostgreSQL: ${stderr}`));
            return;
          }
          
          resolve({
            success: true,
            message: 'Esquema reparado correctamente',
            details: stdout
          });
        });
      } catch (error) {
        console.error('Error al intentar reparar esquema:', error);
        reject(new Error(`Error al intentar reparar esquema: ${error.message}`));
      }
    });
  });
  
  // Manejador para programar verificaciones periódicas (cada 24 horas)
  let checkInterval = null;
  
  ipcMain.handle('schedule-checks', (event, intervalHours = 24) => {
    try {
      // Limpiar intervalo existente si hay uno
      if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
      }
      
      // Convertir horas a milisegundos
      const intervalMs = intervalHours * 60 * 60 * 1000;
      
      // Crear nuevo intervalo
      checkInterval = setInterval(async () => {
        try {
          console.log(`Ejecutando verificación programada (cada ${intervalHours} horas)...`);
          const results = await runPreSorteoChecks();
          
          // Si hay errores críticos, enviar notificación
          if (results.overall === 'error') {
            const notification = {
              title: 'Verificación previa al sorteo',
              body: 'Se detectaron errores críticos que deben ser resueltos antes de realizar un sorteo.'
            };
            
            // Enviar notificación a la ventana principal
            event.sender.send('check-notification', notification);
          }
        } catch (error) {
          console.error('Error en verificación programada:', error);
        }
      }, intervalMs);
      
      // Ejecutar una verificación inicial inmediatamente
      runPreSorteoChecks().catch(error => {
        console.error('Error en verificación inicial programada:', error);
      });
      
      return {
        success: true,
        intervalHours,
        message: `Verificaciones programadas cada ${intervalHours} horas`
      };
    } catch (error) {
      console.error('Error al programar verificaciones:', error);
      throw new Error(`Error al programar verificaciones: ${error.message}`);
    }
  });
  
  // Manejador para cancelar verificaciones programadas
  ipcMain.handle('cancel-scheduled-checks', () => {
    try {
      if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
        return {
          success: true,
          message: 'Verificaciones programadas canceladas'
        };
      }
      
      return {
        success: false,
        message: 'No hay verificaciones programadas para cancelar'
      };
    } catch (error) {
      console.error('Error al cancelar verificaciones programadas:', error);
      throw new Error(`Error al cancelar verificaciones programadas: ${error.message}`);
    }
  });
}

module.exports = { registerPreSorteoHandlers }; 