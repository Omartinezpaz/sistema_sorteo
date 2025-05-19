const fs = require('fs');
const path = require('path');

// Rutas a los archivos importantes
const rutaLoginPage = path.join(__dirname, 'src_renderer', 'pages', 'auth', 'LoginPage.jsx');
const rutaLoginForm = path.join(__dirname, 'src_renderer', 'components', 'auth', 'LoginForm.jsx');
const rutaApp = path.join(__dirname, 'src_renderer', 'App.jsx');
const rutaIndex = path.join(__dirname, 'src_renderer', 'index.jsx');
const rutaHTML = path.join(__dirname, 'public', 'index.html');
const rutaPreload = path.join(__dirname, 'src_main', 'preload.js');

console.log('=== DIAGNÓSTICO DEL COMPONENTE DE LOGIN ===');

// 1. Verificar que los archivos existen
console.log('\n1. Verificando existencia de archivos importantes...');
const archivos = [
  { ruta: rutaLoginPage, nombre: 'LoginPage.jsx' },
  { ruta: rutaLoginForm, nombre: 'LoginForm.jsx' },
  { ruta: rutaApp, nombre: 'App.jsx' },
  { ruta: rutaIndex, nombre: 'index.jsx' },
  { ruta: rutaHTML, nombre: 'index.html' },
  { ruta: rutaPreload, nombre: 'preload.js' }
];

let todoOK = true;
archivos.forEach(archivo => {
  if (fs.existsSync(archivo.ruta)) {
    console.log(`✅ Archivo ${archivo.nombre} encontrado`);
  } else {
    console.log(`❌ Archivo ${archivo.nombre} NO ENCONTRADO`);
    todoOK = false;
  }
});

if (!todoOK) {
  console.log('❌ Faltan archivos críticos. La aplicación no puede funcionar correctamente.');
  process.exit(1);
}

// 2. Leer contenido de los archivos para análisis
console.log('\n2. Analizando componentes de login...');

// Verificar LoginPage.jsx
try {
  const loginPageContent = fs.readFileSync(rutaLoginPage, 'utf8');
  if (loginPageContent.includes('<LoginForm')) {
    console.log('✅ LoginPage.jsx incluye el componente LoginForm');
  } else {
    console.log('❌ LoginPage.jsx no incluye el componente LoginForm');
    todoOK = false;
  }
} catch (err) {
  console.error('Error al leer LoginPage.jsx:', err.message);
  todoOK = false;
}

// Verificar LoginForm.jsx
try {
  const loginFormContent = fs.readFileSync(rutaLoginForm, 'utf8');
  if (loginFormContent.includes('onSubmit={handleSubmit}')) {
    console.log('✅ LoginForm.jsx incluye el manejador de envío del formulario');
  } else {
    console.log('❌ LoginForm.jsx no incluye el manejador de envío del formulario');
    todoOK = false;
  }
} catch (err) {
  console.error('Error al leer LoginForm.jsx:', err.message);
  todoOK = false;
}

// Verificar App.jsx
try {
  const appContent = fs.readFileSync(rutaApp, 'utf8');
  if (appContent.includes('<LoginPage')) {
    console.log('✅ App.jsx renderiza el componente LoginPage cuando no está autenticado');
  } else {
    console.log('❌ App.jsx no renderiza el componente LoginPage');
    todoOK = false;
  }
} catch (err) {
  console.error('Error al leer App.jsx:', err.message);
  todoOK = false;
}

// 3. Insertar logs de depuración en index.jsx
console.log('\n3. Agregando logs de depuración al código...');

try {
  let indexContent = fs.readFileSync(rutaIndex, 'utf8');
  
  // Agregar console.log para ver el flujo de renderizado
  if (!indexContent.includes('console.log("Iniciando renderizado de React")')) {
    indexContent = indexContent.replace(
      'const root = ReactDOM.createRoot(rootElement);',
      'console.log("Iniciando renderizado de React");\nconsole.log("Elemento root encontrado:", rootElement);\nconst root = ReactDOM.createRoot(rootElement);'
    );
    
    indexContent = indexContent.replace(
      'root.render(',
      'console.log("Renderizando App en root...");\nroot.render('
    );
    
    fs.writeFileSync(rutaIndex, indexContent);
    console.log('✅ Logs de depuración agregados a index.jsx');
  } else {
    console.log('ℹ️ Los logs de depuración ya estaban presentes en index.jsx');
  }
} catch (err) {
  console.error('Error al modificar index.jsx:', err.message);
}

