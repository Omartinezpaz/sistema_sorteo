import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

/**
 * Componente Card estandarizado
 * @param {Object} props - Propiedades del componente
 * @param {node} props.children - Contenido de la tarjeta
 * @param {string} props.to - Ruta para convertir la tarjeta en un enlace (opcional)
 * @param {function} props.onClick - Función a ejecutar al hacer clic (opcional)
 * @param {string} props.className - Clases adicionales (opcional)
 */
const Card = ({ 
  children, 
  to, 
  onClick,
  className = '',
  withHoverEffect = true,
  ...props 
}) => {
  const cardClasses = `card ${withHoverEffect ? '' : 'transform-none'} ${className}`;
  
  // Si hay un enlace, envolver en un Link
  if (to) {
    return (
      <Link to={to} className={cardClasses} {...props}>
        {children}
      </Link>
    );
  }
  
  // Si hay onClick, hacer la tarjeta clicable
  if (onClick) {
    return (
      <div 
        className={cardClasses} 
        onClick={onClick} 
        style={{ cursor: 'pointer' }}
        {...props}
      >
        {children}
      </div>
    );
  }
  
  // Tarjeta normal
  return (
    <div className={cardClasses} {...props}>
      {children}
    </div>
  );
};

/**
 * Componente CardContent para el contenido de la tarjeta
 */
export const CardContent = ({ 
  children, 
  className = '',
  ...props 
}) => {
  return (
    <div className={`p-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

/**
 * Componente CardHeader para el encabezado de la tarjeta
 */
export const CardHeader = ({ 
  title, 
  subheader,
  icon,
  action,
  className = '',
  ...props 
}) => {
  return (
    <div className={`flex items-center justify-between p-4 border-b border-gray-100 ${className}`} {...props}>
      <div className="flex items-center">
        {icon && <div className="mr-3 text-primary">{icon}</div>}
        <div>
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {subheader && <p className="text-sm text-gray-500">{subheader}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

/**
 * Componente CardActions para los botones y acciones de la tarjeta
 */
export const CardActions = ({ 
  children, 
  className = '',
  ...props 
}) => {
  return (
    <div className={`p-4 pt-0 flex items-center gap-2 ${className}`} {...props}>
      {children}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  to: PropTypes.string,
  onClick: PropTypes.func,
  className: PropTypes.string,
  withHoverEffect: PropTypes.bool
};

CardContent.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

CardHeader.propTypes = {
  title: PropTypes.node,
  subheader: PropTypes.node,
  icon: PropTypes.node,
  action: PropTypes.node,
  className: PropTypes.string
};

CardActions.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

export default Card; 