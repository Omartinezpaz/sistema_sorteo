/**
 * Validador de esquema de base de datos
 * Verifica que la estructura de las tablas en la base de datos
 * coincida con la estructura esperada definida en schema.js
 */

const { query } = require('./connection');
const { dbSchema } = require('./schema');

/**
 * Verifica la estructura de una tabla específica
 * @param {string} tableName - Nombre de la tabla a verificar
 * @returns {Promise<Object>} Resultado de la verificación
 */
async function validateTableStructure(tableName) {
  const expectedTable = dbSchema[tableName];
  
  if (!expectedTable) {
    return {
      table: tableName,
      valid: false,
      error: 'Tabla no definida en el esquema'
    };
  }
  
  try {
    // Consulta para obtener información sobre las columnas de la tabla
    const columnsResult = await query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM 
        information_schema.columns
      WHERE 
        table_schema = 'public'
        AND table_name = $1
      ORDER BY 
        ordinal_position
    `, [tableName]);
    
    // Si no hay resultados, la tabla no existe
    if (columnsResult.rows.length === 0) {
      return {
        table: tableName,
        valid: false,
        error: 'La tabla no existe en la base de datos'
      };
    }
    
    const actualColumns = columnsResult.rows;
    
    // Verificar que estén todas las columnas esperadas
    const missingColumns = [];
    const typeMismatchColumns = [];
    const nullabilityMismatchColumns = [];
    
    for (const expectedColumn of expectedTable.columns) {
      const actualColumn = actualColumns.find(col => col.column_name === expectedColumn.name);
      
      if (!actualColumn) {
        missingColumns.push(expectedColumn.name);
        continue;
      }
      
      // Verificar tipo de datos
      // En PostgreSQL, algunos tipos pueden tener variantes (ej. varchar vs. character varying)
      const expectedType = normalizeDataType(expectedColumn.type);
      const actualType = normalizeDataType(actualColumn.data_type);
      
      if (expectedType !== actualType) {
        typeMismatchColumns.push({
          column: expectedColumn.name,
          expected: expectedColumn.type,
          actual: actualColumn.data_type
        });
      }
      
      // Verificar restricción de nulidad
      const expectedNullable = expectedColumn.nullable ? 'YES' : 'NO';
      if (actualColumn.is_nullable !== expectedNullable) {
        nullabilityMismatchColumns.push({
          column: expectedColumn.name,
          expected: expectedNullable,
          actual: actualColumn.is_nullable
        });
      }
    }
    
    // Columnas adicionales en la BD que no están en el esquema esperado
    const extraColumns = actualColumns
      .filter(col => !expectedTable.columns.some(expectedCol => expectedCol.name === col.column_name))
      .map(col => col.column_name);
    
    // Verificar clave primaria
    let primaryKeyValid = true;
    let primaryKeyError = null;
    
    if (expectedTable.primaryKey) {
      const pkResult = await query(`
        SELECT 
          kcu.column_name
        FROM 
          information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
        WHERE 
          tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = 'public'
          AND tc.table_name = $1
      `, [tableName]);
      
      if (pkResult.rows.length === 0) {
        primaryKeyValid = false;
        primaryKeyError = 'La tabla no tiene clave primaria';
      } else {
        const primaryKeyColumns = pkResult.rows.map(row => row.column_name);
        
        // Para claves primarias compuestas
        if (Array.isArray(expectedTable.primaryKey)) {
          const missingPkColumns = expectedTable.primaryKey.filter(col => !primaryKeyColumns.includes(col));
          const extraPkColumns = primaryKeyColumns.filter(col => !expectedTable.primaryKey.includes(col));
          
          if (missingPkColumns.length > 0 || extraPkColumns.length > 0) {
            primaryKeyValid = false;
            primaryKeyError = 'La clave primaria no coincide con la esperada';
          }
        } else {
          // Para clave primaria simple
          if (!primaryKeyColumns.includes(expectedTable.primaryKey)) {
            primaryKeyValid = false;
            primaryKeyError = `La clave primaria esperada es ${expectedTable.primaryKey}, pero encontró ${primaryKeyColumns.join(', ')}`;
          }
        }
      }
    }
    
    // Determinar el resultado de la validación
    const isValid = missingColumns.length === 0 && 
                   typeMismatchColumns.length === 0 && 
                   nullabilityMismatchColumns.length === 0 &&
                   primaryKeyValid;
    
    return {
      table: tableName,
      valid: isValid,
      details: {
        missingColumns,
        extraColumns,
        typeMismatchColumns,
        nullabilityMismatchColumns,
        primaryKey: {
          valid: primaryKeyValid,
          error: primaryKeyError
        }
      }
    };
  } catch (error) {
    console.error(`Error al validar la estructura de la tabla ${tableName}:`, error);
    return {
      table: tableName,
      valid: false,
      error: error.message
    };
  }
}

/**
 * Normaliza los tipos de datos para comparación
 * @param {string} dataType - Tipo de datos a normalizar
 * @returns {string} Tipo de datos normalizado
 */
function normalizeDataType(dataType) {
  // Normalizar tipos comunes que pueden tener distintas representaciones
  const normalizations = {
    'character varying': 'varchar',
    'varchar': 'varchar',
    'timestamp with time zone': 'timestamptz',
    'timestamptz': 'timestamptz',
    'timestamp without time zone': 'timestamp',
    'timestamp': 'timestamp',
    'integer': 'int',
    'int': 'int',
    'int4': 'int',
    'boolean': 'bool',
    'bool': 'bool'
  };
  
  return normalizations[dataType.toLowerCase()] || dataType.toLowerCase();
}

/**
 * Valida la estructura de todas las tablas definidas en el esquema
 * @returns {Promise<Object>} Resultado de la validación de todas las tablas
 */
async function validateDatabaseSchema() {
  const results = {
    valid: true,
    tables: {},
    missingTables: [],
    invalidTables: []
  };
  
  try {
    // Obtener lista de tablas en la base de datos
    const tablesResult = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `, []);
    
    const existingTables = tablesResult.rows.map(row => row.table_name);
    
    // Verificar todas las tablas definidas en el esquema
    for (const tableName of Object.keys(dbSchema)) {
      if (!existingTables.includes(tableName)) {
        results.missingTables.push(tableName);
        results.valid = false;
        results.tables[tableName] = {
          valid: false,
          error: 'La tabla no existe en la base de datos'
        };
        continue;
      }
      
      const validationResult = await validateTableStructure(tableName);
      results.tables[tableName] = validationResult;
      
      if (!validationResult.valid) {
        results.invalidTables.push(tableName);
        results.valid = false;
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error al validar el esquema de la base de datos:', error);
    return {
      valid: false,
      error: error.message
    };
  }
}

module.exports = {
  validateTableStructure,
  validateDatabaseSchema
}; 