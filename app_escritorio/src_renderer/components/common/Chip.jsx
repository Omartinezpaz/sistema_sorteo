import React from 'react';
import PropTypes from 'prop-types';
import CloseIcon from '@mui/icons-material/Close';

/**
 * Componente Badge para mostrar etiquetas de estado
 * @param {Object} props - Propiedades del componente
 * @param {node} props.children - Contenido del badge
 * @param {string} props.variant - Variante del badge (primary, success, warning, danger)
 * @param {string} props.className - Clases adicionales (opcional)
 */
export const Badge = ({ 
  children, 
  variant = 'primary',
  className = '',
  ...props 
}) => {
  const variantClass = {
    primary: 'badge-primary',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger'
  }[variant] || 'badge-primary';

  return (
    <span className={`badge ${variantClass} ${className}`} {...props}>
      {children}
    </span>
  );
};

/**
 * Componente Chip para mostrar etiquetas con posibilidad de ser eliminadas
 * @param {Object} props - Propiedades del componente
 * @param {node} props.label - Texto o nodo a mostrar
 * @param {node} props.icon - Icono opcional
 * @param {function} props.onDelete - Función a ejecutar al eliminar (opcional)
 * @param {string} props.className - Clases adicionales (opcional)
 */
export const Chip = ({ 
  label, 
  icon,
  onDelete,
  className = '',
  ...props 
}) => {
  return (
    <div className={`chip ${className}`} {...props}>
      {icon && <span className="chip-icon">{icon}</span>}
      <span>{label}</span>
      {onDelete && (
        <span className="chip-delete" onClick={onDelete}>
          <CloseIcon style={{ fontSize: '0.75rem' }} />
        </span>
      )}
    </div>
  );
};

/**
 * Componente EstadoBadge para mostrar el estado de un elemento
 * @param {Object} props - Propiedades del componente
 * @param {string} props.estado - Estado a mostrar (activo, pendiente, finalizado, etc.)
 * @param {string} props.tipo - Tipo de elemento (opcional - nacional, regional, etc.)
 * @param {string} props.className - Clases adicionales (opcional)
 */
export const EstadoBadge = ({ 
  estado, 
  tipo,
  className = '',
  ...props 
}) => {
  const estadoClass = {
    activo: 'estado-activo',
    pendiente: 'estado-pendiente',
    finalizado: 'estado-finalizado',
    cancelado: 'badge-danger'
  }[estado?.toLowerCase()] || 'badge-primary';

  const tipoClass = tipo ? {
    nacional: 'tipo-nacional',
    regional: 'tipo-regional',
    mixto: 'tipo-mixto'
  }[tipo?.toLowerCase()] : '';

  // Si hay tipo, mostrar dos badges
  if (tipo) {
    return (
      <div className="flex items-center gap-2">
        <span className={`estado-badge ${estadoClass} ${className}`} {...props}>
          {estado}
        </span>
        <span className={`estado-badge ${tipoClass}`}>
          {tipo}
        </span>
      </div>
    );
  }

  // Solo estado
  return (
    <span className={`estado-badge ${estadoClass} ${className}`} {...props}>
      {estado}
    </span>
  );
};

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'success', 'warning', 'danger']),
  className: PropTypes.string
};

Chip.propTypes = {
  label: PropTypes.node.isRequired,
  icon: PropTypes.node,
  onDelete: PropTypes.func,
  className: PropTypes.string
};

EstadoBadge.propTypes = {
  estado: PropTypes.string.isRequired,
  tipo: PropTypes.string,
  className: PropTypes.string
}; 