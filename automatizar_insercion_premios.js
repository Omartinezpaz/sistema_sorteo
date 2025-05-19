const { Client } = require('pg');

// Configuración de la base de datos
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'sorteo_db',
  user: 'omarte',
  password: 'Ap3r1t1v02025'
});

async function automatizarInsercionPremios() {
  try {
    await client.connect();
    console.log('Conectado a la base de datos');

    // 1. Obtener todos los sorteos existentes
    const sorteosResult = await client.query(`
      SELECT 
        id, 
        nombre, 
        estado_actual, 
        metadata 
      FROM 
        sorteos 
      ORDER BY 
        id
    `);

    if (sorteosResult.rows.length === 0) {
      console.log('No se encontraron sorteos en la base de datos');
      return;
    }

    console.log(`Se encontraron ${sorteosResult.rows.length} sorteos`);
    
    // 2. Procesar cada sorteo
    for (const sorteo of sorteosResult.rows) {
      console.log(`\nProcesando sorteo ID ${sorteo.id}: ${sorteo.nombre} (${sorteo.estado_actual})`);
      
      // Verificar si ya existen premios para este sorteo
      const premiosExistentes = await client.query(`
        SELECT COUNT(*) as cantidad
        FROM premios 
        WHERE sorteo_id = $1
      `, [sorteo.id]);
      
      const cantidadPremios = parseInt(premiosExistentes.rows[0].cantidad) || 0;
      
      if (cantidadPremios > 0) {
        console.log(`  ✓ El sorteo ya tiene ${cantidadPremios} premios en la tabla premios`);
        continue; // Pasar al siguiente sorteo
      }
      
      // Extraer premios del metadata
      if (!sorteo.metadata) {
        console.log(`  ✗ El sorteo no tiene metadata definida`);
        continue;
      }
      
      const metadata = sorteo.metadata;
      
      // Extraer premios nacionales
      const premiosNacionales = metadata.premiosNacionales || [];
      if (premiosNacionales.length === 0) {
        console.log(`  ✗ No hay premios nacionales definidos en el metadata`);
      } else {
        console.log(`  ➤ Se encontraron ${premiosNacionales.length} premios nacionales en el metadata`);
        
        // Insertar cada premio nacional
        for (const premio of premiosNacionales) {
          const categoriaId = obtenerCategoriaId(premio.categoria);
          
          try {
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
              sorteo.id,
              premio.nombre,
              premio.descripcion,
              parseFloat(premio.valor) || 0,
              parseInt(premio.orden) || 0,
              categoriaId
            ]);
            
            console.log(`    ✓ Premio insertado: ${premio.nombre}`);
          } catch (error) {
            console.error(`    ✗ Error al insertar premio ${premio.nombre}:`, error.message);
          }
        }
      }
      
      // Extraer premios regionales (si existen)
      const premiosRegionales = metadata.premiosRegionales || {};
      const regionesConPremios = Object.keys(premiosRegionales);
      
      if (regionesConPremios.length === 0) {
        console.log(`  ✗ No hay premios regionales definidos en el metadata`);
      } else {
        console.log(`  ➤ Se encontraron premios regionales para ${regionesConPremios.length} regiones`);
        
        // Insertar cada premio regional
        for (const region of regionesConPremios) {
          const premios = premiosRegionales[region];
          console.log(`    ➤ Región ${region}: ${premios.length} premios`);
          
          for (const premio of premios) {
            const categoriaId = obtenerCategoriaId(premio.categoria);
            
            try {
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
                sorteo.id,
                premio.nombre,
                premio.descripcion,
                parseFloat(premio.valor) || 0,
                parseInt(premio.orden) || 0,
                categoriaId,
                region
              ]);
              
              console.log(`      ✓ Premio regional insertado: ${premio.nombre}`);
            } catch (error) {
              console.error(`      ✗ Error al insertar premio regional ${premio.nombre}:`, error.message);
            }
          }
        }
      }
      
      // Verificar los premios insertados para el sorteo
      const verificacionResult = await client.query(`
        SELECT COUNT(*) as cantidad 
        FROM premios 
        WHERE sorteo_id = $1
      `, [sorteo.id]);
      
      const premiosInsertados = parseInt(verificacionResult.rows[0].cantidad) || 0;
      console.log(`  ✓ Total de premios insertados para el sorteo ID ${sorteo.id}: ${premiosInsertados}`);
    }
    
    console.log('\nProceso completado. Se verificaron todos los sorteos y se insertaron los premios faltantes.');

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
  if (!categoria) return 1;
  
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

// Ejecutar el proceso
automatizarInsercionPremios(); 