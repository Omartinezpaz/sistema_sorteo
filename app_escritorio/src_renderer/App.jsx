import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './assets/css/App.css';
import LoginPage from './pages/auth/LoginPage';
import DashboardStats from './components/dashboard/DashboardStats';
import CreacionSorteo from './pages/sorteo/CreacionSorteo';
import IniciarSorteoPage from './pages/sorteo/IniciarSorteo';
import ListadoSorteos from './components/sorteo/ListadoSorteos';
import ResultadosSorteo from './components/sorteo/ResultadosSorteo';
import GestionTiques from './pages/participantes/GestionTiques';
import ImportarParticipantes from './pages/participantes/ImportarParticipantes';
import ConfiguracionTiques from './pages/configuracion/ConfiguracionTiques';
import { ButtonText } from './components/common/Button';
import { Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions, Button } from '@mui/material';

// Iconos básicos para las pestañas con textos accesibles
const DashboardIcon = () => <span aria-hidden="true">📊</span>;
const SorteosIcon = () => <span aria-hidden="true">🎯</span>;
const ParticipantesIcon = () => <span aria-hidden="true">👥</span>;
const ConfiguracionIcon = () => <span aria-hidden="true">⚙️</span>;
const NuevoSorteoIcon = () => <span aria-hidden="true">✨</span>;
const IniciarSorteoIcon = () => <span aria-hidden="true">🎲</span>;

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // Para guardar datos del usuario
  const [dbTestResult, setDbTestResult] = useState(null);
  const [loginError, setLoginError] = useState(''); // Para mensajes de error del login
  const [selectedSorteoId, setSelectedSorteoId] = useState(null); // Para operaciones sobre un sorteo específico

  // Estado para la navegación adaptado para router
  const [activeTab, setActiveTab] = useState(() => {
    const path = location.pathname;
    if (path.startsWith('/sorteos')) return 'sorteos';
    if (path.startsWith('/participantes')) return 'participantes';
    if (path.startsWith('/configuracion')) return 'configuracion';
    return 'dashboard';
  });

  // Nuevo estado para el diálogo de gestión de tiques
  const [tiqueDialogOpen, setTiqueDialogOpen] = useState(false);
  const [tiqueIdInput, setTiqueIdInput] = useState('');

  // Efecto para actualizar activeTab cuando cambia la ruta
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/sorteos')) setActiveTab('sorteos');
    else if (path.startsWith('/participantes')) setActiveTab('participantes');
    else if (path.startsWith('/configuracion')) setActiveTab('configuracion');
    else setActiveTab('dashboard');
  }, [location.pathname]);

  const handleLogin = async (credentials) => {
    setLoginError(''); // Limpiar errores previos
    try {
      console.log('Enviando credenciales al main process:', credentials);
      // Usar la API correcta según lo configurado en preload.js
      const loginApi = window.electron || window.electronAPI;
      const response = await loginApi.loginAttempt(credentials);
      console.log('Respuesta del main process (login):', response);

      if (response.success) {
        setIsAuthenticated(true);
        setCurrentUser(response.user); // Guardar datos del usuario
        setDbTestResult(null); // Limpiar test de BD si se re-loguea
      } else {
        setLoginError(response.message || 'Error de login desconocido.');
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('Error al llamar a loginAttempt desde el renderer:', error);
      setLoginError(`Error de comunicación: ${error.message}`);
      setIsAuthenticated(false);
      setCurrentUser(null);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setDbTestResult(null); 
    setLoginError('');
    navigate('/');
  };

  const navegarA = (tab, section = null, sorteoId = null) => {
    let path = `/${tab}`;
    
    if (section) {
      path += `/${section}`;
      if (sorteoId !== undefined && sorteoId !== null) {
        path += `/${sorteoId}`;
        setSelectedSorteoId(sorteoId);
      }
    }
    
    navigate(path);
  };

  useEffect(() => {
    if (isAuthenticated && currentUser) { // Solo si está autenticado y hay usuario
      const testDbConnection = async () => {
        try {
          // Usar la API correcta según lo configurado en preload.js
          const dbApi = window.electron || window.electronAPI;
          const time = await dbApi.dbQuery('SELECT NOW()');
          console.log('Resultado de la consulta a BD (después de login):', time);
          setDbTestResult(`Hora del servidor de BD: ${time[0].now}`);
        } catch (error) {
          console.error('Error al consultar la BD desde el renderer (después de login):', error);
          setDbTestResult(`Error al conectar con BD: ${error.message}`);
        }
      };
      testDbConnection();
    }
  }, [isAuthenticated, currentUser]);

  // Escuchar eventos de navegación desde el main process
  useEffect(() => {
    if (isAuthenticated) {
      // Usar la API correcta según lo configurado en preload.js
      const api = window.electron || window.electronAPI;
      const unsubscribe = api.on('cambio-tab', (data) => {
        console.log('Evento de navegación recibido:', data);
        navegarA(data.tab, data.section, data.sorteoId);
      });
      
      // Limpiar al desmontar
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    // Pasar loginError a LoginPage para que pueda mostrarlo (opcional)
    return <LoginPage onLogin={handleLogin} loginError={loginError} />;
  }

  return (
    <div className="app-container">
      <header className="app-header" role="banner">
        <div className="logo">Sorteo Pueblo Valiente</div>
        <div className="user-info">
          <span>Usuario: {currentUser.username} (Rol: {currentUser.role})</span>
          <ButtonText onClick={handleLogout} aria-label="Cerrar sesión">Cerrar Sesión</ButtonText>
        </div>
      </header>

      <nav className="app-tabs" role="navigation" aria-label="Navegación principal">
        <button 
          className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => navegarA('dashboard')}
          aria-label="Dashboard"
          aria-current={activeTab === 'dashboard' ? 'page' : undefined}
        >
          <DashboardIcon /> Dashboard
        </button>
        
        <button 
          className={`tab-button ${activeTab === 'sorteos' ? 'active' : ''}`}
          onClick={() => navegarA('sorteos')}
          aria-label="Sorteos"
          aria-current={activeTab === 'sorteos' ? 'page' : undefined}
        >
          <SorteosIcon /> Sorteos
        </button>
        
        <button 
          className={`tab-button ${activeTab === 'participantes' ? 'active' : ''}`}
          onClick={() => navegarA('participantes')}
          aria-label="Participantes"
          aria-current={activeTab === 'participantes' ? 'page' : undefined}
        >
          <ParticipantesIcon /> Participantes
        </button>
        
        <button 
          className={`tab-button ${activeTab === 'configuracion' ? 'active' : ''}`}
          onClick={() => navegarA('configuracion')}
          aria-label="Configuración"
          aria-current={activeTab === 'configuracion' ? 'page' : undefined}
        >
          <ConfiguracionIcon /> Configuración
        </button>
      </nav>

      <main className="app-content" role="main">
        <Routes>
          <Route path="/" element={<DashboardStats />} />
          <Route path="/dashboard" element={<DashboardStats />} />
          
          {/* Rutas de Sorteos */}
          <Route path="/sorteos" element={
            <div>
              <div className="section-header">
                <h2 className="section-title">Gestión de Sorteos</h2>
                <div className="btn-group">
                  <button 
                    className="btn btn-primary"
                    onClick={() => navegarA('sorteos', 'nuevo')}
                    aria-label="Crear nuevo sorteo"
                  >
                    <NuevoSorteoIcon /> Nuevo Sorteo
                  </button>
                  <button 
                    className="btn btn-success"
                    onClick={() => navegarA('sorteos', 'iniciar')}
                    aria-label="Iniciar un sorteo"
                  >
                    <IniciarSorteoIcon /> Iniciar Sorteo
                  </button>
                </div>
              </div>
              <ListadoSorteos 
                onNuevoSorteo={() => navegarA('sorteos', 'nuevo')}
                onVerSorteo={(id) => navegarA('sorteos', 'ver', id)}
                onEditarSorteo={(id) => navegarA('sorteos', 'editar', id)}
                onIniciarSorteo={(id) => navegarA('sorteos', 'iniciar', id)}
                onVerResultados={(id) => navegarA('sorteos', 'resultados', id)}
              />
            </div>
          } />
          <Route path="/sorteos/nuevo" element={<CreacionSorteo onComplete={() => navegarA('sorteos')} />} />
          <Route path="/sorteos/editar/:sorteoId" element={<CreacionSorteo onComplete={() => navegarA('sorteos')} />} />
          <Route path="/sorteos/iniciar" element={<IniciarSorteoPage onComplete={() => navegarA('sorteos')} />} />
          <Route path="/sorteos/resultados/:sorteoId" element={<ResultadosSorteo onExportarResultados={() => console.log(`Exportando resultados`)} />} />
          <Route path="/sorteos/ver/:sorteoId" element={
            <CreacionSorteo 
              onComplete={() => navegarA('sorteos')} 
              initialStep={4} 
              readOnly={true} 
            />
          } />
          
          {/* Rutas de Participantes */}
          <Route path="/participantes" element={
            <div>
              <div className="section-header">
                <h2 className="section-title">Gestión de Participantes</h2>
                <div className="btn-group">
                  <button 
                    className="btn btn-primary"
                    onClick={() => navegarA('participantes', 'importar')}
                    aria-label="Importar participantes"
                  >
                    Importar Participantes
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setTiqueDialogOpen(true)}
                    aria-label="Gestionar tiques de participantes"
                  >
                    Gestionar Tiques
                  </button>
                </div>
              </div>
              <div className="alert alert-info" role="status">
                Seleccione una acción de las opciones disponibles en la parte superior.
              </div>
            </div>
          } />
          <Route path="/participantes/importar" element={<ImportarParticipantes onComplete={() => navegarA('participantes')} />} />
          <Route path="/participantes/gestion-tiques/:sorteoId" element={<GestionTiques onComplete={() => navegarA('participantes')} />} />
          
          {/* Rutas de Configuración */}
          <Route path="/configuracion" element={
            <div>
              <div className="section-header">
                <h2 className="section-title">Configuración del Sistema</h2>
                <div className="btn-group">
                  <button 
                    className="btn btn-primary"
                    onClick={() => navegarA('configuracion', 'tiques')}
                    aria-label="Configurar distribución de tiques"
                  >
                    Configuración de Tiques
                  </button>
                </div>
              </div>
              <div className="alert alert-info" role="status">
                Seleccione una opción de configuración de las disponibles en la parte superior.
              </div>
            </div>
          } />
          <Route path="/configuracion/tiques" element={<ConfiguracionTiques />} />
        </Routes>
      </main>

      {/* Diálogo para ingresar el ID del sorteo - usando Material-UI Dialog */}
      <Dialog 
        open={tiqueDialogOpen} 
        onClose={() => setTiqueDialogOpen(false)}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">Gestionar Tiques</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Ingrese el ID del sorteo para gestionar sus tiques:
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="ID del Sorteo"
            type="number"
            fullWidth
            value={tiqueIdInput}
            onChange={(e) => setTiqueIdInput(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTiqueDialogOpen(false)} color="primary">
            Cancelar
          </Button>
          <Button 
            onClick={() => {
              if (tiqueIdInput && !isNaN(tiqueIdInput)) {
                navegarA('participantes', 'gestion-tiques', parseInt(tiqueIdInput));
                setTiqueDialogOpen(false);
                setTiqueIdInput('');
              }
            }} 
            color="primary"
            disabled={!tiqueIdInput || isNaN(tiqueIdInput)}
          >
            Continuar
          </Button>
        </DialogActions>
      </Dialog>

      <footer className="app-footer" role="contentinfo">
        {dbTestResult && <span className="db-status" aria-live="polite">{dbTestResult}</span>}
        <span>© {new Date().getFullYear()} Sistema de Sorteos Pueblo Valiente</span>
      </footer>
    </div>
  );
}

export default App; 