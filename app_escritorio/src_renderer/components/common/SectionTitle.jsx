import React from 'react';
import PropTypes from 'prop-types';

/**
 * Componente de título de sección estandarizado con línea decorativa
 * @param {Object} props - Propiedades del componente
 * @param {string} props.title - Texto del título
 * @param {node} props.children - Contenido adicional (opcional)
 * @param {string} props.className - Clases adicionales (opcional)
 */
const SectionTitle = ({ title, children, className = '', ...props }) => {
  return (
    <div className={`mb-6 ${className}`} {...props}>
      <h2 className="section-title">
        {title}
      </h2>
      {children}
    </div>
  );
};

SectionTitle.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  className: PropTypes.string
};

export default SectionTitle; 