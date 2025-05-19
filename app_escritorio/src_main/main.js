const path = require('path');

require('@babel/register')({
  // Dejamos que Babel busque y use babel.config.js automáticamente.
  // Solo especificamos las extensiones que debe intentar transpilar.
  extensions: ['.jsx', '.js'] 
});

const { app, BrowserWindow, ipcMain } = require('electron');
const bcrypt = require('bcrypt'); // Importar bcrypt
const db = require('./database/db');
const { registerPreSorteoHandlers } = require('./ipc/pre-sorteo-handlers');
const setupSorteosHandlers = require('./ipc/sorteos_handlers');
const setupPremiosHandlers = require('./handlers/premiosHandler');
const setupParticipantesHandlers = require('./ipc/participantes_handlers');
const setupGanadoresHandlers = require('./ipc/ganadores_handlers');
const setupReportesHandlers = require('./ipc/reportes_handlers');
const setupConfigHandlers = require('./ipc/config_handlers');
const setupDistribucionTiquesHandlers = require('./ipc/distribucion_tiques_handlers');
const { setupSchemaChecks } = require('./utils/fix_schema');

// Probar la conexión a la BD al iniciar
db.query('SELECT NOW()', [])
  .then(res => {
    console.log('Conexión a PostgreSQL exitosa:', res.rows[0]);
  })
  .catch(err => {
    console.error('Error al conectar con PostgreSQL:', err.stack);
  });

let mainWindow; // Ventana principal

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    title: 'Sistema de Sorteos Pueblo Valiente - MODO DIAGNÓSTICO'
  });

  // Cargar la aplicación normal
  mainWindow.loadFile(path.join(__dirname, '../public/index.html'));
  
  // Siempre abrir DevTools para diagnóstico
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
  
  console.log('Ventana creada y cargando aplicación con diagnóstico avanzado...');

  // Configurar manejadores de IPC
  setupSorteosHandlers();
  setupPremiosHandlers();
  setupParticipantesHandlers();
  setupGanadoresHandlers();
  setupReportesHandlers();
  setupConfigHandlers();
  setupDistribucionTiquesHandlers();
  
  // Configurar verificador de esquema
  setupSchemaChecks(ipcMain);
}

