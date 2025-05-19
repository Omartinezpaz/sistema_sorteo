const { Client } = require('pg');

// Configuración de la base de datos
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'sorteo_db',
  user: 'omarte',
  password: 'Ap3r1t1v02025'
});

async function insertarPremiosDesdeMetadata(sorteoId) {
  try {
    await client.connect();
    console.log(`Conectado a la base de datos. Procesando sorteo ID: ${sorteoId}`);

    // 1. Obtener datos del sorteo
    const sorteoResult = await client.query(`
      SELECT 
        id, 
        nombre, 
        estado_actual, 
        metadata 
      FROM 
        sorteos 
      WHERE 
        id = $1
    `, [sorteoId]);

    if (sorteoResult.rows.length === 0) {
      console.log(`No se encontró ningún sorteo con ID: ${sorteoId}`);
      return;
    }

    const sorteo = sorteoResult.rows[0];
    console.log(`Sorteo encontrado: ${sorteo.nombre} (Estado: ${sorteo.estado_actual})`);

    // 2. Verificar si ya existen premios para este sorteo
    const premiosExistentes = await client.query(`
      SELECT 
        id 
      FROM 
        premios 
      WHERE 
        sorteo_id = $1
    `, [sorteoId]);

    if (premiosExistentes.rows.length > 0) {
      console.log(`Ya existen ${premiosExistentes.rows.length} premios para este sorteo. ¿Desea continuar y agregar más? (S/N)`);
      // En producción aquí se podría agregar una confirmación
    }

    // 3. Extraer premios del metadata
    const metadata = sorteo.metadata;
    
    if (!metadata) {
      console.log('El sorteo no tiene metadata definida.');
      return;
    }

    // Extraer premios nacionales
    const premiosNacionales = metadata.premiosNacionales || [];
    console.log(`Se encontraron ${premiosNacionales.length} premios nacionales en el metadata`);

    // Extraer premios regionales (si existen)
    const premiosRegionales = metadata.premiosRegionales || {};
    const totalPremiosRegionales = Object.values(premiosRegionales).reduce((sum, arr) => sum + arr.length, 0);
    console.log(`Se encontraron ${totalPremiosRegionales} premios regionales en el metadata`);

    // 4. Insertar premios nacionales
    if (premiosNacionales.length > 0) {
      console.log('Insertando premios nacionales...');
      
      for (const premio of premiosNacionales) {
        const categoriaId = obtenerCategoriaId(premio.categoria);
        
        await client.query(`
          INSERT INTO premios (
            sorteo_id,
            nombre,
            descripcion,
            valor,
            orden,
            categoria_id,
            ambito,
            estado,
            fecha_creacion
          ) VALUES (
            $1, $2, $3, $4, $5, $6, 'nacional', 'activo', NOW()
          )
        `, [
          sorteoId,
          premio.nombre,
          premio.descripcion,
          parseFloat(premio.valor) || 0,
          parseInt(premio.orden) || 0,
          categoriaId
        ]);
        
        console.log(`  - Premio insertado: ${premio.nombre}`);
      }
    }

    // 5. Insertar premios regionales (si hay)
    if (totalPremiosRegionales > 0) {
      console.log('Insertando premios regionales...');
      
      for (const [region, premios] of Object.entries(premiosRegionales)) {
        for (const premio of premios) {
          const categoriaId = obtenerCategoriaId(premio.categoria);
          
          await client.query(`
            INSERT INTO premios (
              sorteo_id,
              nombre,
              descripcion,
              valor,
              orden,
              categoria_id,
              ambito,
              estado,
              fecha_creacion,
              region
            ) VALUES (
              $1, $2, $3, $4, $5, $6, 'regional', 'activo', NOW(), $7
            )
          `, [
            sorteoId,
            premio.nombre,
            premio.descripcion,
            parseFloat(premio.valor) || 0,
            parseInt(premio.orden) || 0,
            categoriaId,
            region
          ]);
          
          console.log(`  - Premio regional insertado: ${premio.nombre} (${region})`);
        }
      }
    }

    console.log('Proceso completado. Se insertaron los premios desde el metadata del sorteo.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
    console.log('Conexión cerrada');
  }
}

// Función para mapear categorías a IDs
function obtenerCategoriaId(categoria) {
  // Mapeo simple de categorías a IDs
  switch (categoria.toLowerCase()) {
    case 'principal':
      return 1;
    case 'secundario':
      return 2;
    case 'especial':
      return 3;
    default:
      return 1;  // Categoría por defecto
  }
}

// Procesar el ID del sorteo desde los argumentos de línea de comandos
const sorteoId = process.argv[2];

if (!sorteoId) {
  console.log('Por favor proporcione el ID del sorteo como argumento: node insertar_premios_desde_metadata.js <sorteo_id>');
} else {
  insertarPremiosDesdeMetadata(sorteoId);
} 