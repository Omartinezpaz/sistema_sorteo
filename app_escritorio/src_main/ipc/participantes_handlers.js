const { ipcMain } = require('electron');
const { query } = require('../database/db');
const { app } = require('electron');
const path = require('path');
const fs = require('fs');

function setupParticipantesHandlers() {
  // Obtener participantes de un sorteo específico
  ipcMain.handle('participantes:getParticipantesBySorteo', async (event, sorteoId, soloValidados) => {
    try {
      // Verificar el esquema actual
      const columnasResult = await query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_schema = 'public' 
         AND table_name = 'participantes'`
      );
      
      // Asegurarse de que columnasResult sea un array
      const columnas = Array.isArray(columnasResult) ? columnasResult : [];
      
      // Crear mapa de columnas existentes para fácil verificación
      const columnasExistentes = new Set(columnas.map(col => col.column_name));
      
      console.log('Columnas existentes en participantes:', Array.from(columnasExistentes));
      
      // Verificar el esquema para determinar la consulta apropiada
      const tieneEstadoId = columnasExistentes.has('estado_id');
      const tieneEstado = columnasExistentes.has('estado');
      const tieneFechaCreacion = columnasExistentes.has('fecha_creacion');
      
      // Base de la consulta (campos mínimos que deberían existir en cualquier esquema)
      let baseSQL = `
        SELECT p.id, p.sorteo_id`;
      
      // Nombres de persona
      if (columnasExistentes.has('nombre')) {
        baseSQL += `, p.nombre`;
      }
      if (columnasExistentes.has('apellido')) {
        baseSQL += `, p.apellido`;
      }
      
      // Agregar documento según el esquema
      if (columnasExistentes.has('documento')) {
        baseSQL += `, p.documento`;
      } else if (columnasExistentes.has('documento_identidad')) {
        baseSQL += `, p.documento_identidad as documento`;
      }
      
      // Contacto
      if (columnasExistentes.has('telefono')) {
        baseSQL += `, p.telefono`;
      }
      if (columnasExistentes.has('email')) {
        baseSQL += `, p.email`;
      }
      
      // Agregar dirección y localidad si existen
      if (columnasExistentes.has('direccion')) {
        baseSQL += `, p.direccion`;
      }
      if (columnasExistentes.has('localidad')) {
        baseSQL += `, p.localidad`;
      }
      
      // Incluir fecha_creacion si existe
      if (tieneFechaCreacion) {
        baseSQL += `, p.fecha_creacion`;
      }
      
      // Campo de validación siempre presente
      if (columnasExistentes.has('validado')) {
        baseSQL += `, p.validado`;
      } else {
        baseSQL += `, false as validado`; // Valor por defecto si no existe
      }
      
      // Campos opcionales de validación
      if (columnasExistentes.has('validado_por')) {
        baseSQL += `, p.validado_por`;
      }
      if (columnasExistentes.has('fecha_validacion')) {
        baseSQL += `, p.fecha_validacion`;
      }
      
      // Gestión de estado/municipio/parroquia según esquema
      if (tieneEstadoId) {
        baseSQL += `, p.estado_id, p.municipio_id, p.parroquia_id,
          e.nom_estado as estado_nombre, 
          m.nom_municipio as municipio_nombre,
          pa.nom_parroquia as parroquia_nombre`;
      } else if (tieneEstado) {
        baseSQL += `, p.estado, p.municipio`;
      }
      
      // Campos para tiques y metadata
      if (columnasExistentes.has('metodo_registro')) {
        baseSQL += `, p.metodo_registro`;
      }
      
      if (columnasExistentes.has('datos_adicionales')) {
        baseSQL += `, p.datos_adicionales`;
      }
      
      if (columnasExistentes.has('numero_tique')) {
        baseSQL += `, p.numero_tique, p.prefijo_tique, p.codigo_tique, p.tique_asignado, p.fecha_asignacion_tique`;
      }
      
      // FROM y joins
      baseSQL += ` FROM participantes p`;
      
      // Joins para las referencias si existen
      if (tieneEstadoId) {
        baseSQL += `
          LEFT JOIN estados e ON p.estado_id = e.id
          LEFT JOIN municipios m ON p.municipio_id = m.id
          LEFT JOIN parroquias pa ON p.parroquia_id = pa.id`;
      }
      
      // WHERE
      baseSQL += ` WHERE p.sorteo_id = $1`;
      
      // Filtrar por validados si se solicita
      if (soloValidados && columnasExistentes.has('validado')) {
        baseSQL += ` AND p.validado = true`;
      }
      
      // Orden
      if (tieneFechaCreacion) {
        baseSQL += ` ORDER BY p.fecha_creacion DESC`;
      } else {
        baseSQL += ` ORDER BY p.id DESC`;
      }
      
      // Consulta final
      const sql = baseSQL;
      const params = [sorteoId];
      
      console.log('Ejecutando consulta de participantes con SQL dinámico: ', sql);
      const result = await query(sql, params);
      
      // Asegurarse de que result sea un array
      const participantes = Array.isArray(result) ? result : [];
      
      // Agregar fecha_creacion si no existe en el resultado
      if (!tieneFechaCreacion) {
        participantes.forEach(participante => {
          participante.fecha_creacion = new Date().toISOString();
        });
      }
      
      // Normalizar estados si existen diferentes formatos
      participantes.forEach(participante => {
        // Convertir objeto de estado a string si es necesario (caso especial)
        if (participante.estado && typeof participante.estado === 'object') {
          console.warn('Detectado estado como objeto en lugar de string:', participante.estado);
          participante.estado = participante.estado.nombre || 
                              participante.estado.nom_estado || 
                              'Estado sin nombre';
        }
        
        // Si tenemos estado_id pero no estado, crear campo de estado
        if (participante.estado_id && !participante.estado) {
          participante.estado = participante.estado_nombre || 'N/D';
        }
        
        // Si tenemos municipio_id pero no municipio, crear campo de municipio
        if (participante.municipio_id && !participante.municipio) {
          participante.municipio = participante.municipio_nombre || 'N/D';
        }
      });
      
      return participantes;
    } catch (error) {
      console.error(`Error al obtener participantes del sorteo ${sorteoId}:`, error);
      console.error("Stack trace:", error.stack);
      throw error;
    }
  });
  
  // Obtener un participante específico por ID
  ipcMain.handle('participantes:getParticipanteById', async (event, participanteId) => {
    try {
      // Consulta simplificada para mayor compatibilidad
      const sql = `
        SELECT * FROM participantes
        WHERE id = $1
      `;
      
      const result = await query(sql, [participanteId]);
      
      // Asegurarse de que result sea un array
      const participantes = Array.isArray(result) ? result : [];
      
      if (participantes.length === 0) {
        return null;
      }
      
      // Normalizar resultado
      if (!participantes[0].fecha_creacion) {
        participantes[0].fecha_creacion = new Date().toISOString();
      }
      
      // Normalizar estados si existen diferentes formatos
      if (participantes[0].estado && typeof participantes[0].estado === 'object') {
        participantes[0].estado = participantes[0].estado.nombre || 
                           participantes[0].estado.nom_estado || 
                           'Estado sin nombre';
      }
      
      return participantes[0];
    } catch (error) {
      console.error(`Error al obtener participante con ID ${participanteId}:`, error);
      throw error;
    }
  });
  
  // Crear un nuevo participante
  ipcMain.handle('participantes:createParticipante', async (event, participanteData) => {
    try {
      // Verificar si existe la columna fecha_creacion
      const columnCheck = await query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_schema = 'public' 
         AND table_name = 'participantes' 
         AND column_name = 'fecha_creacion'`
      );
      
      const { 
        sorteo_id, nombre, apellido, documento, telefono, email, 
        direccion, localidad, estado_id, municipio_id, parroquia_id,
        datos_adicionales = {} 
      } = participanteData;
      
      let sql, params;
      
      if (columnCheck && columnCheck.length > 0) {
        // Si existe la columna fecha_creacion
        sql = `
          INSERT INTO participantes (
            sorteo_id, nombre, apellido, documento, telefono, email, 
            direccion, localidad, estado_id, municipio_id, parroquia_id,
            metodo_registro, datos_adicionales, fecha_creacion
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
          RETURNING *
        `;
      } else {
        // Si no existe la columna fecha_creacion
        sql = `
          INSERT INTO participantes (
            sorteo_id, nombre, apellido, documento, telefono, email, 
            direccion, localidad, estado_id, municipio_id, parroquia_id,
            metodo_registro, datos_adicionales
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING *
        `;
      }
      
      params = [
        sorteo_id, nombre, apellido, documento, telefono, email, 
        direccion, localidad, estado_id, municipio_id, parroquia_id,
        participanteData.metodo_registro || 'manual',
        JSON.stringify(datos_adicionales)
      ];
      
      const result = await query(sql, params);
      
      // Agregar fecha_creacion si no existe
      if (columnCheck.length === 0) {
        result[0].fecha_creacion = new Date().toISOString();
      }
      
      return result[0];
    } catch (error) {
      console.error('Error al crear participante:', error);
      throw error;
    }
  });
  
  // Actualizar un participante existente
  ipcMain.handle('participantes:updateParticipante', async (event, participanteId, participanteData) => {
    try {
      // Construir la consulta dinámicamente
      let setClauses = [];
      let params = [];
      let paramIndex = 1;
      
      // Campos que se pueden actualizar
      const updatableFields = [
        'nombre', 'apellido', 'documento', 'telefono', 'email', 
        'direccion', 'localidad', 'estado_id', 'municipio_id', 
        'parroquia_id', 'validado', 'validado_por', 'metodo_registro'
      ];
      
      updatableFields.forEach(field => {
        if (participanteData[field] !== undefined) {
          setClauses.push(`${field} = $${paramIndex}`);
          params.push(participanteData[field]);
          paramIndex++;
        }
      });
      
      // Manejar datos_adicionales (JSON)
      if (participanteData.datos_adicionales !== undefined) {
        setClauses.push(`datos_adicionales = $${paramIndex}`);
        params.push(JSON.stringify(participanteData.datos_adicionales));
        paramIndex++;
      }
      
      // Si no hay nada para actualizar
      if (setClauses.length === 0) {
        return { id: participanteId, message: 'No se proporcionaron campos para actualizar' };
      }
      
      // Completar la consulta
      params.push(participanteId);
      const sql = `
        UPDATE participantes
        SET ${setClauses.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const result = await query(sql, params);
      
      if (result.length === 0) {
        throw new Error(`Participante con ID ${participanteId} no encontrado`);
      }
      
      // Verificar si existe la columna fecha_creacion
      const columnCheck = await query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_schema = 'public' 
         AND table_name = 'participantes' 
         AND column_name = 'fecha_creacion'`
      );
      
      // Agregar fecha_creacion si no existe
      if (columnCheck.length === 0) {
        result[0].fecha_creacion = new Date().toISOString();
      }
      
      return result[0];
    } catch (error) {
      console.error(`Error al actualizar participante con ID ${participanteId}:`, error);
      throw error;
    }
  });
  
  // Eliminar un participante
  ipcMain.handle('participantes:deleteParticipante', async (event, participanteId) => {
    try {
      const result = await query(
        'DELETE FROM participantes WHERE id = $1 RETURNING id',
        [participanteId]
      );
      
      if (result.length === 0) {
        throw new Error(`Participante con ID ${participanteId} no encontrado`);
      }
      
      return { id: participanteId, deleted: true };
    } catch (error) {
      console.error(`Error al eliminar participante con ID ${participanteId}:`, error);
      throw error;
    }
  });
  
  // Validar un participante
  ipcMain.handle('participantes:validarParticipante', async (event, participanteId, usuarioId) => {
    try {
      const result = await query(
        `UPDATE participantes
         SET validado = true, 
             validado_por = $1,
             fecha_validacion = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [usuarioId, participanteId]
      );
      
      if (result.length === 0) {
        throw new Error(`Participante con ID ${participanteId} no encontrado`);
      }
      
      return result[0];
    } catch (error) {
      console.error(`Error al validar participante con ID ${participanteId}:`, error);
      throw error;
    }
  });
  
  // Asignar tiques a un participante
  ipcMain.handle('participantes:asignarTiques', async (event, sorteoId, participanteIds) => {
    try {
      // Aquí implementar la lógica para asignar tiques (números) a los participantes
      // Puede incluir llamadas a procedimientos almacenados o funciones específicas
      
      // Ejemplo básico:
      if (!Array.isArray(participanteIds) || participanteIds.length === 0) {
        throw new Error('Se debe proporcionar al menos un participante para asignar tiques');
      }
      
      const placeholders = participanteIds.map((_, index) => `$${index + 2}`).join(',');
      const params = [sorteoId, ...participanteIds];
      
      const sql = `
        UPDATE participantes
        SET datos_adicionales = COALESCE(datos_adicionales, '{}'::jsonb) || 
                               '{"tiques_asignados": true, "fecha_asignacion": "' || CURRENT_TIMESTAMP || '"}'::jsonb
        WHERE sorteo_id = $1 AND id IN (${placeholders})
        RETURNING id, nombre, apellido, documento, datos_adicionales
      `;
      
      const result = await query(sql, params);
      
      return {
        cantidadAsignados: result.length,
        participantes: result
      };
    } catch (error) {
      console.error(`Error al asignar tiques para el sorteo ${sorteoId}:`, error);
      throw error;
    }
  });
  
  // Importar participantes desde archivo
  ipcMain.handle('participantes:importarParticipantes', async (event, sorteoId, participantesData) => {
    try {
      if (!Array.isArray(participantesData) || participantesData.length === 0) {
        throw new Error('No hay participantes para importar');
      }
      
      // Verificar si existe la columna fecha_creacion
      const columnCheck = await query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_schema = 'public' 
         AND table_name = 'participantes' 
         AND column_name = 'fecha_creacion'`
      );
      
      // Importar cada participante
      const participantesImportados = [];
      
      for (const participante of participantesData) {
        let sql, params;
        
        // Preparar los datos básicos
        const { 
          nombre, apellido, documento, telefono, email, 
          direccion, localidad, estado_id, municipio_id, parroquia_id,
          datos_adicionales = {} 
        } = participante;
        
        if (columnCheck && columnCheck.length > 0) {
          // Si existe la columna fecha_creacion
          sql = `
            INSERT INTO participantes (
              sorteo_id, nombre, apellido, documento, telefono, email, 
              direccion, localidad, estado_id, municipio_id, parroquia_id,
              metodo_registro, datos_adicionales, fecha_creacion
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
            RETURNING *
          `;
        } else {
          // Si no existe la columna fecha_creacion
          sql = `
            INSERT INTO participantes (
              sorteo_id, nombre, apellido, documento, telefono, email, 
              direccion, localidad, estado_id, municipio_id, parroquia_id,
              metodo_registro, datos_adicionales
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
          `;
        }
        
        params = [
          sorteoId, 
          nombre || '', 
          apellido || '', 
          documento || '', 
          telefono || '', 
          email || '',
          direccion || '', 
          localidad || '', 
          estado_id || null, 
          municipio_id || null, 
          parroquia_id || null,
          'importacion',
          JSON.stringify({
            ...datos_adicionales,
            fecha_importacion: new Date().toISOString()
          })
        ];
        
        const result = await query(sql, params);
        
        // Agregar fecha_creacion si no existe
        if (columnCheck.length === 0) {
          result[0].fecha_creacion = new Date().toISOString();
        }
        
        participantesImportados.push(result[0]);
      }
      
      return {
        mensaje: `Se importaron ${participantesImportados.length} participantes`,
        cantidad: participantesImportados.length,
        participantes: participantesImportados
      };
    } catch (error) {
      console.error(`Error al importar participantes para el sorteo ${sorteoId}:`, error);
      throw error;
    }
  });
  
  // MANEJADOR: Generar tiques por estado (BACKUP de función original)
  ipcMain.handle('participantes:generarTiquesPorEstado', async (event, sorteoId, prefijo = 'TIQ') => {
    console.log('[participantes_handlers] generarTiquesPorEstado iniciado:', { sorteoId, prefijo });

    try {
      // Importar módulos necesarios
      const { app } = require('electron');
      const path = require('path');
      const fs = require('fs');
      const fsSync = require('fs');
      const db = require('../database/db');

      // Verificar primero si el sorteo existe
      const sorteoResult = await db.query('SELECT id, nombre FROM sorteos WHERE id = $1', [sorteoId]);
      
      if (!sorteoResult || !sorteoResult.rows || sorteoResult.rows.length === 0) {
        throw new Error(`Sorteo con ID ${sorteoId} no encontrado`);
      }
      
      const sorteoInfo = sorteoResult.rows[0];
      console.log(`[participantes_handlers] Generando tiques para sorteo: ${sorteoInfo.nombre} (ID: ${sorteoId})`);

      // Intentar varias ubicaciones en caso de errores de permisos
      let outputDir = '';
      let dirCreated = false;
      const userDownloads = app.getPath('downloads');
      
      // Lista de posibles ubicaciones para crear el directorio
      const possibleDirs = [
        path.join(userDownloads, 'sorteo_tiques'),
        path.join(app.getPath('documents'), 'sorteo_tiques'),
        path.join(app.getPath('temp'), 'sorteo_tiques'),
        path.join(app.getPath('userData'), 'tiques')
      ];
      
      // Intentar crear el directorio en cada ubicación hasta encontrar una con permisos adecuados
      for (const dir of possibleDirs) {
        try {
          console.log(`[participantes_handlers] Intentando crear directorio en: ${dir}`);
          
          if (!fsSync.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
          }
          
          // Verificar si podemos escribir en el directorio
          const testFile = path.join(dir, '.write_test');
          fs.writeFileSync(testFile, 'test');
          fs.unlinkSync(testFile);
          
          // Si llegamos aquí, el directorio es escribible
          outputDir = dir;
          dirCreated = true;
          console.log(`[participantes_handlers] Directorio creado/verificado correctamente: ${outputDir}`);
          break;
        } catch (dirError) {
          console.error(`[participantes_handlers] Error al crear/verificar directorio ${dir}:`, dirError.message);
          // Continuar con la siguiente ubicación
        }
      }
      
      if (!dirCreated) {
        throw new Error('No se pudo crear un directorio con permisos de escritura en ninguna ubicación');
      }
      
      // Generar nombre de archivo con fecha y hora
      const fecha = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
      const archivoSalida = path.join(outputDir, `tiques_sorteo_${sorteoId}_${fecha}.csv`);
      
      console.log('[participantes_handlers] Archivo de salida:', archivoSalida);
      
      // Implementación JavaScript para generar tiques desde la tabla re_723
      console.log('[participantes_handlers] Generando tiques usando la tabla re_723...');
      
      // 1. Primero verificar si hay datos en la tabla re_723
      const conteoRe723 = await db.query('SELECT COUNT(*) FROM public.re_723');
      
      if (!conteoRe723 || !conteoRe723.rows || !conteoRe723.rows[0] || conteoRe723.rows[0].count <= 0) {
        throw new Error('No hay datos en la tabla de referencia re_723');
      }
      
      console.log(`[participantes_handlers] La tabla re_723 contiene ${conteoRe723.rows[0].count} registros`);
      
      // 2. Obtener conteo por estado para generar estadísticas
      const estadosResult = await db.query(`
        SELECT cod_estado, COUNT(*) AS cantidad 
        FROM public.re_723 
        GROUP BY cod_estado 
        ORDER BY cod_estado
      `);
      
      if (!estadosResult || !estadosResult.rows || estadosResult.rows.length === 0) {
        throw new Error('No se pudieron obtener estadísticas por estado de la tabla re_723');
      }
      
      // 3. Preparar objetos para estadísticas
      const tiquesPorEstado = {};
      let totalTiques = 0;
      
      estadosResult.rows.forEach(estado => {
        tiquesPorEstado[estado.cod_estado] = parseInt(estado.cantidad);
        totalTiques += parseInt(estado.cantidad);
      });
      
      console.log(`[participantes_handlers] Distribución de tiques por estado:`, tiquesPorEstado);
      console.log(`[participantes_handlers] Total de tiques a generar: ${totalTiques}`);
      
      // 4. Generar CSV con cabecera
      let csvContent = 'cedula,nombre,apellido,estado,municipio,parroquia,telefono,email,prefijo_tique,numero_tique,codigo_tique\n';
      
      // 5. Procesar los datos por bloques (para evitar problemas de memoria)
      let contador = 1;
      const LIMITE_CONSULTA = 10000; // Número de registros a procesar por lote
      let offset = 0;
      
      while (true) {
        console.log(`[participantes_handlers] Procesando lote desde ${offset} hasta ${offset + LIMITE_CONSULTA}...`);
        
        // Consultar datos de re_723 en bloques
        const participantesLote = await db.query(`
          SELECT 
            nac || cedula_ch AS cedula,
            p_nombre AS nombre,
            p_apellido AS apellido,
            cod_estado AS estado,
            cod_municipio AS municipio,
            cod_parroquia AS parroquia,
            telefono
          FROM 
            public.re_723
          ORDER BY cod_estado, RANDOM()
          LIMIT $1 OFFSET $2
        `, [LIMITE_CONSULTA, offset]);
        
        if (!participantesLote.rows || participantesLote.rows.length === 0) {
          break; // No hay más registros
        }
        
        // Procesar cada registro del lote
        for (const p of participantesLote.rows) {
          const estado = p.estado || '00';
          const numeroTique = contador++;
          const codigoTique = `${prefijo}-${estado.padStart(2, '0')}-${numeroTique.toString().padStart(5, '0')}`;
          
          // Agregar línea al CSV
          csvContent += `${p.cedula || ''},${p.nombre || ''},${p.apellido || ''},${estado},` +
                       `${p.municipio || ''},${p.parroquia || ''},${p.telefono || ''},,` + // Email vacío
                       `${prefijo},${numeroTique},${codigoTique}\n`;
          
          // Cada 50,000 registros, escribir al archivo para liberar memoria
          if (contador % 50000 === 0) {
            fs.appendFileSync(archivoSalida, csvContent, 'utf8');
            csvContent = ''; // Reiniciar para liberar memoria
            console.log(`[participantes_handlers] Progreso: ${contador} tiques procesados...`);
          }
          
          // Opcional: También insertar en la tabla participantes
          try {
            await db.query(`
              INSERT INTO participantes (
                sorteo_id, nombre, apellido, documento_identidad, 
                estado, municipio, parroquia, telefono, email,
                prefijo_tique, numero_tique, codigo_tique, 
                tique_asignado, fecha_asignacion_tique, 
                validado, fecha_creacion, fecha_registro
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            `, [
              sorteoId, 
              p.nombre || '',
              p.apellido || '', 
              p.cedula || '',
              p.estado || '',
              p.municipio || '', 
              p.parroquia || '', 
              p.telefono || '',
              '', // email vacío
              prefijo,
              numeroTique,
              codigoTique,
              true,
              new Date(),
              true,
              new Date(),
              new Date()
            ]);
          } catch (insertError) {
            // Solo registrar el error, pero continuar el proceso
            console.error(`[participantes_handlers] Error al insertar participante en BD:`, insertError.message);
          }
        }
        
        // Avanzar al siguiente lote
        offset += participantesLote.rows.length;
        
        // Si el lote tiene menos registros que el límite, hemos terminado
        if (participantesLote.rows.length < LIMITE_CONSULTA) {
          break;
        }
      }
      
      // Escribir cualquier contenido restante al archivo
      if (csvContent.length > 0) {
        fs.appendFileSync(archivoSalida, csvContent, 'utf8');
      }
      
      console.log(`[participantes_handlers] Generación completada. Total: ${contador - 1} tiques`);
      
      // Actualizar metadata del sorteo
      try {
        await db.query(
          `UPDATE sorteos 
           SET metadata = COALESCE(metadata, '{}'::jsonb) || 
                         jsonb_build_object(
                             'total_participantes', $1,
                             'tiques_por_estado', $2,
                             'ultima_actualizacion', CURRENT_TIMESTAMP
                         )
           WHERE id = $3`,
          [totalTiques, JSON.stringify(tiquesPorEstado), sorteoId]
        );
        
        console.log('[participantes_handlers] Metadata del sorteo actualizada correctamente');
      } catch (metadataError) {
        console.error('[participantes_handlers] Error al actualizar metadata del sorteo:', metadataError.message);
      }
      
      return {
        resultado: {
          mensaje: `Se generaron ${totalTiques} tiques distribuidos entre ${Object.keys(tiquesPorEstado).length} estados`,
          total_tiques: totalTiques,
          tiques_por_estado: tiquesPorEstado
        },
        archivoSalida: archivoSalida
      };
      
    } catch (error) {
      console.error('[participantes_handlers] Error al generar tiques por estado:', error);
      console.error('[participantes_handlers] Stack del error:', error.stack);
      throw new Error(`Error al generar tiques: ${error.message}`);
    }
  });
  
  // Generar tiques por estado usando la distribución guardada
  ipcMain.handle('participantes:generarTiquesDesdeDistribucion', async (event, sorteoId, prefijo = 'TIQ', archivoSalida = null) => {
    try {
      console.log('Iniciando generación de tiques desde distribución para sorteo:', sorteoId);
      
      // Verificar si existe distribución para este sorteo
      const verificacion = await query(
        'SELECT COUNT(*) as total FROM distribucion_tiques WHERE sorteo_id = $1',
        [sorteoId]
      );
      
      // Verificación más robusta para manejar diferentes formatos de resultado
      let totalDistribuciones = 0;
      
      console.log('Resultado de verificación:', JSON.stringify(verificacion));
      
      if (verificacion) {
        // Si el resultado es un array de objetos (formato típico)
        if (Array.isArray(verificacion) && verificacion.length > 0 && verificacion[0] && typeof verificacion[0].total !== 'undefined') {
          totalDistribuciones = parseInt(verificacion[0].total);
          console.log('Encontrado formato array de objetos:', totalDistribuciones);
        } 
        // Si el resultado es un objeto con propiedad rows (formato node-postgres)
        else if (verificacion.rows && verificacion.rows.length > 0) {
          totalDistribuciones = parseInt(verificacion.rows[0].total);
          console.log('Encontrado formato node-postgres:', totalDistribuciones);
        }
        // Si el resultado es otro formato, intentar una última alternativa
        else if (typeof verificacion === 'object') {
          // Buscar cualquier propiedad que pueda contener el total
          for (const prop in verificacion) {
            if (verificacion[prop] && typeof verificacion[prop].total !== 'undefined') {
              totalDistribuciones = parseInt(verificacion[prop].total);
              console.log('Encontrado en propiedad:', prop, totalDistribuciones);
              break;
            }
          }
        }
      }
      
      console.log('Total de distribuciones encontradas:', totalDistribuciones);
      
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
          const progresoResult = await query(
            'SELECT metadata->>\'progreso_generacion\' as progreso FROM sorteos WHERE id = $1',
            [sorteoId]
          );
          
          // Manejar diferentes formatos de resultado para el progreso
          let progresoJson = null;
          
          if (Array.isArray(progresoResult) && progresoResult.length > 0 && progresoResult[0].progreso) {
            progresoJson = progresoResult[0].progreso;
          } else if (progresoResult && progresoResult.rows && progresoResult.rows.length > 0 && progresoResult.rows[0].progreso) {
            progresoJson = progresoResult.rows[0].progreso;
          }
          
          if (progresoJson) {
            try {
              // Asegurarse de que sea un objeto JSON válido
              const progreso = typeof progresoJson === 'string' ? JSON.parse(progresoJson) : progresoJson;
              event.sender.send('generacion-tiques:progreso', { sorteoId, progreso });
              
              // Si el progreso llegó al 100%, detener el monitoreo
              if (progreso.porcentaje === 100) {
                monitoreoActivo = false;
              } else {
                // Programar la próxima consulta
                setTimeout(consultarProgreso, 1000);
              }
            } catch (jsonError) {
              console.error('Error al parsear JSON de progreso:', jsonError);
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
      const result = await query(
        'SELECT * FROM generar_tiques_desde_distribucion($1, $2, $3)',
        [sorteoId, prefijo, archivoSalida]
      );
      
      // Detener el monitoreo explícitamente
      monitoreoActivo = false;
      
      // Manejar diferentes formatos de resultado
      let resultadoGeneracion = null;
      
      if (Array.isArray(result) && result.length > 0) {
        resultadoGeneracion = result[0];
      } else if (result && result.rows && result.rows.length > 0) {
        resultadoGeneracion = result.rows[0];
      }
      
      if (!resultadoGeneracion) {
        throw new Error('No se pudo ejecutar la generación de tiques o no se obtuvo un resultado válido');
      }
      
      console.log('Resultado de generación:', resultadoGeneracion);
      
      // Enviar evento de finalización
      event.sender.send('generacion-tiques:completado', { 
        sorteoId, 
        resultado: resultadoGeneracion,
        archivoSalida
      });
      
      return {
        resultado: resultadoGeneracion,
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
}

module.exports = setupParticipantesHandlers; 