import React, { useState, useEffect, useMemo } from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';
import { debounce } from 'lodash';
import { buscarUbicaciones } from '../../utils/estadosManager';
import { FormField, Chip } from '../common';

/**
 * Componente mejorado para buscar ubicaciones (estados, municipios o parroquias)
 * 
 * @param {Object} props Propiedades del componente
 * @param {Function} props.onChange Función que se ejecuta al seleccionar una ubicación
 * @param {boolean} props.mostrarEstados Si es true, muestra los estados en los resultados
 * @param {boolean} props.mostrarMunicipios Si es true, muestra los municipios en los resultados
 * @param {boolean} props.mostrarParroquias Si es true, muestra las parroquias en los resultados
 * @param {string} props.placeholder Texto de placeholder para el campo de búsqueda
 * @param {string} props.label Etiqueta del campo de búsqueda
 * @returns {JSX.Element} Componente de búsqueda
 */
function BuscadorUbicaciones({ 
  onChange,
  mostrarEstados = true,
  mostrarMunicipios = true,
  mostrarParroquias = true,
  placeholder = 'Buscar ubicación (estado, municipio o parroquia)',
  label = 'Ubicación',
  value = null,
  error = false,
  helperText = '',
  required = false,
  disabled = false,
  className = '',
  id = 'buscador-ubicaciones'
}) {
  // Estados
  const [options, setOptions] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Crear función debounced memoizada para evitar recreaciones
  const buscarUbicacionesDebounced = useMemo(
    () => 
      debounce(async (termino) => {
        if (termino.length < 3) {
          setOptions([]);
          setLoading(false);
          return;
        }

        setLoading(true);
        setSearchError(null);
        
        try {
          const resultados = await buscarUbicaciones(termino);
          
          // Filtrar resultados según configuración
          const resultadosFiltrados = resultados.filter(item => {
            if (!mostrarEstados && !item.cod_municipio) return false;
            if (!mostrarMunicipios && item.cod_municipio && !item.cod_parroquia) return false;
            if (!mostrarParroquias && item.cod_parroquia) return false;
            return true;
          });
          
          setOptions(resultadosFiltrados);
        } catch (error) {
          console.error('Error al buscar ubicaciones:', error);
          setSearchError('Error al buscar ubicaciones. Intente nuevamente.');
          setOptions([]);
        } finally {
          setLoading(false);
        }
      }, 300),
    [mostrarEstados, mostrarMunicipios, mostrarParroquias]
  );

  // Efecto para limpiar debounce al desmontar
  useEffect(() => {
    return () => {
      buscarUbicacionesDebounced.cancel();
    };
  }, [buscarUbicacionesDebounced]);

  // Manejar cambio de input
  const handleInputChange = (newValue) => {
    setInputValue(newValue);
    buscarUbicacionesDebounced(newValue);
  };

  // Obtener color por tipo de ubicación
  const getTipoChip = (option) => {
    if (!option.cod_municipio) {
      return { label: 'Estado', color: 'primary' };
    } else if (option.cod_municipio && !option.cod_parroquia) {
      return { label: 'Municipio', color: 'secondary' };
    } else {
      return { label: 'Parroquia', color: 'success' };
    }
  };

  // Mapear opciones para el FormField
  const formattedOptions = options.map(option => ({
    value: option,
    label: option.nombre_completo,
    tipo: getTipoChip(option)
  }));

  // Renderizar opción personalizada en el menú de selección
  const renderOption = (option) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <Typography variant="body1">{option.label}</Typography>
        <Chip 
          label={option.tipo.label}
          color={option.tipo.color}
          size="small"
          className="ml-2"
        />
      </Box>
      <Typography variant="caption" color="textSecondary">
        Código: {option.value.codigo_completo}
      </Typography>
    </Box>
  );

  // Input adicional para mostrar indicador de carga
  const customInputAdornment = loading ? <CircularProgress color="inherit" size={20} /> : null;

  return (
    <FormField
      id={id}
      name={id}
      label={label}
      placeholder={placeholder}
      type="autocomplete"
      value={value}
      inputValue={inputValue}
      onChange={onChange}
      onInputValueChange={handleInputChange}
      options={formattedOptions}
      renderOption={renderOption}
      loading={loading}
      error={error || !!searchError}
      helperText={helperText || searchError}
      required={required}
      disabled={disabled}
      className={className}
      noOptionsText="Sin resultados"
      loadingText="Buscando..."
      getOptionLabel={option => {
        // Manejar cuando option es el objeto completo o solo el valor
        if (typeof option === 'object' && option !== null) {
          return option.label || (option.nombre_completo || '');
        }
        return '';
      }}
      isOptionEqualToValue={(option, value) => {
        if (!option || !value) return false;
        return option.value?.id === value.id || option.id === value.id;
      }}
      InputProps={{
        endAdornment: customInputAdornment
      }}
    />
  );
}

export default BuscadorUbicaciones; 