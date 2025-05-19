/**
 * Script ultra simple para generar tiques para el sorteo 28
 * Enfocado en generar solo unos pocos tiques para un subconjunto pequeño de estados
 */

const { Client } = require('pg');

// Configuración de la conexión a la base de datos
const dbConfig = {
  user: 'omarte',
  host: 'localhost',
  database: 'sorteo_db',
  password: 'Ap3r1t1v02025',
  port: 5432,
};

// Cliente de base de datos
const client = new Client(dbConfig);

async function main() {
  console.log('Iniciando generación simplificada de tiques para el sorteo 28...');
  
  try {
    // Conectar a la base de datos
    console.log('Conectando a la base de datos...');
    await client.connect();
    console.log('Conexión establecida correctamente ✅');
    
    // Verificar si existen participantes para pruebas
    console.log('\nVerificando participantes de prueba en re_723:');
    const participantesResult = await client.query('SELECT COUNT(*) as total FROM re_723');
    
    if (parseInt(participantesResult.rows[0].total) === 0) {
      console.log('❌ No hay participantes en la tabla re_723. No se pueden generar tiques.');
      await client.end();
      return;
    }
    
    console.log(`Total de participantes disponibles: ${participantesResult.rows[0].total}`);
    
    // Limpiar cualquier tique existente para el sorteo 28
    console.log('\nLimpiando tiques existentes para el sorteo 28...');
    await client.query('DELETE FROM participantes WHERE sorteo_id = 28');
    console.log('✅ Tiques anteriores eliminados');
    
    // Limpiar distribuciones previas
    console.log('\nLimpiando distribuciones previas para el sorteo 28...');
    await client.query('DELETE FROM distribucion_tiques WHERE sorteo_id = 28');
    console.log('✅ Distribuciones previas eliminadas');
    
    // Crear distribución simplificada (solo para 2 estados)
    console.log('\nCreando distribución muy simplificada (solo 2 estados)...');
    
    // Obtener los primeros 2 estados
    const estadosResult = await client.query('SELECT cod_estado, nom_estado FROM estados ORDER BY cod_estado LIMIT 2');
    
    if (estadosResult.rows.length === 0) {
      console.log('❌ No se encontraron estados en la base de datos');
      await client.end();
      return;
    }
    
    // Crear distribución manual super simple
    const estado1 = estadosResult.rows[0];
    const estado2 = estadosResult.rows[1];
    
    console.log(`Creando distribución para: ${estado1.nom_estado} y ${estado2.nom_estado}`);
    
    // Insertar distribución para el primer estado
    await client.query(`
      INSERT INTO distribucion_tiques 
      (sorteo_id, cod_estado, rango_desde, rango_hasta, cantidad, porcentaje, fecha_creacion)
      VALUES (28, $1, 1, 5, 5, 50, NOW())
    `, [estado1.cod_estado]);
    
    // Insertar distribución para el segundo estado
    await client.query(`
      INSERT INTO distribucion_tiques 
      (sorteo_id, cod_estado, rango_desde, rango_hasta, cantidad, porcentaje, fecha_creacion)
      VALUES (28, $1, 6, 10, 5, 50, NOW())
    `, [estado2.cod_estado]);
    
    console.log('✅ Distribución super simple creada');
    
    // Generar tiques de forma manual para cada estado
    console.log('\nGenerando tiques manualmente...');
    
    // Funciones auxiliares para generar tiques por estado
    async function generarTiquesPorEstado(estado, rangoDesde, cantidad) {
      // Obtener participantes para este estado
      const participantesEstado = await client.query(`
        SELECT 
          nac || cedula_ch AS cedula,
          p_nombre AS nombre,
          p_apellido AS apellido,
          cod_estado::TEXT,
          cod_municipio::TEXT,
          cod_parroquia::TEXT,
          telefono
        FROM 
          public.re_723
        WHERE 
          cod_estado::TEXT = $1::TEXT
        ORDER BY 
          RANDOM()
        LIMIT $2
      `, [estado.cod_estado.toString(), cantidad]);
      
      console.log(`Obtenidos ${participantesEstado.rows.length} participantes para el estado ${estado.nom_estado}`);
      
      if (participantesEstado.rows.length === 0) {
        return 0;
      }
      
      // Insertar tiques directamente en la tabla participantes
      for (let i = 0; i < participantesEstado.rows.length; i++) {
        const p = participantesEstado.rows[i];
        const numeroTique = rangoDesde + i;
        const codigoTique = `TIQ-${p.cod_estado.padStart(2, '0')}-${numeroTique.toString().padStart(5, '0')}`;
        
        await client.query(`
          INSERT INTO participantes (
            sorteo_id, nombre, apellido, documento_identidad, 
            estado, municipio, parroquia, telefono, email,
            prefijo_tique, numero_tique, codigo_tique, 
            tique_asignado, fecha_asignacion_tique, 
            validado, fecha_creacion, fecha_registro
          ) VALUES (
            28, $1, $2, $3, 
            $4, $5, $6, $7, '',
            'TIQ', $8, $9, 
            TRUE, NOW(), 
            TRUE, NOW(), NOW()
          )
        `, [
          p.nombre,
          p.apellido,
          p.cedula,
          p.cod_estado,
          p.cod_municipio,
          p.cod_parroquia,
          p.telefono,
          numeroTique,
          codigoTique
        ]);
        
        console.log(`Tique generado: ${codigoTique} para ${p.nombre} ${p.apellido}`);
      }
      
      return participantesEstado.rows.length;
    }
    
    // Generar tiques para el primer estado
    console.log(`\nGenerando tiques para el estado ${estado1.nom_estado}...`);
    const tiquesEstado1 = await generarTiquesPorEstado(estado1, 1, 5);
    console.log(`✅ ${tiquesEstado1} tiques generados para ${estado1.nom_estado}`);
    
    // Generar tiques para el segundo estado
    console.log(`\nGenerando tiques para el estado ${estado2.nom_estado}...`);
    const tiquesEstado2 = await generarTiquesPorEstado(estado2, 6, 5);
    console.log(`✅ ${tiquesEstado2} tiques generados para ${estado2.nom_estado}`);
    
    // Actualizar metadata del sorteo
    console.log('\nActualizando metadata del sorteo 28...');
    const totalTiques = tiquesEstado1 + tiquesEstado2;
    const tiquesPorEstado = {};
    tiquesPorEstado[estado1.cod_estado] = tiquesEstado1;
    tiquesPorEstado[estado2.cod_estado] = tiquesEstado2;
    
    await client.query(`
      UPDATE sorteos 
      SET metadata = COALESCE(metadata, '{}'::jsonb) || 
                  jsonb_build_object(
                      'total_participantes', $1,
                      'tiques_por_estado', $2,
                      'ultima_actualizacion', NOW()
                  )
      WHERE id = 28
    `, [totalTiques, JSON.stringify(tiquesPorEstado)]);
    
    console.log('✅ Metadata actualizada correctamente');
    
    // Verificar tiques generados
    const countResult = await client.query('SELECT COUNT(*) as total FROM participantes WHERE sorteo_id = 28');
    console.log(`\nTotal de tiques generados: ${countResult.rows[0].total}`);
    
    if (parseInt(countResult.rows[0].total) > 0) {
      console.log('\n✅ GENERACIÓN MANUAL EXITOSA');
      
      // Mostrar algunos tiques de ejemplo
      const ejemplosResult = await client.query(`
        SELECT codigo_tique, documento_identidad, nombre, apellido, estado
        FROM participantes 
        WHERE sorteo_id = 28 
        LIMIT 5
      `);
      
      console.log('\nEjemplos de tiques generados:');
      ejemplosResult.rows.forEach((tique, index) => {
        console.log(`${index + 1}. ${tique.codigo_tique} - ${tique.documento_identidad} - ${tique.nombre} ${tique.apellido} - Estado: ${tique.estado}`);
      });
      
      console.log('\n🔄 Próximo paso:');
      console.log('1. Ya puede utilizar la aplicación para visualizar los tiques generados.');
      console.log('2. Si estos tiques de prueba funcionan, puede generar más tiques o utilizar el script completo.');
    } else {
      console.log('❌ No se pudieron generar tiques');
    }
    
    // Cerrar la conexión a la base de datos
    await client.end();
    console.log('\nConexión a la base de datos cerrada.');
    
  } catch (error) {
    console.error('Error durante la ejecución del script:', error);
    
    // Mostrar detalles adicionales del error si están disponibles
    if (error.detail) console.log('Detalle:', error.detail);
    if (error.hint) console.log('Hint:', error.hint);
    if (error.where) console.log('Ubicación:', error.where);
    
    try {
      await client.end();
    } catch (err) {}
  }
}

// Ejecutar la función principal
main().catch(console.error); 