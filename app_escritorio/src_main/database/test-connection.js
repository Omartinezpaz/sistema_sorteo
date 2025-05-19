const { testConnection, config, query } = require('./connection');

async function runTests() {
  console.log('Iniciando pruebas de conexión a PostgreSQL...');
  console.log('Configuración actual:', JSON.stringify(config, null, 2));
  
  try {
    // Probar conexión básica
    const connectionSuccess = await testConnection();
    
    if (!connectionSuccess) {
      console.error('❌ Error: No se pudo establecer conexión con PostgreSQL');
      process.exit(1);
    }
    
    console.log('✅ Conexión a PostgreSQL exitosa');
    
    // Verificar existencia de tablas requeridas
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('\n📋 Tablas encontradas en la base de datos:');
    
    if (tablesResult.rows.length === 0) {
      console.log('  No se encontraron tablas. La base de datos está vacía.');
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    }
    
    // Comprobar espacio disponible en la base de datos
    const dbSizeResult = await query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as db_size;
    `);
    
    console.log(`\n💾 Tamaño actual de la base de datos: ${dbSizeResult.rows[0].db_size}`);
    
    // Verificar versión de PostgreSQL
    const versionResult = await query('SELECT version();');
    console.log(`\n🔍 Versión de PostgreSQL: ${versionResult.rows[0].version.split(',')[0]}`);
    
    // Verificar permisos del usuario
    const userPrivilegesResult = await query(`
      SELECT table_name, privilege_type
      FROM information_schema.table_privileges
      WHERE grantee = $1
      ORDER BY table_name, privilege_type;
    `, [config.user]);
    
    console.log(`\n👤 Permisos del usuario '${config.user}':`);
    
    if (userPrivilegesResult.rows.length === 0) {
      console.log('  El usuario no tiene permisos explícitos asignados.');
      console.log('  Si es superusuario, esto es normal ya que tiene todos los privilegios implícitamente.');
    } else {
      const tablePermissions = {};
      
      userPrivilegesResult.rows.forEach(row => {
        const { table_name, privilege_type } = row;
        if (!tablePermissions[table_name]) {
          tablePermissions[table_name] = [];
        }
        tablePermissions[table_name].push(privilege_type);
      });
      
      Object.entries(tablePermissions).forEach(([table, privileges]) => {
        console.log(`  - ${table}: ${privileges.join(', ')}`);
      });
    }
    
    // Verificar si el usuario es superusuario
    const isSuperuserResult = await query(`
      SELECT rolsuper FROM pg_roles WHERE rolname = $1;
    `, [config.user]);
    
    if (isSuperuserResult.rows.length > 0 && isSuperuserResult.rows[0].rolsuper) {
      console.log(`\n🔑 El usuario '${config.user}' es superusuario en PostgreSQL.`);
    }
    
    console.log('\n✅ Pruebas de conexión completadas exitosamente');
    
  } catch (error) {
    console.error('\n❌ Error durante las pruebas:', error);
    process.exit(1);
  } finally {
    // Terminar el proceso después de las pruebas
    process.exit(0);
  }
}

// Ejecutar las pruebas
runTests(); 