import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, 
  Typography,
  Paper, 
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Divider,
  Chip,
  InputAdornment
} from '@mui/material';
import {
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Check as CheckIcon
} from '@mui/icons-material';

const ConfiguracionTiques = () => {
  const navigate = useNavigate();
  
  // Estados para la configuración
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [sorteos, setSorteos] = useState([]);
  const [selectedSorteo, setSelectedSorteo] = useState('');
  const [estadosMeta, setEstadosMeta] = useState([]);
  const [prefijo, setPrefijo] = useState('TIQ');
  const [configuracionTiques, setConfiguracionTiques] = useState({
    formatoNumeracion: {
      prefijo: 'TIQ',
      longitudNumero: 5
    },
    rangosEstado: []
  });
  
  // Efecto para cargar sorteos disponibles
  useEffect(() => {
    const cargarSorteos = async () => {
      try {
        setLoading(true);
        // Cargar sorteos en estado borrador o programado
        const sorteosData = await window.electron.invoke('sorteos:getSorteosByEstado', ['borrador', 'programado']);
        setSorteos(sorteosData);
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar sorteos:', error);
        setError('Error al cargar la lista de sorteos disponibles');
        setLoading(false);
      }
    };
    
    cargarSorteos();
  }, []);
  
  // Efecto para cargar estados disponibles
  useEffect(() => {
    const cargarEstados = async () => {
      try {
        // Cargar lista de estados disponibles desde la BD
        const response = await window.electron.invoke('config:getEstados');
        
        // Formatear para usar en la configuración
        const estadosFormateados = response.map(estado => ({
          codigo: estado.cod_estado,
          nombre: estado.nombre,
          porcentaje: 0,
          cantidadTiques: 0
        }));
        
        setEstadosMeta(estadosFormateados);
      } catch (error) {
        console.error('Error al cargar estados:', error);
        setError('Error al cargar la lista de estados');
      }
    };
    
    cargarEstados();
  }, []);
  
  // Cargar configuración existente de un sorteo
  const cargarConfiguracionSorteo = async (sorteoId) => {
    try {
      setLoading(true);
      setError(null);
      
      // Obtener datos del sorteo seleccionado
      const sorteoData = await window.electron.invoke('sorteos:getSorteoById', sorteoId);
      
      if (sorteoData && sorteoData.metadata) {
        // Si el sorteo ya tiene configuración, cargarla
        if (sorteoData.metadata.formatoNumeracion) {
          setPrefijo(sorteoData.metadata.formatoNumeracion.prefijo || 'TIQ');
          
          setConfiguracionTiques({
            formatoNumeracion: {
              prefijo: sorteoData.metadata.formatoNumeracion.prefijo || 'TIQ',
              longitudNumero: sorteoData.metadata.formatoNumeracion.longitudNumero || 5
            },
            rangosEstado: sorteoData.metadata.rangosEstado || []
          });
        } else {
          // Configuración por defecto
          setPrefijo('TIQ');
          setConfiguracionTiques({
            formatoNumeracion: {
              prefijo: 'TIQ',
              longitudNumero: 5
            },
            rangosEstado: []
          });
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar configuración del sorteo:', error);
      setError('Error al cargar la configuración del sorteo seleccionado');
      setLoading(false);
    }
  };
  
  // Manejar cambio de sorteo seleccionado
  const handleSorteoChange = (event) => {
    const sorteoId = event.target.value;
    setSelectedSorteo(sorteoId);
    
    if (sorteoId) {
      cargarConfiguracionSorteo(sorteoId);
    } else {
      // Reiniciar configuración si no hay sorteo seleccionado
      setPrefijo('TIQ');
      setConfiguracionTiques({
        formatoNumeracion: {
          prefijo: 'TIQ',
          longitudNumero: 5
        },
        rangosEstado: []
      });
    }
  };
  
  // Cambiar prefijo de tiques
  const handlePrefijoChange = (event) => {
    const newPrefijo = event.target.value.toUpperCase();
    setPrefijo(newPrefijo);
    setConfiguracionTiques({
      ...configuracionTiques,
      formatoNumeracion: {
        ...configuracionTiques.formatoNumeracion,
        prefijo: newPrefijo
      }
    });
  };
  
  // Agregar un nuevo estado a la configuración
  const agregarEstado = () => {
    // Verificar si hay estados disponibles que no estén ya configurados
    const estadosConfigurados = configuracionTiques.rangosEstado.map(e => e.estado);
    const estadosDisponibles = estadosMeta.filter(e => !estadosConfigurados.includes(e.codigo));
    
    if (estadosDisponibles.length > 0) {
      const primerEstadoDisponible = estadosDisponibles[0];
      
      setConfiguracionTiques({
        ...configuracionTiques,
        rangosEstado: [
          ...configuracionTiques.rangosEstado,
          {
            estado: primerEstadoDisponible.codigo,
            nombre: primerEstadoDisponible.nombre,
            porcentaje: 0,
            cantidadTiques: 0
          }
        ]
      });
    }
  };
  
  // Eliminar un estado de la configuración
  const eliminarEstado = (index) => {
    const nuevosRangos = [...configuracionTiques.rangosEstado];
    nuevosRangos.splice(index, 1);
    
    setConfiguracionTiques({
      ...configuracionTiques,
      rangosEstado: nuevosRangos
    });
  };
  
  // Actualizar porcentaje de un estado
  const actualizarPorcentaje = (index, porcentaje) => {
    const valor = Math.min(100, Math.max(0, parseInt(porcentaje) || 0));
    
    const nuevosRangos = [...configuracionTiques.rangosEstado];
    nuevosRangos[index].porcentaje = valor;
    
    setConfiguracionTiques({
      ...configuracionTiques,
      rangosEstado: nuevosRangos
    });
  };
  
  // Actualizar cantidad de tiques de un estado
  const actualizarCantidadTiques = (index, cantidad) => {
    const valor = Math.max(0, parseInt(cantidad) || 0);
    
    const nuevosRangos = [...configuracionTiques.rangosEstado];
    nuevosRangos[index].cantidadTiques = valor;
    
    setConfiguracionTiques({
      ...configuracionTiques,
      rangosEstado: nuevosRangos
    });
  };
  
  // Distribuir porcentajes equitativamente
  const distribuirPorcentajesEquitativos = () => {
    if (configuracionTiques.rangosEstado.length === 0) return;
    
    const porcentajeEquitativo = Math.floor(100 / configuracionTiques.rangosEstado.length);
    const resto = 100 - (porcentajeEquitativo * configuracionTiques.rangosEstado.length);
    
    const nuevosRangos = configuracionTiques.rangosEstado.map((rango, index) => ({
      ...rango,
      porcentaje: porcentajeEquitativo + (index === 0 ? resto : 0)
    }));
    
    setConfiguracionTiques({
      ...configuracionTiques,
      rangosEstado: nuevosRangos
    });
  };
  
  // Guardar configuración
  const guardarConfiguracion = async () => {
    if (!selectedSorteo) {
      setError('Debe seleccionar un sorteo para guardar la configuración');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Verificar que la suma de porcentajes sea 100%
      const sumaPorcentajes = configuracionTiques.rangosEstado.reduce((sum, rango) => sum + rango.porcentaje, 0);
      if (sumaPorcentajes !== 100 && configuracionTiques.rangosEstado.length > 0) {
        setError('La suma de porcentajes debe ser exactamente 100%');
        setLoading(false);
        return;
      }
      
      // Actualizar metadata del sorteo
      await window.electron.invoke('sorteos:actualizarMetadata', selectedSorteo, {
        formatoNumeracion: configuracionTiques.formatoNumeracion,
        rangosEstado: configuracionTiques.rangosEstado
      });
      
      setSuccess('Configuración guardada correctamente');
      setLoading(false);
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      setError(`Error al guardar la configuración: ${error.message}`);
      setLoading(false);
    }
  };
  
  // Calcular porcentaje total
  const porcentajeTotal = configuracionTiques.rangosEstado.reduce((sum, rango) => sum + rango.porcentaje, 0);
  
  // Renderizado del componente
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Configuración de Distribución de Tiques
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/configuracion')}
          sx={{ mr: 2 }}
        >
          Volver a Configuración
        </Button>
      </Box>
      
      {/* Selección de sorteo */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Seleccionar Sorteo
        </Typography>
        
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="sorteo-select-label">Sorteo</InputLabel>
          <Select
            labelId="sorteo-select-label"
            id="sorteo-select"
            value={selectedSorteo}
            label="Sorteo"
            onChange={handleSorteoChange}
            disabled={loading}
          >
            <MenuItem value="">
              <em>Seleccione un sorteo</em>
            </MenuItem>
            {sorteos.map((sorteo) => (
              <MenuItem key={sorteo.id} value={sorteo.id}>
                {sorteo.nombre} ({sorteo.estado_actual})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>
      
      {selectedSorteo && (
        <>
          {/* Configuración de formato de numeración */}
          <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Formato de Numeración
            </Typography>
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Prefijo para Tiques"
                  value={prefijo}
                  onChange={handlePrefijoChange}
                  inputProps={{ maxLength: 5 }}
                  helperText="Máximo 5 caracteres. Ejemplo: TIQ-01-00001"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body1">
                  Formato de ejemplo: {prefijo}-01-00001
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  El formato será: PREFIJO-ESTADO-NÚMERO
                </Typography>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Configuración de distribución por estado */}
          <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Distribución por Estado
              </Typography>
              
              <Box>
                <Button 
                  variant="outlined" 
                  startIcon={<RefreshIcon />}
                  onClick={distribuirPorcentajesEquitativos}
                  disabled={configuracionTiques.rangosEstado.length === 0}
                  sx={{ mr: 1 }}
                >
                  Distribuir Equitativamente
                </Button>
                
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  onClick={agregarEstado}
                  disabled={estadosMeta.filter(e => !configuracionTiques.rangosEstado.map(r => r.estado).includes(e.codigo)).length === 0}
                >
                  Agregar Estado
                </Button>
              </Box>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {/* Indicador de porcentaje total */}
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ mr: 2 }}>
                Porcentaje Total:
              </Typography>
              <Chip 
                label={`${porcentajeTotal}%`} 
                color={porcentajeTotal === 100 ? 'success' : 'warning'} 
                icon={porcentajeTotal === 100 ? <CheckIcon /> : undefined}
              />
              {porcentajeTotal !== 100 && configuracionTiques.rangosEstado.length > 0 && (
                <Typography variant="caption" color="warning.main" sx={{ ml: 2 }}>
                  La suma debe ser exactamente 100%
                </Typography>
              )}
            </Box>
            
            {/* Tabla de estados y distribución */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Estado</TableCell>
                    <TableCell>Porcentaje (%)</TableCell>
                    <TableCell>Cantidad de Tiques</TableCell>
                    <TableCell width="100">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {configuracionTiques.rangosEstado.length > 0 ? (
                    configuracionTiques.rangosEstado.map((rango, index) => (
                      <TableRow key={index}>
                        <TableCell>{rango.nombre || `Estado ${rango.estado}`}</TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={rango.porcentaje}
                            onChange={(e) => actualizarPorcentaje(index, e.target.value)}
                            InputProps={{
                              endAdornment: <InputAdornment position="end">%</InputAdornment>,
                            }}
                            inputProps={{ min: 0, max: 100 }}
                            size="small"
                            sx={{ width: '100px' }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={rango.cantidadTiques}
                            onChange={(e) => actualizarCantidadTiques(index, e.target.value)}
                            inputProps={{ min: 0 }}
                            size="small"
                            sx={{ width: '100px' }}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            color="error" 
                            onClick={() => eliminarEstado(index)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography variant="body2" py={2}>
                          No hay estados configurados. Agregue estados para configurar la distribución.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              Nota: Puede especificar la distribución por porcentaje o por cantidad específica de tiques.
              El sistema respetará esta configuración al generar tiques en la sección de Gestión de Tiques.
            </Typography>
          </Paper>
          
          {/* Botones de acción */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={guardarConfiguracion}
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </Box>
          
          {/* Mensajes de error o éxito */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}
        </>
      )}
      
      {loading && (
        <Box display="flex" justifyContent="center" mt={3}>
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};

export default ConfiguracionTiques; 