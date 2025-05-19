import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Button, 
  Chip,
  Divider,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BadgeIcon from '@mui/icons-material/Badge';

const DetalleSorteo = () => {
  const { sorteoId } = useParams();
  const navigate = useNavigate();
  
  // Estados
  const [sorteo, setSorteo] = useState(null);
  const [premios, setPremios] = useState([]);
  const [participantes, setParticipantes] = useState([]);
  const [ganadores, setGanadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Cargar datos del sorteo
  useEffect(() => {
    if (sorteoId) {
      cargarDatosSorteo();
    }
  }, [sorteoId]);
  
  const cargarDatosSorteo = async () => {
    try {
      setLoading(true);
      
      // Obtener datos del sorteo
      const sorteoData = await window.electron.invoke('sorteos:getSorteoById', sorteoId);
      setSorteo(sorteoData);
      
      // Obtener premios
      const premiosData = await window.electron.invoke('premios:getPremiosBySorteo', sorteoId);
      setPremios(premiosData || []);
      
      // Obtener participantes
      const participantesData = await window.electron.invoke('participantes:getParticipantesBySorteo', sorteoId);
      setParticipantes(participantesData || []);
      
      // Obtener ganadores si el sorteo está finalizado
      if (sorteoData.estado_actual === 'finalizado') {
        const ganadoresData = await window.electron.invoke('ganadores:getGanadoresBySorteo', sorteoId);
        setGanadores(ganadoresData || []);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar datos del sorteo:', error);
      setError('Error al cargar los datos del sorteo');
      setLoading(false);
    }
  };
  
  // Iniciar sorteo
  const iniciarSorteo = () => {
    navigate(`/sorteos/iniciar/${sorteoId}`);
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
        <Button 
          variant="outlined" 
          onClick={cargarDatosSorteo} 
          sx={{ mt: 2 }}
        >
          Reintentar
        </Button>
      </Box>
    );
  }
  
  if (!sorteo) {
    return (
      <Box p={3}>
        <Alert severity="warning">No se encontró el sorteo solicitado</Alert>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/sorteos')} 
          sx={{ mt: 2 }}
        >
          Volver a la lista de sorteos
        </Button>
      </Box>
    );
  }
  
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Detalle del Sorteo
      </Typography>
      
      {/* Información general del sorteo */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Typography variant="h5" gutterBottom>
                {sorteo.nombre}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Fecha: {new Date(sorteo.fecha_sorteo).toLocaleString()}
              </Typography>
              <Typography variant="body1" paragraph>
                {sorteo.descripcion}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Chip 
                label={sorteo.estado_actual} 
                color={
                  sorteo.estado_actual === 'finalizado' ? 'success' : 
                  sorteo.estado_actual === 'en_progreso' ? 'error' :
                  sorteo.estado_actual === 'programado' ? 'primary' : 'default'
                }
                sx={{ mb: 1 }}
              />
              <Typography variant="body2">
                Tipo: {sorteo.estado || 'Nacional'}
              </Typography>
              <Typography variant="body2">
                Creado: {new Date(sorteo.fecha_creacion).toLocaleDateString()}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Botones de acciones */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Acciones
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/sorteos/editar/${sorteoId}`)}
              >
                Editar Sorteo
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                startIcon={<PlayArrowIcon />}
                onClick={iniciarSorteo}
                disabled={sorteo.estado_actual === 'finalizado'}
              >
                Iniciar Sorteo
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                color="secondary"
                startIcon={<VisibilityIcon />}
                onClick={() => navigate(`/sorteos/resultados/${sorteoId}`)}
                disabled={sorteo.estado_actual !== 'finalizado'}
              >
                Ver Resultados
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                color="info"
                startIcon={<BadgeIcon />}
                onClick={() => navigate(`/participantes/tiques/${sorteoId}`)}
              >
                Gestión de Tiques
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Estadísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              {premios.length}
            </Typography>
            <Typography variant="body2">
              Premios
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              {participantes.length}
            </Typography>
            <Typography variant="body2">
              Participantes
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              {participantes.filter(p => p.tique_asignado).length}
            </Typography>
            <Typography variant="body2">
              Tiques Asignados
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Lista de premios */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Premios
          </Typography>
          
          {premios.length > 0 ? (
            <Grid container spacing={2}>
              {premios.map((premio, index) => (
                <Grid item xs={12} sm={6} md={4} key={premio.id || index}>
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 2, 
                      bgcolor: index === 0 ? 'rgba(255, 215, 0, 0.1)' : 'inherit',
                      borderLeft: index === 0 ? '4px solid gold' : 'none'
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight="bold">
                      {premio.nombre}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {premio.descripcion}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2">
                      Valor: {typeof premio.valor === 'number' ? premio.valor.toLocaleString() : premio.valor}
                    </Typography>
                    <Typography variant="body2">
                      Categoría: {premio.categoria_id}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="info">No hay premios registrados para este sorteo</Alert>
          )}
        </CardContent>
      </Card>
      
      {/* Estado de participantes */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Estado de participantes
          </Typography>
          
          {participantes.length > 0 ? (
            <>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={4}>
                  <Paper elevation={1} sx={{ p: 1.5, textAlign: 'center' }}>
                    <Typography variant="body2">Validados</Typography>
                    <Typography variant="h6" color="success.main">
                      {participantes.filter(p => p.validado).length}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Paper elevation={1} sx={{ p: 1.5, textAlign: 'center' }}>
                    <Typography variant="body2">Pendientes de validación</Typography>
                    <Typography variant="h6" color="warning.main">
                      {participantes.filter(p => !p.validado).length}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Paper elevation={1} sx={{ p: 1.5, textAlign: 'center' }}>
                    <Typography variant="body2">Con tique asignado</Typography>
                    <Typography variant="h6" color="primary.main">
                      {participantes.filter(p => p.tique_asignado).length}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
              
              <Button 
                variant="outlined" 
                onClick={() => navigate(`/participantes/tiques/${sorteoId}`)}
                startIcon={<BadgeIcon />}
                fullWidth
              >
                Gestionar participantes y tiques
              </Button>
            </>
          ) : (
            <Alert severity="warning">
              No hay participantes registrados para este sorteo.
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => navigate(`/participantes/importar`)}
                sx={{ ml: 2 }}
              >
                Importar participantes
              </Button>
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default DetalleSorteo; 