// 4. Modificar LoginForm.jsx para hacerlo más visible
try {
  let loginFormContent = fs.readFileSync(rutaLoginForm, 'utf8');
  
  // Buscar si ya tiene el estilo destacado
  if (!loginFormContent.includes('background-color: #ffcc00')) {
    // Agregar estilo destacado y console.log
    loginFormContent = loginFormContent.replace(
      'return (',
      'console.log("Renderizando LoginForm...");\nreturn ('
    );
    
    loginFormContent = loginFormContent.replace(
      '<form onSubmit={handleSubmit} className="login-form">',
      '<form onSubmit={handleSubmit} className="login-form" style={{background: "#ffcc00", padding: "20px", border: "3px solid red", marginTop: "50px"}}>'
    );
    
    loginFormContent = loginFormContent.replace(
      '<h2>Iniciar Sesión</h2>',
      '<h2 style={{color: "black", fontWeight: "bold"}}>FORMULARIO DE LOGIN (VERIFICACIÓN)</h2>'
    );
    
    fs.writeFileSync(rutaLoginForm, loginFormContent);
    console.log('✅ LoginForm modificado para ser más visible');
  } else {
    console.log('ℹ️ LoginForm ya estaba modificado para ser más visible');
  }
} catch (err) {
  console.error('Error al modificar LoginForm.jsx:', err.message);
}

// 5. Verificar la estructura del HTML
try {
  const htmlContent = fs.readFileSync(rutaHTML, 'utf8');
  
  // Verificar que tenga el div#root
  if (htmlContent.includes('<div id="root"></div>')) {
    console.log('✅ index.html contiene el div#root para montar la aplicación');
  } else {
    console.log('❌ index.html no contiene el div#root correctamente');
    todoOK = false;
  }
  
  // Verificar la ruta del script
  if (htmlContent.includes('./dist/renderer.js')) {
    console.log('✅ index.html referencia correctamente al archivo renderer.js');
  } else {
    console.log('❌ index.html no referencia correctamente al archivo renderer.js');
    todoOK = false;
  }
} catch (err) {
  console.error('Error al leer index.html:', err.message);
  todoOK = false;
}

// 6. Verificar preload.js
try {
  const preloadContent = fs.readFileSync(rutaPreload, 'utf8');
  
  // Verificar comunicación IPC
  if (preloadContent.includes('loginAttempt')) {
    console.log('✅ preload.js exporta la función loginAttempt');
  } else {
    console.log('❌ preload.js no exporta la función loginAttempt');
    todoOK = false;
  }
} catch (err) {
  console.error('Error al leer preload.js:', err.message);
  todoOK = false;
}

// 7. Crear archivo simple de login para probar
const rutaLoginSimple = path.join(__dirname, 'public', 'login_verificacion.html');
const contenidoLoginSimple = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Verificación de Login</title>
  <style>
    body { 
      background: #2c3e50;
      color: white;
      font-family: Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
    }
    .login-form {
      background: #ffcc00;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 0 20px rgba(0,0,0,0.5);
      color: black;
      width: 350px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    input {
      width: 100%;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    button {
      background: #e74c3c;
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      width: 100%;
    }
    h2 {
      text-align: center;
      margin-top: 0;
      margin-bottom: 20px;
      color: #e74c3c;
    }
  </style>
</head>
<body>
  <div class="login-form">
    <h2>VERIFICACIÓN DE LOGIN</h2>
    <div class="form-group">
      <label>Usuario:</label>
      <input type="text" placeholder="Ingrese su usuario">
    </div>
    <div class="form-group">
      <label>Contraseña:</label>
      <input type="password" placeholder="Ingrese su contraseña">
    </div>
    <button onclick="alert('Esta es solo una página de prueba para verificar que el renderizado HTML funciona.')">Ingresar</button>
    <p style="text-align:center;margin-top:20px;">Si ves esta página, el HTML se está renderizando correctamente en Electron.</p>
  </div>
  <script>
    console.log('Página de verificación cargada correctamente');
    document.body.style.backgroundColor = localStorage.getItem('bgColor') || '#2c3e50';
    
    // Cambiar color cada 3 segundos para verificar que JavaScript funciona
    let colors = ['#2c3e50', '#34495e', '#3498db', '#1abc9c', '#27ae60'];
    let colorIndex = 0;
    
    setInterval(() => {
      colorIndex = (colorIndex + 1) % colors.length;
      document.body.style.backgroundColor = colors[colorIndex];
      localStorage.setItem('bgColor', colors[colorIndex]);
      console.log('Cambiando color de fondo:', colors[colorIndex]);
    }, 3000);
  </script>
</body>
</html>`;

try {
  fs.writeFileSync(rutaLoginSimple, contenidoLoginSimple);
  console.log(`✅ Archivo de verificación de login creado en: ${rutaLoginSimple}`);
} catch (err) {
  console.error('Error al crear archivo de verificación:', err.message);
}

console.log('\n=== DIAGNÓSTICO COMPLETADO ===');
if (todoOK) {
  console.log('✅ Todos los componentes de login parecen estar correctamente configurados.');
} else {
  console.log('⚠️ Se encontraron problemas con los componentes de login.');
}

console.log('\nPróximos pasos:');
console.log('1. Recompila la aplicación con "npm run build"');
console.log('2. Ejecuta la aplicación con "npm start"');
console.log('3. Si la pantalla sigue en blanco, abre las herramientas de desarrollo (F12) y verifica los mensajes en la consola');
console.log('4. También puedes probar la página de verificación simple ejecutando la aplicación con:');
console.log('   electron . --load-url=file://' + rutaLoginSimple.replace(/\\/g, '/')); 