import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Auth
import LoginPage from './pages/auth/Login';

// Dashboard
import DashboardPage from './pages/dashboard/Dashboard';

// Sorteos
import SorteosPage from './pages/sorteo/Sorteos';
import CrearSorteoPage from './pages/sorteo/CrearSorteo';
import EditarSorteoPage from './pages/sorteo/EditarSorteo';
import DetalleSorteoPage from './pages/sorteo/DetalleSorteo';
import IniciarSorteoPage from './pages/sorteo/IniciarSorteo';
import ResultadosSorteoPage from './pages/sorteo/ResultadosSorteo';

// Participantes
import ParticipantesPage from './pages/participantes/Participantes';
import ImportarParticipantesPage from './pages/participantes/ImportarParticipantes';
import GestionTiquesPage from './pages/participantes/GestionTiques';

// Configuración
import ConfiguracionPage from './pages/config/Configuracion';

// Otros
import NotFoundPage from './pages/errors/NotFound';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Rutas de autenticación */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="" element={<Navigate to="/auth/login" replace />} />
      </Route>
      
      {/* Rutas principales (protegidas) */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        {/* Rutas de Sorteos */}
        <Route path="sorteos">
          <Route index element={<SorteosPage />} />
          <Route path="crear" element={<CrearSorteoPage />} />
          <Route path="editar/:id" element={<EditarSorteoPage />} />
          <Route path="detalle/:id" element={<DetalleSorteoPage />} />
          <Route path="iniciar" element={<IniciarSorteoPage />} />
          <Route path="resultados/:id" element={<ResultadosSorteoPage />} />
        </Route>
        
        {/* Rutas de Participantes */}
        <Route path="participantes">
          <Route index element={<ParticipantesPage />} />
          <Route path="importar" element={<ImportarParticipantesPage />} />
          <Route path="tiques/:sorteoId" element={<GestionTiquesPage />} />
        </Route>
        
        {/* Rutas de Configuración */}
        <Route path="configuracion" element={<ConfiguracionPage />} />
        
        {/* Redirección para rutas no encontradas */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      
      {/* Redirección para la raíz */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes; 