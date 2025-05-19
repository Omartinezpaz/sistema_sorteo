/**
 * Script para verificar si hay sorteos en la base de datos y crear uno si no existe
 */

const { Pool } = require('pg');
require('dotenv').config();

// Configuración de conexión
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function verificarYCrearSorteo() {
  const client = await pool.connect();
  
  try {
    // Verificar estructura de la tabla sorteos primero
    const columnasResult = await client.query(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_schema = 'public' 
       AND table_name = 'sorteos'`
    );
    
    // Crear mapa de columnas existentes para fácil verificación
    const columnasExistentes = new Set(columnasResult.rows.map(col => col.column_name));
    console.log('Columnas existentes en la tabla sorteos:', Array.from(columnasExistentes));
    
    // Verificar si hay sorteos
    const countResult = await client.query('SELECT COUNT(*) FROM sorteos');
    console.log(`Número de sorteos en la base de datos: ${countResult.rows[0].count}`);
    
    if (parseInt(countResult.rows[0].count) > 0) {
      // Ya hay sorteos, mostrar el primero
      // Construir consulta basada en columnas existentes
      let query = 'SELECT id, nombre';
      
      // Agregar campos opcionales si existen
      if (columnasExistentes.has('tipo_sorteo')) {
        query += ', tipo_sorteo';
      } else if (columnasExistentes.has('tipo')) {
        query += ', tipo as tipo_sorteo';
      }
      
      if (columnasExistentes.has('fecha_sorteo')) {
        query += ', fecha_sorteo';
      }
      
      if (columnasExistentes.has('estado_actual')) {
        query += ', estado_actual';
      } else if (columnasExistentes.has('estado')) {
        query += ', estado as estado_actual';
      }
      
      query += ' FROM sorteos ORDER BY id LIMIT 1';
      
      const sorteosResult = await client.query(query);
      
      if (sorteosResult.rows.length > 0) {
        const sorteo = sorteosResult.rows[0];
        console.log('\nPrimer sorteo encontrado:');
        console.log(JSON.stringify(sorteo, null, 2));
        
        // Contar participantes
        const participantesResult = await client.query(
          'SELECT COUNT(*) FROM participantes WHERE sorteo_id = $1',
          [sorteo.id]
        );
        
        console.log(`\nNúmero de participantes en el sorteo ID ${sorteo.id}: ${participantesResult.rows[0].count}`);
        
        // Verificar si existe la columna validado en participantes
        const tieneValidado = (await client.query(
          `SELECT EXISTS (
             SELECT 1 
             FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'participantes' 
             AND column_name = 'validado'
           ) as existe`
        )).rows[0].existe;
        
        if (tieneValidado) {
          // Contar participantes validados
          const validadosResult = await client.query(
            'SELECT COUNT(*) FROM participantes WHERE sorteo_id = $1 AND validado = true',
            [sorteo.id]
          );
          
          console.log(`Número de participantes validados: ${validadosResult.rows[0].count}`);
        } else {
          console.log('La columna validado no existe en la tabla participantes');
        }
        
        return sorteo.id; // Retornar el ID del sorteo existente
      }
    }
    
    // No hay sorteos, crear uno nuevo
    console.log('\nNo hay sorteos o no se pudo obtener información. Creando uno nuevo...');
    
    // Construir la consulta de inserción según las columnas disponibles
    let campos = ['nombre'];
    let valores = ["'Sorteo de Prueba'"];
    
    if (columnasExistentes.has('descripcion')) {
      campos.push('descripcion');
      valores.push("'Sorteo creado automáticamente para pruebas'");
    }
    
    if (columnasExistentes.has('tipo_sorteo')) {
      campos.push('tipo_sorteo');
      valores.push("'nacional'");
    } else if (columnasExistentes.has('tipo')) {
      campos.push('tipo');
      valores.push("'nacional'");
    }
    
    if (columnasExistentes.has('fecha_sorteo')) {
      campos.push('fecha_sorteo');
      valores.push("NOW() + INTERVAL '7 days'");
    }
    
    if (columnasExistentes.has('estado_actual')) {
      campos.push('estado_actual');
      valores.push("'borrador'");
    } else if (columnasExistentes.has('estado')) {
      campos.push('estado');
      valores.push("'borrador'");
    }
    
    if (columnasExistentes.has('creado_por')) {
      campos.push('creado_por');
      valores.push('1');
    }
    
    if (columnasExistentes.has('fecha_creacion')) {
      campos.push('fecha_creacion');
      valores.push('NOW()');
    }
    
    if (columnasExistentes.has('metadata')) {
      campos.push('metadata');
      valores.push("'{\"premiosNacionales\": [{\"nombre\": \"Premio Principal\", \"descripcion\": \"Premio mayor de prueba\", \"valor\": \"1000\", \"orden\": \"1\", \"categoria\": \"principal\"}]}'::jsonb");
    }
    
    // Crear la consulta SQL
    const insertSQL = `
      INSERT INTO sorteos (${campos.join(', ')}) 
      VALUES (${valores.join(', ')})
      RETURNING id, nombre
    `;
    
    console.log('Ejecutando SQL:', insertSQL);
    
    // Crear un nuevo sorteo de prueba
    const nuevoSorteoResult = await client.query(insertSQL);
    
    const nuevoSorteo = nuevoSorteoResult.rows[0];
    console.log('\nNuevo sorteo creado:');
    console.log(JSON.stringify(nuevoSorteo, null, 2));
    
    return nuevoSorteo.id; // Retornar el ID del nuevo sorteo
    
  } catch (error) {
    console.error('Error al verificar o crear sorteo:', error);
    return null;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar la verificación
verificarYCrearSorteo()
  .then(sorteoId => {
    if (sorteoId) {
      console.log(`\nID de sorteo disponible para pruebas: ${sorteoId}`);
      
      // Sugerir el comando para insertar participantes
      console.log(`\nPara insertar participantes de prueba, ejecute:`);
      console.log(`node insertar_participantes_prueba.js ${sorteoId}`);
    } else {
      console.error('No se pudo obtener un ID de sorteo válido');
    }
  })
  .catch(err => {
    console.error('Error en el proceso:', err);
    process.exit(1);
  }); 