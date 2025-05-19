const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración de la conexión
const pool = new Pool({
  user: 'omarte',
  host: 'localhost',
  database: 'sorteo_db',
  password: 'Ap3r1t1v02025',
  port: 5432,
});

async function corregirTrigger() {
  const client = await pool.connect();
  
  try {
    console.log('Iniciando corrección del trigger de timestamp...');
    
    // Ejecutar las instrucciones SQL directamente
    await client.query('BEGIN');
    
    // Eliminar triggers problemáticos
    const dropTriggers = `
      DROP TRIGGER IF EXISTS actualizar_timestamps_trigger ON estados;
      DROP TRIGGER IF EXISTS actualizar_timestamps_trigger ON municipios;
      DROP TRIGGER IF EXISTS actualizar_timestamps_trigger ON parroquias;
      DROP TRIGGER IF EXISTS actualizar_timestamps_trigger ON sorteos;
      DROP TRIGGER IF EXISTS actualizar_timestamps_trigger ON participantes;
      DROP TRIGGER IF EXISTS actualizar_timestamps_trigger ON usuarios;
    `;
    await client.query(dropTriggers);
    console.log('Triggers eliminados correctamente.');
    
    // Eliminar la función problemática
    const dropFunction = `DROP FUNCTION IF EXISTS actualizar_timestamps();`;
    await client.query(dropFunction);
    console.log('Función problemática eliminada correctamente.');
    
    // Crear una nueva función que verifique si el campo existe
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
    await client.query(createFunction);
    console.log('Nueva función creada correctamente.');
    
    // Crear nuevos triggers sólo en las tablas que tienen el campo fecha_actualizacion
    const crearTriggers = `
      DO $$
      DECLARE
        tablas text[] := ARRAY['estados', 'municipios', 'parroquias'];
        tabla text;
      BEGIN
        FOREACH tabla IN ARRAY tablas LOOP
          IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = tabla 
            AND column_name = 'fecha_actualizacion'
          ) THEN
            EXECUTE format('
              CREATE TRIGGER actualizar_fecha_actualizacion_trigger
              BEFORE UPDATE ON %I
              FOR EACH ROW
              EXECUTE FUNCTION actualizar_fecha_actualizacion()
            ', tabla);
          END IF;
        END LOOP;
      END $$;
    `;
    await client.query(crearTriggers);
    console.log('Nuevos triggers creados correctamente.');
    
    await client.query('COMMIT');
    console.log('Corrección del trigger completada exitosamente.');
    
    // Verificar que no queden triggers problemáticos
    const triggers = await client.query(`
      SELECT tgname, relname 
      FROM pg_trigger t 
      JOIN pg_class c ON t.tgrelid = c.oid 
      WHERE tgname LIKE '%timestamp%'
    `);
    
    if (triggers.rows.length > 0) {
      console.log('Triggers relacionados con timestamp restantes:');
      triggers.rows.forEach(row => {
        console.log(`- ${row.tgname} en tabla ${row.relname}`);
      });
    } else {
      console.log('No quedan triggers relacionados con timestamp.');
    }
    
    // Verificar los nuevos triggers
    const nuevosTriggers = await client.query(`
      SELECT tgname, relname 
      FROM pg_trigger t 
      JOIN pg_class c ON t.tgrelid = c.oid 
      WHERE tgname = 'actualizar_fecha_actualizacion_trigger'
    `);
    
    if (nuevosTriggers.rows.length > 0) {
      console.log('Nuevos triggers creados:');
      nuevosTriggers.rows.forEach(row => {
        console.log(`- ${row.tgname} en tabla ${row.relname}`);
      });
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error durante la corrección del trigger:', error);
  } finally {
    client.release();
  }
}

corregirTrigger()
  .then(() => {
    console.log('Proceso de corrección finalizado');
    pool.end();
  })
  .catch(err => {
    console.error('Error en el proceso general:', err);
    pool.end();
  }); 