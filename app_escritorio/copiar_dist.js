const fs = require('fs');
const path = require('path');

console.log('Copiando archivos de distribución...');

// Directorios de origen y destino
const sourceDir = path.join(__dirname, 'dist');
const targetDir = path.join(__dirname, 'public', 'dist');

// Asegurarse de que el directorio de destino exista
if (!fs.existsSync(targetDir)) {
  console.log(`Creando directorio ${targetDir}`);
  fs.mkdirSync(targetDir, { recursive: true });
}

// Obtener todos los archivos de la carpeta de origen
const files = fs.readdirSync(sourceDir);

// Copiar cada archivo
files.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const targetPath = path.join(targetDir, file);
  
  // Verificar si es un archivo y no un directorio
  const stats = fs.statSync(sourcePath);
  if (stats.isFile()) {
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`✅ Copiado: ${file} (${Math.round(stats.size / 1024)} KB)`);
  }
});

console.log('Copia completada con éxito.');
console.log('');
console.log('Para iniciar la aplicación, ejecute:');
console.log('npm start'); 