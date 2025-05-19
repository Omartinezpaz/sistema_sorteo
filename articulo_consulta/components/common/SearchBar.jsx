import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon, FilterList as FilterIcon } from '@mui/icons-material';
import { ButtonText } from './Button';

/**
 * Componente de barra de búsqueda estandarizada
 */
const SearchBar = ({
  value = '',
  onChange,
  onSearch,
  onClear,
  placeholder = 'Buscar...',
  variant = 'outlined',
  size = 'medium',
  fullWidth = true,
  showFilterButton = false,
  onFilterClick,
  className = '',
  searchOnChange = false,
  searchOnEnter = true,
  autoFocus = false,
  disabled = false,
  debounceTime = 500,
  ...props
}) => {
  const [searchTimeout, setSearchTimeout] = useState(null);
  
  const handleChange = (e) => {
    const newValue = e.target.value;
    
    if (onChange) {
      onChange(newValue);
    }
    
    if (searchOnChange && onSearch) {
      // Implementar debounce para evitar llamadas excesivas
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      
      const timeout = setTimeout(() => {
        onSearch(newValue);
      }, debounceTime);
      
      setSearchTimeout(timeout);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && searchOnEnter && onSearch) {
      onSearch(value);
    }
  };
  
  const handleClear = () => {
    if (onChange) {
      onChange('');
    }
    
    if (onClear) {
      onClear();
    } else if (onSearch) {
      onSearch('');
    }
  };
  
  return (
    <TextField
      value={value}
      onChange={handleChange}
      onKeyPress={handleKeyPress}
      placeholder={placeholder}
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      className={className}
      autoFocus={autoFocus}
      disabled={disabled}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon color="action" />
          </InputAdornment>
        ),
        endAdornment: (
          <InputAdornment position="end">
            {value && (
              <ButtonText onClick={handleClear} className="mr-1">
                <ClearIcon fontSize="small" />
              </ButtonText>
            )}
            {showFilterButton && (
              <IconButton 
                size="small" 
                onClick={onFilterClick}
                color="primary"
                disabled={disabled}
              >
                <FilterIcon />
              </IconButton>
            )}
          </InputAdornment>
        )
      }}
      {...props}
    />
  );
};

/**
 * Componente de barra de búsqueda avanzada con filtros integrados
 */
export const AdvancedSearchBar = ({
  value = '',
  onChange,
  onSearch,
  onClear,
  filters = [],
  selectedFilters = {},
  onFilterChange,
  placeholder = 'Buscar...',
  showFilterButton = true,
  ...props
}) => {
  const [showFilters, setShowFilters] = useState(false);
  
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  const handleFilterChange = (filterId, value) => {
    if (onFilterChange) {
      onFilterChange(filterId, value);
    }
  };
  
  return (
    <div className="w-full">
      <SearchBar
        value={value}
        onChange={onChange}
        onSearch={onSearch}
        onClear={onClear}
        placeholder={placeholder}
        showFilterButton={showFilterButton}
        onFilterClick={toggleFilters}
        {...props}
      />
      
      {showFilters && filters.length > 0 && (
        <div className="mt-2 p-3 border border-gray-200 rounded bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filters.map((filter) => (
              <div key={filter.id} className="flex items-center">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type={filter.type || 'checkbox'}
                    className="form-checkbox h-5 w-5 text-primary"
                    checked={!!selectedFilters[filter.id]}
                    onChange={(e) => handleFilterChange(filter.id, filter.type === 'checkbox' ? e.target.checked : e.target.value)}
                  />
                  <span className="ml-2 text-gray-700">{filter.label}</span>
                </label>
              </div>
            ))}
          </div>
          
          <div className="mt-3 flex justify-end">
            <ButtonText onClick={() => setShowFilters(false)}>
              Cerrar filtros
            </ButtonText>
          </div>
        </div>
      )}
    </div>
  );
};

SearchBar.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  onSearch: PropTypes.func,
  onClear: PropTypes.func,
  placeholder: PropTypes.string,
  variant: PropTypes.oneOf(['outlined', 'filled', 'standard']),
  size: PropTypes.oneOf(['small', 'medium']),
  fullWidth: PropTypes.bool,
  showFilterButton: PropTypes.bool,
  onFilterClick: PropTypes.func,
  className: PropTypes.string,
  searchOnChange: PropTypes.bool,
  searchOnEnter: PropTypes.bool,
  autoFocus: PropTypes.bool,
  disabled: PropTypes.bool,
  debounceTime: PropTypes.number
};

AdvancedSearchBar.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  onSearch: PropTypes.func,
  onClear: PropTypes.func,
  filters: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['checkbox', 'radio', 'select'])
    })
  ),
  selectedFilters: PropTypes.object,
  onFilterChange: PropTypes.func,
  placeholder: PropTypes.string,
  showFilterButton: PropTypes.bool
};

export default SearchBar; 