/**
 * Script para ejecutar los pasos de corrección del sistema de generación de tiques
 * 
 * Este script ejecuta las siguientes acciones:
 * 1. Conecta a la base de datos
 * 2. Aplica la solución completa para la distribución de tiques (si es necesario)
 * 3. Configura la distribución de tiques para el sorteo 27 (si no existe)
 * 4. Ejecuta un diagnóstico para el sorteo 28
 * 5. Genera los tiques para el sorteo solicitado
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración de la conexión a la base de datos
const dbConfig = {
  user: 'omarte',
  host: 'localhost',
  database: 'sorteo_db',
  password: 'Ap3r1t1v02025',
  port: 5432,
};

// Rutas de los archivos SQL
const SOLUCION_COMPLETA = path.join(__dirname, 'solucion_completa_distribucion_tiques.sql');
const SOLO_CONFIGURAR = path.join(__dirname, 'solo_configurar_distribucion.sql');
const DIAGNOSTICO_SORTEO28 = path.join(__dirname, 'actualizar_distribucion_sorteo28.sql');

// Cliente de base de datos
const client = new Client(dbConfig);

// Función para ejecutar un archivo SQL
async function ejecutarArchivoSQL(rutaArchivo) {
  try {
    console.log(`Ejecutando archivo SQL: ${rutaArchivo}`);
    const contenido = fs.readFileSync(rutaArchivo, 'utf8');
    await client.query(contenido);
    console.log(`✅ Archivo SQL ejecutado correctamente: ${rutaArchivo}`);
    return true;
  } catch (error) {
    console.error(`❌ Error al ejecutar archivo SQL ${rutaArchivo}:`, error);
    return false;
  }
}

// Función para verificar si existen distribuciones para un sorteo
async function verificarDistribucion(sorteoId) {
  try {
    const verificacion = await client.query(
      'SELECT COUNT(*) as total FROM distribucion_tiques WHERE sorteo_id = $1',
      [sorteoId]
    );
    
    const total = parseInt(verificacion.rows[0].total);
    return total > 0;
  } catch (error) {
    console.error(`Error al verificar distribución para sorteo ${sorteoId}:`, error);
    return false;
  }
}

// Función para verificar si la tabla distribucion_tiques existe
async function verificarTablaDistribucion() {
  try {
    const verificacion = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'distribucion_tiques'
      ) as existe;
    `);
    
    return verificacion.rows[0].existe;
  } catch (error) {
    console.error('Error al verificar si existe la tabla distribucion_tiques:', error);
    return false;
  }
}

// Función para verificar si la función generar_tiques_desde_distribucion existe
async function verificarFuncion() {
  try {
    const verificacion = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_proc 
        WHERE proname = 'generar_tiques_desde_distribucion' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      ) as existe;
    `);
    
    return verificacion.rows[0].existe;
  } catch (error) {
    console.error('Error al verificar si existe la función generar_tiques_desde_distribucion:', error);
    return false;
  }
}

// Función para ejecutar la generación de tiques
async function generarTiques(sorteoId, prefijo = 'TIQ') {
  try {
    console.log(`Ejecutando generación de tiques para sorteo ${sorteoId}...`);
    
    // Ejecutar la función en la base de datos
    const resultado = await client.query(
      'SELECT * FROM generar_tiques_desde_distribucion($1, $2)',
      [sorteoId, prefijo]
    );
    
    if (resultado.rows.length > 0) {
      console.log(`✅ Generación exitosa para sorteo ${sorteoId}`);
      console.log('Resumen:', resultado.rows[0].mensaje);
      console.log('Total tiques:', resultado.rows[0].total_tiques);
      
      return {
        exito: true,
        resultado: resultado.rows[0]
      };
    } else {
      console.log(`❌ No se obtuvo resultado de la generación para sorteo ${sorteoId}`);
      return {
        exito: false,
        error: 'No se obtuvo resultado'
      };
    }
  } catch (error) {
    console.error(`❌ Error al generar tiques para sorteo ${sorteoId}:`, error);
    return {
      exito: false,
      error: error.message
    };
  }
}

// Función principal
async function main() {
  console.log('Iniciando script de corrección y generación de tiques...');
  
  try {
    // Conectar a la base de datos
    console.log('Conectando a la base de datos...');
    await client.connect();
    console.log('Conexión establecida correctamente ✅');
    
    // Verificar si la tabla y función existen
    const tablaExiste = await verificarTablaDistribucion();
    const funcionExiste = await verificarFuncion();
    
    // Si no existe la tabla o la función, aplicar la solución completa
    if (!tablaExiste || !funcionExiste) {
      console.log('No se encontró la tabla o la función. Aplicando solución completa...');
      await ejecutarArchivoSQL(SOLUCION_COMPLETA);
    } else {
      console.log('La tabla y la función ya existen. Verificando distribuciones...');
    }
    
    // Verificar distribuciones para sorteo 27
    const tieneDistribucion27 = await verificarDistribucion(27);
    if (!tieneDistribucion27) {
      console.log('No se encontró distribución para sorteo 27. Configurando...');
      
      // Intentar primero con el archivo específico de configuración
      const resultadoConfig = await ejecutarArchivoSQL(SOLO_CONFIGURAR);
      
      if (!resultadoConfig) {
        console.log('Falló la configuración específica. Intentando con solución completa...');
        await ejecutarArchivoSQL(SOLUCION_COMPLETA);
      }
    } else {
      console.log('El sorteo 27 ya tiene distribución configurada ✅');
    }
    
    // Verificar distribuciones para sorteo 28
    const tieneDistribucion28 = await verificarDistribucion(28);
    if (tieneDistribucion28) {
      console.log('El sorteo 28 tiene distribución configurada ✅');
      // Ejecutar diagnóstico para sorteo 28
      console.log('Ejecutando diagnóstico para sorteo 28...');
      await ejecutarArchivoSQL(DIAGNOSTICO_SORTEO28);
    } else {
      console.log('No se encontró distribución para sorteo 28.');
    }
    
    // Preguntar al usuario qué sorteo quiere generar
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('¿Para qué sorteo desea generar tiques? (27/28): ', async (sorteo) => {
      const sorteoId = parseInt(sorteo.trim());
      
      if (sorteoId !== 27 && sorteoId !== 28) {
        console.log('Sorteo no válido. Por favor, ejecute el script nuevamente.');
        await client.end();
        readline.close();
        return;
      }
      
      // Verificar que exista distribución para el sorteo seleccionado
      const tieneDistribucion = await verificarDistribucion(sorteoId);
      if (!tieneDistribucion) {
        console.log(`❌ El sorteo ${sorteoId} no tiene distribución configurada. Por favor, configure la distribución primero.`);
        await client.end();
        readline.close();
        return;
      }
      
      // Generar tiques
      const resultado = await generarTiques(sorteoId);
      
      if (resultado.exito) {
        console.log('🎉 ¡Generación de tiques completada exitosamente!');
      } else {
        console.log('❌ La generación de tiques falló.');
      }
      
      // Cerrar la conexión y terminar
      await client.end();
      console.log('Conexión a la base de datos cerrada.');
      readline.close();
    });
    
  } catch (error) {
    console.error('Error general en el script:', error);
    await client.end();
  }
}

// Ejecutar el script
main().catch(console.error); 