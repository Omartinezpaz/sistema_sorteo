import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

// Lista de propiedades personalizadas que no deben pasarse a los elementos button/a
const customButtonProps = [
  'loading',
  'startIcon',
  'endIcon',
  'fullWidth'
];

/**
 * Filtra las propiedades personalizadas que no deben pasarse a los elementos DOM
 * @param {Object} props - Propiedades originales
 * @returns {Object} - Propiedades filtradas
 */
const filterButtonProps = (props) => {
  const filteredProps = { ...props };
  customButtonProps.forEach(prop => {
    if (prop in filteredProps) {
      delete filteredProps[prop];
    }
  });
  return filteredProps;
};

/**
 * Componente de botón primario estandarizado
 */
export const ButtonPrimary = ({ 
  children, 
  onClick, 
  disabled = false, 
  type = 'button', 
  to, 
  startIcon, 
  endIcon,
  fullWidth = false,
  loading = false,
  className = '',
  ...props 
}) => {
  const buttonClasses = `btn-primary ${fullWidth ? 'w-full' : ''} ${className}`;
  
  // Filtrar props que no deben pasarse a los elementos DOM
  const filteredProps = filterButtonProps(props);
  
  // Si loading es true, deshabilitar el botón
  const isDisabled = disabled || loading;
  
  if (to) {
    return (
      <Link 
        to={to} 
        className={buttonClasses}
        {...filteredProps}
      >
        {startIcon && <span className="mr-2">{startIcon}</span>}
        {loading && (
          <span className="inline-block animate-spin mr-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </span>
        )}
        {children}
        {endIcon && <span className="ml-2">{endIcon}</span>}
      </Link>
    );
  }
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={buttonClasses}
      {...filteredProps}
    >
      {startIcon && <span className="mr-2">{startIcon}</span>}
      {loading && (
        <span className="inline-block animate-spin mr-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
      )}
      {children}
      {endIcon && <span className="ml-2">{endIcon}</span>}
    </button>
  );
};

/**
 * Componente de botón secundario estandarizado
 */
export const ButtonSecondary = ({ 
  children, 
  onClick, 
  disabled = false, 
  type = 'button', 
  to, 
  startIcon, 
  endIcon,
  fullWidth = false,
  loading = false,
  className = '',
  ...props 
}) => {
  const buttonClasses = `btn-secondary ${fullWidth ? 'w-full' : ''} ${className}`;
  
  // Filtrar props que no deben pasarse a los elementos DOM
  const filteredProps = filterButtonProps(props);
  
  // Si loading es true, deshabilitar el botón
  const isDisabled = disabled || loading;
  
  if (to) {
    return (
      <Link 
        to={to} 
        className={buttonClasses}
        {...filteredProps}
      >
        {startIcon && <span className="mr-2">{startIcon}</span>}
        {loading && (
          <span className="inline-block animate-spin mr-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </span>
        )}
        {children}
        {endIcon && <span className="ml-2">{endIcon}</span>}
      </Link>
    );
  }
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={buttonClasses}
      {...filteredProps}
    >
      {startIcon && <span className="mr-2">{startIcon}</span>}
      {loading && (
        <span className="inline-block animate-spin mr-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
      )}
      {children}
      {endIcon && <span className="ml-2">{endIcon}</span>}
    </button>
  );
};

/**
 * Componente de botón de texto estandarizado
 */
export const ButtonText = ({ 
  children, 
  onClick, 
  disabled = false, 
  type = 'button', 
  to, 
  startIcon, 
  endIcon,
  loading = false,
  className = '',
  ...props 
}) => {
  const buttonClasses = `btn-text ${className}`;
  
  // Filtrar props que no deben pasarse a los elementos DOM
  const filteredProps = filterButtonProps(props);
  
  // Si loading es true, deshabilitar el botón
  const isDisabled = disabled || loading;
  
  if (to) {
    return (
      <Link 
        to={to} 
        className={buttonClasses}
        {...filteredProps}
      >
        {startIcon && <span className="mr-2">{startIcon}</span>}
        {loading && (
          <span className="inline-block animate-spin mr-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </span>
        )}
        {children}
        {endIcon && <span className="ml-2">{endIcon}</span>}
      </Link>
    );
  }
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={buttonClasses}
      {...filteredProps}
    >
      {startIcon && <span className="mr-2">{startIcon}</span>}
      {loading && (
        <span className="inline-block animate-spin mr-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
      )}
      {children}
      {endIcon && <span className="ml-2">{endIcon}</span>}
    </button>
  );
};

// PropTypes compartidos por todos los botones
const buttonPropTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  type: PropTypes.string,
  to: PropTypes.string,
  startIcon: PropTypes.node,
  endIcon: PropTypes.node,
  loading: PropTypes.bool,
  className: PropTypes.string
};

ButtonPrimary.propTypes = {
  ...buttonPropTypes,
  fullWidth: PropTypes.bool
};

ButtonSecondary.propTypes = {
  ...buttonPropTypes,
  fullWidth: PropTypes.bool
};

ButtonText.propTypes = {
  ...buttonPropTypes
}; 