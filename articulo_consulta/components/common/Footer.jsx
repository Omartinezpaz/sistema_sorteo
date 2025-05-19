import React from 'react';
import { Container, Link as MuiLink } from '@mui/material';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-logo">
          Sistema de Sorteos
        </div>
        
        <div className="footer-links">
          <Link to="/dashboard">Inicio</Link>
          <Link to="/sorteos">Sorteos</Link>
          <Link to="/ayuda">Ayuda</Link>
          <MuiLink href="mailto:soporte@sistemasorteos.com">Contacto</MuiLink>
        </div>
        
        <div className="footer-copyright">
          © {currentYear} Sistema de Sorteos. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer; 