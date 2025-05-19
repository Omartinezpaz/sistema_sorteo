/**
 * Corrección para el manejador de participantes:generarTiquesDesdeDistribucion
 * Ubicación: app_escritorio/src_main/ipc/participantes_handlers.js
 * 
 * Problema: El código está tratando de acceder a verificacion[0].total, pero es posible
 * que la consulta devuelva los resultados en un formato diferente dependiendo del driver
 * de PostgreSQL utilizado. Esto causa el error "Cannot read properties of undefined (reading 'total')".
 * 
 * La corrección consiste en hacer una verificación más robusta del resultado de la consulta
 * y manejar adecuadamente diferentes formatos de retorno de la consulta.
 */

// Reemplazar las líneas 771-778 con este código:

// Verificar si existe distribución para este sorteo
const verificacion = await query(
  'SELECT COUNT(*) as total FROM distribucion_tiques WHERE sorteo_id = $1',
  [sorteoId]
);

// Verificación más robusta para manejar diferentes formatos de resultado
let totalDistribuciones = 0;
if (verificacion && verificacion.length > 0) {
  // Si el resultado es un array de objetos (formato típico)
  if (verificacion[0] && typeof verificacion[0].total !== 'undefined') {
    totalDistribuciones = parseInt(verificacion[0].total);
  } 
  // Si el resultado es un array de arrays (formato alternativo)
  else if (Array.isArray(verificacion[0]) && verificacion[0].length > 0) {
    totalDistribuciones = parseInt(verificacion[0][0]);
  }
  // Si el resultado es un objeto con propiedades rows (formato node-postgres)
  else if (verificacion.rows && verificacion.rows.length > 0) {
    totalDistribuciones = parseInt(verificacion.rows[0].total);
  }
}

if (totalDistribuciones === 0) {
  throw new Error('No hay distribución de tiques configurada para este sorteo');
}

// Otra posible solución alternativa (usar directamente la función de BD):

// Verificar si existe distribución para este sorteo
try {
  const verificacion = await db.query(
    'SELECT COUNT(*) as total FROM distribucion_tiques WHERE sorteo_id = $1',
    [sorteoId]
  );
  
  // Acceder al resultado considerando el formato de node-postgres
  const totalDistribuciones = parseInt(verificacion.rows[0].total);
  
  if (totalDistribuciones === 0) {
    throw new Error('No hay distribución de tiques configurada para este sorteo');
  }
} catch (err) {
  console.error('Error al verificar distribución de tiques:', err);
  throw new Error(`Error al verificar distribución de tiques: ${err.message}`);
}

/**
 * Implementación alternativa del manejador completo para mayor seguridad:
 */

// Generar tiques por estado usando la distribución guardada
ipcMain.handle('participantes:generarTiquesDesdeDistribucion', async (event, sorteoId, prefijo = 'TIQ', archivoSalida = null) => {
  try {
    // Verificar si existe distribución para este sorteo
    const verificacion = await db.query(
      'SELECT COUNT(*) as total FROM distribucion_tiques WHERE sorteo_id = $1',
      [sorteoId]
    );
    
    // Obtener el total del formato devuelto por node-postgres
    const totalDistribuciones = parseInt(verificacion.rows[0].total);
    
    console.log(`Total de distribuciones para sorteo ${sorteoId}: ${totalDistribuciones}`);
    
    if (totalDistribuciones === 0) {
      throw new Error('No hay distribución de tiques configurada para este sorteo');
    }
    
    // Preparar ruta del archivo de salida si no se proporcionó
    if (!archivoSalida) {
      // Obtener ruta de directorio de descargas
      const downloadsPath = app.getPath('downloads');
      const outputDir = path.join(downloadsPath, 'sorteo_tiques');
      
      // Crear directorio si no existe
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Generar nombre de archivo con fecha y hora
      const fecha = new Date().toISOString().replace(/:/g, '-').substring(0, 19);
      archivoSalida = path.join(outputDir, `tiques_sorteo_${sorteoId}_${fecha}.csv`);
    }
    
    console.log('Ejecutando generación de tiques desde distribución para sorteo:', sorteoId);
    console.log('Prefijo:', prefijo);
    console.log('Archivo de salida:', archivoSalida);
    
    // Iniciar un proceso en segundo plano para monitorizar el progreso
    let monitoreoActivo = true;
    
    // Enviar el evento de inicio
    event.sender.send('generacion-tiques:inicio', { sorteoId });
    
    // Función para consultar el progreso
    const consultarProgreso = async () => {
      if (!monitoreoActivo) return;
      
      try {
        const progresoResult = await db.query(
          'SELECT metadata->>\'progreso_generacion\' as progreso FROM sorteos WHERE id = $1',
          [sorteoId]
        );
        
        if (progresoResult && progresoResult.rows && progresoResult.rows.length > 0 && progresoResult.rows[0].progreso) {
          const progreso = JSON.parse(progresoResult.rows[0].progreso);
          event.sender.send('generacion-tiques:progreso', { sorteoId, progreso });
          
          // Si el progreso llegó al 100%, detener el monitoreo
          if (progreso.porcentaje === 100) {
            monitoreoActivo = false;
          } else {
            // Programar la próxima consulta
            setTimeout(consultarProgreso, 1000);
          }
        } else {
          // Si no hay información de progreso, intentar de nuevo
          setTimeout(consultarProgreso, 1000);
        }
      } catch (error) {
        console.error('Error al consultar progreso:', error);
        // Reintentar a pesar del error
        setTimeout(consultarProgreso, 2000);
      }
    };
    
    // Iniciar monitoreo en paralelo
    consultarProgreso();
    
    // Ejecutar el procedimiento almacenado
    const result = await db.query(
      'SELECT * FROM generar_tiques_desde_distribucion($1, $2, $3)',
      [sorteoId, prefijo, archivoSalida]
    );
    
    // Detener el monitoreo explícitamente
    monitoreoActivo = false;
    
    if (!result || !result.rows || result.rows.length === 0) {
      throw new Error('No se pudo ejecutar la generación de tiques');
    }
    
    console.log('Resultado de generación:', result.rows[0]);
    
    // Enviar evento de finalización
    event.sender.send('generacion-tiques:completado', { 
      sorteoId, 
      resultado: result.rows[0],
      archivoSalida
    });
    
    return {
      resultado: result.rows[0],
      archivoSalida: archivoSalida
    };
  } catch (error) {
    console.error('Error al generar tiques desde distribución:', error);
    // Notificar el error también por eventos
    event.sender.send('generacion-tiques:error', { 
      sorteoId, 
      error: error.message 
    });
    throw new Error(`Error al generar tiques: ${error.message}`);
  }
}); 