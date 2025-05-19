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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { es } from 'date-fns/locale';
import Layout from '../common/Layout';
import premioService from '../../api/premio';
import sorteoService from '../../api/sorteo';

const CrearPremio = () => {
  const { sorteoId } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSorteo, setLoadingSorteo] = useState(true);
  const [categorias, setCategorias] = useState([]);
  const [sorteo, setSorteo] = useState(null);

  const [premio, setPremio] = useState({
    sorteo_id: sorteoId,
    nombre: '',
    descripcion: '',
    valor: '',
    orden: 1,
    categoria_id: '',
    patrocinador: '',
    condiciones: '',
    fecha_entrega: null,
    images_json: null
  });

  // Cargar datos del sorteo y categorías
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoadingSorteo(true);
        
        // Cargar info del sorteo
        const sorteoResponse = await sorteoService.getById(sorteoId);
        if (sorteoResponse.success) {
          setSorteo(sorteoResponse.sorteo);
        } else {
          setError('No se pudo cargar la información del sorteo');
          return;
        }
        
        // Cargar categorías
        const categoriasResponse = await premioService.getCategorias();
        if (categoriasResponse.success) {
          setCategorias(categoriasResponse.categorias || []);
        }

        // Obtener premios para determinar el orden
        const premiosResponse = await premioService.getBySorteo(sorteoId);
        if (premiosResponse.success && premiosResponse.premios) {
          const premios = premiosResponse.premios;
          if (premios.length > 0) {
            // Encontrar el máximo orden y agregar 1
            const maxOrden = Math.max(...premios.map(p => p.orden || 0));
            setPremio(prev => ({ ...prev, orden: maxOrden + 1 }));
          }
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setError('Error al cargar los datos necesarios. Por favor, intente nuevamente.');
      } finally {
        setLoadingSorteo(false);
      }
    };

    cargarDatos();
  }, [sorteoId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPremio({
      ...premio,
      [name]: value
    });
  };

  const handleDateChange = (newDate) => {
    setPremio({
      ...premio,
      fecha_entrega: newDate
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validaciones básicas
      if (!premio.nombre) {
        throw new Error('El nombre del premio es requerido');
      }

      // Crear el premio
      const response = await premioService.create(premio);
      setSuccess(true);
      
      // Redirigir después de un breve momento
      setTimeout(() => {
        navigate(`/sorteos/${sorteoId}`);
      }, 1500);
    } catch (error) {
      console.error('Error al crear premio:', error);
      setError(error.message || 'Error al crear el premio');
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
          Agregar Premio
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
            Premio creado exitosamente. Redirigiendo...
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
                label="Nombre del Premio"
                value={premio.nombre}
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
                rows={3}
                value={premio.descripcion}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="valor"
                name="valor"
                label="Valor"
                type="number"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  ),
                }}
                value={premio.valor}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="orden"
                name="orden"
                label="Orden"
                type="number"
                value={premio.orden}
                onChange={handleChange}
                disabled={loading}
                helperText="Posición en la que se mostrará el premio (menor = más importante)"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="categoria-label">Categoría</InputLabel>
                <Select
                  labelId="categoria-label"
                  id="categoria_id"
                  name="categoria_id"
                  value={premio.categoria_id}
                  label="Categoría"
                  onChange={handleChange}
                  disabled={loading}
                >
                  <MenuItem value="">
                    <em>Ninguna</em>
                  </MenuItem>
                  {categorias.map((categoria) => (
                    <MenuItem key={categoria.id} value={categoria.id}>
                      {categoria.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="patrocinador"
                name="patrocinador"
                label="Patrocinador"
                value={premio.patrocinador}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DatePicker
                  label="Fecha de Entrega"
                  value={premio.fecha_entrega}
                  onChange={handleDateChange}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth name="fecha_entrega" />
                  )}
                  disabled={loading}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                id="condiciones"
                name="condiciones"
                label="Condiciones"
                multiline
                rows={3}
                value={premio.condiciones}
                onChange={handleChange}
                disabled={loading}
                helperText="Condiciones especiales para reclamar este premio"
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={() => navigate(`/sorteos/${sorteoId}`)}
              sx={{ mr: 1 }}
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
              Guardar Premio
            </Button>
          </Box>
        </Box>
      </Box>
    </Layout>
  );
};

export default CrearPremio; 