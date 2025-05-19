import React from 'react';
import PropTypes from 'prop-types';
import { ButtonPrimary, ButtonSecondary } from './Button';

// Lista de propiedades personalizadas que no deben pasarse al elemento form
const customFormProps = [
  'showActions',
  'loading',
  'errorMessage',
  'successMessage',
  'submitText',
  'cancelText',
  'onCancel',
  'title',
  'subtitle'
];

/**
 * Filtra las propiedades personalizadas que no deben pasarse al elemento form
 * @param {Object} props - Propiedades originales
 * @returns {Object} - Propiedades filtradas
 */
const filterFormProps = (props) => {
  const filteredProps = { ...props };
  customFormProps.forEach(prop => {
    if (prop in filteredProps) {
      delete filteredProps[prop];
    }
  });
  return filteredProps;
};

/**
 * Componente Form estandarizado que incluye estructura básica de formularios
 */
const Form = ({
  onSubmit,
  children,
  title,
  subtitle,
  submitText = 'Guardar',
  cancelText = 'Cancelar',
  onCancel,
  loading = false,
  errorMessage = null,
  successMessage = null,
  className = '',
  showActions = true,
  ...props
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (typeof onSubmit === 'function') {
      onSubmit(e);
    }
  };

  // Filtrar props que no deben pasarse directamente al elemento form
  const filteredProps = filterFormProps(props);

  return (
    <div className={`w-full ${className}`}>
      {(title || subtitle) && (
        <div className="mb-6">
          {title && <h2 className="section-title">{title}</h2>}
          {subtitle && <p className="text-gray-500 mt-2">{subtitle}</p>}
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4" role="alert">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} {...filteredProps}>
        {children}

        {showActions && (submitText || onCancel) && (
          <div className="flex justify-end space-x-3 mt-6">
            {onCancel && (
              <ButtonSecondary onClick={onCancel} type="button">
                {cancelText}
              </ButtonSecondary>
            )}
            {submitText && (
              <ButtonPrimary type="submit" disabled={loading} loading={loading}>
                {loading ? 'Procesando...' : submitText}
              </ButtonPrimary>
            )}
          </div>
        )}
      </form>
    </div>
  );
};

/**
 * Componente para agrupar campos de formulario
 */
export const FormGroup = ({ children, title, className = '', ...props }) => {
  return (
    <div className={`mb-6 ${className}`} {...props}>
      {title && <h3 className="text-lg font-medium mb-3">{title}</h3>}
      {children}
    </div>
  );
};

/**
 * Componente para crear filas de campos en formularios
 */
export const FormRow = ({ children, className = '', ...props }) => {
  return (
    <div className={`flex flex-wrap -mx-2 ${className}`} {...props}>
      {children}
    </div>
  );
};

/**
 * Componente para crear columnas en las filas de formularios
 */
export const FormCol = ({ children, width = 'full', className = '', ...props }) => {
  const widthClasses = {
    full: 'w-full',
    '1/2': 'w-full md:w-1/2',
    '1/3': 'w-full md:w-1/3',
    '2/3': 'w-full md:w-2/3',
    '1/4': 'w-full md:w-1/4',
    '3/4': 'w-full md:w-3/4',
  };

  return (
    <div className={`px-2 ${widthClasses[width] || 'w-full'} ${className}`} {...props}>
      {children}
    </div>
  );
};

Form.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  submitText: PropTypes.string,
  cancelText: PropTypes.string,
  onCancel: PropTypes.func,
  loading: PropTypes.bool,
  errorMessage: PropTypes.string,
  successMessage: PropTypes.string,
  className: PropTypes.string,
  showActions: PropTypes.bool
};

FormGroup.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  className: PropTypes.string
};

FormRow.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

FormCol.propTypes = {
  children: PropTypes.node.isRequired,
  width: PropTypes.oneOf(['full', '1/2', '1/3', '2/3', '1/4', '3/4']),
  className: PropTypes.string
};

export default Form;