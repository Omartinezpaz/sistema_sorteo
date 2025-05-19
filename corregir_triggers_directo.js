const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración de conexión a la base de datos
// Puedes actualizar estos valores según tu configuración
const config = {
  user: 'omarte', 
  host: 'localhost',
  database: 'sorteo_db',
  password: 'Ap3r1t1v02025',
  port: 5432
};

// Contenido SQL directo para la corrección (en caso de que el archivo no exista)
const sqlDirecto = `
-- Primero eliminar los triggers existentes (tanto los viejos como los nuevos)
DROP TRIGGER IF EXISTS actualizar_timestamps_trigger ON estados;
DROP TRIGGER IF EXISTS actualizar_timestamps_trigger ON municipios;
DROP TRIGGER IF EXISTS actualizar_timestamps_trigger ON parroquias;
DROP TRIGGER IF EXISTS actualizar_timestamps_trigger ON sorteos;
DROP TRIGGER IF EXISTS actualizar_timestamps_trigger ON participantes;
DROP TRIGGER IF EXISTS actualizar_timestamps_trigger ON usuarios;

DROP TRIGGER IF EXISTS actualizar_fecha_actualizacion_trigger ON estados;
DROP TRIGGER IF EXISTS actualizar_fecha_actualizacion_trigger ON municipios;
DROP TRIGGER IF EXISTS actualizar_fecha_actualizacion_trigger ON parroquias;
DROP TRIGGER IF EXISTS actualizar_fecha_actualizacion_trigger ON sorteos;
DROP TRIGGER IF EXISTS actualizar_fecha_actualizacion_trigger ON participantes;
DROP TRIGGER IF EXISTS actualizar_fecha_actualizacion_trigger ON usuarios;

-- Eliminar ambas funciones de timestamp para evitar conflictos
DROP FUNCTION IF EXISTS actualizar_timestamps() CASCADE;
DROP FUNCTION IF EXISTS actualizar_fecha_actualizacion() CASCADE;

-- Crear una nueva función que verifique si el campo "fecha_actualizacion" existe
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

-- Aplicar el nuevo trigger a cada tabla que tenga el campo fecha_actualizacion
CREATE TRIGGER actualizar_fecha_actualizacion_trigger
BEFORE UPDATE ON estados
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_actualizacion();

CREATE TRIGGER actualizar_fecha_actualizacion_trigger
BEFORE UPDATE ON municipios
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_actualizacion();

CREATE TRIGGER actualizar_fecha_actualizacion_trigger
BEFORE UPDATE ON parroquias
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_actualizacion();

-- Verificar y corregir el campo fecha_actualizacion en cada tabla si es necesario
ALTER TABLE IF EXISTS estados 
ALTER COLUMN fecha_actualizacion SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE IF EXISTS municipios 
ALTER COLUMN fecha_actualizacion SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE IF EXISTS parroquias 
ALTER COLUMN fecha_actualizacion SET DEFAULT CURRENT_TIMESTAMP;
`;

async function aplicarCorreccion() {
  console.log('========================================');
  console.log('INICIANDO SCRIPT DE CORRECCIÓN DE TRIGGERS');
  console.log('========================================');
  console.log(`Intentando conectar a: ${config.host}:${config.port}/${config.database} como ${config.user}`);
  
  // Crear una nueva instancia de cliente para esta operación
  const cliente = new Client(config);
  
  try {
    // Conectar a la base de datos
    await cliente.connect();
    console.log('✅ Conexión a la base de datos establecida correctamente');
    
    // Verificar tablas con el campo fecha_actualizacion
    console.log('Verificando tablas con el campo fecha_actualizacion...');
    const queryTablas = `
      SELECT table_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND column_name = 'fecha_actualizacion'
    `;
    const resultado = await cliente.query(queryTablas);
    console.log('Tablas con el campo fecha_actualizacion:');
    resultado.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    // Ejecutar la corrección
    console.log('\nEjecutando SQL de corrección...');
    await cliente.query(sqlDirecto);
    
    console.log('✅ ¡CORRECCIÓN APLICADA CON ÉXITO!');
    console.log('Ahora puedes reiniciar la aplicación y debería funcionar correctamente.');
  } catch (error) {
    console.error('❌ ERROR al aplicar la corrección:', error);
    console.log('Detalles del error:');
    console.log('- Mensaje:', error.message);
    if (error.code) console.log('- Código de error:', error.code);
    if (error.position) console.log('- Posición en el SQL:', error.position);
    
    console.log('\nSugerencias:');
    console.log('1. Verifica que la base de datos esté activa y accesible');
    console.log('2. Confirma que los datos de conexión sean correctos');
    console.log('3. Asegúrate de tener permisos suficientes en la base de datos');
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
aplicarCorreccion(); 