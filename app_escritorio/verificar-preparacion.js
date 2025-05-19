#!/usr/bin/env node

/**
 * Script para verificar la preparación del sistema para sorteos
 * Ejecutar con: node verificar-preparacion.js
 */

console.log('======================================================');
console.log('       VERIFICACIÓN DE PREPARACIÓN PARA SORTEO        ');
console.log('======================================================');
console.log('Sistema de Sorteos Pueblo Valiente');
console.log('------------------------------------------------------');

// Intentar importar el módulo de preparación previa
try {
  const { ejecutarPreparacionPrevia } = require('./src_main/utils/preparacion-previa');
  
  ejecutarPreparacionPrevia()
    .then(resultado => {
      // El resultado ya imprime todos los detalles
      if (resultado.success) {
        console.log('\n✨ El sistema está listo para realizar sorteos ✨');
      } else {
        console.log('\n⚠️ Se encontraron problemas que deben resolverse ⚠️');
        console.log('Revise los mensajes anteriores para más detalles');
      }
      
      console.log('\n======================================================');
    })
    .catch(error => {
      console.error('\n❌ Error al ejecutar verificación:', error);
      console.log('\n======================================================');
      process.exit(1);
    });
} catch (error) {
  console.error('\n❌ Error al cargar módulos:', error);
  console.log('\nAsegúrese de que se han instalado todas las dependencias:');
  console.log('  npm install');
  console.log('\n======================================================');
  process.exit(1);
} 