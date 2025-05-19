import { useState, useEffect, useContext } from 'react';
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
  Checkbox,
  Paper
} from '@mui/material';
import Layout from '../common/Layout';
import participanteService from '../../api/participante';
import sorteoService from '../../api/sorteo';
import AuthContext from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const EditarParticipante = () => {
  const { sorteoId, participanteId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { socketService } = useSocket();
  
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [sorteo, setSorteo] = useState(null);

  const [participante, setParticipante] = useState({
    nombre: '',
    email: '',
    telefono: '',
    validado: false,
    metodo_registro: 'manual',
    datos_adicionales: null
  });

  // Cargar datos del sorteo y participante
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoadingData(true);
        setError(null);
        
        // Cargar información del sorteo
        const sorteoResponse = await sorteoService.getById(sorteoId);
        if (!sorteoResponse.success || !sorteoResponse.sorteo) {
          throw new Error('No se pudo cargar la información del sorteo');
        }
        setSorteo(sorteoResponse.sorteo);
        
        // Verificar permisos
        if (sorteoResponse.sorteo.creado_por !== user?.id && user?.rol !== 'admin') {
          throw new Error('No tiene permisos para editar este participante');
        }
        
        // Cargar información del participante
        const participanteResponse = await participanteService.getById(participanteId);
        if (!participanteResponse.success || !participanteResponse.participante) {
          throw new Error('No se pudo cargar la información del participante');
        }
        
        // Verificar que el participante pertenece al sorteo
        if (participanteResponse.participante.sorteo_id.toString() !== sorteoId) {
          throw new Error('El participante no pertenece al sorteo indicado');
        }
        
        // Establecer datos del participante en el formulario
        setParticipante({
          nombre: participanteResponse.participante.nombre,
          email: participanteResponse.participante.email || '',
          telefono: participanteResponse.participante.telefono || '',
          validado: participanteResponse.participante.validado || false,
          metodo_registro: participanteResponse.participante.metodo_registro || 'manual',
          datos_adicionales: participanteResponse.participante.datos_adicionales || ''
        });
        
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setError(error.message || 'Error al cargar los datos');
      } finally {
        setLoadingData(false);
      }
    };

    cargarDatos();
  }, [sorteoId, participanteId, user]);

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

      // Actualizar el participante
      const response = await participanteService.update(participanteId, participante);
      
      if (response.success) {
        setSuccess(true);
        
        // Notificar actualización mediante socket.io si está disponible
        socketService.getSocket().emit('participante-actualizado', {
          sorteoId,
          participanteId,
          mensaje: `Participante ${participante.nombre} actualizado`
        });
        
        // Mostrar mensaje de éxito y redirigir después de un tiempo
        setTimeout(() => {
          navigate(`/sorteos/${sorteoId}/participantes`);
        }, 2000);
      } else {
        throw new Error(response.message || 'Error al actualizar el participante');
      }
    } catch (error) {
      console.error('Error al actualizar participante:', error);
      setError(error.message || 'Error al actualizar el participante');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = () => {
    navigate(`/sorteos/${sorteoId}/participantes`);
  };

  if (loadingData) {
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
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Editar Participante
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
            Participante actualizado exitosamente.
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
                label="Participante validado"
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
              onClick={handleCancelar}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Guardar Cambios'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Layout>
  );
};

export default EditarParticipante; 