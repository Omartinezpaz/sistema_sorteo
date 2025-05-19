import React, { useState, useEffect } from 'react';
import LoginPage from './pages/auth/LoginPage';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messageInfo, setMessageInfo] = useState(null);
  
  // Función de login (simulada por ahora)
  const handleLogin = async (credentials) => {
    console.log('Intento de login con:', credentials);
    try {
      // Aquí normalmente llamaríamos a window.api.loginAttempt
      // Por ahora solo mostramos un mensaje de éxito para la prueba
      setUser({ id: 1, username: 'admin', role: 'admin' });
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, message: error.message };
    }
  };
  
  // Mostrar mensaje informativo en lugar de alert
  const showMessage = (text) => {
    setMessageInfo(text);
    // Ocultar el mensaje después de 3 segundos
    setTimeout(() => {
      setMessageInfo(null);
    }, 3000);
  };
  
  // Simulación de carga inicial
  useEffect(() => {
    console.log('App cargada - Inicializando...');
    setTimeout(() => {
      setLoading(false);
      console.log('Aplicación lista');
    }, 1000);
  }, []);
  
  // Pantalla de carga
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <h1>Cargando aplicación...</h1>
        <div style={{ 
          width: '50%', 
          height: '20px', 
          backgroundColor: '#e0e0e0',
          borderRadius: '10px',
          overflow: 'hidden',
          margin: '20px 0'
        }}>
          <div style={{ 
            width: '70%', 
            height: '100%', 
            backgroundColor: '#4caf50',
            animation: 'loading 1.5s infinite'
          }}></div>
        </div>
        <p>Por favor espere...</p>
        
        <style>{`
          @keyframes loading {
            0% { width: 0%; }
            50% { width: 70%; }
            100% { width: 100%; }
          }
        `}</style>
      </div>
    );
  }
  
  // Si no está autenticado, mostrar la página de login
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }
  
  // Contenido principal si está autenticado
  return (
    <div style={{ padding: '20px' }}>
      <h1>Sistema de Sorteos Pueblo Valiente</h1>
      <p>Bienvenido, {user?.username}</p>
      <p>Esta es una versión simplificada de la aplicación para diagnóstico.</p>
      
      {/* Mensaje informativo */}
      {messageInfo && (
        <div style={{ 
          marginTop: '10px', 
          padding: '10px', 
          backgroundColor: '#4caf50', 
          color: 'white', 
          borderRadius: '4px',
          animation: 'fadeIn 0.3s'
        }}>
          {messageInfo}
        </div>
      )}
      
      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <h2>Panel de Control</h2>
        <p>Seleccione una de las siguientes opciones:</p>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '20px' }}>
          {['Dashboard', 'Sorteos', 'Participantes', 'Configuración'].map(option => (
            <button 
              key={option}
              style={{
                padding: '10px 20px',
                backgroundColor: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              onClick={() => showMessage(`Funcionalidad ${option} no implementada en esta versión simplificada`)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      
      <button 
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#f44336',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
        onClick={() => {
          setIsAuthenticated(false);
          setUser(null);
        }}
      >
        Cerrar Sesión
      </button>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default App; 