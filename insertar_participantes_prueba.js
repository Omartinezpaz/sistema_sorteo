/**
 * Script para insertar participantes de prueba en un sorteo específico
 * Ejecutar con: node insertar_participantes_prueba.js SORTEO_ID
 */

const { Pool } = require('pg');
require('dotenv').config();

// Obtener el ID del sorteo desde los argumentos
const sorteoId = process.argv[2];

if (!sorteoId) {
  console.error('Debe proporcionar un ID de sorteo como argumento');
  console.error('Uso: node insertar_participantes_prueba.js SORTEO_ID');
  process.exit(1);
}

// Configuración de conexión
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// Datos base de participantes de prueba
const participantesPruebaBase = [
  {
    nombre: 'Juan',
    apellido: 'Pérez',
    documento_identidad: 'V-12345678',
    documento: 'V-12345678', // Campo alternativo
    telefono: '04141234567',
    email: 'juan@ejemplo.com',
    direccion: 'Calle Principal',
    localidad: 'Caracas',
    estado_id: 1, // Asumiendo que 1 es el ID de un estado válido
    municipio_id: 1,
    parroquia_id: 1
  },
  {
    nombre: 'María',
    apellido: 'González',
    documento_identidad: 'V-23456789',
    documento: 'V-23456789',
    telefono: '04245678901',
    email: 'maria@ejemplo.com',
    direccion: 'Av. Libertador',
    localidad: 'Maracaibo',
    estado_id: 2,
    municipio_id: 10,
    parroquia_id: 25
  },
  {
    nombre: 'Pedro',
    apellido: 'Ramírez',
    documento_identidad: 'V-34567890',
    documento: 'V-34567890',
    telefono: '04161234567',
    email: 'pedro@ejemplo.com',
    direccion: 'Urb. El Paraíso',
    localidad: 'Valencia',
    estado_id: 3,
    municipio_id: 15,
    parroquia_id: 30
  },
  {
    nombre: 'Ana',
    apellido: 'Martínez',
    documento_identidad: 'V-45678901',
    documento: 'V-45678901',
    telefono: '04247894561',
    email: 'ana@ejemplo.com',
    direccion: 'Calle Sucre',
    localidad: 'Barquisimeto',
    estado_id: 4,
    municipio_id: 20,
    parroquia_id: 35
  },
  {
    nombre: 'Luis',
    apellido: 'Torres',
    documento_identidad: 'V-56789012',
    documento: 'V-56789012',
    telefono: '04168907654',
    email: 'luis@ejemplo.com',
    direccion: 'Av. Bolívar',
    localidad: 'Mérida',
    estado_id: 5,
    municipio_id: 25,
    parroquia_id: 40
  }
];

