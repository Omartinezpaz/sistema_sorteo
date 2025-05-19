const { Client } = require('pg');

// Configuración de la base de datos
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'sorteo_db',
  user: 'omarte',
  password: 'Ap3r1t1v02025'
});

async function verificarAsignacionTiques() {
  try {
    await client.connect();
    console.log('Conectado a la base de datos');

    // Consultar participantes con tiques asignados
    const resultado = await client.query(`
      SELECT 
        id, 
        nombre,
        apellido, 
        estado, 
        documento_identidad,
        numero_tique, 
        prefijo_tique, 
        codigo_tique, 
        tique_asignado,
        fecha_asignacion_tique
      FROM 
        participantes 
      WHERE 
        tique_asignado = true 
      ORDER BY 
        id DESC 
      LIMIT 10
    `);

    if (resultado.rows.length > 0) {
      console.log('Participantes con tiques asignados:');
      console.table(resultado.rows);
    } else {
      console.log('No hay participantes con tiques asignados');
      
      // Si no hay, verificar si hay participantes validados
      const participantesValidados = await client.query(`
        SELECT 
          id, 
          nombre,
          apellido,
          estado,
          documento_identidad,
          validado
        FROM 
          participantes 
        WHERE 
          validado = true 
        ORDER BY 
          id DESC 
        LIMIT 10
      `);
      
      if (participantesValidados.rows.length > 0) {
        console.log('Hay participantes validados pero sin tiques asignados:');
        console.table(participantesValidados.rows);
      } else {
        console.log('No hay participantes validados en la base de datos');
      }
    }

    // Consultar vista de participantes con tiques
    try {
      const vistaResult = await client.query(`
        SELECT * FROM vw_participantes_tiques LIMIT 5
      `);
      
      console.log('\nVista de participantes con tiques:');
      if (vistaResult.rows.length > 0) {
        console.table(vistaResult.rows);
      } else {
        console.log('La vista no tiene registros');
      }
    } catch (err) {
      console.error('Error al consultar la vista:', err.message);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
    console.log('Conexión cerrada');
  }
}

// Ejecutar verificación
verificarAsignacionTiques(); 