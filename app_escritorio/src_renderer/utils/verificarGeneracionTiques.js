/**
 * Utilidad para verificar el proceso de generación de tiques
 */

// Función para verificar si existe distribución para el sorteo
const verificarDistribucion = async (sorteoId) => {
  try {
    const result = await window.electron.invoke('distribucion:existeParaSorteo', { sorteoId });
    return {
      existe: result.existe,
      total: result.total || 0,
      mensaje: result.existe ? 
        `Distribución encontrada. Total a generar: ${result.total}` : 
        'No existe distribución configurada para este sorteo'
    };
  } catch (error) {
    console.error('Error al verificar distribución:', error);
    throw new Error(`Error al verificar distribución: ${error.message}`);
  }
};

// Función para verificar el progreso actual
const verificarProgreso = async (sorteoId) => {
  try {
    const result = await window.electron.invoke('sorteo:obtenerMetadata', { sorteoId });
    const progreso = result?.metadata?.progreso_generacion || null;
    
    if (!progreso) {
      return {
        enProgreso: false,
        mensaje: 'No hay generación en curso'
      };
    }

    return {
      enProgreso: true,
      generados: progreso.generados,
      total: progreso.total_a_generar,
      porcentaje: progreso.porcentaje,
      estadoActual: progreso.estado_actual,
      estadosProcesados: progreso.estados_procesados,
      totalEstados: progreso.total_estados,
      mensaje: `Generación en curso: ${progreso.generados} de ${progreso.total_a_generar} (${progreso.porcentaje}%)`
    };
  } catch (error) {
    console.error('Error al verificar progreso:', error);
    throw new Error(`Error al verificar progreso: ${error.message}`);
  }
};

// Función para verificar tiques generados
const verificarTiquesGenerados = async (sorteoId) => {
  try {
    const result = await window.electron.invoke('participantes:contarPorSorteo', { sorteoId });
    return {
      total: result.total || 0,
      porEstado: result.porEstado || {},
      mensaje: result.total > 0 ? 
        `Se han generado ${result.total} tiques en total` : 
        'No se han generado tiques aún'
    };
  } catch (error) {
    console.error('Error al verificar tiques generados:', error);
    throw new Error(`Error al verificar tiques generados: ${error.message}`);
  }
};

// Función principal que realiza todas las verificaciones
const verificarGeneracionCompleta = async (sorteoId) => {
  try {
    console.log(`Iniciando verificación para sorteo ${sorteoId}...`);
    
    // 1. Verificar distribución
    const distribucion = await verificarDistribucion(sorteoId);
    console.log('Estado de distribución:', distribucion.mensaje);
    
    // 2. Verificar progreso actual
    const progreso = await verificarProgreso(sorteoId);
    console.log('Estado de progreso:', progreso.mensaje);
    
    // 3. Verificar tiques generados
    const tiques = await verificarTiquesGenerados(sorteoId);
    console.log('Estado de tiques:', tiques.mensaje);
    
    // 4. Analizar resultados
    const estado = {
      tieneDistribucion: distribucion.existe,
      generacionEnCurso: progreso.enProgreso,
      tiquesGenerados: tiques.total,
      distribucionEsperada: distribucion.total,
      porcentajeCompletado: progreso.enProgreso ? progreso.porcentaje : 
        (tiques.total > 0 ? (tiques.total / distribucion.total * 100) : 0)
    };
    
    // 5. Determinar estado general
    let estadoGeneral;
    if (!estado.tieneDistribucion) {
      estadoGeneral = 'SIN_DISTRIBUCION';
    } else if (estado.generacionEnCurso) {
      estadoGeneral = 'EN_PROGRESO';
    } else if (estado.tiquesGenerados === 0) {
      estadoGeneral = 'NO_INICIADO';
    } else if (estado.tiquesGenerados === estado.distribucionEsperada) {
      estadoGeneral = 'COMPLETADO';
    } else if (estado.tiquesGenerados < estado.distribucionEsperada) {
      estadoGeneral = 'INCOMPLETO';
    } else {
      estadoGeneral = 'ERROR_CANTIDAD';
    }
    
    return {
      estado: estadoGeneral,
      detalles: {
        distribucion,
        progreso,
        tiques,
        estado
      },
      mensaje: obtenerMensajeEstado(estadoGeneral, estado)
    };
  } catch (error) {
    console.error('Error en verificación completa:', error);
    throw new Error(`Error en verificación: ${error.message}`);
  }
};

// Función auxiliar para generar mensajes según el estado
const obtenerMensajeEstado = (estadoGeneral, estado) => {
  const mensajes = {
    SIN_DISTRIBUCION: 'No existe una distribución configurada para este sorteo.',
    EN_PROGRESO: `Generación en curso: ${estado.porcentajeCompletado}% completado`,
    NO_INICIADO: 'La generación de tiques no ha iniciado.',
    COMPLETADO: `Generación completada. ${estado.tiquesGenerados} tiques generados.`,
    INCOMPLETO: `Generación incompleta. Faltan ${estado.distribucionEsperada - estado.tiquesGenerados} tiques.`,
    ERROR_CANTIDAD: 'Error: La cantidad de tiques generados excede la distribución esperada.'
  };
  
  return mensajes[estadoGeneral] || 'Estado desconocido';
};

export {
  verificarGeneracionCompleta,
  verificarDistribucion,
  verificarProgreso,
  verificarTiquesGenerados
}; 