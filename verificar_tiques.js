const { Client } = require('pg');

// Configuración de la base de datos
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'sorteo_db',
  user: 'omarte',
  password: 'Ap3r1t1v02025'
});

async function verificarTiques() {
  try {
    await client.connect();
    console.log('Conectado a la base de datos');

    // Verificar si existen los nuevos campos
    const resultado = await client.query(`
      SELECT 
        column_name, 
        data_type 
      FROM 
        information_schema.columns 
      WHERE 
        table_name = 'participantes' AND 
        column_name IN ('numero_tique', 'codigo_tique', 'prefijo_tique', 'tique_asignado', 'fecha_asignacion_tique')
      ORDER BY 
        column_name
    `);

    if (resultado.rows.length > 0) {
      console.log('Campos de tiques agregados correctamente:');
      console.table(resultado.rows);
    } else {
      console.log('No se encontraron los campos de tiques en la tabla participantes');
    }

    // Verificar si existe la vista de participantes con tiques
    const vistaExiste = await client.query(`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.views 
        WHERE table_name = 'vw_participantes_tiques'
      ) as existe
    `);

    if (vistaExiste.rows[0].existe) {
      console.log('La vista vw_participantes_tiques existe');
    } else {
      console.log('La vista vw_participantes_tiques NO existe');
    }

    // Verificar si existe el trigger
    const triggerExiste = await client.query(`
      SELECT EXISTS (
        SELECT 1 
        FROM pg_trigger 
        WHERE tgname = 'trg_generar_codigo_tique'
      ) as existe
    `);

    if (triggerExiste.rows[0].existe) {
      console.log('El trigger trg_generar_codigo_tique existe');
    } else {
      console.log('El trigger trg_generar_codigo_tique NO existe');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
    console.log('Conexión cerrada');
  }
}

// Ejecutar verificación
verificarTiques(); 