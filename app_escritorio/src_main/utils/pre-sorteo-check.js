const { testConnection, query, paths } = require('../database/connection');
const { hasEnoughSpace, createAppDirectories } = require('./disk-space');
const { validateDatabaseSchema } = require('../database/schema-validator');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Detectar si estamos en Electron o en Node.js puro
const isElectron = process.versions && process.versions.electron;

/**
 * Realiza verificaciones previas al sorteo
 * @returns {Promise<Object>} Resultados de las verificaciones
 */
async function runPreSorteoChecks() {
  const results = {
    date: new Date().toISOString(),
    system: getSystemInfo(),
    checks: {
      database: { status: 'pending' },
      diskSpace: { status: 'pending' },
      directories: { status: 'pending' },
      tablesExist: { status: 'pending' },
      schemaValid: { status: 'pending' },
      dependencies: { status: 'pending' },
      systemResources: { status: 'pending' }
    },
    overall: 'pending'
  };
  
  try {
    // Crear directorios necesarios
    console.log('Verificando directorios de la aplicación...');
    const dirInfo = await createAppDirectories();
    results.checks.directories = {
      status: 'success',
      details: dirInfo
    };
    
    // Verificar espacio en disco
    console.log('Verificando espacio en disco...');
    const dataDir = paths.userData;
    const hasSpace = await hasEnoughSpace(dataDir, 500); // Requerir 500MB
    results.checks.diskSpace = {
      status: hasSpace ? 'success' : 'error',
      details: {
        directory: dataDir,
        sufficientSpace: hasSpace
      }
    };
    
    // Verificar conexión a la base de datos
    console.log('Verificando conexión a la base de datos...');
    const dbConnected = await testConnection();
    results.checks.database = {
      status: dbConnected ? 'success' : 'error',
      details: {
        connected: dbConnected
      }
    };
    
    // Si hay conexión, verificar tablas requeridas
    if (dbConnected) {
      console.log('Verificando tablas requeridas...');
      const requiredTables = [
        'usuarios',
        'sorteos',
        'participantes',
        'premios',
        'ganadores'
      ];
      
      const existingTablesResult = await query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = ANY($1)
      `, [requiredTables]);
      
      const existingTables = existingTablesResult.rows.map(row => row.table_name);
      const missingTables = requiredTables.filter(table => !existingTables.includes(table));
      
      results.checks.tablesExist = {
        status: missingTables.length === 0 ? 'success' : 'warning',
        details: {
          required: requiredTables,
          existing: existingTables,
          missing: missingTables
        }
      };
      
      // Si todas las tablas existen, verificar estructura
      if (missingTables.length === 0) {
        console.log('Verificando estructura de la base de datos...');
        const schemaValidation = await validateDatabaseSchema();
        
        results.checks.schemaValid = {
          status: schemaValidation.valid ? 'success' : 'warning',
          details: schemaValidation
        };
      } else {
        results.checks.schemaValid = {
          status: 'warning',
          details: {
            valid: false,
            error: 'No se puede validar el esquema porque faltan tablas'
          }
        };
      }
    }
    
    // Verificar dependencias
    console.log('Verificando dependencias del sistema...');
    const dependenciesCheck = checkDependencies();
    results.checks.dependencies = {
      status: dependenciesCheck.success ? 'success' : 'warning',
      details: dependenciesCheck
    };
    
    // Verificar recursos del sistema
    console.log('Verificando recursos del sistema...');
    const systemResources = checkSystemResources();
    results.checks.systemResources = {
      status: systemResources.sufficient ? 'success' : 'warning',
      details: systemResources
    };
    
    // Determinar estado general
    const hasErrors = Object.values(results.checks).some(check => check.status === 'error');
    const hasWarnings = Object.values(results.checks).some(check => check.status === 'warning');
    
    if (hasErrors) {
      results.overall = 'error';
    } else if (hasWarnings) {
      results.overall = 'warning';
    } else {
      results.overall = 'success';
    }
    
    // Guardar resultados en archivo de log
    const logDir = path.join(paths.userData, 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFile = path.join(logDir, `pre-sorteo-check-${timestamp}.json`);
    fs.writeFileSync(logFile, JSON.stringify(results, null, 2));
    
    console.log(`Resultados guardados en: ${logFile}`);
    
    return results;
  } catch (error) {
    console.error('Error durante la verificación pre-sorteo:', error);
    results.overall = 'error';
    results.error = error.message;
    return results;
  }
}

/**
 * Obtiene información del sistema
 * @returns {Object} Información del sistema
 */
function getSystemInfo() {
  const info = {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    userDataPath: paths.userData,
    tempPath: paths.temp,
    cpuCores: os.cpus().length,
    totalMemoryMB: Math.round(os.totalmem() / (1024 * 1024)),
    freeMemoryMB: Math.round(os.freemem() / (1024 * 1024))
  };
  
  // Añadir información específica de Electron si está disponible
  if (isElectron) {
    try {
      info.electronVersion = process.versions.electron;
      const { app } = require('electron');
      info.appVersion = app.getVersion();
    } catch (error) {
      console.error('Error al obtener información de Electron:', error);
    }
  }
  
  return info;
}

/**
 * Verifica dependencias requeridas
 * @returns {Object} Estado de las dependencias
 */
function checkDependencies() {
  const dependencies = {
    pg: false,
    exceljs: false,
    'file-saver': false,
    pdfmake: false
  };
  
  let missingCount = 0;
  
  try {
    // Intentar cargar cada dependencia
    Object.keys(dependencies).forEach(dep => {
      try {
        require(dep);
        dependencies[dep] = true;
      } catch (err) {
        dependencies[dep] = false;
        missingCount++;
      }
    });
  } catch (error) {
    return {
      success: false,
      dependencies,
      error: error.message
    };
  }
  
  return {
    success: missingCount === 0,
    dependencies,
    missing: missingCount
  };
}

/**
 * Verifica los recursos del sistema (memoria, CPU)
 * @returns {Object} Estado de los recursos del sistema
 */
function checkSystemResources() {
  const totalMemoryMB = Math.round(os.totalmem() / (1024 * 1024));
  const freeMemoryMB = Math.round(os.freemem() / (1024 * 1024));
  const memoryUsagePercent = 100 - Math.round((freeMemoryMB / totalMemoryMB) * 100);
  const cpuCores = os.cpus().length;
  
  // Requerimientos mínimos recomendados
  const minMemoryMB = 2048; // 2 GB
  const minFreeMB = 512;   // 512 MB libres
  const minCores = 2;      // Al menos 2 núcleos
  const maxMemoryUsage = 85; // Max 85% de uso
  
  const memoryWarning = totalMemoryMB < minMemoryMB || freeMemoryMB < minFreeMB || memoryUsagePercent > maxMemoryUsage;
  const cpuWarning = cpuCores < minCores;
  
  return {
    sufficient: !memoryWarning && !cpuWarning,
    memory: {
      totalMemoryMB,
      freeMemoryMB,
      usagePercent: memoryUsagePercent,
      warning: memoryWarning,
      minimum: {
        totalMemoryMB: minMemoryMB,
        freeMemoryMB: minFreeMB,
        maxUsagePercent: maxMemoryUsage
      }
    },
    cpu: {
      cores: cpuCores,
      warning: cpuWarning,
      minimum: {
        cores: minCores
      }
    }
  };
}

/**
 * Ejecuta las verificaciones y muestra un resumen en consola
 */
async function runAndLogChecks() {
  console.log('🔍 Iniciando verificación pre-sorteo...');
  const result = await runPreSorteoChecks();
  
  console.log('\n📊 Resultados de la verificación pre-sorteo:');
  console.log('----------------------------------------');
  
  const statusIcons = {
    success: '✅',
    warning: '⚠️',
    error: '❌',
    pending: '⏳'
  };
  
  // Imprimir cada verificación
  Object.entries(result.checks).forEach(([checkName, check]) => {
    console.log(`${statusIcons[check.status]} ${checkName}: ${check.status.toUpperCase()}`);
    
    // Imprimir detalles específicos según el tipo de verificación
    if (checkName === 'database' && check.status === 'error') {
      console.log('   └─ No se pudo conectar a la base de datos PostgreSQL');
    } else if (checkName === 'diskSpace' && check.status === 'error') {
      console.log('   └─ No hay suficiente espacio en disco (se requieren 500MB)');
    } else if (checkName === 'tablesExist' && check.status !== 'success') {
      console.log('   └─ Tablas faltantes: ' + check.details.missing.join(', '));
    } else if (checkName === 'schemaValid' && check.status !== 'success') {
      if (check.details.invalidTables && check.details.invalidTables.length > 0) {
        console.log('   └─ Tablas con estructura incorrecta: ' + check.details.invalidTables.join(', '));
      } else if (check.details.error) {
        console.log('   └─ Error: ' + check.details.error);
      }
    } else if (checkName === 'dependencies' && check.status !== 'success') {
      console.log('   └─ Dependencias faltantes: ' + 
        Object.entries(check.details.dependencies)
          .filter(([_, installed]) => !installed)
          .map(([name]) => name)
          .join(', ')
      );
    } else if (checkName === 'systemResources' && check.status !== 'success') {
      if (check.details.memory.warning) {
        console.log('   └─ Memoria: ' + check.details.memory.freeMemoryMB + 'MB libres de ' + 
                   check.details.memory.totalMemoryMB + 'MB (' + check.details.memory.usagePercent + '% en uso)');
      }
      if (check.details.cpu.warning) {
        console.log('   └─ CPU: ' + check.details.cpu.cores + ' núcleos (mínimo recomendado: ' + 
                   check.details.cpu.minimum.cores + ')');
      }
    }
  });
  
  console.log('----------------------------------------');
  console.log(`Resultado general: ${statusIcons[result.overall]} ${result.overall.toUpperCase()}`);
  
  return result;
}

// Exponer funciones
module.exports = {
  runPreSorteoChecks,
  runAndLogChecks
}; 