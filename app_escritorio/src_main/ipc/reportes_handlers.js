const { ipcMain, dialog, app } = require('electron');
const db = require('../database/db');
const fs = require('fs');
const path = require('path');

// Simular la generación de PDF y Excel por ahora
// En una implementación real, usaríamos librerías como PDFKit o ExcelJS

function setupReportesHandlers() {
  // Generar PDF con lista de tiques
  ipcMain.handle('reportes:generarPDFTiques', async (event, sorteoId, estado = null) => {
    try {
      // 1. Obtener datos del sorteo
      const sorteoResult = await db.query('SELECT nombre, fecha_sorteo FROM sorteos WHERE id = $1', [sorteoId]);
      
      if (sorteoResult.rows.length === 0) {
        throw new Error(`No se encontró el sorteo con ID ${sorteoId}`);
      }
      
      const sorteo = sorteoResult.rows[0];
      
      // 2. Obtener participantes con tiques asignados
      let query = `
        SELECT 
          p.id, 
          p.documento_identidad, 
          p.nombre, 
          p.apellido, 
          p.estado, 
          p.numero_tique, 
          p.prefijo_tique, 
          p.codigo_tique
        FROM 
          participantes p
        WHERE 
          p.sorteo_id = $1 AND 
          p.validado = true AND 
          p.tique_asignado = true
      `;
      
      const params = [sorteoId];
      
      // Si se especificó un estado, filtrar por él
      if (estado) {
        query += ' AND p.estado = $2';
        params.push(estado);
      }
      
      query += ' ORDER BY p.estado, p.codigo_tique';
      
      const participantesResult = await db.query(query, params);
      
      // 3. Generar nombre de archivo basado en sorteo
      const fechaHoy = new Date().toISOString().split('T')[0];
      const nombreArchivo = `Tiques_${sorteo.nombre.replace(/\s+/g, '_')}_${fechaHoy}.pdf`;
      
      // 4. Obtener directorio de descargas
      const downloadsPath = app.getPath('downloads');
      const rutaArchivo = path.join(downloadsPath, nombreArchivo);
      
      // 5. Simular la generación del PDF (en una implementación real usaríamos PDFKit)
      // Escribir un archivo de texto simple para simular
      const contenido = `REPORTE DE TIQUES - ${sorteo.nombre}\n` +
                         `Fecha: ${new Date(sorteo.fecha_sorteo).toLocaleString()}\n` +
                         `Generado: ${new Date().toLocaleString()}\n\n` +
                         `Total de tiques: ${participantesResult.rows.length}\n` +
                         `${estado ? `Estado: ${estado}` : 'Todos los estados'}\n\n` +
                         'LISTA DE TIQUES:\n\n' +
                         participantesResult.rows.map(p => 
                           `${p.codigo_tique} - ${p.apellido}, ${p.nombre} - ${p.estado}`
                         ).join('\n');
      
      fs.writeFileSync(rutaArchivo, contenido);
      
      return {
        success: true,
        mensaje: `PDF generado en: ${rutaArchivo}`,
        ruta: rutaArchivo
      };
    } catch (error) {
      console.error('Error en reportes:generarPDFTiques:', error);
      throw new Error(`Error al generar PDF de tiques: ${error.message}`);
    }
  });

  // Exportar lista de tiques a Excel
  ipcMain.handle('reportes:exportarTiquesExcel', async (event, sorteoId, estado = null) => {
    try {
      // 1. Obtener datos del sorteo
      const sorteoResult = await db.query('SELECT nombre, fecha_sorteo FROM sorteos WHERE id = $1', [sorteoId]);
      
      if (sorteoResult.rows.length === 0) {
        throw new Error(`No se encontró el sorteo con ID ${sorteoId}`);
      }
      
      const sorteo = sorteoResult.rows[0];
      
      // 2. Obtener participantes con tiques asignados
      let query = `
        SELECT 
          p.id, 
          p.documento_identidad, 
          p.nombre, 
          p.apellido, 
          p.estado, 
          p.municipio,
          p.telefono,
          p.email,
          p.numero_tique, 
          p.prefijo_tique, 
          p.codigo_tique,
          p.fecha_asignacion_tique
        FROM 
          participantes p
        WHERE 
          p.sorteo_id = $1 AND 
          p.validado = true AND 
          p.tique_asignado = true
      `;
      
      const params = [sorteoId];
      
      // Si se especificó un estado, filtrar por él
      if (estado) {
        query += ' AND p.estado = $2';
        params.push(estado);
      }
      
      query += ' ORDER BY p.estado, p.codigo_tique';
      
      const participantesResult = await db.query(query, params);
      
      // 3. Generar nombre de archivo basado en sorteo
      const fechaHoy = new Date().toISOString().split('T')[0];
      const nombreArchivo = `Tiques_${sorteo.nombre.replace(/\s+/g, '_')}_${fechaHoy}.csv`;
      
      // 4. Obtener directorio de descargas
      const downloadsPath = app.getPath('downloads');
      const rutaArchivo = path.join(downloadsPath, nombreArchivo);
      
      // 5. Simular la generación del CSV (en una implementación real usaríamos ExcelJS)
      // Crear un archivo CSV simple
      const cabecera = 'ID,Documento,Nombre,Apellido,Estado,Municipio,Teléfono,Email,Número Tique,Prefijo,Código Tique,Fecha Asignación';
      const filas = participantesResult.rows.map(p => {
        // Escapar comas y comillas dobles en datos para CSV
        const nombre = p.nombre ? `"${p.nombre.replace(/"/g, '""')}"` : '""';
        const apellido = p.apellido ? `"${p.apellido.replace(/"/g, '""')}"` : '""';
        const estado = p.estado ? `"${p.estado.replace(/"/g, '""')}"` : '""';
        const municipio = p.municipio ? `"${p.municipio.replace(/"/g, '""')}"` : '""';
        
        return [
          p.id,
          `"${p.documento_identidad || ''}"`,
          nombre,
          apellido,
          estado,
          municipio,
          `"${p.telefono || ''}"`,
          `"${p.email || ''}"`,
          p.numero_tique || '',
          `"${p.prefijo_tique || ''}"`,
          `"${p.codigo_tique || ''}"`,
          p.fecha_asignacion_tique ? new Date(p.fecha_asignacion_tique).toLocaleString() : ''
        ].join(',');
      });
      
      const contenido = [cabecera, ...filas].join('\n');
      fs.writeFileSync(rutaArchivo, contenido);
      
      return {
        success: true,
        mensaje: `Excel generado en: ${rutaArchivo}`,
        ruta: rutaArchivo
      };
    } catch (error) {
      console.error('Error en reportes:exportarTiquesExcel:', error);
      throw new Error(`Error al exportar tiques a Excel: ${error.message}`);
    }
  });

  // Generar reporte de resultados del sorteo
  ipcMain.handle('reportes:generarResultadosSorteo', async (event, sorteoId) => {
    try {
      // 1. Obtener datos del sorteo
      const sorteoResult = await db.query('SELECT nombre, fecha_sorteo, estado_actual FROM sorteos WHERE id = $1', [sorteoId]);
      
      if (sorteoResult.rows.length === 0) {
        throw new Error(`No se encontró el sorteo con ID ${sorteoId}`);
      }
      
      const sorteo = sorteoResult.rows[0];
      
      // Verificar que el sorteo esté finalizado
      if (sorteo.estado_actual !== 'finalizado') {
        throw new Error('Solo se pueden generar reportes de resultados para sorteos finalizados');
      }
      
      // 2. Obtener ganadores del sorteo
      const ganadoresResult = await db.query(`
        SELECT 
          g.id, 
          g.participante_id, 
          g.premio_id, 
          g.numero_ganador, 
          g.fecha_sorteo,
          p.nombre AS participante_nombre,
          p.apellido AS participante_apellido,
          p.documento_identidad,
          p.estado,
          pr.nombre AS premio_nombre,
          pr.descripcion AS premio_descripcion,
          pr.valor AS premio_valor
        FROM 
          ganadores g
          JOIN participantes p ON g.participante_id = p.id
          JOIN premios pr ON g.premio_id = pr.id
        WHERE 
          g.sorteo_id = $1
        ORDER BY
          pr.valor DESC, g.fecha_sorteo
      `, [sorteoId]);
      
      // 3. Generar nombre de archivo
      const fechaHoy = new Date().toISOString().split('T')[0];
      const nombreArchivo = `Resultados_${sorteo.nombre.replace(/\s+/g, '_')}_${fechaHoy}.pdf`;
      
      // 4. Obtener directorio de descargas
      const downloadsPath = app.getPath('downloads');
      const rutaArchivo = path.join(downloadsPath, nombreArchivo);
      
      // 5. Simular la generación de PDF de resultados
      const contenido = `RESULTADOS DEL SORTEO - ${sorteo.nombre}\n` +
                        `Fecha del sorteo: ${new Date(sorteo.fecha_sorteo).toLocaleString()}\n` +
                        `Reporte generado: ${new Date().toLocaleString()}\n\n` +
                        `Total de ganadores: ${ganadoresResult.rows.length}\n\n` +
                        'GANADORES POR PREMIO:\n\n' +
                        ganadoresResult.rows.map(g => 
                          `Premio: ${g.premio_nombre} (${g.premio_valor})\n` +
                          `Número ganador: ${g.numero_ganador}\n` +
                          `Participante: ${g.participante_apellido}, ${g.participante_nombre}\n` +
                          `Documento: ${g.documento_identidad}\n` +
                          `Estado: ${g.estado}\n` +
                          `Fecha de sorteo: ${new Date(g.fecha_sorteo).toLocaleString()}\n` +
                          '----------------------'
                        ).join('\n\n');
      
      fs.writeFileSync(rutaArchivo, contenido);
      
      return {
        success: true,
        mensaje: `Reporte de resultados generado en: ${rutaArchivo}`,
        ruta: rutaArchivo
      };
    } catch (error) {
      console.error('Error en reportes:generarResultadosSorteo:', error);
      throw new Error(`Error al generar reporte de resultados: ${error.message}`);
    }
  });
}

module.exports = setupReportesHandlers; 