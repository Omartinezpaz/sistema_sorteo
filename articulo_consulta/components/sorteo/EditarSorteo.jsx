import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  FormControlLabel,
  Switch,
  Grid,
  Alert,
  CircularProgress,
  MenuItem,
  InputLabel,
  Select
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { es } from 'date-fns/locale';
import Layout from '../common/Layout';
import sorteoService from '../../api/sorteo';

const EditarSorteo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSorteo, setLoadingSorteo] = useState(true);

  const [sorteo, setSorteo] = useState({
    nombre: '',
    descripcion: '',
    fecha_sorteo: new Date(),
    estado: 'activo',
    estado_actual: 'borrador',
    es_publico: false,
    reglas: '',
    imagenes_json: null
  });

  // Cargar datos del sorteo
  useEffect(() => {
    const cargarSorteo = async () => {
      try {
        setLoadingSorteo(true);
        const response = await sorteoService.getById(id);
        
        if (response.success && response.sorteo) {
          const sorteoData = response.sorteo;
          setSorteo({
            ...sorteoData,
            fecha_sorteo: sorteoData.fecha_sorteo ? new Date(sorteoData.fecha_sorteo) : new Date(),
            reglas: sorteoData.reglas || ''
          });
        } else {
          setError('No se pudo cargar la información del sorteo');
        }
      } catch (error) {
        console.error('Error al cargar sorteo:', error);
        setError('Error al cargar el sorteo. Por favor, intente nuevamente.');
      } finally {
        setLoadingSorteo(false);
      }
    };

    cargarSorteo();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setSorteo({
      ...sorteo,
      [name]: name === 'es_publico' ? checked : value
    });
  };

  const handleDateChange = (newDate) => {
    setSorteo({
      ...sorteo,
      fecha_sorteo: newDate
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validaciones básicas
      if (!sorteo.nombre) {
        throw new Error('El nombre del sorteo es requerido');
      }

      // Actualizar el sorteo
      await sorteoService.update(id, sorteo);
      setSuccess(true);
      
      // Redirigir después de un breve momento
      setTimeout(() => {
        navigate(`/sorteos/${id}`);
      }, 1500);
    } catch (error) {
      console.error('Error al actualizar sorteo:', error);
      setError(error.message || 'Error al actualizar el sorteo');
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarEstado = async (nuevoEstado) => {
    try {
      setLoading(true);
      setError(null);
      
      await sorteoService.updateEstado(id, nuevoEstado);
      
      // Actualizar el estado en el formulario
      setSorteo({
        ...sorteo,
        estado_actual: nuevoEstado
      });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      setError(error.message || 'Error al cambiar el estado del sorteo');
    } finally {
      setLoading(false);
    }
  };

  if (loadingSorteo) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Editar Sorteo
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Sorteo actualizado exitosamente.
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Estado actual: {sorteo.estado_actual.replace('_', ' ')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {sorteo.estado_actual === 'borrador' && (
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => handleCambiarEstado('programado')}
                disabled={loading}
              >
                Programar Sorteo
              </Button>
            )}
            {sorteo.estado_actual === 'programado' && (
              <Button 
                variant="contained" 
                color="success"
                onClick={() => handleCambiarEstado('en_progreso')}
                disabled={loading}
              >
                Iniciar Sorteo
              </Button>
            )}
            {sorteo.estado_actual === 'en_progreso' && (
              <Button 
                variant="contained" 
                color="info"
                onClick={() => handleCambiarEstado('finalizado')}
                disabled={loading}
              >
                Finalizar Sorteo
              </Button>
            )}
            {['borrador', 'programado', 'en_progreso'].includes(sorteo.estado_actual) && (
              <Button 
                variant="contained" 
                color="error"
                onClick={() => handleCambiarEstado('cancelado')}
                disabled={loading}
              >
                Cancelar Sorteo
              </Button>
            )}
          </Box>
        </Box>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="nombre"
                name="nombre"
                label="Nombre del Sorteo"
                value={sorteo.nombre}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                id="descripcion"
                name="descripcion"
                label="Descripción"
                multiline
                rows={4}
                value={sorteo.descripcion || ''}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DateTimePicker
                  label="Fecha y Hora del Sorteo"
                  value={sorteo.fecha_sorteo}
                  onChange={handleDateChange}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth name="fecha_sorteo" />
                  )}
                  disabled={loading || sorteo.estado_actual === 'finalizado'}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={sorteo.es_publico}
                    onChange={handleChange}
                    name="es_publico"
                    color="primary"
                    disabled={loading}
                  />
                }
                label="Sorteo Público"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                id="reglas"
                name="reglas"
                label="Reglas del Sorteo"
                multiline
                rows={3}
                value={sorteo.reglas || ''}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={() => navigate(`/sorteos/${id}`)}
              sx={{ mr: 1 }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || sorteo.estado_actual === 'finalizado'}
            >
              Guardar Cambios
            </Button>
          </Box>
        </Box>
      </Box>
    </Layout>
  );
};

export default EditarSorteo; 