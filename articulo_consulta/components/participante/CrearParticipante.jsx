import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import Layout from '../common/Layout';
import participanteService from '../../api/participante';
import sorteoService from '../../api/sorteo';

const CrearParticipante = () => {
  const { sorteoId } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSorteo, setLoadingSorteo] = useState(true);
  const [sorteo, setSorteo] = useState(null);

  const [participante, setParticipante] = useState({
    sorteo_id: sorteoId,
    nombre: '',
    email: '',
    telefono: '',
    validado: false,
    metodo_registro: 'manual',
    datos_adicionales: null
  });

  // Cargar datos del sorteo
  useEffect(() => {
    const cargarSorteo = async () => {
      try {
        setLoadingSorteo(true);
        const response = await sorteoService.getById(sorteoId);
        
        if (response.success && response.sorteo) {
          setSorteo(response.sorteo);
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
  }, [sorteoId]);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setParticipante({
      ...participante,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validaciones básicas
      if (!participante.nombre) {
        throw new Error('El nombre del participante es requerido');
      }

      if (!participante.email && !participante.telefono) {
        throw new Error('Debe proporcionar al menos un email o teléfono');
      }

      if (participante.email) {
        // Validación simple de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(participante.email)) {
          throw new Error('El formato de email no es válido');
        }
      }

      // Crear el participante
      const response = await participanteService.create(participante);
      setSuccess(true);
      
      // Limpiar el formulario para agregar otro participante
      setParticipante({
        sorteo_id: sorteoId,
        nombre: '',
        email: '',
        telefono: '',
        validado: false,
        metodo_registro: 'manual',
        datos_adicionales: null
      });
      
      // Mostrar mensaje de éxito por un tiempo
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error al crear participante:', error);
      setError(error.message || 'Error al registrar el participante');
    } finally {
      setLoading(false);
    }
  };

  const handleVolverAlSorteo = () => {
    navigate(`/sorteos/${sorteoId}`);
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

  if (!sorteo) {
    return (
      <Layout>
        <Alert severity="error" sx={{ mb: 2 }}>
          Sorteo no encontrado
        </Alert>
        <Button variant="contained" onClick={() => navigate('/dashboard')}>
          Volver al Dashboard
        </Button>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Agregar Participante
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Sorteo: {sorteo.nombre}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Participante registrado exitosamente.
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="nombre"
                name="nombre"
                label="Nombre completo"
                value={participante.nombre}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="email"
                name="email"
                label="Email"
                type="email"
                value={participante.email}
                onChange={handleChange}
                disabled={loading}
                helperText="Al menos un email o teléfono es requerido"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="telefono"
                name="telefono"
                label="Teléfono"
                value={participante.telefono}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={participante.validado}
                    onChange={handleChange}
                    name="validado"
                    color="primary"
                    disabled={loading}
                  />
                }
                label="Validar participante automáticamente"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                id="datos_adicionales"
                name="datos_adicionales"
                label="Datos adicionales"
                multiline
                rows={3}
                value={participante.datos_adicionales || ''}
                onChange={handleChange}
                disabled={loading}
                helperText="Información adicional sobre el participante (opcional)"
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={handleVolverAlSorteo}
              disabled={loading}
            >
              Volver al Sorteo
            </Button>
            <Box>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Registrar Participante'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Layout>
  );
};

export default CrearParticipante; 