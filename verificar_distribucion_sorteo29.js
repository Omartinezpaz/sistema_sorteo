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
  console.log('Verificando y corrigiendo distribución de tiques para el sorteo 29...');
  
  try {
    // Conectar a la base de datos
    console.log('Conectando a la base de datos...');
    await client.connect();
    console.log('Conexión establecida correctamente ✅');
    
    // Verificar si el sorteo 29 existe
    const sorteoResult = await client.query('SELECT id, nombre, estado_actual FROM sorteos WHERE id = 29');
    
    if (sorteoResult.rows.length === 0) {
      console.log('❌ El sorteo 29 no existe en la base de datos');
      await client.end();
      return;
    }
    
    console.log('✅ Sorteo encontrado:', sorteoResult.rows[0]);
    
    // Verificar distribución actual
    const distResult = await client.query('SELECT COUNT(*) as total FROM distribucion_tiques WHERE sorteo_id = 29');
    const totalDistribuciones = parseInt(distResult.rows[0].total);
    
    if (totalDistribuciones > 0) {
      console.log(`\nSe encontraron ${totalDistribuciones} distribuciones para el sorteo 29`);
      
      // Mostrar las distribuciones existentes
      const distribuciones = await client.query(`
        SELECT dt.*, e.nom_estado 
        FROM distribucion_tiques dt
        JOIN estados e ON dt.cod_estado = e.cod_estado
        WHERE dt.sorteo_id = 29
        ORDER BY e.nom_estado
      `);
      
      console.log('\nDistribuciones actuales:');
      distribuciones.rows.forEach(dist => {
        console.log(`- ${dist.nom_estado}: ${dist.cantidad} tiques (${dist.porcentaje}%)`);
      });
    } else {
      console.log('\n❌ No hay distribución de tiques configurada para el sorteo 29');
      console.log('Creando nueva distribución...');
      
      // Obtener todos los estados
      const estadosResult = await client.query('SELECT cod_estado, nom_estado FROM estados ORDER BY cod_estado');
      
      if (estadosResult.rows.length === 0) {
        console.log('❌ No se encontraron estados en la base de datos');
        await client.end();
        return;
      }
      
      // Crear distribución simplificada (1000 tiques por estado)
      const tiquesPorEstado = 1000;
      let rangoDesde = 1;
      
      for (const estado of estadosResult.rows) {
        const rangoHasta = rangoDesde + tiquesPorEstado - 1;
        
        await client.query(`
          INSERT INTO distribucion_tiques
          (sorteo_id, cod_estado, rango_desde, rango_hasta, cantidad, porcentaje, fecha_creacion)
          VALUES (29, $1, $2, $3, $4, $5, NOW())
        `, [
          estado.cod_estado,
          rangoDesde,
          rangoHasta,
          tiquesPorEstado,
          (tiquesPorEstado / (tiquesPorEstado * estadosResult.rows.length) * 100).toFixed(2)
        ]);
        
        console.log(`✅ Distribución creada para ${estado.nom_estado}: ${tiquesPorEstado} tiques`);
        rangoDesde = rangoHasta + 1;
      }
      
      console.log('\n✅ Distribución creada exitosamente para todos los estados');
    }
    
    // Cerrar la conexión a la base de datos
    await client.end();
    console.log('\nConexión a la base de datos cerrada.');
    
  } catch (error) {
    console.error('Error durante la ejecución del script:', error);
    try {
      await client.end();
    } catch (err) {}
  }
}

// Ejecutar la función principal
main().catch(console.error); 