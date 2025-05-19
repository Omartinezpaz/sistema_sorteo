import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Grid, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Add as AddIcon,
  Save as SaveIcon,
  DeleteOutline as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Badge as BadgeIcon,
  Print as PrintIcon,
  Search as SearchIcon,
  FilterAlt as FilterIcon,
  Download as DownloadIcon,
  DataArray as DataArrayIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';
import ProgresoGeneracionTiques from '../../components/shared/ProgresoGeneracionTiques';

const GestionTiques = ({ onComplete }) => {
  // Obtener sorteoId desde los parámetros de la URL
  const { sorteoId } = useParams();
  const navigate = useNavigate();
  
  // Estados
  const [sorteo, setSorteo] = useState(null);
  const [participantes, setParticipantes] = useState([]);
  const [filteredParticipantes, setFilteredParticipantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('');
  const [estados, setEstados] = useState([]);
  const [showAsignados, setShowAsignados] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importStats, setImportStats] = useState(null);
  const [generandoTiques, setGenerandoTiques] = useState(false);
  const [dialogoTiquesOpen, setDialogoTiquesOpen] = useState(false);
  const [resultadoGeneracion, setResultadoGeneracion] = useState(null);
  const [asignandoTiques, setAsignandoTiques] = useState(false);
  const [asignacionStats, setAsignacionStats] = useState(null);
  const [alertDialog, setAlertDialog] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Cargar datos iniciales
  useEffect(() => {
    if (sorteoId) {
      cargarDatos();
    }
  }, [sorteoId]);
  
  // Cargar participantes cuando cambia el filtro o la búsqueda
  useEffect(() => {
    if (participantes.length > 0) {
      aplicarFiltros();
    }
  }, [searchTerm, selectedEstado, showAsignados, participantes]);

  // Función para cargar datos del sorteo y participantes
  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Obtener datos del sorteo
      try {
        const sorteoData = await window.electron.invoke('sorteos:getSorteoById', sorteoId);
        setSorteo(sorteoData);
        
        // Extraer estados disponibles del metadata del sorteo
        if (sorteoData.metadata && sorteoData.metadata.rangosEstado) {
          const estadosFromMetadata = sorteoData.metadata.rangosEstado.map(rango => rango.estado);
          setEstados(estadosFromMetadata);
        }
      } catch (sorteoError) {
        console.error('Error al cargar el sorteo:', sorteoError);
        setError(`Error: El sorteo con ID ${sorteoId} no existe o no se puede acceder a él`);
        setLoading(false);
        return;
      }
      
      // Cargar participantes
      await cargarParticipantes();
      
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los datos del sorteo y participantes');
      setLoading(false);
    }
  };
  
  // Cargar participantes
  const cargarParticipantes = async () => {
    try {
      // Obtener todos los participantes validados para este sorteo
      const participantesData = await window.electron.invoke('participantes:getParticipantesBySorteo', sorteoId, true);
      setParticipantes(participantesData);
      setFilteredParticipantes(participantesData);
    } catch (error) {
      console.error('Error al cargar participantes:', error);
      setError('Error al cargar los participantes del sorteo');
    }
  };
  
  // Aplicar filtros a la lista de participantes
  const aplicarFiltros = () => {
    let filtered = [...participantes];
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.documento_identidad?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.codigo_tique?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtrar por estado
    if (selectedEstado) {
      filtered = filtered.filter(p => p.estado === selectedEstado);
    }
    
    // Filtrar por tiques asignados/no asignados
    if (showAsignados) {
      filtered = filtered.filter(p => p.tique_asignado);
    }
    
    setFilteredParticipantes(filtered);
  };
  
  // Resetear filtros
  const resetFiltros = () => {
    setSearchTerm('');
    setSelectedEstado('');
    setShowAsignados(false);
  };
  
  // Abrir diálogo de importación de participantes
  const handleOpenImportDialog = () => {
    setImportFile(null);
    setImportProgress(0);
    setImportStats(null);
    setImportDialogOpen(true);
  };
  
  // Manejar selección de archivo para importar
  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setImportFile(event.target.files[0]);
    }
  };
  
  // Importar participantes desde archivo
  const importarParticipantes = async () => {
    if (!importFile) return;
    
    try {
      setImportProgress(10);
      
      // Aquí se enviaría el archivo al backend para procesarlo
      // Por ahora, simulamos la importación
      await new Promise(resolve => setTimeout(resolve, 1500));
      setImportProgress(50);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setImportProgress(100);
      
      // Simular estadísticas de importación
      setImportStats({
        total: 120,
        importados: 118,
        errores: 2,
        erroresDetalle: [
          'Fila 45: Documento de identidad duplicado',
          'Fila 87: Falta estado de residencia'
        ]
      });
      
      // Recargar participantes después de importar
      await cargarParticipantes();
      
    } catch (error) {
      console.error('Error al importar participantes:', error);
      setError('Error al importar participantes desde el archivo');
      setImportProgress(0);
    }
  };
  
  // Función para generar tiques desde la tabla re_723
  const generarTiquesDesdeTabla = async () => {
    if (!sorteoId) {
      showAlertDialog('Error: No hay sorteoId definido. Acceda a esta página desde la lista de sorteos.', 'error');
      return;
    }
    
    try {
      console.log('=== INICIANDO GENERACIÓN DE TIQUES ===');
      console.log('Datos del sorteo:', sorteo);
      
      setGenerandoTiques(true);
      setDialogoTiquesOpen(true);
      setResultadoGeneracion(null);
      
      // Configurar verificación de distribución primero
      const verificacionDist = await window.electron.invoke('distribucion:existeParaSorteo', sorteoId);
      
      if (!verificacionDist.existe) {
        setGenerandoTiques(false);
        return showAlertDialog('No hay distribución de tiques configurada para este sorteo. Configure la distribución en la sección de configuración de sorteos.', 'error');
      }

      // Usar el nuevo método que aprovecha la tabla de distribución
      const prefijo = sorteo?.metadata?.formatoNumeracion?.prefijo || 'TIQ';
      console.log('Usando prefijo para tiques:', prefijo);
      
      console.log('Invocando método participantes:generarTiquesDesdeDistribucion...');
      // Esta llamada iniciará el proceso en segundo plano y registrará eventos de progreso
      const resultado = await window.electron.invoke('participantes:generarTiquesDesdeDistribucion', sorteoId, prefijo);
      
      console.log('Resultado recibido de generación de tiques:', resultado);
      setResultadoGeneracion(resultado);
      
      // Recargar participantes después de la generación
      await cargarParticipantes();
      
      // Mostrar notificación de éxito
      showAlertDialog(`Generación completada: Se generaron ${resultado.resultado.total_tiques} tiques.`, 'success');
      
    } catch (error) {
      console.error('Error al generar tiques:', error);
      
      setResultadoGeneracion({
        error: true,
        mensaje: `Error al generar tiques: ${error.message || 'Error desconocido'}`,
        errorInfo: error.stack
      });
      
      setGenerandoTiques(false);
    }
  };
  
  // Asignar tiques a participantes sin tique
  const asignarTiquesAutomaticamente = async () => {
    try {
      setAsignandoTiques(true);
      
      // Contar participantes sin tique
      const sinTique = participantes.filter(p => !p.tique_asignado).length;
      
      // Si no hay participantes sin tique, no hacer nada
      if (sinTique === 0) {
        setAsignacionStats({
          asignados: 0,
          errores: 0,
          mensaje: 'Todos los participantes ya tienen tiques asignados'
        });
        setAsignandoTiques(false);
        return;
      }
      
      // Simular asignación de tiques
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Llamar al endpoint para asignar tiques automáticamente
      const resultado = await window.electron.invoke('participantes:asignarTiques', sorteoId);
      
      // Actualizar lista de participantes
      await cargarParticipantes();
      
      setAsignacionStats({
        asignados: sinTique,
        errores: 0,
        mensaje: `Se asignaron tiques a ${sinTique} participantes con éxito`
      });
      
    } catch (error) {
      console.error('Error al asignar tiques:', error);
      setAsignacionStats({
        asignados: 0,
        errores: 1,
        mensaje: `Error: ${error.message || 'No se pudieron asignar los tiques'}`
      });
    } finally {
      setAsignandoTiques(false);
    }
  };
  
  // Función para mostrar un diálogo de alerta (reemplaza los alert)
  const showAlertDialog = (message, severity = 'success') => {
    setAlertDialog({
      open: true,
      message,
      severity
    });
  };
  
  // Generar PDF con lista de tiques
  const generarPDFTiques = async () => {
    try {
      // Aquí se llamaría a la función para generar PDF
      await window.electron.invoke('reportes:generarPDFTiques', sorteoId, selectedEstado || null);
      
      // Mostrar mensaje de éxito usando el diálogo
      showAlertDialog('PDF generado correctamente. Se ha guardado en la carpeta de descargas.');
      
    } catch (error) {
      console.error('Error al generar PDF:', error);
      setError('Error al generar el PDF de tiques');
    }
  };
  
  // Exportar lista de tiques a Excel
  const exportarTiquesExcel = async () => {
    try {
      // Aquí se llamaría a la función para exportar a Excel
      await window.electron.invoke('reportes:exportarTiquesExcel', sorteoId, selectedEstado || null);
      
      // Mostrar mensaje de éxito usando el diálogo
      showAlertDialog('Archivo Excel generado correctamente. Se ha guardado en la carpeta de descargas.');
      
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      setError('Error al exportar los tiques a Excel');
    }
  };

  // Para la función de diagnóstico
  const runDiagnostico = async () => {
    try {
      // Mostrar datos en consola
      console.log('Datos disponibles del sorteo:', sorteo);
      console.log('Participantes cargados:', participantes.length);
      
      // Verificar sorteo actual
      console.log('Datos del sorteo actual:', sorteo);
      
      // Verificar canales disponibles
      console.log('Objeto electron:', window.electron);
      
      // Mostrar mensaje de éxito usando el diálogo
      showAlertDialog('Verificación completada. Revisa la consola para más detalles.');
    } catch (error) {
      console.error('Error en diagnóstico:', error);
      showAlertDialog(`Error en diagnóstico: ${error.message}`, 'error');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
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
          onClick={cargarDatos} 
          sx={{ mt: 2 }}
        >
          Reintentar
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Gestión de Tiques
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/participantes')}
          sx={{ mr: 2 }}
        >
          Volver a Participantes
        </Button>
      </Box>
      
      {sorteo && (
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6">
                Sorteo: {sorteo.nombre}
              </Typography>
              <Typography variant="body1">
                Estado: <Chip 
                  label={sorteo.estado_actual} 
                  color={sorteo.estado_actual === 'programado' ? 'primary' : 'default'} 
                  size="small" 
                />
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body1">
                Fecha: {new Date(sorteo.fecha_sorteo).toLocaleString()}
              </Typography>
              <Typography variant="body1">
                Tipo: {sorteo.estado || 'Nacional'}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {/* Estadísticas de tiques */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" color="primary">
              {participantes.length}
            </Typography>
            <Typography variant="body2">
              Participantes totales
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" color="success.main">
              {participantes.filter(p => p.tique_asignado).length}
            </Typography>
            <Typography variant="body2">
              Con tique asignado
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" color="error.main">
              {participantes.filter(p => !p.tique_asignado).length}
            </Typography>
            <Typography variant="body2">
              Sin tique asignado
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Barra de herramientas */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              label="Buscar participante o tique"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
              }}
            />
          </Grid>
          
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="estado-select-label">Estado</InputLabel>
              <Select
                labelId="estado-select-label"
                id="estado-select"
                value={selectedEstado}
                label="Estado"
                onChange={(e) => setSelectedEstado(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {estados.map((estado) => (
                  <MenuItem key={estado} value={estado}>{estado}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} md={2}>
            <Button 
              variant="outlined" 
              startIcon={<FilterIcon />}
              onClick={() => setShowAsignados(!showAsignados)}
              color={showAsignados ? "primary" : "inherit"}
              fullWidth
            >
              {showAsignados ? "Con tique" : "Todos"}
            </Button>
          </Grid>
          
          <Grid item xs={6} md={2}>
            <Button 
              variant="contained" 
              startIcon={<CloudUploadIcon />}
              onClick={handleOpenImportDialog}
              fullWidth
            >
              Importar
            </Button>
          </Grid>
          
          <Grid item xs={6} md={2}>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<BadgeIcon />}
              onClick={asignarTiquesAutomaticamente}
              disabled={asignandoTiques || participantes.filter(p => !p.tique_asignado).length === 0}
              fullWidth
            >
              Asignar Tiques
            </Button>
          </Grid>
        </Grid>
        
        {/* Segunda fila de herramientas */}
        <Grid container spacing={2} alignItems="center" sx={{ mt: 1 }}>
          <Grid item xs={6} md={2}>
            <Button 
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={generarPDFTiques}
              fullWidth
            >
              Generar PDF
            </Button>
          </Grid>
          
          <Grid item xs={6} md={2}>
            <Button 
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={exportarTiquesExcel}
              fullWidth
            >
              Exportar Excel
            </Button>
          </Grid>
          
          <Grid item xs={6} md={2}>
            <Button 
              variant="contained"
              color="primary"
              startIcon={<DataArrayIcon />}
              onClick={() => {
                console.log('Botón GENERAR TIQUES clickeado');
                console.log('Estado del sorteo:', sorteoId, sorteo?.estado_actual);
                generarTiquesDesdeTabla();
              }}
              fullWidth
              sx={{
                fontWeight: 'bold',
                bgcolor: '#fc0457', // Color primario más destacado
                '&:hover': {
                  bgcolor: '#d0003f'
                },
                '&:focus': {
                  boxShadow: '0 0 0 3px rgba(252, 4, 87, 0.3)'
                }
              }}
            >
              Generar Tiques
            </Button>
          </Grid>
          
          {/* Botón de diagnóstico */}
          <Grid item xs={12} sx={{ mt: 1 }}>
            <Button 
              variant="outlined"
              color="info"
              size="small"
              onClick={runDiagnostico}
            >
              Diagnóstico de Conexión
            </Button>
          </Grid>
          
          <Grid item xs={12} md={6} sx={{ textAlign: 'right' }}>
            {filteredParticipantes.length !== participantes.length && (
              <Typography variant="body2">
                Mostrando {filteredParticipantes.length} de {participantes.length} participantes
                <Button size="small" onClick={resetFiltros} sx={{ ml: 1 }}>
                  Resetear filtros
                </Button>
              </Typography>
            )}
          </Grid>
        </Grid>
      </Paper>
      
      {/* Mostrar estadísticas de asignación si hay */}
      {asignacionStats && (
        <Alert 
          severity={asignacionStats.errores > 0 ? "error" : "success"}
          sx={{ mb: 3 }}
          onClose={() => setAsignacionStats(null)}
        >
          {asignacionStats.mensaje}
        </Alert>
      )}
      
      {/* Tabla de participantes con tiques */}
      {asignandoTiques ? (
        <Box display="flex" flexDirection="column" alignItems="center" py={4}>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Asignando tiques a los participantes...
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={1}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Documento</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Número Tique</TableCell>
                <TableCell>Código Tique</TableCell>
                <TableCell>Fecha Asignación</TableCell>
                <TableCell>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredParticipantes.length > 0 ? (
                filteredParticipantes.map((participante) => (
                  <TableRow key={participante.id}>
                    <TableCell>{participante.id}</TableCell>
                    <TableCell>{participante.documento_identidad}</TableCell>
                    <TableCell>{`${participante.nombre} ${participante.apellido}`}</TableCell>
                    <TableCell>{participante.estado}</TableCell>
                    <TableCell>{participante.numero_tique || '—'}</TableCell>
                    <TableCell>
                      {participante.codigo_tique ? (
                        <Chip 
                          label={participante.codigo_tique}
                          color="primary"
                          size="small"
                        />
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {participante.fecha_asignacion_tique 
                        ? new Date(participante.fecha_asignacion_tique).toLocaleString()
                        : '—'
                      }
                    </TableCell>
                    <TableCell>
                      {participante.tique_asignado ? (
                        <Chip 
                          icon={<CheckCircleIcon />} 
                          label="Asignado" 
                          color="success" 
                          size="small"
                        />
                      ) : (
                        <Chip 
                          icon={<ErrorIcon />} 
                          label="Pendiente" 
                          color="error" 
                          size="small"
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body1" py={2}>
                      No se encontraron participantes con los filtros aplicados
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Diálogo para importar participantes */}
      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Importar Participantes</DialogTitle>
        <DialogContent>
          <DialogContentText paragraph>
            Seleccione un archivo Excel o CSV con la lista de participantes para importar.
            El archivo debe contener las siguientes columnas: documento_identidad, nombre, apellido, telefono, email, estado.
          </DialogContentText>
          
          <Box sx={{ my: 3, textAlign: 'center' }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
            >
              Seleccionar Archivo
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                hidden
                onChange={handleFileChange}
              />
            </Button>
            
            {importFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Archivo seleccionado: {importFile.name}
              </Typography>
            )}
          </Box>
          
          {importProgress > 0 && (
            <Box sx={{ width: '100%', my: 2 }}>
              <Typography variant="body2" gutterBottom>
                Importando datos: {importProgress}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={importProgress} 
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
          )}
          
          {importStats && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>
                Resultado de la importación
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="body2">Total:</Typography>
                  <Typography variant="h6">{importStats.total}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2">Importados:</Typography>
                  <Typography variant="h6" color="success.main">{importStats.importados}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2">Errores:</Typography>
                  <Typography variant="h6" color="error.main">{importStats.errores}</Typography>
                </Grid>
              </Grid>
              
              {importStats.errores > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Detalles de errores:
                  </Typography>
                  <ul>
                    {importStats.erroresDetalle.map((error, index) => (
                      <li key={index}>
                        <Typography variant="body2" color="error">
                          {error}
                        </Typography>
                      </li>
                    ))}
                  </ul>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>
            Cerrar
          </Button>
          <Button 
            variant="contained" 
            onClick={importarParticipantes}
            disabled={!importFile || importProgress > 0}
            startIcon={<CloudUploadIcon />}
          >
            Importar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para mostrar resultados de generación de tiques */}
      <Dialog 
        open={dialogoTiquesOpen} 
        onClose={() => setDialogoTiquesOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>Generación de Tiques por Estado</DialogTitle>
        <DialogContent>
          {generandoTiques ? (
            <ProgresoGeneracionTiques 
              sorteoId={sorteoId} 
              onComplete={(data) => {
                setGenerandoTiques(false);
                setResultadoGeneracion(data);
              }}
            />
          ) : (
            resultadoGeneracion && (
              <Box sx={{ mt: 2 }}>
                {resultadoGeneracion.error ? (
                  <>
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {resultadoGeneracion.mensaje}
                    </Alert>
                    {resultadoGeneracion.errorInfo && (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Información adicional:
                        </Typography>
                        <Typography variant="body2">
                          {resultadoGeneracion.errorInfo}
                        </Typography>
                      </Alert>
                    )}
                  </>
                ) : (
                  <>
                    <Alert severity="success" sx={{ mb: 2 }}>
                      Tiques generados correctamente
                    </Alert>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="h6" gutterBottom>
                      Detalles:
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={4}>
                        <Typography variant="body2">Total generados:</Typography>
                        <Typography variant="h6">
                          {resultadoGeneracion.resultado?.total_tiques || 0}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={8}>
                        <Typography variant="body2">Archivo CSV:</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1" noWrap sx={{ maxWidth: '300px' }}>
                            {resultadoGeneracion.archivoSalida ? (
                              <Tooltip title={resultadoGeneracion.archivoSalida}>
                                <span>
                                  {resultadoGeneracion.archivoSalida.split('\\').pop().split('/').pop()}
                                </span>
                              </Tooltip>
                            ) : 'No disponible'}
                          </Typography>
                          {resultadoGeneracion.archivoSalida && (
                            <IconButton 
                              size="small" 
                              color="primary" 
                              sx={{ ml: 1 }}
                              onClick={() => {
                                // Copiar ruta al portapapeles
                                navigator.clipboard.writeText(resultadoGeneracion.archivoSalida);
                                showAlertDialog('Ruta copiada al portapapeles', 'success');
                              }}
                            >
                              <Tooltip title="Copiar ruta">
                                <ContentCopyIcon fontSize="small" />
                              </Tooltip>
                            </IconButton>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </>
                )}
              </Box>
            )
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoTiquesOpen(false)}>
            Cerrar
          </Button>
          {!generandoTiques && resultadoGeneracion && !resultadoGeneracion.error && resultadoGeneracion.archivoSalida && (
            <>
              <Button 
                variant="outlined"
                startIcon={<ContentCopyIcon />}
                onClick={() => {
                  navigator.clipboard.writeText(resultadoGeneracion.archivoSalida);
                  showAlertDialog('Ruta completa copiada al portapapeles', 'success');
                }}
              >
                Copiar Ruta
              </Button>
              <Button 
                variant="contained" 
                color="primary"
                startIcon={<DownloadIcon />}
                onClick={() => {
                  // Abrir el archivo o la carpeta que contiene el archivo
                  const dirPath = resultadoGeneracion.archivoSalida.substring(
                    0, 
                    resultadoGeneracion.archivoSalida.lastIndexOf('\\') + 1 || 
                    resultadoGeneracion.archivoSalida.lastIndexOf('/') + 1
                  );
                  window.electron.invoke('shell:openPath', dirPath);
                }}
              >
                Abrir Carpeta
              </Button>
            </>
          )}
          {!generandoTiques && resultadoGeneracion && resultadoGeneracion.error && (
            <Button 
              variant="contained" 
              color="primary"
              onClick={generarTiquesDesdeTabla}
            >
              Intentar Nuevamente
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Diálogo de alerta para reemplazar los alert() */}
      <Dialog
        open={alertDialog.open}
        onClose={() => setAlertDialog({ ...alertDialog, open: false })}
      >
        <DialogTitle>
          {alertDialog.severity === 'error' ? 'Error' : 'Información'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {alertDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setAlertDialog({ ...alertDialog, open: false })} 
            color="primary" 
            autoFocus
          >
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GestionTiques; 