/**
 * Definición del esquema de la base de datos
 * Este archivo contiene la estructura esperada de las tablas
 * para verificar la integridad de la base de datos
 */

const fs = require('fs');
const path = require('path');

// Verificar si existe el archivo de esquema actual
const currentSchemaPath = path.join(__dirname, 'current-schema.json');
let dbSchema;

// Intentar cargar el esquema actual si existe, de lo contrario usar el predefinido
try {
  if (fs.existsSync(currentSchemaPath)) {
    console.log('Cargando esquema actual desde:', currentSchemaPath);
    const schemaData = fs.readFileSync(currentSchemaPath, 'utf8');
    const currentSchema = JSON.parse(schemaData);
    
    // Convertir el formato guardado al formato esperado por el validador
    dbSchema = {};
    
    for (const [tableName, tableInfo] of Object.entries(currentSchema)) {
      dbSchema[tableName] = {
        columns: tableInfo.columns,
        primaryKey: tableInfo.primaryKey
      };
    }
  } else {
    console.log('Archivo de esquema actual no encontrado, usando esquema predefinido');
    // Esquema predefinido
    dbSchema = {
      usuarios: {
        columns: [
          { name: 'id_usuario', type: 'integer', nullable: false },
          { name: 'nombre', type: 'character varying', nullable: false },
          { name: 'apellido', type: 'character varying', nullable: false },
          { name: 'email', type: 'character varying', nullable: false },
          { name: 'password', type: 'character varying', nullable: false },
          { name: 'rol', type: 'character varying', nullable: false },
          { name: 'fecha_creacion', type: 'timestamp with time zone', nullable: true },
          { name: 'ultimo_acceso', type: 'timestamp with time zone', nullable: true },
          { name: 'activo', type: 'boolean', nullable: false, default: true }
        ],
        primaryKey: 'id_usuario',
        indices: ['email']
      },
      
      sorteos: {
        columns: [
          { name: 'id_sorteo', type: 'integer', nullable: false },
          { name: 'nombre', type: 'character varying', nullable: false },
          { name: 'descripcion', type: 'text', nullable: true },
          { name: 'fecha_hora', type: 'timestamp with time zone', nullable: false },
          { name: 'tipo_sorteo', type: 'character varying', nullable: false },
          { name: 'estado', type: 'character varying', nullable: false },
          { name: 'creado_por', type: 'integer', nullable: false, references: 'usuarios(id_usuario)' },
          { name: 'fecha_creacion', type: 'timestamp with time zone', nullable: true },
          { name: 'fecha_modificacion', type: 'timestamp with time zone', nullable: true }
        ],
        primaryKey: 'id_sorteo',
        indices: ['fecha_hora', 'estado']
      },
      
      participantes: {
        columns: [
          { name: 'id_participante', type: 'integer', nullable: false },
          { name: 'nombre', type: 'character varying', nullable: false },
          { name: 'apellido', type: 'character varying', nullable: false },
          { name: 'documento_identidad', type: 'character varying', nullable: false },
          { name: 'email', type: 'character varying', nullable: true },
          { name: 'telefono', type: 'character varying', nullable: true },
          { name: 'estado', type: 'character varying', nullable: false },
          { name: 'municipio', type: 'character varying', nullable: true },
          { name: 'parroquia', type: 'character varying', nullable: true },
          { name: 'direccion', type: 'text', nullable: true },
          { name: 'fecha_registro', type: 'timestamp with time zone', nullable: true }
        ],
        primaryKey: 'id_participante',
        indices: ['documento_identidad', 'estado']
      },
      
      premios: {
        columns: [
          { name: 'id_premio', type: 'integer', nullable: false },
          { name: 'id_sorteo', type: 'integer', nullable: false, references: 'sorteos(id_sorteo)' },
          { name: 'nombre', type: 'character varying', nullable: false },
          { name: 'descripcion', type: 'text', nullable: true },
          { name: 'categoria', type: 'character varying', nullable: false },
          { name: 'orden', type: 'integer', nullable: false },
          { name: 'imagen_url', type: 'character varying', nullable: true },
          { name: 'ambito', type: 'character varying', nullable: false }, // 'nacional', 'regional'
          { name: 'estado', type: 'character varying', nullable: true }, // para premios regionales
          { name: 'fecha_creacion', type: 'timestamp with time zone', nullable: true }
        ],
        primaryKey: 'id_premio',
        indices: ['id_sorteo', 'categoria', 'ambito']
      },
      
      ganadores: {
        columns: [
          { name: 'id_ganador', type: 'integer', nullable: false },
          { name: 'id_sorteo', type: 'integer', nullable: false, references: 'sorteos(id_sorteo)' },
          { name: 'id_participante', type: 'integer', nullable: false, references: 'participantes(id_participante)' },
          { name: 'id_premio', type: 'integer', nullable: false, references: 'premios(id_premio)' },
          { name: 'numero_ticket', type: 'character varying', nullable: false },
          { name: 'fecha_seleccion', type: 'timestamp with time zone', nullable: false },
          { name: 'certificado_generado', type: 'boolean', nullable: false, default: false },
          { name: 'notificado', type: 'boolean', nullable: false, default: false },
          { name: 'fecha_notificacion', type: 'timestamp with time zone', nullable: true }
        ],
        primaryKey: 'id_ganador',
        indices: ['id_sorteo', 'id_participante', 'id_premio']
      }
    };
  }
} catch (error) {
  console.error('Error al cargar esquema:', error);
  // Usar un esquema vacío en caso de error (para evitar fallos)
  dbSchema = {};
}

module.exports = { dbSchema }; 