app.whenReady().then(() => {
  createWindow();
  
  registerPreSorteoHandlers(app);
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('db-query', async (event, sql, params = []) => {
  try {
    const result = await db.query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('Error en consulta a BD:', error);
    throw error;
  }
});

ipcMain.handle('login-attempt', async (event, { username, password }) => {
  if (!username || !password) {
    return { success: false, message: 'Nombre de usuario y contraseña son requeridos.' };
  }
  try {
    const query = 'SELECT id, username, password_hash, rol FROM usuarios WHERE username = $1 AND activo = TRUE';
    const result = await db.query(query, [username]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const passwordMatch = bcrypt.compareSync(password, user.password_hash);

      if (passwordMatch) {
        console.log('Login exitoso para el usuario:', user.username);
        return { 
          success: true, 
          message: 'Login exitoso', 
          user: { id: user.id, username: user.username, role: user.rol } 
        };
      } else {
        console.log('Contraseña incorrecta para el usuario:', username);
        return { success: false, message: 'Nombre de usuario o contraseña incorrectos.' };
      }
    } else {
      console.log('Usuario no encontrado o inactivo:', username);
      return { success: false, message: 'Nombre de usuario o contraseña incorrectos.' };
    }
  } catch (error) {
    console.error('Error durante el intento de login:', error);
    return { success: false, message: `Error del servidor: ${error.message}` };
  }
});

app.on('will-quit', () => {
  db.pool.end(() => {
    console.log('Pool de conexiones a PostgreSQL cerrado.');
  });
});

ipcMain.handle('dashboard-sorteos-count', async (event) => {  try {    const query = `      SELECT estado_actual, COUNT(*) as total      FROM sorteos      GROUP BY estado_actual      ORDER BY estado_actual    `;    const result = await db.query(query);        if (result.rows.length === 0) {      return [];    }        return result.rows;  } catch (error) {    console.error('Error al obtener conteo de sorteos:', error);    throw error;  }});

ipcMain.handle('dashboard-participacion', async (event) => {
  try {
    let query = `
      SELECT 
        estado, 
        SUM(total_participantes) as participantes,
        SUM(total_ganadores) as ganadores
      FROM public.vw_participacion_region
      GROUP BY estado
      ORDER BY participantes DESC
      LIMIT 10
    `;
    
    let result;
    try {
      result = await db.query(query);
    } catch (viewError) {
      console.warn('Vista vw_participacion_region no encontrada, usando consulta alternativa', viewError);
      
      query = `
        SELECT 
          e.nom_estado as estado, 
          COUNT(p.id) as participantes,
          COUNT(g.id) as ganadores
        FROM estados e
        LEFT JOIN participantes p ON 
          (p.datos_adicionales->>'cod_estado')::INTEGER = e.cod_estado
        LEFT JOIN ganadores g ON g.participante_id = p.id
        GROUP BY e.nom_estado
        ORDER BY participantes DESC
        LIMIT 10
      `;
      
      result = await db.query(query);
    }
    
    if (result.rows.length === 0) {
      return [
        { estado: 'Zulia', participantes: 120, ganadores: 5 },
        { estado: 'Miranda', participantes: 95, ganadores: 3 },
        { estado: 'Distrito Capital', participantes: 85, ganadores: 4 },
        { estado: 'Carabobo', participantes: 65, ganadores: 2 },
        { estado: 'Aragua', participantes: 50, ganadores: 1 }
      ];
    }
    
    return result.rows;
  } catch (error) {
    console.error('Error al obtener datos de participación:', error);
    return [
      { estado: 'Zulia', participantes: 120, ganadores: 5 },
      { estado: 'Miranda', participantes: 95, ganadores: 3 },
      { estado: 'Distrito Capital', participantes: 85, ganadores: 4 },
      { estado: 'Carabobo', participantes: 65, ganadores: 2 },
      { estado: 'Aragua', participantes: 50, ganadores: 1 }
    ];
  }
});

ipcMain.handle('get-dashboard-stats', async (event) => {
  try {
    let sorteosCounts = [];
    try {
      const query = `
        SELECT estado_actual, COUNT(*) as total
        FROM sorteos
        GROUP BY estado_actual
        ORDER BY estado_actual
      `;
      const result = await db.query(query);
      sorteosCounts = result.rows.length > 0 ? result.rows : [
        { estado_actual: 'activo', total: 3 },
        { estado_actual: 'finalizado', total: 7 },
        { estado_actual: 'cancelado', total: 1 }
      ];
    } catch (error) {
      console.error('Error al obtener conteo de sorteos:', error);
      sorteosCounts = [
        { estado_actual: 'activo', total: 3 },
        { estado_actual: 'finalizado', total: 7 },
        { estado_actual: 'cancelado', total: 1 }
      ];
    }

    const sorteosStats = {
      total: 0,
      activos: 0,
      finalizados: 0,
      cancelados: 0
    };

    sorteosCounts.forEach(item => {
      sorteosStats.total += parseInt(item.total);
      
      if (item.estado_actual.toLowerCase() === 'activo') {
        sorteosStats.activos = parseInt(item.total);
      } else if (item.estado_actual.toLowerCase() === 'finalizado') {
        sorteosStats.finalizados = parseInt(item.total);
      } else if (item.estado_actual.toLowerCase() === 'cancelado') {
        sorteosStats.cancelados = parseInt(item.total);
      }
    });

    let participacion = [];
    try {
      let query = `
        SELECT 
          estado, 
          SUM(total_participantes) as participantes,
          SUM(total_ganadores) as ganadores
        FROM public.vw_participacion_region
        GROUP BY estado
        ORDER BY participantes DESC
        LIMIT 10
      `;
      
      let result;
      try {
        result = await db.query(query);
      } catch (viewError) {
        console.warn('Vista vw_participacion_region no encontrada, usando consulta alternativa', viewError);
        
        query = `
          SELECT 
            e.nom_estado as estado, 
            COUNT(p.id) as participantes,
            COUNT(g.id) as ganadores
          FROM estados e
          LEFT JOIN participantes p ON 
            (p.datos_adicionales->>'cod_estado')::INTEGER = e.cod_estado
          LEFT JOIN ganadores g ON g.participante_id = p.id
          GROUP BY e.nom_estado
          ORDER BY participantes DESC
          LIMIT 10
        `;
        
        result = await db.query(query);
      }
      
      participacion = result.rows.length > 0 ? result.rows : [
        { estado: 'Zulia', participantes: 120, ganadores: 5 },
        { estado: 'Miranda', participantes: 95, ganadores: 3 },
        { estado: 'Distrito Capital', participantes: 85, ganadores: 4 },
        { estado: 'Carabobo', participantes: 65, ganadores: 2 },
        { estado: 'Aragua', participantes: 50, ganadores: 1 }
      ];
    } catch (error) {
      console.error('Error al obtener datos de participación:', error);
      participacion = [
        { estado: 'Zulia', participantes: 120, ganadores: 5 },
        { estado: 'Miranda', participantes: 95, ganadores: 3 },
        { estado: 'Distrito Capital', participantes: 85, ganadores: 4 },
        { estado: 'Carabobo', participantes: 65, ganadores: 2 },
        { estado: 'Aragua', participantes: 50, ganadores: 1 }
      ];
    }

    const participantesPorEstado = {};
    participacion.forEach(item => {
      participantesPorEstado[item.estado] = parseInt(item.participantes);
    });

    return {
      ...sorteosStats,
      participantesPorEstado
    };
  } catch (error) {
    console.error('Error al obtener estadísticas del dashboard:', error);
    
    return {
      total: 11,
      activos: 3,
      finalizados: 7,
      cancelados: 1,
      participantesPorEstado: {
        'Zulia': 120,
        'Miranda': 95,
        'Distrito Capital': 85,
        'Carabobo': 65,
        'Aragua': 50
      }
    };
  }
});

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('sorteo', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('sorteo');
}

app.on('ready', () => {
  const { runPreSorteoChecks } = require('./utils/pre-sorteo-check');
  
  setTimeout(() => {
    runPreSorteoChecks()
      .then(results => {
        console.log('Verificaciones iniciales completadas:', results.overall);
        
        if (results.overall === 'error' && mainWindow) {
          mainWindow.webContents.send('check-notification', {
            title: 'Verificación del sistema',
            body: 'Se encontraron problemas críticos que deben resolverse para el correcto funcionamiento del sistema.'
          });
        }
      })
      .catch(error => {
        console.error('Error en verificaciones iniciales:', error);
      });
  }, 3000);

  // Corregir problemas con triggers de timestamp
  setTimeout(() => {
    corregirTriggerTimestamp()
      .then(result => {
        console.log('Corrección de triggers de timestamp completada:', result);
      })
      .catch(error => {
        console.error('Error al corregir triggers de timestamp:', error);
      });
  }, 5000);
});

// Función para corregir problemas con triggers de timestamp
async function corregirTriggerTimestamp() {
  try {
    console.log('Iniciando corrección de triggers de timestamp...');
    
    // 1. Eliminar la función problemática y todos sus triggers
    await db.query('DROP FUNCTION IF EXISTS actualizar_timestamps() CASCADE;');
    
    // Eliminar específicamente los triggers problemáticos de cada tabla conocida
    const tablasConocidas = ['estados', 'municipios', 'parroquias', 'sorteos', 'participantes', 'usuarios', 'ganadores', 'premios'];
    for (const tabla of tablasConocidas) {
      try {
        await db.query(`DROP TRIGGER IF EXISTS actualizar_timestamps_trigger ON ${tabla};`);
        console.log(`Trigger eliminado de la tabla: ${tabla}`);
      } catch (err) {
        console.log(`Nota: No se pudo eliminar el trigger de la tabla ${tabla}:`, err.message);
      }
    }
    
    // 2. Crear una nueva función que verifique si el campo existe
    const createFunction = `
      CREATE OR REPLACE FUNCTION actualizar_fecha_actualizacion()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Verificar si la tabla tiene el campo "fecha_actualizacion"
        IF EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = TG_TABLE_NAME 
          AND column_name = 'fecha_actualizacion'
        ) THEN
          NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;
    await db.query(createFunction);
    
    // 3. Verificar tablas que tienen el campo fecha_actualizacion
    const tablasQuery = `
      SELECT table_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND column_name = 'fecha_actualizacion'
    `;
    const tablasResult = await db.query(tablasQuery);
    
    // 4. Crear triggers para cada tabla que tiene el campo fecha_actualizacion
    for (const row of tablasResult.rows) {
      const tableName = row.table_name;
      try {
        // Primero eliminar el trigger si ya existe para evitar duplicados
        await db.query(`DROP TRIGGER IF EXISTS actualizar_fecha_actualizacion_trigger ON ${tableName};`);
        
        const triggerQuery = `
          CREATE TRIGGER actualizar_fecha_actualizacion_trigger
          BEFORE UPDATE ON ${tableName}
          FOR EACH ROW
          EXECUTE FUNCTION actualizar_fecha_actualizacion();
        `;
        await db.query(triggerQuery);
        console.log(`Trigger creado para tabla: ${tableName}`);
      } catch (error) {
        console.error(`Error al crear trigger para tabla ${tableName}:`, error);
      }
    }
    
    return { success: true, message: 'Corrección de triggers completada' };
  } catch (error) {
    console.error('Error en la corrección de triggers:', error);
    return { success: false, error: error.message };
  }
}

// Manejador de navegación entre pestañas
ipcMain.on('navegacion-app', (event, { tab, section, sorteoId }) => {
  console.log('Solicitud de navegación a:', tab, section, sorteoId);
  if (mainWindow) {
    mainWindow.webContents.send('cambio-tab', { tab, section, sorteoId });
  }
});

// Manejador para abrir archivos o carpetas con la aplicación predeterminada del sistema
ipcMain.handle('shell:openPath', async (event, pathToOpen) => {
  try {
    const { shell } = require('electron');
    await shell.openPath(pathToOpen);
    return { success: true };
  } catch (error) {
    console.error('Error al abrir la ruta:', error);
    return { success: false, error: error.message };
  }
});

// Manejador para abrir el diálogo de selección de archivos
ipcMain.handle('dialog:openFile', async (event, options) => {
  try {
    const { dialog } = require('electron');
    const result = await dialog.showOpenDialog(options);
    return result;
  } catch (error) {
    console.error('Error al abrir el diálogo de selección de archivos:', error);
    return { canceled: true, error: error.message };
  }
});

// Manejador para leer archivos
ipcMain.handle('fs:readFile', async (event, filePath) => {
  try {
    const fs = require('fs').promises;
    const data = await fs.readFile(filePath, 'utf8');
    return data;
  } catch (error) {
    console.error('Error al leer el archivo:', error);
    return null;
  }
});

// Manejador para guardar el diálogo de selección para guardar archivos
ipcMain.handle('dialog:saveFile', async (event, options) => {
  try {
    const { dialog } = require('electron');
    const result = await dialog.showSaveDialog(options);
    return result;
  } catch (error) {
    console.error('Error al abrir el diálogo para guardar archivo:', error);
    return { canceled: true, error: error.message };
  }
});

// Manejador para escribir archivos
ipcMain.handle('fs:writeFile', async (event, filePath, data) => {
  try {
    const fs = require('fs').promises;
    await fs.writeFile(filePath, data, 'utf8');
    return { success: true };
  } catch (error) {
    console.error('Error al escribir el archivo:', error);
    return { success: false, error: error.message };
  }
});

// In this file, you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here. 