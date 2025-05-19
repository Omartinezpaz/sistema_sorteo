import React from 'react';
import PropTypes from 'prop-types';
import { 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormHelperText,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  Switch,
  Autocomplete,
  Chip
} from '@mui/material';

// Lista de propiedades personalizadas que no deben pasarse a los componentes MUI
const customProps = [
  'loading',
  'showActions',
  'validationSchema',
  'showTitle',
  'showHeader',
  'onSubmitSuccess',
  'onSubmitError',
  'showDividers',
  'showControls',
  'initialStep',
  'onStepChange'
];

/**
 * Filtra las propiedades personalizadas que no deben pasarse a los componentes MUI
 * @param {Object} props - Propiedades originales
 * @returns {Object} - Propiedades filtradas
 */
const filterCustomProps = (props) => {
  const filteredProps = { ...props };
  customProps.forEach(prop => {
    if (prop in filteredProps) {
      delete filteredProps[prop];
    }
  });
  return filteredProps;
};

/**
 * Campo de formulario estandarizado que soporta diferentes tipos de inputs
 */
const FormField = ({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  helperText,
  required = false,
  disabled = false,
  fullWidth = true,
  placeholder,
  className = '',
  options = [],
  multiple = false,
  rows = 4,
  inputProps = {},
  InputProps = {},
  size = 'medium',
  variant = 'outlined',
  autoFocus = false,
  ...props
}) => {
  // Filtrar propiedades personalizadas
  const filteredProps = filterCustomProps(props);

  // Manejo especial para checkboxes y switches
  if (type === 'checkbox') {
    return (
      <FormControlLabel
        control={
          <Checkbox
            id={id}
            name={name}
            checked={!!value}
            onChange={onChange}
            disabled={disabled}
            {...filteredProps}
          />
        }
        label={label}
        className={className}
      />
    );
  }

  if (type === 'switch') {
    return (
      <FormControlLabel
        control={
          <Switch
            id={id}
            name={name}
            checked={!!value}
            onChange={onChange}
            disabled={disabled}
            {...filteredProps}
          />
        }
        label={label}
        className={className}
      />
    );
  }

  // Manejo para radio buttons
  if (type === 'radio') {
    return (
      <FormControl 
        component="fieldset" 
        error={!!error} 
        disabled={disabled}
        className={className}
        fullWidth={fullWidth}
      >
        <InputLabel>{label}</InputLabel>
        <RadioGroup
          id={id}
          name={name}
          value={value || ''}
          onChange={onChange}
          row={filteredProps.row}
        >
          {options.map((option) => (
            <FormControlLabel
              key={option.value}
              value={option.value}
              control={<Radio />}
              label={option.label}
            />
          ))}
        </RadioGroup>
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
      </FormControl>
    );
  }

  // Manejo para selects
  if (type === 'select') {
    return (
      <FormControl 
        variant={variant}
        error={!!error}
        disabled={disabled}
        fullWidth={fullWidth}
        className={className}
        size={size}
      >
        <InputLabel id={`${id}-label`}>{label}</InputLabel>
        <Select
          labelId={`${id}-label`}
          id={id}
          name={name}
          value={value || (multiple ? [] : '')}
          onChange={onChange}
          onBlur={onBlur}
          multiple={multiple}
          label={label}
          required={required}
          {...filteredProps}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
      </FormControl>
    );
  }
  
  // Manejo para autocomplete
  if (type === 'autocomplete') {
    return (
      <Autocomplete
        id={id}
        disabled={disabled}
        options={options}
        getOptionLabel={(option) => {
          // Manejar tanto opciones como valores
          if (typeof option === 'object' && option !== null) {
            return option.label || '';
          }
          // Buscar la etiqueta correspondiente al valor
          const foundOption = options.find(opt => opt.value === option);
          return foundOption ? foundOption.label : '';
        }}
        value={value}
        onChange={(event, newValue) => {
          if (typeof onChange === 'function') {
            // Si es múltiple, pasamos un array de valores, sino el valor único
            const simulatedEvent = {
              target: {
                name,
                value: multiple 
                  ? (newValue || []).map(item => typeof item === 'object' ? item.value : item)
                  : (newValue ? (typeof newValue === 'object' ? newValue.value : newValue) : null)
              }
            };
            onChange(simulatedEvent);
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            name={name}
            label={label}
            error={!!error}
            helperText={helperText}
            required={required}
            variant={variant}
            fullWidth={fullWidth}
            size={size}
            className={className}
            InputProps={{
              ...params.InputProps,
              ...InputProps
            }}
          />
        )}
        multiple={multiple}
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((option, index) => (
            <Chip
              label={typeof option === 'object' ? option.label : option}
              {...getTagProps({ index })}
              size="small"
            />
          ))
        }
        {...filteredProps}
      />
    );
  }

  // Corregir el tipo datetime a datetime-local para inputs nativos
  const inputType = type === 'datetime' ? 'datetime-local' : type;

  // Manejo para textarea
  if (type === 'textarea') {
    return (
      <TextField
        id={id}
        name={name}
        label={label}
        value={value || ''}
        onChange={onChange}
        onBlur={onBlur}
        error={!!error}
        helperText={helperText}
        disabled={disabled}
        fullWidth={fullWidth}
        placeholder={placeholder}
        className={className}
        size={size}
        variant={variant}
        multiline
        rows={rows}
        required={required}
        inputProps={inputProps}
        InputProps={InputProps}
        autoFocus={autoFocus}
        {...filteredProps}
      />
    );
  }

  // Por defecto, renderizar un TextField estándar
  return (
    <TextField
      id={id}
      name={name}
      label={label}
      type={inputType}
      value={value || ''}
      onChange={onChange}
      onBlur={onBlur}
      error={!!error}
      helperText={helperText}
      disabled={disabled}
      fullWidth={fullWidth}
      placeholder={placeholder}
      className={className}
      size={size}
      variant={variant}
      required={required}
      inputProps={inputProps}
      InputProps={InputProps}
      autoFocus={autoFocus}
      {...filteredProps}
    />
  );
};

FormField.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  type: PropTypes.oneOf([
    'text', 'password', 'email', 'number', 'tel', 'url', 'search',
    'date', 'time', 'datetime', 'datetime-local', 'month', 'week',
    'textarea', 'select', 'checkbox', 'radio', 'switch', 'autocomplete'
  ]),
  value: PropTypes.any,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  fullWidth: PropTypes.bool,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.any.isRequired,
    label: PropTypes.string.isRequired
  })),
  multiple: PropTypes.bool,
  rows: PropTypes.number,
  inputProps: PropTypes.object,
  InputProps: PropTypes.object,
  size: PropTypes.oneOf(['small', 'medium']),
  variant: PropTypes.oneOf(['standard', 'outlined', 'filled']),
  autoFocus: PropTypes.bool
};

export default FormField; 