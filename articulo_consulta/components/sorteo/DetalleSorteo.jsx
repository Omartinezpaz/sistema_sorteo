import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Typography,
  Box,
  Button,
  Grid,
  Paper,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import {  Edit as EditIcon,  Add as AddIcon,  Delete as DeleteIcon,  Check as CheckIcon,  Assessment as AssessmentIcon} from '@mui/icons-material';
import Layout from '../common/Layout';
import AuthContext from '../../context/AuthContext';
import sorteoService from '../../api/sorteo';
import premioService from '../../api/premio';
import participanteService from '../../api/participante';
import ReportesSorteo from './ReportesSorteo';
import ResultadosSorteo from './ResultadosSorteo';

const DetalleSorteo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [sorteo, setSorteo] = useState(null);
  const [premios, setPremios] = useState([]);
  const [participantes, setParticipantes] = useState({ items: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null });
  const [success, setSuccess] = useState(null);
  const [realizandoSorteo, setRealizandoSorteo] = useState(false);
  const [resultadoSorteo, setResultadoSorteo] = useState(null);

  // Cargar datos del sorteo y sus premios
  useEffect(() => {
    const cargarSorteo = async () => {
      try {
        setLoading(true);
        const response = await sorteoService.getById(id);
        
        if (response.success && response.sorteo) {
          setSorteo(response.sorteo);
          // Cargar premios relacionados
          const premiosResponse = await premioService.getBySorteo(id);
          if (premiosResponse.success) {
            setPremios(premiosResponse.premios || []);
          }
          
          // Cargar participantes relacionados (primera página)
          const participantesResponse = await participanteService.getBySorteo(id, 1, 10);
          if (participantesResponse.success) {
            setParticipantes({
              items: participantesResponse.participantes || [],
              pagination: participantesResponse.pagination || {}
            });
          }
        } else {
          setError('No se pudo cargar la información del sorteo');
        }
      } catch (error) {
        console.error('Error al cargar sorteo:', error);
        setError('Error al cargar el sorteo. Por favor, intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    cargarSorteo();
  }, [id]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Formatear fecha
  const formatFecha = (fechaString) => {
    if (!fechaString) return 'No programado';
    
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para mostrar el estado del sorteo con color
  const getEstadoChip = (estado) => {
    const estadoColors = {
      'borrador': 'default',
      'programado': 'primary',
      'en_progreso': 'success',
      'finalizado': 'info',
      'suspendido': 'warning',
      'cancelado': 'error'
    };

    const color = estadoColors[estado] || 'default';
    
    return (
      <Chip 
        label={estado.replace('_', ' ')} 
        color={color} 
        size="small" 
        sx={{ textTransform: 'capitalize' }}
      />
    );
  };

  // Verificar si el usuario es el creador o admin
  const esCreadorOAdmin = () => {
    if (!user || !sorteo) return false;
    return user.id === sorteo.creado_por || user.rol === 'admin';
  };

  const handleEliminarSorteo = async () => {
    try {
      setLoading(true);
      await sorteoService.delete(id);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Error al eliminar sorteo:', error);
      setError(error.message || 'Error al eliminar el sorteo');
      setLoading(false);
    }
  };

  const handleRealizarSorteo = async () => {
    try {
      setRealizandoSorteo(true);
      setError(null);
      
      const response = await sorteoService.realizarSorteo(id);
      
      if (response.success) {
        setResultadoSorteo(response.resultado);
        setSuccess('¡Sorteo realizado exitosamente!');
        
        // Recargar datos después del sorteo
        const sorteoResponse = await sorteoService.getById(id);
        if (sorteoResponse.success && sorteoResponse.sorteo) {
          setSorteo(sorteoResponse.sorteo);
        }
      }
    } catch (error) {
      console.error('Error al realizar sorteo:', error);
      setError(error.message || 'Error al realizar el sorteo');
    } finally {
      setRealizandoSorteo(false);
    }
  };

  if (loading && !sorteo) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (error && !sorteo) {
    return (
      <Layout>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/dashboard')}>
          Volver al Dashboard
        </Button>
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
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            {sorteo.nombre}
          </Typography>
          
          {esCreadorOAdmin() && (
            <Box>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                component={Link}
                to={`/sorteos/${id}/editar`}
                sx={{ mr: 1 }}
              >
                Editar
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setConfirmDialog({ open: true, action: 'eliminar' })}
              >
                Eliminar
              </Button>
            </Box>
          )}
        </Box>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" color="text.secondary">
                Estado
              </Typography>
              {getEstadoChip(sorteo.estado_actual)}
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" color="text.secondary">
                Fecha del Sorteo
              </Typography>
              <Typography variant="body1">
                {formatFecha(sorteo.fecha_sorteo)}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" color="text.secondary">
                Visibilidad
              </Typography>
              <Typography variant="body1">
                {sorteo.es_publico ? 'Público' : 'Privado'}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" color="text.secondary">
                Total de Participantes
              </Typography>
              <Typography variant="body1">
                {sorteo.total_participantes || 0}
              </Typography>
            </Grid>
            
            {sorteo.descripcion && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" color="text.secondary">
                  Descripción
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {sorteo.descripcion}
                </Typography>
              </Grid>
            )}
            
            {sorteo.reglas && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" color="text.secondary">
                  Reglas
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {sorteo.reglas}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
        
        {esCreadorOAdmin() && sorteo.estado_actual === 'en_progreso' && (
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              color="success"
              fullWidth
              size="large"
              onClick={() => setConfirmDialog({ open: true, action: 'sortear' })}
              disabled={realizandoSorteo || premios.length === 0 || sorteo.total_participantes === 0}
            >
              {realizandoSorteo ? <CircularProgress size={24} color="inherit" /> : 'Realizar Sorteo'}
            </Button>
            
            {premios.length === 0 && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                Debe agregar premios antes de realizar el sorteo
              </Alert>
            )}
            
            {sorteo.total_participantes === 0 && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                Debe agregar participantes antes de realizar el sorteo
              </Alert>
            )}
          </Box>
        )}
        
        {resultadoSorteo && (
          <Box sx={{ mb: 3 }}>
            <ResultadosSorteo 
              sorteo={sorteo}
              resultados={resultadoSorteo}
              onGenerarSorteo={sorteo.estado_actual === 'en_progreso' ? handleRealizarSorteo : undefined}
            />
          </Box>
        )}
        
        {!resultadoSorteo && sorteo.estado_actual === 'en_progreso' && esCreadorOAdmin() && (
          <Box sx={{ mb: 3 }}>
            <ResultadosSorteo 
              sorteo={sorteo} 
              resultados={[]} 
              onGenerarSorteo={handleRealizarSorteo} 
            />
          </Box>
        )}
        
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Premios" />
          <Tab label="Participantes" />
        </Tabs>
        
        <Box role="tabpanel" hidden={tabValue !== 0}>
          {tabValue === 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Premios ({premios.length})
                </Typography>
                
                {esCreadorOAdmin() && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    component={Link}
                    to={`/sorteos/${id}/premios/nuevo`}
                    size="small"
                  >
                    Agregar Premio
                  </Button>
                )}
              </Box>
              
              {premios.length > 0 ? (
                <List>
                  {premios.map((premio) => (
                    <Paper key={premio.id} sx={{ mb: 2 }}>
                      <ListItem
                        secondaryAction={
                          esCreadorOAdmin() && (
                            <Box>
                              <Button
                                size="small"
                                component={Link}
                                to={`/sorteos/${id}/premios/${premio.id}/editar`}
                                sx={{ mr: 1 }}
                              >
                                Editar
                              </Button>
                            </Box>
                          )
                        }
                      >
                        <ListItemText
                          primary={premio.nombre}
                          secondary={
                            <Box>
                              <Typography variant="body2" component="span">
                                {premio.descripcion}
                              </Typography>
                              {premio.valor && (
                                <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                                  Valor: {premio.valor}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    </Paper>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  No hay premios registrados para este sorteo.
                </Alert>
              )}
            </Box>
          )}
        </Box>
        
        <Box role="tabpanel" hidden={tabValue !== 1}>
          {tabValue === 1 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Participantes ({sorteo.total_participantes || 0})
                </Typography>
                
                {esCreadorOAdmin() && (
                  <Box>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      component={Link}
                      to={`/sorteos/${id}/participantes/nuevo`}
                      size="small"
                      sx={{ mr: 1 }}
                    >
                      Agregar Participante
                    </Button>
                    <Button
                      variant="outlined"
                      component={Link}
                      to={`/sorteos/${id}/participantes/importar`}
                      size="small"
                    >
                      Importar
                    </Button>
                  </Box>
                )}
              </Box>
              
              {participantes.items.length > 0 ? (
                <List>
                  {participantes.items.map((participante) => (
                    <Paper key={participante.id} sx={{ mb: 2 }}>
                      <ListItem
                        secondaryAction={
                          esCreadorOAdmin() && (
                            <Box>
                              {!participante.validado && (
                                <Button
                                  size="small"
                                  startIcon={<CheckIcon />}
                                  color="success"
                                  sx={{ mr: 1 }}
                                  onClick={() => {/* Validar participante */}}
                                >
                                  Validar
                                </Button>
                              )}
                              <Button
                                size="small"
                                component={Link}
                                to={`/sorteos/${id}/participantes/${participante.id}/editar`}
                                sx={{ mr: 1 }}
                              >
                                Editar
                              </Button>
                            </Box>
                          )
                        }
                      >
                        <ListItemText
                          primary={participante.nombre}
                          secondary={
                            <Box>
                              <Typography variant="body2" component="span">
                                {participante.email}
                              </Typography>
                              <Box sx={{ mt: 1 }}>
                                {participante.validado ? (
                                  <Chip size="small" color="success" label="Validado" />
                                ) : (
                                  <Chip size="small" color="warning" label="Pendiente" />
                                )}
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                    </Paper>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  No hay participantes registrados para este sorteo.
                </Alert>
              )}
              
              {participantes.pagination.total > participantes.pagination.limit && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button variant="contained" component={Link} to={`/sorteos/${id}/participantes`}>
                    Ver todos los participantes
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>
      
      {/* Diálogo de confirmación */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
      >
        <DialogTitle>
          {confirmDialog.action === 'eliminar' ? 'Eliminar Sorteo' : 'Realizar Sorteo'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.action === 'eliminar' 
              ? '¿Está seguro que desea eliminar este sorteo? Esta acción no se puede deshacer.'
              : '¿Está seguro que desea realizar el sorteo ahora? Esta acción seleccionará ganadores y no se puede deshacer.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>
            Cancelar
          </Button>
          <Button 
            color={confirmDialog.action === 'eliminar' ? 'error' : 'primary'} 
            onClick={() => {
              setConfirmDialog({ ...confirmDialog, open: false });
              if (confirmDialog.action === 'eliminar') {
                handleEliminarSorteo();
              } else {
                handleRealizarSorteo();
              }
            }}
            autoFocus
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default DetalleSorteo;