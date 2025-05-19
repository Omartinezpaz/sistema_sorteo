const { Client } = require('pg');

// Configuración correcta de la base de datos
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'sorteo_db',
  user: 'omarte',
  password: 'Ap3r1t1v02025'
});

async function verificarTrigger() {
  try {
    await client.connect();
    console.log('Conectado a la base de datos');

    // Verificar el trigger de validación de estados
    const triggerQuery = `
      SELECT p.prosrc 
      FROM pg_trigger t
      JOIN pg_proc p ON t.tgfoid = p.oid
      JOIN pg_class c ON t.tgrelid = c.oid
      WHERE c.relname = 'sorteos' AND t.tgname LIKE '%validar%estado%'
    `;
    
    const triggerResult = await client.query(triggerQuery);
    
    if (triggerResult.rows.length > 0) {
      console.log('Contenido de la función de validación de estados:');
      console.log(triggerResult.rows[0].prosrc);
      
      // Verificar si la función permite la transición de programado a en_progreso
      const hayTransicionProgramadoEnProgreso = triggerResult.rows[0].prosrc.includes("'programado'") && 
                                              triggerResult.rows[0].prosrc.includes("'en_progreso'");
      
      if (hayTransicionProgramadoEnProgreso) {
        console.log('\n✅ La función parece permitir la transición de "programado" a "en_progreso"');
      } else {
        console.log('\n❌ La función NO parece permitir explícitamente la transición de "programado" a "en_progreso"');
        console.log('\nSe recomienda actualizar la función de validación de estados con el siguiente código:');
        console.log(`
CREATE OR REPLACE FUNCTION validar_estado_sorteo()
RETURNS TRIGGER AS $$
BEGIN
    -- No permitir cambiar de 'finalizado' a otros estados
    IF OLD.estado_actual = 'finalizado' AND NEW.estado_actual != 'finalizado' THEN
        RAISE EXCEPTION 'No se puede modificar el estado de un sorteo finalizado';
    END IF;
    
    -- Validar transiciones de estado permitidas
    IF NOT (
        (OLD.estado_actual = 'borrador' AND NEW.estado_actual IN ('programado', 'cancelado')) OR
        (OLD.estado_actual = 'programado' AND NEW.estado_actual IN ('en_progreso', 'cancelado')) OR
        (OLD.estado_actual = 'en_progreso' AND NEW.estado_actual IN ('finalizado', 'suspendido')) OR
        (OLD.estado_actual = 'suspendido' AND NEW.estado_actual IN ('en_progreso', 'cancelado'))
    ) THEN
        RAISE EXCEPTION 'Transición de estado no permitida: % a %', OLD.estado_actual, NEW.estado_actual;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
`);
      }
    } else {
      console.log('No se encontró ningún trigger de validación de estados para la tabla sorteos');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
    console.log('\nConexión cerrada');
  }
}

verificarTrigger(); 