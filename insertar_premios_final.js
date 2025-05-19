const { Client } = require('pg');

// Configuración correcta de la base de datos
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'sorteo_db',  // Nombre correcto de la base de datos
  user: 'omarte',
  password: 'Ap3r1t1v02025'
});

async function insertarPremios() {
  try {
    await client.connect();
    console.log('Conectado a la base de datos');

    // Verificar tablas disponibles en la base de datos
    const tablasQuery = `
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    const tablasResult = await client.query(tablasQuery);
    console.log('Tablas en esquema public:');
    tablasResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    // Insertar premios para el sorteo 12
    try {
      // Verificar si la tabla premios existe
      const checkPremiosTable = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'premios'
        )`);
      
      if (checkPremiosTable.rows[0].exists) {
        console.log('\nLa tabla premios existe, procediendo a insertar datos...');
        
        // Eliminar premios existentes para el sorteo 12
        await client.query(`
          DELETE FROM public.premios 
          WHERE sorteo_id = 12
        `);
        
        // Insertar los premios
        const query = `
          INSERT INTO public.premios (
            sorteo_id, nombre, descripcion, valor, orden, categoria_id, fecha_creacion
          ) VALUES 
            (12, '1 er Premio Por Estado', 'Vehiculo Marca Chery "0" Kilometro', 15000, 3, 1, NOW()),
            (12, '2 do Premio Por Estado', 'Marca Yamahaa 660cc "0" Kilometro', 6600, 2, 2, NOW()),
            (12, '3 er Premio Por Estado', 'Moto de Paseo "0" Kilometro', 2000, 1, 3, NOW())
          RETURNING id, sorteo_id, nombre
        `;

        const resultado = await client.query(query);
        console.log('Premios agregados correctamente:');
        resultado.rows.forEach(row => {
          console.log(`- ID: ${row.id}, Sorteo: ${row.sorteo_id}, Nombre: ${row.nombre}`);
        });
      } else {
        console.log('\nLa tabla premios NO existe en el esquema public');
        console.log('Es posible que necesites crear la tabla o verificar el esquema correcto');
      }
    } catch (err) {
      console.error('Error al manipular premios:', err.message);
    }

    // Actualizar estado del sorteo
    try {
      // Verificar si la tabla sorteos existe
      const checkSorteosTable = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'sorteos'
        )`);
      
      if (checkSorteosTable.rows[0].exists) {
        console.log('\nLa tabla sorteos existe, procediendo a actualizar el estado...');
        
        // Actualizar estado del sorteo a "programado"
        const queryEstado = `
          UPDATE public.sorteos
          SET estado_actual = 'programado', es_publico = true
          WHERE id = 12
          RETURNING id, nombre, estado_actual
        `;
        
        const resultadoEstado = await client.query(queryEstado);
        console.log('Estado del sorteo actualizado:');
        console.log(`- ID: ${resultadoEstado.rows[0].id}, Nombre: ${resultadoEstado.rows[0].nombre}, Estado: ${resultadoEstado.rows[0].estado_actual}`);
      } else {
        console.log('\nLa tabla sorteos NO existe en el esquema public');
      }
    } catch (err) {
      console.error('Error al actualizar estado del sorteo:', err.message);
    }

  } catch (error) {
    console.error('Error general:', error);
  } finally {
    await client.end();
    console.log('\nConexión cerrada');
  }
}

insertarPremios(); 