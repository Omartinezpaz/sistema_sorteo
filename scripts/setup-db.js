const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuración de la conexión
const pool = new Pool({
  user: 'omarte',
  host: 'localhost',
  database: 'sorteo_db',
  password: 'Ap3r1t1v02025',
  port: 5432,
});

async function setupDatabase() {
  console.log('Iniciando configuración de la base de datos...');
  
  // 1. Corregir errores de timestamp
  console.log('\n=== Corrigiendo errores de timestamp ===');
  try {
    await corregirErrorTimestamp();
  } catch (error) {
    console.error('Error al corregir timestamp:', error);
  }
  
  // 2. Crear tipo personalizado
  console.log('\n=== Creando tipo personalizado para distribución ===');
  try {
    await crearTipoDistribucion();
  } catch (error) {
    console.error('Error al crear tipo distribución:', error);
  }
  
  // 3. Aplicar función de distribución de tickets
  console.log('\n=== Aplicando funciones de distribución de tickets ===');
  try {
    await aplicarFuncionDistribucion();
    await aplicarFuncionDistribucionConTipo();
  } catch (error) {
    console.error('Error al aplicar funciones de distribución:', error);
  }
  
  console.log('\nConfiguración de base de datos completada');
}

async function corregirErrorTimestamp() {
  const client = await pool.connect();
  
  try {
    console.log('Eliminando triggers y funciones problemáticas...');
    
    // Eliminar triggers problemáticos
    await client.query(`
      DROP TRIGGER IF EXISTS actualizar_timestamps_trigger ON estados;
      DROP TRIGGER IF EXISTS actualizar_timestamps_trigger ON municipios;
      DROP TRIGGER IF EXISTS actualizar_timestamps_trigger ON parroquias;
      DROP TRIGGER IF EXISTS actualizar_timestamps_trigger ON sorteos;
      DROP TRIGGER IF EXISTS actualizar_timestamps_trigger ON participantes;
      DROP TRIGGER IF EXISTS actualizar_timestamps_trigger ON usuarios;
    `);
    
    // Eliminar la función problemática
    await client.query(`DROP FUNCTION IF EXISTS actualizar_timestamps() CASCADE;`);
    
    console.log('Creando nueva función para actualizar fecha_actualizacion...');
    
    // Crear nueva función
    await client.query(`
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
    `);
    
    // Obtener todas las tablas con el campo fecha_actualizacion
    const tablasResult = await client.query(`
      SELECT table_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND column_name = 'fecha_actualizacion'
    `);
    
    console.log('Creando triggers para las tablas que tienen el campo fecha_actualizacion...');
    
    // Crear triggers para cada tabla
    for (const row of tablasResult.rows) {
      const tableName = row.table_name;
      try {
        await client.query(`
          CREATE OR REPLACE TRIGGER actualizar_fecha_actualizacion_trigger
          BEFORE UPDATE ON ${tableName}
          FOR EACH ROW
          EXECUTE FUNCTION actualizar_fecha_actualizacion();
        `);
        console.log(`- Trigger creado para tabla: ${tableName}`);
      } catch (error) {
        console.error(`- Error al crear trigger para tabla ${tableName}:`, error.message);
      }
    }
    
    console.log('Corrección de errores de timestamp completada.');
    return true;
  } catch (error) {
    console.error('Error en la corrección de timestamp:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function crearTipoDistribucion() {
  const client = await pool.connect();
  
  try {
    console.log('Creando tipo personalizado para distribución de tickets...');
    
    // Eliminar tipo si existe (para poder recrearlo)
    await client.query(`DROP TYPE IF EXISTS tipo_distribucion CASCADE;`);
    
    // Leer el archivo SQL con la definición del tipo
    const sqlFilePath = path.join(__dirname, '../database/migrations/crear_tipo_distribucion.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error(`Archivo no encontrado: ${sqlFilePath}`);
      return false;
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Ejecutar el SQL
    await client.query(sqlContent);
    
    // Verificar que el tipo existe
    const tipoResult = await client.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typname = 'tipo_distribucion'
    `);
    
    if (tipoResult.rows.length > 0) {
      console.log('Tipo tipo_distribucion creado correctamente.');
      return true;
    } else {
      console.error('El tipo no se creó correctamente.');
      return false;
    }
  } catch (error) {
    console.error('Error al crear tipo_distribucion:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function aplicarFuncionDistribucion() {
  const client = await pool.connect();
  
  try {
    console.log('Aplicando función de distribución de tickets por territorio...');
    
    // Leer el archivo SQL con la función
    const sqlFilePath = path.join(__dirname, '../database/migrations/distribuir_tickets_por_territorio.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error(`Archivo no encontrado: ${sqlFilePath}`);
      return false;
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Ejecutar el SQL
    await client.query(sqlContent);
    
    // Verificar que la función existe
    const funcResult = await client.query(`
      SELECT proname 
      FROM pg_proc 
      WHERE proname = 'distribuir_tickets_por_territorio'
    `);
    
    if (funcResult.rows.length > 0) {
      console.log('Función distribuir_tickets_por_territorio creada correctamente.');
      return true;
    } else {
      console.error('La función no se creó correctamente.');
      return false;
    }
  } catch (error) {
    console.error('Error al aplicar función de distribución:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function aplicarFuncionDistribucionConTipo() {
  const client = await pool.connect();
  
  try {
    console.log('Aplicando función de distribución con tipo personalizado...');
    
    // Leer el archivo SQL con la función
    const sqlFilePath = path.join(__dirname, '../database/migrations/distribuir_tickets_con_tipo.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error(`Archivo no encontrado: ${sqlFilePath}`);
      return false;
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Ejecutar el SQL
    await client.query(sqlContent);
    
    // Verificar que la función existe
    const funcResult = await client.query(`
      SELECT proname 
      FROM pg_proc 
      WHERE proname = 'distribuir_tickets_con_tipo'
    `);
    
    if (funcResult.rows.length > 0) {
      console.log('Función distribuir_tickets_con_tipo creada correctamente.');
      return true;
    } else {
      console.error('La función no se creó correctamente.');
      return false;
    }
  } catch (error) {
    console.error('Error al aplicar función de distribución con tipo:', error);
    throw error;
  } finally {
    client.release();
  }
}

setupDatabase()
  .then(() => {
    pool.end();
    console.log('Proceso finalizado.');
  })
  .catch(err => {
    console.error('Error en el proceso general:', err);
    pool.end();
    process.exit(1);
  }); 