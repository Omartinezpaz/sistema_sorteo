import React from 'react';
import PropTypes from 'prop-types';

/**
 * Componente Stepper personalizado
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.steps - Array de pasos (strings o objetos con {id, label})
 * @param {number} props.activeStep - Índice del paso activo
 * @param {Function} props.onStepClick - Función a ejecutar al hacer clic en un paso (opcional)
 */
const StepperCustom = ({ steps, activeStep, onStepClick }) => {
  return (
    <div className="stepper">
      {steps.map((step, index) => {
        const isCompleted = index < activeStep;
        const isActive = index === activeStep;
        
        // Manejar tanto strings como objetos con propiedad label
        const stepLabel = typeof step === 'string' ? step : step.label;
        
        return (
          <div 
            key={index} 
            className={`stepper-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
            onClick={() => onStepClick && onStepClick(index)}
            style={{ cursor: onStepClick ? 'pointer' : 'default' }}
          >
            <div className="stepper-icon">
              {isCompleted ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : (
                index + 1
              )}
            </div>
            <div className="stepper-label">{stepLabel}</div>
          </div>
        );
      })}
    </div>
  );
};

StepperCustom.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.string.isRequired
      })
    ])
  ).isRequired,
  activeStep: PropTypes.number.isRequired,
  onStepClick: PropTypes.func
};

export default StepperCustom; 