async function insertarParticipantes() {
  const client = await pool.connect();
  
  try {
    // Iniciar transacción
    await client.query('BEGIN');
    
    // Verificar la estructura de la tabla participantes
    const columnasResult = await client.query(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_schema = 'public' 
       AND table_name = 'participantes'`
    );
    
    // Crear mapa de columnas existentes para fácil verificación
    const columnasExistentes = new Set(columnasResult.rows.map(col => col.column_name));
    console.log('Columnas existentes en la tabla participantes:', Array.from(columnasExistentes));
    
    // Determinar qué campos usar según el esquema actual
    const campoDocumento = columnasExistentes.has('documento_identidad') ? 'documento_identidad' : 'documento';
    const tieneValidado = columnasExistentes.has('validado');
    
    console.log(`Insertando ${participantesPruebaBase.length} participantes para el sorteo ${sorteoId}...`);
    
    for (const participanteBase of participantesPruebaBase) {
      // Crear objeto de participante con los campos correctos
      const participante = {};
      
      // Campos básicos que deberían existir
      participante.sorteo_id = sorteoId;
      
      // Datos personales si existen
      if (columnasExistentes.has('nombre')) participante.nombre = participanteBase.nombre;
      if (columnasExistentes.has('apellido')) participante.apellido = participanteBase.apellido;
      if (columnasExistentes.has(campoDocumento)) participante[campoDocumento] = participanteBase[campoDocumento];
      if (columnasExistentes.has('telefono')) participante.telefono = participanteBase.telefono;
      if (columnasExistentes.has('email')) participante.email = participanteBase.email;
      
      // Ubicación
      if (columnasExistentes.has('direccion')) participante.direccion = participanteBase.direccion;
      if (columnasExistentes.has('localidad')) participante.localidad = participanteBase.localidad;
      
      // Estado y municipio
      if (columnasExistentes.has('estado_id')) participante.estado_id = participanteBase.estado_id;
      if (columnasExistentes.has('municipio_id')) participante.municipio_id = participanteBase.municipio_id;
      if (columnasExistentes.has('parroquia_id')) participante.parroquia_id = participanteBase.parroquia_id;
      
      // Campos de control si existen
      if (tieneValidado) participante.validado = true;
      if (columnasExistentes.has('fecha_validacion')) participante.fecha_validacion = 'CURRENT_TIMESTAMP';
      if (columnasExistentes.has('validado_por')) participante.validado_por = 1;
      if (columnasExistentes.has('metodo_registro')) participante.metodo_registro = 'manual';
      if (columnasExistentes.has('fecha_creacion')) participante.fecha_creacion = 'CURRENT_TIMESTAMP';
      
      // Verificar primero si el participante ya existe
      const checkResult = await client.query(
        `SELECT id FROM participantes WHERE ${campoDocumento} = $1 AND sorteo_id = $2`,
        [participante[campoDocumento], sorteoId]
      );
      
      if (checkResult.rowCount > 0) {
        console.log(`Participante con ${campoDocumento} ${participante[campoDocumento]} ya existe. Actualizando...`);
        
        // Construir la consulta de actualización
        const setClauses = [];
        const valores = [];
        let paramIndex = 1;
        
        // Excluir campos que no queremos actualizar
        const camposExcluidos = ['sorteo_id', campoDocumento];
        
        // Agregar cada campo al SET
        Object.entries(participante).forEach(([campo, valor]) => {
          if (!camposExcluidos.includes(campo)) {
            if (valor === 'CURRENT_TIMESTAMP') {
              setClauses.push(`${campo} = CURRENT_TIMESTAMP`);
            } else {
              setClauses.push(`${campo} = $${paramIndex++}`);
              valores.push(valor);
            }
          }
        });
        
        // Agregar condiciones WHERE
        valores.push(participante[campoDocumento]);
        valores.push(sorteoId);
        
        const updateSQL = `
          UPDATE participantes
          SET ${setClauses.join(', ')}
          WHERE ${campoDocumento} = $${paramIndex++}
          AND sorteo_id = $${paramIndex}
        `;
        
        await client.query(updateSQL, valores);
      } else {
        // Construir la consulta de inserción
        const campos = [];
        const placeholders = [];
        const valores = [];
        let paramIndex = 1;
        
        // Procesar cada campo
        Object.entries(participante).forEach(([campo, valor]) => {
          campos.push(campo);
          
          if (valor === 'CURRENT_TIMESTAMP') {
            placeholders.push('CURRENT_TIMESTAMP');
          } else {
            placeholders.push(`$${paramIndex++}`);
            valores.push(valor);
          }
        });
        
        const insertSQL = `
          INSERT INTO participantes (${campos.join(', ')})
          VALUES (${placeholders.join(', ')})
        `;
        
        await client.query(insertSQL, valores);
      }
    }
    
    // Confirmar transacción
    await client.query('COMMIT');
    console.log('Participantes insertados exitosamente.');
    
    // Contar participantes en el sorteo
    const countResult = await client.query(
      'SELECT COUNT(*) FROM participantes WHERE sorteo_id = $1',
      [sorteoId]
    );
    
    console.log(`El sorteo ${sorteoId} ahora tiene ${countResult.rows[0].count} participantes.`);
    
    // Contar participantes validados si existe la columna
    if (tieneValidado) {
      const validadosResult = await client.query(
        'SELECT COUNT(*) FROM participantes WHERE sorteo_id = $1 AND validado = true',
        [sorteoId]
      );
      
      console.log(`El sorteo ${sorteoId} tiene ${validadosResult.rows[0].count} participantes validados.`);
    }
    
  } catch (error) {
    // Revertir en caso de error
    await client.query('ROLLBACK');
    console.error('Error al insertar participantes:', error);
  } finally {
    // Liberar cliente
    client.release();
    
    // Cerrar pool
    await pool.end();
  }
}

// Ejecutar función principal
insertarParticipantes()
  .then(() => {
    console.log('Proceso finalizado');
  })
  .catch(err => {
    console.error('Error en el proceso:', err);
    process.exit(1);
  }); 