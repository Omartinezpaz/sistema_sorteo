import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App'; // Volvemos a usar la App original
// import App from './App_simple'; // Ya no usamos la versión simplificada
import './assets/css/App.css';
import './assets/css/global.css'; // Importar estilos globales accesibles

// Función para verificar el entorno y el estado del DOM
function verificarEntorno() {
  console.log('========== INICIANDO DIAGNÓSTICO DE REACT ==========');
  
  // 1. Verificar que estamos en el contexto adecuado
  console.log('Contexto: ', typeof window !== 'undefined' ? 'Navegador/Electron' : 'Otro');
  
  // 2. Verificar que el DOM está listo
  console.log('Documento: ', document ? 'Disponible' : 'No disponible');
  
  // 3. Verificar que el elemento root existe
  const rootElement = document.getElementById('root');
  console.log('Elemento root: ', rootElement ? 'Encontrado' : 'NO ENCONTRADO');
  
  // 4. Verificar dimensiones del contenedor root
  if (rootElement) {
    console.log('Dimensiones de root:', {
      offsetWidth: rootElement.offsetWidth,
      offsetHeight: rootElement.offsetHeight,
      clientWidth: rootElement.clientWidth,
      clientHeight: rootElement.clientHeight
    });
    
    // Añadir color de fondo para verificar visualmente
    rootElement.style.backgroundColor = '#f0f0f0';
  }
  
  return rootElement;
}

// Montar un componente básico de prueba para verificar
function ComponenteDePrueba() {
  console.log('Renderizando ComponenteDePrueba');
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#ff9800', 
      color: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      fontFamily: 'Arial, sans-serif',
      maxWidth: '80%',
      margin: '0 auto',
      textAlign: 'center'
    }}>
      <h1 style={{ color: 'white' }}>COMPONENTE DE PRUEBA DE REACT</h1>
      <p>Si puedes ver este mensaje, React está funcionando correctamente.</p>
      <button 
        style={{
          padding: '10px 20px',
          backgroundColor: '#e91e63',
          border: 'none',
          borderRadius: '4px',
          color: 'white',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
        onClick={() => {
          console.log('El evento onClick funciona correctamente');
          // Crear un mensaje visual en el DOM en lugar de usar alert()
          const mensajeDiv = document.createElement('div');
          mensajeDiv.textContent = 'El evento onClick funciona correctamente';
          mensajeDiv.style.backgroundColor = '#4caf50';
          mensajeDiv.style.color = 'white';
          mensajeDiv.style.padding = '10px';
          mensajeDiv.style.margin = '10px 0';
          mensajeDiv.style.borderRadius = '4px';
          mensajeDiv.style.fontWeight = 'bold';
          mensajeDiv.style.textAlign = 'center';
          
          // Agregar el mensaje después del botón
          const parentNode = document.querySelector('button').parentNode;
          parentNode.appendChild(mensajeDiv);
          
          // Remover el mensaje después de 3 segundos
          setTimeout(() => {
            parentNode.removeChild(mensajeDiv);
          }, 3000);
        }}
      >
        Haz clic para probar eventos
      </button>
    </div>
  );
}

// Inicializar React con manejo de errores
try {
  // Verificar el entorno y obtener el elemento root
  const rootElement = verificarEntorno();
  
  if (!rootElement) {
    // Si no hay elemento root, crearlo manualmente
    console.warn('Elemento root no encontrado, creándolo manualmente');
    const nuevoRoot = document.createElement('div');
    nuevoRoot.id = 'root';
    nuevoRoot.style.position = 'fixed';
    nuevoRoot.style.top = '0';
    nuevoRoot.style.left = '0';
    nuevoRoot.style.width = '100%';
    nuevoRoot.style.height = '100%';
    nuevoRoot.style.backgroundColor = '#f0f0f0';
    document.body.appendChild(nuevoRoot);
    
    console.log('Elemento root creado manualmente:', nuevoRoot);
    
    // Inicializar React en el nuevo root
    try {
      const root = ReactDOM.createRoot(nuevoRoot);
      console.log('Root de React creado correctamente en el elemento manual');
      
      // Renderizar directamente la aplicación (ya no necesitamos el paso intermedio)
      try {
        console.log('Intentando renderizar la aplicación...');
        root.render(
          <React.StrictMode>
            <HashRouter>
              <App />
            </HashRouter>
          </React.StrictMode>
        );
        console.log('Aplicación renderizada correctamente');
      } catch (appError) {
        console.error('Error al renderizar la aplicación:', appError);
        // En caso de error, mostrar el componente de prueba
        root.render(<ComponenteDePrueba />);
      }
    } catch (renderError) {
      console.error('Error al crear root o renderizar:', renderError);
      
      // Mostrar error en el DOM
      document.body.innerHTML = `
        <div style="padding: 20px; background-color: #f44336; color: white; font-family: Arial; margin: 20px;">
          <h2>Error de Renderizado de React</h2>
          <p>${renderError.message}</p>
          <pre>${renderError.stack}</pre>
        </div>
      `;
    }
  } else {
    // Inicialización normal con el elemento root existente
    console.log('Usando elemento root existente para montar React');
    
    try {
      // Crear root de React
      const root = ReactDOM.createRoot(rootElement);
      console.log('Root de React creado correctamente');
      
      // Renderizar directamente la aplicación
      try {
        console.log('Intentando renderizar la aplicación...');
        root.render(
          <React.StrictMode>
            <HashRouter>
              <App />
            </HashRouter>
          </React.StrictMode>
        );
        console.log('Aplicación renderizada correctamente');
      } catch (appError) {
        console.error('Error al renderizar la aplicación:', appError);
        // En caso de error, mostrar el componente de prueba
        root.render(<ComponenteDePrueba />);
      }
    } catch (error) {
      console.error('Error al inicializar React:', error);
      
      // Mostrar error en el DOM
      rootElement.innerHTML = `
        <div style="padding: 20px; background-color: #f44336; color: white; font-family: Arial; margin: 20px;">
          <h2>Error de Inicialización de React</h2>
          <p>${error.message}</p>
          <pre>${error.stack}</pre>
        </div>
      `;
    }
  }
} catch (globalError) {
  console.error('Error global al inicializar la aplicación:', globalError);
  
  // Mostrar mensaje de error en el cuerpo del documento
  document.body.innerHTML = `
    <div style="padding: 20px; background-color: #d32f2f; color: white; font-family: Arial; margin: 20px;">
      <h2>Error Fatal de Aplicación</h2>
      <p>${globalError.message}</p>
      <pre>${globalError.stack}</pre>
    </div>
  `;
} 