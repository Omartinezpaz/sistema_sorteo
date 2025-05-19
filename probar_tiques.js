const { Client } = require('pg');

// Configuración de la base de datos
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'sorteo_db',
  user: 'omarte',
  password: 'Ap3r1t1v02025'
});

async function probarTiques() {
  try {
    await client.connect();
    console.log('Conectado a la base de datos');

    // 1. Crear un sorteo de ejemplo con rangos para estados
    console.log('Creando sorteo de prueba con rangos por estado...');
    
    const sorteoResult = await client.query(`
      INSERT INTO sorteos (
        nombre, 
        fecha_creacion, 
        fecha_sorteo, 
        estado, 
        descripcion, 
        creado_por, 
        estado_actual, 
        es_publico,
        metadata
      ) VALUES (
        'Sorteo de Prueba Tiques', 
        NOW(), 
        '2025-06-01 12:00:00', 
        'regional', 
        'Sorteo para probar la asignación de tiques', 
        1, 
        'borrador', 
        false,
        $1
      ) RETURNING id
    `, [JSON.stringify({
      estado: "borrador",
      nombre: "Sorteo de Prueba Tiques",
      fechaHora: "2025-06-01T12:00:00Z",
      tipoSorteo: "regional",
      descripcion: "Sorteo para probar la asignación de tiques",
      rangosEstado: [
        {
          desde: "100000",
          hasta: "101999",
          estado: "DTTO. CAPITAL",
          prefijo: "DC"
        },
        {
          desde: "200000",
          hasta: "201999",
          estado: "EDO. AMAZONAS",
          prefijo: "AM"
        },
        {
          desde: "300000",
          hasta: "301999",
          estado: "EDO. ANZOATEGUI",
          prefijo: "AN"
        }
      ],
      algoritmoSorteo: "simple",
      formatoNumeracion: "{PREFIJO}-{NUMERO}"
    })]);
    
    const sorteoId = sorteoResult.rows[0].id;
    console.log(`Sorteo creado con ID: ${sorteoId}`);
    
    // 2. Insertar participantes de prueba para diferentes estados
    console.log('Insertando participantes de prueba...');
    
    // Participante de Distrito Capital
    await client.query(`
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
        estado
      ) VALUES (
        $1,
        'Carlos',
        'Pérez',
        '0412-1234567',
        'V12345678',
        'carlos@ejemplo.com',
        NOW(),
        true,
        'manual',
        'DTTO. CAPITAL'
      )
    `, [sorteoId]);
    
    // Participante de Amazonas
    await client.query(`
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
        estado
      ) VALUES (
        $1,
        'María',
        'González',
        '0424-1234567',
        'V23456789',
        'maria@ejemplo.com',
        NOW(),
        true,
        'manual',
        'EDO. AMAZONAS'
      )
    `, [sorteoId]);
    
    // Participante de Anzoátegui
    await client.query(`
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
        estado
      ) VALUES (
        $1,
        'José',
        'Rodríguez',
        '0416-1234567',
        'V34567890',
        'jose@ejemplo.com',
        NOW(),
        true,
        'manual',
        'EDO. ANZOATEGUI'
      )
    `, [sorteoId]);

    // 3. Consultar los participantes para verificar la asignación de tiques
    console.log('Verificando la asignación de tiques...');
    
    const participantesResult = await client.query(`
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
        sorteo_id = $1
      ORDER BY
        estado, numero_tique
    `, [sorteoId]);
    
    console.log('Participantes con tiques asignados:');
    console.table(participantesResult.rows);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
    console.log('Conexión cerrada');
  }
}

// Ejecutar la prueba
probarTiques(); 