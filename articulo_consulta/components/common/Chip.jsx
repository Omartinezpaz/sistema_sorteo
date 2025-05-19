import React from 'react';
import PropTypes from 'prop-types';

/**
 * Componente Badge estandarizado para mostrar etiquetas con estados
 */
export const Badge = ({ 
  children, 
  variant = 'primary', 
  className = '',
  ...props 
}) => {
  const badgeClasses = `badge badge-${variant} ${className}`;
  
  return (
    <span className={badgeClasses} {...props}>
      {children}
    </span>
  );
};

/**
 * Componente Chip estandarizado para etiquetas con posible icono
 */
export const Chip = ({ 
  children, 
  icon, 
  onDelete, 
  className = '',
  ...props 
}) => {
  const chipClasses = `chip ${onDelete ? 'chip-deletable' : ''} ${className}`;
  
  return (
    <span className={chipClasses} {...props}>
      {icon && <span className="chip-icon">{icon}</span>}
      {children}
      {onDelete && (
        <span 
          className="chip-delete" 
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </span>
      )}
    </span>
  );
};

/**
 * Componente EstadoBadge para estandarizar los estados de sorteos
 */
export const EstadoBadge = ({ estado, className = '', ...props }) => {
  let badgeClass;
  
  switch (estado?.toLowerCase()) {
    case 'activo':
      badgeClass = 'estado-activo';
      break;
    case 'pendiente':
      badgeClass = 'estado-pendiente';
      break;
    case 'finalizado':
      badgeClass = 'estado-finalizado';
      break;
    case 'nacional':
      badgeClass = 'tipo-nacional';
      break;
    case 'regional':
      badgeClass = 'tipo-regional';
      break;
    case 'mixto':
      badgeClass = 'tipo-mixto';
      break;
    default:
      badgeClass = 'badge-primary';
  }
  
  return (
    <span className={`estado-badge ${badgeClass} ${className}`} {...props}>
      {estado}
    </span>
  );
};

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'success', 'warning']),
  className: PropTypes.string
};

Chip.propTypes = {
  children: PropTypes.node.isRequired,
  icon: PropTypes.node,
  onDelete: PropTypes.func,
  className: PropTypes.string
};

EstadoBadge.propTypes = {
  estado: PropTypes.string.isRequired,
  className: PropTypes.string
}; 