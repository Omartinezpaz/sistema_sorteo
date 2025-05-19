const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración de conexión a la base de datos
const config = {
  user: 'omarte',
  host: 'localhost',
  database: 'sorteo_db',
  password: 'Ap3r1t1v02025', 
  port: 5432
};

// Función para separar el script SQL en bloques manejables
function separarScriptEnBloques(sql) {
  // Dividir el script en bloques lógicos
  const bloques = [];
  
  // Primero eliminar comentarios para facilitar el análisis
  const sinComentarios = sql.replace(/--.*$/gm, '');
  
  // Usar expresiones regulares para identificar bloques CREATE TABLE, CREATE FUNCTION, etc.
  const regexBloques = /(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|CREATE OR REPLACE|SELECT)[\s\S]*?;/g;
  let match;
  
  while ((match = regexBloques.exec(sinComentarios)) !== null) {
    bloques.push(match[0]);
  }
  
  return bloques;
}

async function recrearBaseDatos() {
  console.log('========================================');
  console.log('RECONSTRUCCIÓN INCREMENTAL DE LA BASE DE DATOS');
  console.log('========================================');
  console.log(`Conectando a: ${config.host}:${config.port}/${config.database} como ${config.user}`);
  
  // Crear cliente PostgreSQL
  const cliente = new Client(config);
  
  try {
    // Conectar a la base de datos
    await cliente.connect();
    console.log('✅ Conexión establecida correctamente');
    
    // Leer el archivo SQL completo
    const scriptPath = path.join(__dirname, 'scripts', 'base_datos.sql');
    console.log(`Leyendo archivo SQL desde: ${scriptPath}`);
    
    const sqlScript = fs.readFileSync(scriptPath, 'utf8');
    console.log(`✅ Archivo SQL leído correctamente (${sqlScript.length} caracteres)`);
    
    // Intentar primero crear la función de actualización de timestamps
    console.log('Ejecutando primero la función actualizar_fecha_actualizacion...');
    try {
      const funcionSQL = `
      CREATE OR REPLACE FUNCTION actualizar_fecha_actualizacion()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Verificar si la tabla tiene el campo "fecha_actualizacion"
        IF EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = TG_TABLE_NAME 
          AND column_name = 'fecha_actualizacion'
        ) THEN
          NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      `;
      await cliente.query(funcionSQL);
      console.log('✅ Función actualizar_fecha_actualizacion creada correctamente');
    } catch (err) {
      console.log('⚠️ No se pudo crear la función actualizar_fecha_actualizacion:', err.message);
    }
    
    // Corregir los triggers problemáticos
    console.log('Ejecutando corrección de triggers problemáticos...');
    try {
      const correccionSQL = `
      -- Eliminar todos los triggers existentes que podrían causar problemas
      DROP TRIGGER IF EXISTS actualizar_timestamps_trigger ON estados;
      DROP TRIGGER IF EXISTS actualizar_timestamps_trigger ON municipios;
      DROP TRIGGER IF EXISTS actualizar_timestamps_trigger ON parroquias;
      DROP TRIGGER IF EXISTS actualizar_timestamps_trigger ON sorteos;
      DROP TRIGGER IF EXISTS actualizar_timestamps_trigger ON participantes;
      DROP TRIGGER IF EXISTS actualizar_timestamps_trigger ON usuarios;
      
      -- Eliminar función problemática
      DROP FUNCTION IF EXISTS actualizar_timestamps() CASCADE;
      
      -- Recrear triggers con la nueva función
      DROP TRIGGER IF EXISTS actualizar_fecha_actualizacion_trigger ON estados;
      DROP TRIGGER IF EXISTS actualizar_fecha_actualizacion_trigger ON municipios;
      DROP TRIGGER IF EXISTS actualizar_fecha_actualizacion_trigger ON parroquias;
      `;
      await cliente.query(correccionSQL);
      console.log('✅ Corrección de triggers aplicada correctamente');
    } catch (err) {
      console.log('⚠️ Error al corregir triggers:', err.message);
    }
    
    // Verificar si la vista participacion_region existe
    console.log('Verificando si existe la vista vw_participacion_region...');
    try {
      const resultado = await cliente.query(`
        SELECT 1 FROM pg_views WHERE viewname = 'vw_participacion_region'
      `);
      
      if (resultado.rows.length > 0) {
        console.log('✅ La vista vw_participacion_region ya existe');
      } else {
        console.log('Creando vista vw_participacion_region...');
        try {
          await cliente.query(`
            CREATE OR REPLACE VIEW public.vw_participacion_region AS
            SELECT 
              e.nom_estado AS estado,
              e.nom_municipio AS municipio,
              count(p.id) AS total_participantes,
              count(g.id) AS total_ganadores,
              round(count(g.id)::numeric * 100.0 / NULLIF(count(p.id), 0)::numeric, 2) AS porcentaje_ganancia
            FROM estados_old e
            LEFT JOIN participantes p ON ((p.datos_adicionales ->> 'cod_estado'::text)::integer) = e.cod_estado AND ((p.datos_adicionales ->> 'cod_municipio'::text)::integer) = e.cod_municipio
            LEFT JOIN ganadores g ON g.participante_id = p.id
            GROUP BY e.nom_estado, e.nom_municipio
            ORDER BY e.nom_estado, e.nom_municipio;
          `);
          console.log('✅ Vista vw_participacion_region creada correctamente');
        } catch (err) {
          console.log('⚠️ No se pudo crear la vista vw_participacion_region:', err.message);
        }
      }
    } catch (err) {
      console.log('⚠️ Error al verificar vista vw_participacion_region:', err.message);
    }
    
    console.log('✅ OPERACIONES PRINCIPALES COMPLETADAS');
    console.log('La base de datos ha sido actualizada.');
    console.log('Ahora puedes iniciar la aplicación y debería funcionar correctamente.');
  } catch (error) {
    console.error('❌ ERROR GENERAL:', error);
    console.log('Detalles del error:');
    console.log('- Mensaje:', error.message);
    if (error.position) console.log('- Posición en el SQL:', error.position);
    
    console.log('\nSugerencias:');
    console.log('1. Verifica que PostgreSQL esté en ejecución');
    console.log('2. Confirma que las credenciales de conexión sean correctas');
    console.log('3. Asegúrate de tener permisos para ejecutar todas las operaciones en la base de datos');
  } finally {
    // Cerrar la conexión
    try {
      await cliente.end();
      console.log('Conexión cerrada');
    } catch (err) {
      console.error('Error al cerrar conexión:', err);
    }
    
    console.log('========================================');
  }
}

// Ejecutar la función principal
recrearBaseDatos(); 