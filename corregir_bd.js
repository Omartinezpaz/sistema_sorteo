// Este código lo puedes copiar y pegar en la consola de DevTools una vez que abras la aplicación
// Presiona F12 para abrir DevTools y pega esto en la consola:

// Función para corregir los triggers de timestamp
async function corregirTriggerTimestamp() {
  try {
    console.log('Iniciando corrección manual de triggers de timestamp...');
    
    // 1. Eliminar la función problemática y todos sus triggers
    await global.pool.query('DROP FUNCTION IF EXISTS actualizar_timestamps() CASCADE;');
    
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
    await global.pool.query(createFunction);
    
    // 3. Verificar tablas que tienen el campo fecha_actualizacion
    const tablasQuery = `
      SELECT table_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND column_name = 'fecha_actualizacion'
    `;
    const tablasResult = await global.pool.query(tablasQuery);
    
    // 4. Crear triggers para cada tabla que tiene el campo fecha_actualizacion
    for (const row of tablasResult.rows) {
      const tableName = row.table_name;
      try {
        // Primero eliminar el trigger si ya existe para evitar duplicados
        await global.pool.query(`DROP TRIGGER IF EXISTS actualizar_fecha_actualizacion_trigger ON ${tableName};`);
        
        const triggerQuery = `
          CREATE TRIGGER actualizar_fecha_actualizacion_trigger
          BEFORE UPDATE ON ${tableName}
          FOR EACH ROW
          EXECUTE FUNCTION actualizar_fecha_actualizacion();
        `;
        await global.pool.query(triggerQuery);
        console.log(`Trigger creado para tabla: ${tableName}`);
      } catch (error) {
        console.error(`Error al crear trigger para tabla ${tableName}:`, error);
      }
    }
    
    return { success: true, message: 'Corrección de triggers completada manualmente' };
  } catch (error) {
    console.error('Error en la corrección manual de triggers:', error);
    return { success: false, error: error.message };
  }
}

// Para ejecutar la función, usa:
// corregirTriggerTimestamp().then(console.log).catch(console.error); 