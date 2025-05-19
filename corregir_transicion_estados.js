const { Client } = require('pg');
const fs = require('fs');

// Configuración correcta de la base de datos
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'sorteo_db',
  user: 'omarte',
  password: 'Ap3r1t1v02025'
});

async function verificarTransicion() {
  try {
    await client.connect();
    console.log('Conectado a la base de datos');

    // Verificar si existe el trigger de validación de estados
    const triggerQuery = `
      SELECT tgname, prosrc
      FROM pg_trigger t
      JOIN pg_proc p ON t.tgfoid = p.oid
      JOIN pg_class c ON t.tgrelid = c.oid
      WHERE c.relname = 'sorteos' AND t.tgname LIKE '%validar%estado%'
    `;
    
    const triggerResult = await client.query(triggerQuery);
    
    console.log('Verificando triggers de validación de estados:');
    if (triggerResult.rows.length > 0) {
      console.log(`Se encontraron ${triggerResult.rows.length} triggers relacionados con la validación de estados:`);
      
      triggerResult.rows.forEach(trigger => {
        console.log(`- ${trigger.tgname}`);
      });
      
      console.log('\nSe recomienda verificar la función de validación de estados para asegurar que permite la transición de "programado" a "en_progreso".');
    } else {
      console.log('No se encontraron triggers de validación de estados.');
    }

    // Proponer una corrección para el IniciarSorteo.jsx
    console.log('\nCorrección propuesta para el componente IniciarSorteo.jsx:');
    console.log(`
// Modificar el método iniciarSorteo() en app_escritorio/src_renderer/components/sorteo/IniciarSorteo.jsx

const iniciarSorteo = async () => {
  // Verificar si hay premios y participantes
  if (!premios || premios.length === 0) {
    setError('No hay premios configurados para este sorteo');
    return;
  }
  
  if (!participantes || participantes.length === 0) {
    setError('No hay participantes válidos para este sorteo');
    return;
  }
  
  try {
    // Verificar el estado actual y aplicar lógica adecuada según el estado
    if (sorteo.estado_actual === 'borrador') {
      // Si está en borrador, primero cambiar a programado
      const programado = await actualizarEstadoSorteo('programado');
      if (!programado) {
        throw new Error('No se pudo actualizar el estado a programado');
      }
      // Pequeña pausa para asegurar que el cambio se refleje correctamente
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Ahora cambiar a en_progreso
    const updated = await actualizarEstadoSorteo('en_progreso');
    if (!updated) {
      throw new Error('No se pudo actualizar el estado del sorteo');
    }
    
    // Continuar con el resto del proceso...
    setPremioActual(premios[0]);
    
    // Si es sorteo regional, empezar con el primer estado
    if (sorteo.tipo_sorteo !== 'nacional') {
      const metadata = sorteo.metadata ? JSON.parse(sorteo.metadata) : {};
      const estados = metadata.estadosSeleccionados || [];
      if (estados.length > 0) {
        setCurrentEstado(estados[0]);
      }
    }
    
    // Iniciar la animación
    iniciarAnimacion();
  } catch (error) {
    console.error('Error al iniciar sorteo:', error);
    setError(\`Error al iniciar sorteo: \${error.message}\`);
  }
};
`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
    console.log('\nConexión cerrada');
  }
}

verificarTransicion(); 