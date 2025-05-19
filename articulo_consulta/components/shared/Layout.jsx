import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Definición de colores del tema
const MAIN_COLOR = 'var(--primary)';
const HOVER_COLOR = 'var(--primary-dark)';
const LIGHT_COLOR = 'var(--primary-light)';

import React from 'react';
import { Box, Container, Paper } from '@mui/material';
import NavBar from '../common/NavBar';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'Sorteos', path: '/sorteos', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { name: 'Crear Sorteo', path: '/sorteos/crear', icon: 'M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f8f9fa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }}>
      {/* Sidebar para móvil */}
      <div 
        style={{ 
          position: 'fixed',
          inset: 0,
          zIndex: 40,
          display: sidebarOpen ? 'block' : 'none'
        }} 
        className="md:hidden"
        role="dialog"
      >
        <div 
          style={{ 
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)'
          }} 
          onClick={() => setSidebarOpen(false)}
        ></div>

        <div style={{ 
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '20rem',
          width: '100%',
          background: 'white',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ position: 'absolute', top: '0', right: '0', marginRight: '-3rem', paddingTop: '0.5rem' }}>
            <button
              style={{ 
                marginLeft: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '2.5rem',
                width: '2.5rem',
                borderRadius: '9999px',
                outline: 'none'
              }}
              onClick={() => setSidebarOpen(false)}
            >
              <span style={{ position: 'absolute', width: '1px', height: '1px', padding: '0', margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', borderWidth: '0' }}>Cerrar menú</span>
              <svg style={{ height: '1.5rem', width: '1.5rem', color: 'white' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div style={{ flex: '1 1 0%', height: '0', paddingTop: '1.25rem', paddingBottom: '1rem', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, paddingLeft: '1rem', paddingRight: '1rem' }}>
              <h1 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold',
                color: MAIN_COLOR,
                display: 'flex',
                alignItems: 'center'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '1.5rem', height: '1.5rem', marginRight: '0.5rem' }}>
                  <path d="M21.721 12.752a9.711 9.711 0 00-.945-5.003 12.754 12.754 0 01-4.339 2.708 18.991 18.991 0 01-.214 4.772 17.165 17.165 0 005.498-2.477zM14.634 15.55a17.324 17.324 0 00.332-4.647c-.952.227-1.945.347-2.966.347-1.021 0-2.014-.12-2.966-.347a17.515 17.515 0 00.332 4.647 17.385 17.385 0 005.268 0zM9.772 17.119a18.963 18.963 0 004.456 0A17.182 17.182 0 0112 21.724a17.18 17.18 0 01-2.228-4.605zM7.777 15.23a18.87 18.87 0 01-.214-4.774 12.753 12.753 0 01-4.34-2.708 9.711 9.711 0 00-.944 5.004 17.165 17.165 0 005.498 2.477zM21.356 14.752a9.765 9.765 0 01-7.478 6.817a18.64 18.64 0 001.988-4.718a18.627 18.627 0 005.49-2.098zM2.644 14.752c1.682.971 3.53 1.688 5.49 2.099a18.64 18.64 0 001.988 4.718 9.765 9.765 0 01-7.478-6.816zM13.878 2.43a9.755 9.755 0 016.116 3.986 11.267 11.267 0 01-3.746 2.504 18.63 18.63 0 00-2.37-6.49zM12 2.276a17.152 17.152 0 012.805 7.121c-.897.23-1.837.353-2.805.353-.968 0-1.908-.122-2.805-.353A17.151 17.151 0 0112 2.276zM10.122 2.43a18.629 18.629 0 00-2.37 6.49 11.266 11.266 0 01-3.746-2.504 9.754 9.754 0 016.116-3.985z" />
                </svg>
                Sistema de Sorteos
              </h1>
            </div>
            <nav style={{ marginTop: '1.25rem', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}>
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    paddingLeft: '0.5rem',
                    paddingRight: '0.5rem',
                    paddingTop: '0.75rem',
                    paddingBottom: '0.75rem',
                    fontSize: '1rem',
                    fontWeight: '500',
                    borderRadius: '0.375rem',
                    marginBottom: '0.25rem',
                    color: isActive(item.path) ? MAIN_COLOR : '#4b5563',
                    backgroundColor: isActive(item.path) ? LIGHT_COLOR : 'transparent',
                    transition: 'all 0.2s',
                    textDecoration: 'none'
                  }}
                >
                  <svg
                    style={{ 
                      marginRight: '1rem',
                      height: '1.5rem',
                      width: '1.5rem',
                      color: isActive(item.path) ? MAIN_COLOR : '#9ca3af' 
                    }}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          <div style={{ 
            flexShrink: 0,
            display: 'flex',
            borderTopWidth: '1px',
            borderTopColor: '#e5e7eb',
            padding: '1rem' 
          }}>
            <div style={{ flexShrink: 0, display: 'block', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div>
                  <div style={{ 
                    height: '2.5rem',
                    width: '2.5rem',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: MAIN_COLOR,
                    color: 'white',
                    fontWeight: '500',
                    fontSize: '1rem'
                  }}>
                    {user?.nombre_completo?.charAt(0) || 'U'}
                  </div>
                </div>
                <div style={{ marginLeft: '0.75rem' }}>
                  <p style={{ 
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    {user?.nombre_completo || 'Usuario'}
                  </p>
                  <button
                    onClick={handleLogout}
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      color: MAIN_COLOR,
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.25rem 0',
                      transition: 'color 0.2s'
                    }}
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar desktop */}
      <div 
        style={{ 
          width: '16rem',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0
        }} 
        className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0"
      >
        <div style={{ 
          flex: '1 1 0%',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          borderRightWidth: '1px',
          borderRightColor: '#e5e7eb',
          backgroundColor: 'white',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ 
            flex: '1 1 0%',
            display: 'flex',
            flexDirection: 'column',
            paddingTop: '1.25rem',
            paddingBottom: '1rem',
            overflowY: 'auto'
          }}>
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
              paddingLeft: '1rem',
              paddingRight: '1rem'
            }}>
              <h1 style={{ 
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: MAIN_COLOR,
                display: 'flex',
                alignItems: 'center'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }}>
                  <path d="M21.721 12.752a9.711 9.711 0 00-.945-5.003 12.754 12.754 0 01-4.339 2.708 18.991 18.991 0 01-.214 4.772 17.165 17.165 0 005.498-2.477zM14.634 15.55a17.324 17.324 0 00.332-4.647c-.952.227-1.945.347-2.966.347-1.021 0-2.014-.12-2.966-.347a17.515 17.515 0 00.332 4.647 17.385 17.385 0 005.268 0zM9.772 17.119a18.963 18.963 0 004.456 0A17.182 17.182 0 0112 21.724a17.18 17.18 0 01-2.228-4.605zM7.777 15.23a18.87 18.87 0 01-.214-4.774 12.753 12.753 0 01-4.34-2.708 9.711 9.711 0 00-.944 5.004 17.165 17.165 0 005.498 2.477zM21.356 14.752a9.765 9.765 0 01-7.478 6.817 18.64 18.64 0 001.988-4.718 18.627 18.627 0 005.49-2.098zM2.644 14.752c1.682.971 3.53 1.688 5.49 2.099a18.64 18.64 0 001.988 4.718 9.765 9.765 0 01-7.478-6.816zM13.878 2.43a9.755 9.755 0 016.116 3.986 11.267 11.267 0 01-3.746 2.504 18.63 18.63 0 00-2.37-6.49zM12 2.276a17.152 17.152 0 012.805 7.121c-.897.23-1.837.353-2.805.353-.968 0-1.908-.122-2.805-.353A17.151 17.151 0 0112 2.276zM10.122 2.43a18.629 18.629 0 00-2.37 6.49 11.266 11.266 0 01-3.746-2.504 9.754 9.754 0 016.116-3.985z" />
                </svg>
                Sistema de Sorteos
              </h1>
            </div>
            <nav style={{ 
              marginTop: '1.25rem',
              flex: '1 1 0%',
              paddingLeft: '0.5rem',
              paddingRight: '0.5rem',
              backgroundColor: 'white'
            }}>
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    paddingLeft: '0.5rem',
                    paddingRight: '0.5rem',
                    paddingTop: '0.75rem',
                    paddingBottom: '0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    borderRadius: '0.375rem',
                    marginBottom: '0.25rem',
                    color: isActive(item.path) ? MAIN_COLOR : '#4b5563',
                    backgroundColor: isActive(item.path) ? LIGHT_COLOR : 'transparent',
                    transition: 'all 0.2s',
                    textDecoration: 'none'
                  }}
                >
                  <svg
                    style={{ 
                      marginRight: '0.75rem',
                      height: '1.25rem',
                      width: '1.25rem',
                      color: isActive(item.path) ? MAIN_COLOR : '#9ca3af' 
                    }}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          <div style={{ 
            flexShrink: 0,
            display: 'flex',
            borderTopWidth: '1px',
            borderTopColor: '#e5e7eb',
            padding: '1rem' 
          }}>
            <div style={{ flexShrink: 0, width: '100%', display: 'block' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div>
                  <div style={{ 
                    height: '2.25rem',
                    width: '2.25rem',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: MAIN_COLOR,
                    color: 'white',
                    fontWeight: '500',
                    fontSize: '0.875rem'
                  }}>
                    {user?.nombre_completo?.charAt(0) || 'U'}
                  </div>
                </div>
                <div style={{ marginLeft: '0.75rem' }}>
                  <p style={{ 
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    {user?.nombre_completo || 'Usuario'}
                  </p>
                  <button
                    onClick={handleLogout}
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      color: MAIN_COLOR,
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.25rem 0',
                      transition: 'color 0.2s'
                    }}
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div 
        style={{ 
          display: 'flex',
          flexDirection: 'column',
          flex: '1 1 0%'
        }} 
        className="md:pl-64 flex flex-col flex-1"
      >
        <div 
          style={{ 
            position: 'sticky',
            top: '0',
            zIndex: 10,
            paddingLeft: '0.25rem',
            paddingTop: '0.25rem',
            backgroundColor: '#f8f9fa'
          }} 
          className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-100"
        >
          <button
            type="button"
            style={{ 
              marginLeft: '-0.125rem',
              marginTop: '-0.125rem',
              height: '3rem',
              width: '3rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '0.375rem',
              color: '#6b7280',
              outline: 'none'
            }}
            onClick={() => setSidebarOpen(true)}
          >
            <span style={{ position: 'absolute', width: '1px', height: '1px', padding: '0', margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', borderWidth: '0' }}>Abrir menú</span>
            <svg style={{ height: '1.5rem', width: '1.5rem' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        <main style={{ flex: '1 1 0%' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;