const { Pool } = require('pg');
const readline = require('readline');

// Crear interfaz para leer entrada del usuario
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Obtener la contraseña del usuario
rl.question('Ingrese la contraseña para PostgreSQL: ', (password) => {
  rl.close();
  
  // Configuración de la conexión
  const pool = new Pool({
    user: 'omarte',
    host: 'localhost',
    database: 'sorteo_db',
    password: 'Ap3r1t1v02025',
    port: 5432,
  });

  // Consulta para verificar si existe la columna en cada tabla
  const query = `
  SELECT 
    table_name, 
    column_name
  FROM 
    information_schema.columns 
  WHERE 
    table_schema = 'public' 
    AND table_name IN ('estados', 'municipios', 'parroquias')
    AND column_name = 'poblacion'
  ORDER BY 
    table_name;
  `;

  // Ejecutar la consulta
  pool.query(query)
    .then(res => {
      if (res.rows.length === 0) {
        console.log('La columna "poblacion" no existe en ninguna de las tablas');
      } else {
        console.log('Tablas que ya tienen la columna "poblacion":');
        for (const row of res.rows) {
          console.log(`- ${row.table_name}`);
        }
      }
      
      // Verificar si la columna existe en todas las tablas
      const tablas = ['estados', 'municipios', 'parroquias'];
      const tablasConPoblacion = new Set(res.rows.map(row => row.table_name));
      
      const tablasFaltantes = tablas.filter(tabla => !tablasConPoblacion.has(tabla));
      
      if (tablasFaltantes.length > 0) {
        console.log('\nTablas que NO tienen la columna "poblacion":');
        for (const tabla of tablasFaltantes) {
          console.log(`- ${tabla}`);
        }
      } else {
        console.log('\nTodas las tablas ya tienen la columna "poblacion"');
      }
      
      pool.end();
    })
    .catch(err => {
      console.error('Error al ejecutar la consulta:', err);
      pool.end();
    });
}); 