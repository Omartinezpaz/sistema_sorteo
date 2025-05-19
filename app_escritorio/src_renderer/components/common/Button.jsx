import React from 'react';
import PropTypes from 'prop-types';
import './Button.css';

// Lista de propiedades personalizadas que no deben pasarse a los elementos button
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

// Lista de propiedades personalizadas que no deben pasarse a los elementos button
const customProps = [
  'children', 'onClick', 'className', 'icon', 'loading', 'loadingText',
  'type', 'size', 'outline', 'href', 'target', 'rel', 'as', 'ariaLabel'
];

// Resolver props basados en las propiedades pasadas
const resolveButtonProps = (props) => {
  // Propiedades filtradas para pasa al elemento DOM
  const filteredProps = {};
  
  // Solo agregar propiedades válidas para el elemento DOM
  Object.keys(props).forEach(key => {
    if (!customProps.includes(key)) {
      filteredProps[key] = props[key];
    }
  });
  
  return filteredProps;
};

/**
 * Componente Button mejorado para accesibilidad
 * @param {Object} props - Propiedades del componente
 * @param {string} props.type - Tipo de botón: primary, secondary, success, danger, warning, info
 * @param {string} props.size - Tamaño del botón: sm, md, lg
 * @param {boolean} props.outline - Si es true, el botón tendrá solo contorno
 * @param {boolean} props.disabled - Si es true, el botón estará deshabilitado
 * @param {Function} props.onClick - Función a ejecutar al hacer clic
 * @param {string} props.className - Clases CSS adicionales
 * @param {React.ReactNode} props.children - Contenido del botón
 * @param {string} props.ariaLabel - Texto para el atributo aria-label
 */
export const Button = ({
  type = 'primary',
  size = 'md',
  outline = false,
  disabled = false,
  onClick,
  className = '',
  children,
  ariaLabel,
  ...rest
}) => {
  // Construir clases CSS
  const buttonClasses = `
    btn 
    ${outline ? `btn-outline-${type}` : `btn-${type}`} 
    btn-${size} 
    ${className}
  `.trim();

  return (
    <button
      type="button"
      className={buttonClasses}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      {...rest}
    >
      {children}
    </button>
  );
};

/**
 * Componente de botón primario estandarizado
 */
export const ButtonPrimary = ({ 
  children, 
  onClick, 
  disabled = false, 
  type = 'button', 
  href, 
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
  
  if (href) {
    return (
      <a 
        href={href} 
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
      </a>
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
  href, 
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
  
  if (href) {
    return (
      <a 
        href={href} 
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
      </a>
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
 * Componente ButtonText mejorado para accesibilidad
 * @param {Object} props - Propiedades del componente 
 * @param {Function} props.onClick - Función a ejecutar al hacer clic
 * @param {string} props.className - Clases CSS adicionales
 * @param {React.ReactNode} props.children - Contenido del botón
 * @param {string} props.ariaLabel - Texto para el atributo aria-label
 */
export const ButtonText = ({
  onClick,
  className = '',
  children,
  ariaLabel,
  ...rest
}) => {
  const otherProps = resolveButtonProps(rest);
  
  return (
    <button
      type="button"
      className={`btn-text ${className}`}
      onClick={onClick}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      {...otherProps}
    >
      {children}
    </button>
  );
};

// PropTypes compartidos por todos los botones
const buttonPropTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  type: PropTypes.string,
  href: PropTypes.string,
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

export default Button; 