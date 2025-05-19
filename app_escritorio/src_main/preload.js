/**
 * Archivo preload.js para Electron
 * Expone funciones de IPC al proceso de renderizado
 */

const { contextBridge, ipcRenderer } = require('electron');

// Lista de canales permitidos para invocación
const validInvokeChannels = [
  // Canales de DB
  'db-query',
  
  // Autenticación
  'login-attempt',
  
  // Dashboard
  'get-dashboard-stats',
  'dashboard-sorteos-count',
  'dashboard-participacion',
  
  // Sorteos
  'sorteos:getAllSorteos',
  'sorteos:getSorteoById',
  'sorteos:getSorteosByEstado',
  'sorteos:createSorteo',
  'sorteos:updateSorteo',
  'sorteos:deleteSorteo',
  'sorteos:updateSorteoEstado',
  'sorteos:actualizarMetadata',
  'sorteos:eliminarSorteo',
  
  // Premios
  'premios:getPremiosBySorteo',
  'premios:getPremioById',
  'premios:createPremio',
  'premios:updatePremio',
  'premios:deletePremio',
  'premios:migrarPremiosDesdeMetadata',
  
  // Participantes
  'participantes:getParticipantesBySorteo',
  'participantes:getParticipanteById',
  'participantes:createParticipante',
  'participantes:updateParticipante',
  'participantes:deleteParticipante',
  'participantes:validarParticipante',
  'participantes:asignarTiques',
  'participantes:importarParticipantes',
  'participantes:generarTiquesPorEstado',
  'participantes:generarTiquesDesdeDistribucion',
  
  // Distribución de Tiques
  'distribucion:getBySorteo',
  'distribucion:guardar',
  'distribucion:eliminar',
  'distribucion:existeParaSorteo',
  
  // Ganadores
  'ganadores:getGanadoresBySorteo',
  'ganadores:getGanadorById',
  'ganadores:registrarGanador',
  'ganadores:deleteGanador',
  'ganadores:realizarSorteoAutomatico',
  'ganadores:finalizarSorteo',
  
  // Reportes
  'reportes:generarPDFTiques',
  'reportes:exportarTiquesExcel',
  'reportes:generarResultadosSorteo',
  
  // Verificaciones previas al sorteo
  'run-checks',
  'fix-schema',
  'schedule-checks',
  'cancel-scheduled-checks',
  
  // Sistema y Shell
  'shell:openPath',
  'dialog:openFile',
  'dialog:saveFile',
  'fs:readFile',
  'fs:writeFile',
  
  // Configuración del sistema
  'config:getEstados',
  'config:getMunicipios',
  'config:getParroquias',
];

// Lista de canales permitidos para listeners
const validListenerChannels = [
  'check-notification', 
  'cambio-tab',
  'generacion-tiques:inicio',
  'generacion-tiques:progreso',
  'generacion-tiques:completado',
  'generacion-tiques:error'
];

// Crear la API para exponer
const electronAPI = {
  // Método específico para consultas a la BD (retrocompatibilidad)
  dbQuery: (sql, params) => ipcRenderer.invoke('db-query', sql, params),
  
  // Método específico para autenticación (retrocompatibilidad)
  loginAttempt: (credentials) => ipcRenderer.invoke('login-attempt', credentials),
  
  // Método específico para estadísticas del dashboard (retrocompatibilidad)
  getDashboardStats: () => ipcRenderer.invoke('get-dashboard-stats'),
  
  // Método general para invocar cualquier canal IPC
  invoke: (channel, ...args) => {
    // Log para depuración
    console.log(`[preload] Invocando canal: ${channel}`, args);
    
    if (validInvokeChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args).then(result => {
        // Log para inspeccionar el resultado (evitando objetos muy grandes)
        if (result && typeof result === 'object' && Array.isArray(result)) {
          console.log(`[preload] Resultado de ${channel}: Array con ${result.length} elementos`);
        } else if (result && typeof result === 'object') {
          console.log(`[preload] Resultado de ${channel}: Objeto con claves ${Object.keys(result)}`);
        } else {
          console.log(`[preload] Resultado de ${channel}:`, result);
        }
        return result;
      }).catch(error => {
        console.error(`[preload] Error en ${channel}:`, error);
        throw error;
      });
    }
    
    console.error(`Canal no permitido: ${channel}`);
    throw new Error(`Canal no permitido: ${channel}`);
  },
  
  // Navegación entre pestañas
  navegarApp: (tab, section = null, sorteoId = null) => {
    console.log(`[preload] Navegando a tab: ${tab}, section: ${section}, sorteoId: ${sorteoId}`);
    ipcRenderer.send('navegacion-app', { tab, section, sorteoId });
  },
  
  // Recibir notificaciones
  on: (channel, callback) => {
    console.log(`[preload] Registrando listener para canal: ${channel}`);
    
    if (validListenerChannels.includes(channel)) {
      // Eliminar un posible oyente anterior para evitar duplicados
      ipcRenderer.removeAllListeners(channel);
      
      // Agregar un nuevo oyente
      ipcRenderer.on(channel, (_, ...args) => callback(...args));
      
      // Devolver una función para eliminar el oyente
      return () => {
        console.log(`[preload] Removiendo listener para canal: ${channel}`);
        ipcRenderer.removeAllListeners(channel);
      };
    }
    
    throw new Error(`Canal no permitido: ${channel}`);
  }
};

// Exponer API segura al proceso de renderizado como 'electron'
contextBridge.exposeInMainWorld('electron', electronAPI);

// También exponer la misma API como 'electronAPI' para mantener retrocompatibilidad
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Función para ayudar a detectar si está funcionando la comunicación con el proceso principal
console.log('⚡ Preload script cargado correctamente - APIs expuestas: electron, electronAPI'); 