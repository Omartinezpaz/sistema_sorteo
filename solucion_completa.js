/**
 * Script principal para solucionar todos los problemas con la generación de tiques
 * 
 * Este script ejecuta todos los pasos necesarios de manera secuencial:
 * 1. Crea los sorteos faltantes (IDs 27 y 28)
 * 2. Corrige la función generar_tiques_desde_distribucion
 * 3. Configura la distribución de tiques para los sorteos
 * 4. Genera los tiques para el sorteo seleccionado
 */

const { spawn } = require('child_process');
const readline = require('readline');

// Función para ejecutar un script de Node.js y esperar a que termine
function ejecutarScript(scriptPath) {
  return new Promise((resolve, reject) => {
    console.log(`\n----- Ejecutando ${scriptPath} -----\n`);
    
    const proceso = spawn('node', [scriptPath], {
      stdio: 'inherit',
      shell: true
    });
    
    proceso.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ Script ${scriptPath} completado exitosamente`);
        resolve();
      } else {
        console.error(`\n❌ Error en el script ${scriptPath}. Código de salida: ${code}`);
        reject(new Error(`Error en el script ${scriptPath}`));
      }
    });
    
    proceso.on('error', (err) => {
      console.error(`\n❌ Error al ejecutar el script ${scriptPath}:`, err);
      reject(err);
    });
  });
}

// Función para preguntar al usuario
function preguntarUsuario(pregunta) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(pregunta, (respuesta) => {
      rl.close();
      resolve(respuesta.trim());
    });
  });
}

// Función principal
async function main() {
  console.log('=================================================');
  console.log('  SOLUCIÓN COMPLETA PARA GENERACIÓN DE TIQUES    ');
  console.log('=================================================');
  console.log('\nEste script ejecutará todos los pasos necesarios para solucionar los problemas con la generación de tiques.\n');
  
  try {
    // 1. Crear sorteos faltantes
    console.log('PASO 1: Crear sorteos faltantes (IDs 27 y 28)');
    await ejecutarScript('crear_sorteos_faltantes.js');
    
    // 2. Corregir la función de generación de tiques
    console.log('\nPASO 2: Corregir la función generar_tiques_desde_distribucion');
    await ejecutarScript('corregir_funcion_tiques.js');
    
    // 3. Preguntar al usuario qué sorteo desea configurar y generar tiques
    const sorteoId = await preguntarUsuario('\n¿Para qué sorteo desea configurar y generar tiques? (27/28): ');
    
    if (sorteoId !== '27' && sorteoId !== '28') {
      throw new Error('Sorteo no válido. Por favor, ejecute el script nuevamente y seleccione 27 o 28.');
    }
    
    // 4. Configurar la distribución de tiques
    console.log(`\nPASO 3: Configurar la distribución de tiques para el sorteo ${sorteoId}`);
    
    // Ejecutar configuración específica para el sorteo seleccionado
    if (sorteoId === '27') {
      // Para sorteo 27, usar el script específico
      await ejecutarScript('node -e "require(\'fs\').readFileSync(\'solo_configurar_distribucion.sql\', \'utf8\').split(\';\').forEach(q => { if(q.trim()) require(\'pg\').Client({user: \'omarte\', database: \'sorteo_db\', password: \'Ap3r1t1v02025\'}).query(q) })"');
    } else {
      // Para sorteo 28, verificar si ya tiene distribución
      console.log('Verificando la distribución para el sorteo 28...');
      await ejecutarScript('node -e "const {Client} = require(\'pg\'); const client = new Client({user: \'omarte\', database: \'sorteo_db\', password: \'Ap3r1t1v02025\'}); client.connect().then(() => client.query(\'SELECT COUNT(*) FROM distribucion_tiques WHERE sorteo_id = 28\').then(res => {console.log(\'Distribuciones para sorteo 28:\', res.rows[0].count); process.exit(0);}).catch(err => {console.error(err); process.exit(1);})).catch(err => {console.error(err); process.exit(1);});"');
    }
    
    // 5. Generar tiques
    console.log(`\nPASO 4: Generar tiques para el sorteo ${sorteoId}`);
    await ejecutarScript(`node -e "const {Client} = require('pg'); const client = new Client({user: 'omarte', database: 'sorteo_db', password: 'Ap3r1t1v02025'}); client.connect().then(() => client.query('SELECT * FROM generar_tiques_desde_distribucion($1, $2)', [${sorteoId}, 'TIQ']).then(res => {console.log('Resultado generación:', res.rows[0]); process.exit(0);}).catch(err => {console.error(err); process.exit(1);})).catch(err => {console.error(err); process.exit(1);});"`)
    
    console.log('\n=================================================');
    console.log('  ¡SOLUCIÓN COMPLETADA EXITOSAMENTE!  ');
    console.log('=================================================');
    console.log('\nTodos los pasos se han ejecutado correctamente. Ya puede utilizar la aplicación para visualizar los tiques generados.');
    
  } catch (error) {
    console.error('\n❌ ERROR DURANTE LA EJECUCIÓN:');
    console.error(error);
    console.log('\nPor favor, siga las instrucciones en el archivo INSTRUCCIONES_SOLUCION_COMPLETA.md para ejecutar los pasos manualmente.');
  }
}

// Ejecutar la función principal
main().catch(console.error); 