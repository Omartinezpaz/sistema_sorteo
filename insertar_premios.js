const { Client } = require('pg');

// Configuración obtenida del archivo .env
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'sorteo_db',
  user: 'omarte',
  password: 'Ap3r1t1v02025',
  schema: 'sorteos_23_052025'
});

async function insertarPremios() {
  try {
    await client.connect();
    console.log('Conectado a la base de datos');

    // Insertar los premios
    const query = `
      INSERT INTO public.premios (
        sorteo_id, nombre, descripcion, valor, orden, categoria_id, fecha_creacion
      ) VALUES 
        (12, '1 er Premio Por Estado', 'Vehiculo Marca Chery "0" Kilometro', 15000, 3, 1, NOW()),
        (12, '2 do Premio Por Estado', 'Marca Yamahaa 660cc "0" Kilometro', 6600, 2, 2, NOW()),
        (12, '3 er Premio Por Estado', 'Moto de Paseo "0" Kilometro', 2000, 1, 3, NOW())
    `;

    await client.query(query);
    console.log('Premios agregados correctamente');

    // Actualizar estado del sorteo a "programado"
    const queryEstado = `
      UPDATE public.sorteos
      SET estado_actual = 'programado', es_publico = true
      WHERE id = 12
      RETURNING *
    `;
    
    const result = await client.query(queryEstado);
    console.log('Estado del sorteo actualizado a programado:', result.rows[0].estado_actual);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
    console.log('Conexión cerrada');
  }
}

insertarPremios(); 