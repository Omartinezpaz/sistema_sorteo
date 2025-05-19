import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Card, { CardContent, CardHeader } from './Card';
import FormField from './FormField';
import { ButtonPrimary, ButtonSecondary, ButtonText } from './Button';
import { FormGroup, FormRow, FormCol } from './Form';
import { FilterList as FilterIcon, Clear as ClearIcon } from '@mui/icons-material';

/**
 * Componente de filtro individual
 */
const FilterItem = ({ filter, value, onChange }) => {
  const handleChange = (e) => {
    const newValue = filter.type === 'checkbox' 
      ? e.target.checked 
      : e.target.value;
    
    onChange(filter.id, newValue);
  };
  
  return (
    <FormField
      id={`filter-${filter.id}`}
      name={filter.id}
      label={filter.label}
      type={filter.type || 'select'}
      value={value}
      onChange={handleChange}
      options={filter.options || []}
      multiple={filter.multiple}
      size="small"
      fullWidth
    />
  );
};

/**
 * Componente de barra de filtros estandarizada
 */
const FilterBar = ({
  filters = [],
  values = {},
  onChange,
  onApply,
  onClear,
  title = 'Filtros',
  showIcon = true,
  className = '',
  expanded = true,
  hideEmpty = false,
  collapseButton = true,
  applyButton = true,
  clearButton = true
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [localValues, setLocalValues] = useState(values);
  
  // Filtrar filtros sin opciones cuando hideEmpty es true
  const visibleFilters = hideEmpty 
    ? filters.filter(filter => !filter.options || filter.options.length > 0)
    : filters;
  
  if (visibleFilters.length === 0) {
    return null;
  }
  
  const handleFilterChange = (filterId, value) => {
    const newValues = {
      ...localValues,
      [filterId]: value
    };
    
    setLocalValues(newValues);
    
    if (onChange) {
      onChange(filterId, value, newValues);
    }
  };
  
  const handleApply = () => {
    if (onApply) {
      onApply(localValues);
    }
  };
  
  const handleClear = () => {
    const emptyValues = {};
    
    // Resetear todos los valores a sus defaults
    filters.forEach(filter => {
      if (filter.type === 'checkbox') {
        emptyValues[filter.id] = false;
      } else {
        emptyValues[filter.id] = filter.multiple ? [] : '';
      }
    });
    
    setLocalValues(emptyValues);
    
    if (onClear) {
      onClear(emptyValues);
    }
  };
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <Card className={className}>
      <CardHeader 
        title={title} 
        icon={showIcon ? <FilterIcon /> : null}
        action={
          collapseButton ? (
            <ButtonText onClick={toggleExpand}>
              {isExpanded ? 'Ocultar' : 'Mostrar'}
            </ButtonText>
          ) : null
        }
      />
      
      {isExpanded && (
        <CardContent>
          <FormGroup>
            <FormRow>
              {visibleFilters.map((filter) => (
                <FormCol 
                  key={filter.id} 
                  width={filter.width || '1/3'}
                >
                  <FilterItem
                    filter={filter}
                    value={localValues[filter.id]}
                    onChange={handleFilterChange}
                  />
                </FormCol>
              ))}
            </FormRow>
            
            {(applyButton || clearButton) && (
              <FormRow className="mt-4 flex justify-end">
                {clearButton && (
                  <ButtonSecondary 
                    onClick={handleClear}
                    size="small"
                    startIcon={<ClearIcon />}
                  >
                    Limpiar
                  </ButtonSecondary>
                )}
                
                {applyButton && (
                  <ButtonPrimary 
                    onClick={handleApply}
                    size="small"
                    className="ml-2"
                  >
                    Aplicar filtros
                  </ButtonPrimary>
                )}
              </FormRow>
            )}
          </FormGroup>
        </CardContent>
      )}
    </Card>
  );
};

/**
 * Componente de botones de filtro rápido (tags)
 */
export const FilterTags = ({
  options = [],
  selectedValue = '', 
  onChange,
  multiSelect = false,
  className = '',
  colorMapping = {}
}) => {
  const getTagStyle = (value, isSelected) => {
    const baseClass = "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer";
    
    if (!isSelected) {
      return `${baseClass} bg-gray-100 text-gray-600 hover:bg-gray-200`;
    }
    
    const color = colorMapping[value] || 'primary';
    
    switch (color) {
      case 'success':
        return `${baseClass} bg-green-100 text-green-800`;
      case 'warning':
        return `${baseClass} bg-yellow-100 text-yellow-800`;
      case 'info':
        return `${baseClass} bg-blue-100 text-blue-800`;
      case 'error':
        return `${baseClass} bg-red-100 text-red-800`;
      case 'secondary':
        return `${baseClass} bg-purple-100 text-purple-800`;
      default:
        return `${baseClass} bg-primary-lighter text-primary-dark`;
    }
  };
  
  const handleTagClick = (value) => {
    if (multiSelect) {
      // Lógica para multiselección (aún no implementada)
    } else {
      // Toggle: si ya está seleccionado, deseleccionar
      const newValue = selectedValue === value ? '' : value;
      if (onChange) {
        onChange(newValue);
      }
    }
  };
  
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          className={getTagStyle(option.value, selectedValue === option.value)}
          onClick={() => handleTagClick(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

FilterItem.propTypes = {
  filter: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    type: PropTypes.string,
    options: PropTypes.array,
    multiple: PropTypes.bool
  }).isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired
};

FilterBar.propTypes = {
  filters: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      type: PropTypes.string,
      options: PropTypes.array,
      multiple: PropTypes.bool,
      width: PropTypes.string
    })
  ).isRequired,
  values: PropTypes.object,
  onChange: PropTypes.func,
  onApply: PropTypes.func,
  onClear: PropTypes.func,
  title: PropTypes.string,
  showIcon: PropTypes.bool,
  className: PropTypes.string,
  expanded: PropTypes.bool,
  hideEmpty: PropTypes.bool,
  collapseButton: PropTypes.bool,
  applyButton: PropTypes.bool,
  clearButton: PropTypes.bool
};

FilterTags.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  selectedValue: PropTypes.string,
  onChange: PropTypes.func,
  multiSelect: PropTypes.bool,
  className: PropTypes.string,
  colorMapping: PropTypes.object
};

export default FilterBar; 