const { exec } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { paths } = require('../database/connection');

// Detectar si estamos en Electron o en Node.js puro
const isElectron = process.versions && process.versions.electron;

/**
 * Obtiene información sobre el espacio disponible en disco
 * @param {string} directory - Directorio a verificar
 * @returns {Promise<Object>} Información del espacio en disco (total, libre, usado)
 */
function getDiskSpace(directory = paths.userData) {
  return new Promise((resolve, reject) => {
    if (process.platform === 'win32') {
      // Obtener la unidad donde está el directorio
      const drive = path.parse(directory).root;
      
      exec(`wmic logicaldisk where "DeviceID='${drive.charAt(0)}:'" get Size,FreeSpace /format:csv`, (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }
        
        try {
          // Parsear la salida csv de wmic
          const lines = stdout.trim().split('\n');
          if (lines.length < 2) {
            reject(new Error(`No se pudo obtener información de la unidad ${drive}`));
            return;
          }
          
          // La segunda línea contiene los valores
          const values = lines[1].split(',');
          if (values.length < 3) {
            reject(new Error(`Formato de salida inesperado para la unidad ${drive}`));
            return;
          }
          
          const freeSpace = parseFloat(values[1]);
          const totalSpace = parseFloat(values[2]);
          const usedSpace = totalSpace - freeSpace;
          
          resolve({
            drive,
            directory,
            total: formatBytes(totalSpace),
            free: formatBytes(freeSpace),
            used: formatBytes(usedSpace),
            percentFree: ((freeSpace / totalSpace) * 100).toFixed(2) + '%',
            percentUsed: ((usedSpace / totalSpace) * 100).toFixed(2) + '%',
            rawValues: {
              totalBytes: totalSpace,
              freeBytes: freeSpace,
              usedBytes: usedSpace
            }
          });
        } catch (parseError) {
          reject(parseError);
        }
      });
    } else if (process.platform === 'linux' || process.platform === 'darwin') {
      // Para Linux y macOS
      exec(`df -k "${directory}"`, (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }
        
        try {
          const lines = stdout.trim().split('\n');
          if (lines.length < 2) {
            reject(new Error(`No se pudo obtener información del directorio ${directory}`));
            return;
          }
          
          // La segunda línea contiene la información
          const info = lines[1].split(/\s+/);
          
          // Obtener valores en kilobytes
          const totalKB = parseInt(info[1], 10) * 1024;
          const usedKB = parseInt(info[2], 10) * 1024;
          const freeKB = parseInt(info[3], 10) * 1024;
          
          resolve({
            directory,
            total: formatBytes(totalKB),
            free: formatBytes(freeKB),
            used: formatBytes(usedKB),
            percentFree: ((freeKB / totalKB) * 100).toFixed(2) + '%',
            percentUsed: ((usedKB / totalKB) * 100).toFixed(2) + '%',
            rawValues: {
              totalBytes: totalKB,
              freeBytes: freeKB,
              usedBytes: usedKB
            }
          });
        } catch (parseError) {
          reject(parseError);
        }
      });
    } else {
      reject(new Error(`Sistema operativo no soportado: ${process.platform}`));
    }
  });
}

/**
 * Verifica si hay suficiente espacio disponible
 * @param {string} directory - Directorio a verificar
 * @param {number} requiredMB - Espacio requerido en MB
 * @returns {Promise<boolean>} true si hay suficiente espacio
 */
async function hasEnoughSpace(directory = paths.userData, requiredMB = 500) {
  try {
    const diskInfo = await getDiskSpace(directory);
    const requiredBytes = requiredMB * 1024 * 1024;
    const hasSufficientSpace = diskInfo.rawValues.freeBytes >= requiredBytes;
    
    console.log(`Espacio disponible: ${diskInfo.free} (${diskInfo.percentFree} libre)`);
    console.log(`Espacio requerido: ${formatBytes(requiredBytes)}`);
    console.log(`Espacio suficiente: ${hasSufficientSpace ? 'Sí' : 'No'}`);
    
    return hasSufficientSpace;
  } catch (error) {
    console.error('Error al verificar espacio en disco:', error);
    // En caso de error, asumimos que no hay espacio suficiente
    return false;
  }
}

/**
 * Formatea bytes a una representación legible
 * @param {number} bytes - Número de bytes
 * @returns {string} Representación formateada
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Crea directorios necesarios para la aplicación
 * @returns {Promise<Object>} Información sobre los directorios creados
 */
async function createAppDirectories() {
  const directories = {
    userData: paths.userData,
    logs: path.join(paths.userData, 'logs'),
    backups: path.join(paths.userData, 'backups'),
    exports: path.join(paths.userData, 'exports'),
    tempFiles: path.join(paths.temp, 'sorteo_pueblo_valiente')
  };
  
  // Crear directorios si no existen
  for (const [key, dir] of Object.entries(directories)) {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Directorio creado: ${dir}`);
      } catch (error) {
        console.error(`Error al crear directorio ${dir}:`, error);
      }
    }
  }
  
  // Verificar espacio en cada directorio
  const spaceInfo = {};
  
  for (const [key, dir] of Object.entries(directories)) {
    try {
      const hasSpace = await hasEnoughSpace(dir);
      spaceInfo[key] = {
        path: dir,
        hasEnoughSpace: hasSpace
      };
    } catch (error) {
      console.error(`Error al verificar espacio en ${dir}:`, error);
      spaceInfo[key] = {
        path: dir,
        hasEnoughSpace: false,
        error: error.message
      };
    }
  }
  
  return {
    directories,
    spaceInfo
  };
}

// Exportar funciones
module.exports = {
  getDiskSpace,
  hasEnoughSpace,
  formatBytes,
  createAppDirectories
}; 