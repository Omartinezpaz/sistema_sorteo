const { Client } = require('pg');

// Configuración de la base de datos
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'sorteo_db',
  user: 'omarte',
  password: 'Ap3r1t1v02025'
});

async function insertarParticipantes() {
  try {
    await client.connect();
    console.log('Conectado a la base de datos');

    // Insertar participantes de prueba para el sorteo ID 12
    const query = `
      INSERT INTO participantes (
        sorteo_id, 
        nombre, 
        apellido, 
        telefono, 
        documento_identidad, 
        email, 
        fecha_registro, 
        validado, 
        metodo_registro, 
        estado,
        datos_adicionales
      ) VALUES 
        (12, 'Juan', 'Pérez', '1234567890', 'V12345678', 'juan@ejemplo.com', NOW(), true, 'manual', 'DTTO. CAPITAL', '{"cod_estado": 1}'),
        (12, 'María', 'Gómez', '0987654321', 'V87654321', 'maria@ejemplo.com', NOW(), true, 'manual', 'EDO. ANZOATEGUI', '{"cod_estado": 2}'),
        (12, 'Pedro', 'Rodríguez', '5555555555', 'V55555555', 'pedro@ejemplo.com', NOW(), true, 'manual', 'EDO. ZULIA', '{"cod_estado": 3}'),
        (12, 'Ana', 'Martínez', '6666666666', 'V66666666', 'ana@ejemplo.com', NOW(), true, 'manual', 'EDO. LARA', '{"cod_estado": 4}'),
        (12, 'Carlos', 'López', '7777777777', 'V77777777', 'carlos@ejemplo.com', NOW(), true, 'manual', 'EDO. ARAGUA', '{"cod_estado": 5}')
      RETURNING id, nombre, apellido, estado
    `;

    const resultado = await client.query(query);
    console.log('Participantes agregados exitosamente:');
    resultado.rows.forEach(row => {
      console.log(`- ID: ${row.id}, Nombre: ${row.nombre} ${row.apellido}, Estado: ${row.estado}`);
    });

    // Verificar el número total de participantes para el sorteo
    const countQuery = `
      SELECT COUNT(*) as total FROM participantes 
      WHERE sorteo_id = 12 AND validado = true
    `;
    
    const countResult = await client.query(countQuery);
    console.log(`\nTotal de participantes válidos para el sorteo ID 12: ${countResult.rows[0].total}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
    console.log('\nConexión cerrada');
  }
}

insertarParticipantes(); 