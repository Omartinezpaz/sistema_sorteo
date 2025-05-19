const { Client } = require('pg');

// Configuración obtenida del archivo .env
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'sorteo_db',
  user: 'omarte',
  password: 'Ap3r1t1v02025'
});

async function insertarPremios() {
  try {
    await client.connect();
    console.log('Conectado a la base de datos');

    // Verificar estructura de la tabla premios
    const premiosStructureQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'premios'
      ORDER BY ordinal_position;
    `;
    
    const premiosStructure = await client.query(premiosStructureQuery);
    console.log('Estructura de la tabla premios:');
    premiosStructure.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type})`);
    });
    console.log();

    // Verificar si ya existen premios para el sorteo 12
    const premiosExistentesQuery = `
      SELECT COUNT(*) AS total
      FROM public.premios
      WHERE sorteo_id = 12
    `;
    
    const premiosExistentes = await client.query(premiosExistentesQuery);
    const totalPremios = parseInt(premiosExistentes.rows[0].total);
    console.log(`Premios existentes para el sorteo 12: ${totalPremios}`);
    
    if (totalPremios > 0) {
      console.log('Ya existen premios para este sorteo. Eliminando premios existentes...');
      
      const eliminarPremiosQuery = `
        DELETE FROM public.premios
        WHERE sorteo_id = 12
      `;
      
      await client.query(eliminarPremiosQuery);
      console.log('Premios anteriores eliminados.');
    }

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

    // Actualizar estado del sorteo a "programado"
    const queryEstado = `
      UPDATE public.sorteos
      SET estado_actual = 'programado', es_publico = true
      WHERE id = 12
      RETURNING id, nombre, estado_actual
    `;
    
    const resultadoEstado = await client.query(queryEstado);
    console.log('\nEstado del sorteo actualizado:');
    console.log(`- ID: ${resultadoEstado.rows[0].id}, Nombre: ${resultadoEstado.rows[0].nombre}, Estado: ${resultadoEstado.rows[0].estado_actual}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
    console.log('\nConexión cerrada');
  }
}

insertarPremios(); 