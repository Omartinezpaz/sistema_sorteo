// API para la gestión de participantes
const { ipcMain } = require('electron');
const db = require('../database/connection');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

// Registrar todos los manejadores de IPC para participantes
function registerParticipantesHandlers() {
  // Obtener participantes por sorteo
  ipcMain.handle('participantes:getParticipantesBySorteo', async (event, sorteoId, soloValidados = false) => {
    try {
      let query = 'SELECT * FROM participantes WHERE sorteo_id = $1';
      const params = [sorteoId];
      
      if (soloValidados) {
        query += ' AND validado = true';
      }
      
      query += ' ORDER BY id DESC';
      
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error al obtener participantes:', error);
      throw new Error('Error al obtener participantes');
    }
  });

  // Generar tiques para participantes desde la tabla re_723
  ipcMain.handle('participantes:generarTiquesPorEstado', async (event, sorteoId, prefijo = 'TIQ') => {
    console.log('API participantesApi: Recibida solicitud generarTiquesPorEstado:', { sorteoId, prefijo });
    
    try {
      // Crear directorio de salida si no existe
      const userDownloads = app.getPath('downloads');
      const outputDir = path.join(userDownloads, 'sorteo_tiques');
      
      console.log('Directorio de salida para tiques:', outputDir);
      
      if (!fs.existsSync(outputDir)) {
        console.log('Creando directorio de salida...');
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Generar nombre de archivo con fecha y hora
      const fecha = new Date().toISOString().replace(/:/g, '-').substring(0, 19);
      const archivoSalida = path.join(outputDir, `tiques_sorteo_${sorteoId}_${fecha}.csv`);
      
      console.log('Archivo de salida para tiques:', archivoSalida);
      
      // Ejecutar la función SQL
      console.log('Ejecutando función SQL generar_tiques_por_estado...');
      const result = await db.query(
        'SELECT * FROM generar_tiques_por_estado($1, $2, $3)',
        [sorteoId, prefijo, archivoSalida]
      );
      
      console.log('Resultado de generar_tiques_por_estado:', result.rows[0]);
      
      return {
        resultado: result.rows[0],
        archivoSalida: archivoSalida
      };
    } catch (error) {
      console.error('Error al generar tiques por estado:', error);
      console.error('Detalles del error:', error.stack || 'No hay stack disponible');
      throw new Error(`Error al generar tiques: ${error.message}`);
    }
  });

  // Otros manejadores existentes...
}

module.exports = {
  registerParticipantesHandlers
}; 