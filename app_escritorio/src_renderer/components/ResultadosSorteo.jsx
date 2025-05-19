import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Chip,
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Grid,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import PrintIcon from '@mui/icons-material/Print';

// Función para enmascarar el documento de identidad
const enmascararDocumento = (documento) => {
  if (!documento) return '—';
  // Si el documento tiene formato V-12345678, enmascaramos solo los números
  if (documento.includes('-')) {
    const partes = documento.split('-');
    return `${partes[0]}-****${partes[1].substring(partes[1].length - 2)}`;
  }
  // Si es solo números, enmascaramos la mayoría
  return `****${documento.substring(documento.length - 2)}`;
};

// Función para enmascarar el nombre
const enmascararNombre = (nombre, apellido) => {
  if (!nombre) return '—';
  // Mostrar solo iniciales o primeras letras
  const inicial = nombre.charAt(0);
  const inicialApellido = apellido ? apellido.charAt(0) : '';
  return inicialApellido ? `${inicial}.${inicialApellido}.` : `${inicial}.**`;
};

const ResultadosSorteo = ({ sorteoId, onClose }) => {
  const [sorteo, setSorteo] = useState(null);
  const [ganadores, setGanadores] = useState([]);
  const [premios, setPremios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [estadisticas, setEstadisticas] = useState({
    totalParticipantes: 0,
    totalGanadores: 0,
    distribucionPorEstado: []
  });

  // Cargar datos del sorteo y ganadores
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Obtener información del sorteo
        const sorteoData = await window.electronAPI.dbQuery(
          'SELECT * FROM sorteos WHERE id = $1',
          [sorteoId]
        );
        
        if (!sorteoData || sorteoData.length === 0) {
          throw new Error('No se encontró el sorteo especificado');
        }
        
        setSorteo(sorteoData[0]);
        
        // Obtener premios del sorteo
        const premiosData = await window.electronAPI.dbQuery(
          'SELECT * FROM premios WHERE sorteo_id = $1 ORDER BY orden DESC',
          [sorteoId]
        );
        setPremios(premiosData || []);
        
        // Obtener ganadores
        const ganadoresData = await window.electronAPI.dbQuery(
          `SELECT g.*, p.nombre, p.apellido, p.documento_identidad, p.telefono, p.email, p.estado
           FROM ganadores g
           LEFT JOIN participantes p ON g.participante_id = p.id
           WHERE g.sorteo_id = $1
           ORDER BY g.premio_id, g.estado`,
          [sorteoId]
        );
        setGanadores(ganadoresData || []);
        
        // Obtener estadísticas
        const estadisticasParticipantes = await window.electronAPI.dbQuery(
          `SELECT COUNT(*) as total FROM participantes WHERE sorteo_id = $1 AND validado = true`,
          [sorteoId]
        );
        
        const distribucionEstados = await window.electronAPI.dbQuery(
          `SELECT estado, COUNT(*) as cantidad 
           FROM participantes 
           WHERE sorteo_id = $1 AND validado = true
           GROUP BY estado
           ORDER BY COUNT(*) DESC`,
          [sorteoId]
        );
        
        setEstadisticas({
          totalParticipantes: estadisticasParticipantes[0]?.total || 0,
          totalGanadores: ganadoresData?.length || 0,
          distribucionPorEstado: distribucionEstados || []
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setError(`Error al cargar datos: ${error.message}`);
        setLoading(false);
      }
    };
    
    loadData();
  }, [sorteoId]);

  // Exportar resultados a CSV
  const exportarResultados = () => {
    if (!ganadores || ganadores.length === 0) return;
    
    // Preparar encabezados y datos
    const headers = ['Premio', 'Estado', 'Tique Ganador', 'Fecha'];
    
    const data = ganadores.map(ganador => {
      const premio = premios.find(p => p.id === ganador.premio_id);
      return [
        premio?.nombre || 'Premio desconocido',
        ganador.estado || 'Nacional',
        ganador.numero_ganador || '',
        new Date(ganador.fecha_sorteo).toLocaleString()
      ];
    });
    
    // Crear contenido CSV
    const csvContent = [
      headers.join(','),
      ...data.map(row => row.join(','))
    ].join('\n');
    
    // Crear y descargar el archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `resultados_sorteo_${sorteoId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Imprimir resultados
  const imprimirResultados = () => {
    window.print();
  };

  // Renderizar loading
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Renderizar error
  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box className="print-section">
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Resultados del Sorteo
        </Typography>
        
        <Typography variant="h6" align="center" gutterBottom>
          {sorteo?.nombre}
        </Typography>
        
        <Typography variant="subtitle1" align="center" gutterBottom>
          Fecha: {new Date(sorteo?.fecha_sorteo).toLocaleDateString()}
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="subtitle1">Total Participantes</Typography>
              <Typography variant="h4" color="primary">{estadisticas.totalParticipantes}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="subtitle1">Total Ganadores</Typography>
              <Typography variant="h4" color="success.main">{estadisticas.totalGanadores}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="subtitle1">Total Premios</Typography>
              <Typography variant="h4" color="secondary">{premios.length}</Typography>
            </Paper>
          </Grid>
        </Grid>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Ganadores por Premio
          </Typography>
          
          {premios.map((premio) => {
            // Filtrar ganadores por premio
            const ganadoresPremio = ganadores.filter(g => g.premio_id === premio.id);
            
            if (ganadoresPremio.length === 0) return null;
            
            return (
              <Box key={premio.id} sx={{ mb: 3 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" color="primary" gutterBottom>
                    {premio.nombre}
                  </Typography>
                  
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Estado</TableCell>
                          <TableCell>Tique Ganador</TableCell>
                          <TableCell>ID Protegido</TableCell>
                          <TableCell>Hora del Sorteo</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {ganadoresPremio.map((ganador) => (
                          <TableRow key={ganador.id}>
                            <TableCell>{ganador.estado || 'Nacional'}</TableCell>
                            <TableCell>
                              <Chip 
                                label={ganador.numero_ganador} 
                                color="primary" 
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>{enmascararDocumento(ganador.documento_identidad)}</TableCell>
                            <TableCell>
                              {new Date(ganador.fecha_sorteo).toLocaleTimeString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Box>
            );
          })}
        </Box>
        
        {ganadores.length === 0 && (
          <Alert severity="info" sx={{ my: 2 }}>
            No hay ganadores registrados para este sorteo.
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            variant="outlined"
            onClick={onClose}
          >
            Volver
          </Button>
          
          <Box>
            <Button
              variant="contained"
              startIcon={<SaveAltIcon />}
              onClick={exportarResultados}
              disabled={ganadores.length === 0}
              sx={{ mr: 1 }}
            >
              Exportar
            </Button>
            
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={imprimirResultados}
              disabled={ganadores.length === 0}
            >
              Imprimir
            </Button>
          </Box>
        </Box>
      </Paper>
      
      {/* Sección para estadísticas detalladas - solo visible en pantalla, no en impresión */}
      <Paper elevation={3} sx={{ p: 3, mb: 4, '@media print': { display: 'none' } }}>
        <Typography variant="h6" gutterBottom>
          Estadísticas de Participación
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Distribución por Estado
            </Typography>
            
            {estadisticas.distribucionPorEstado.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Estado</TableCell>
                      <TableCell align="right">Participantes</TableCell>
                      <TableCell align="right">%</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {estadisticas.distribucionPorEstado.map((item) => (
                      <TableRow key={item.estado}>
                        <TableCell>{item.estado}</TableCell>
                        <TableCell align="right">{item.cantidad}</TableCell>
                        <TableCell align="right">
                          {((item.cantidad / estadisticas.totalParticipantes) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">No hay datos de distribución disponibles.</Alert>
            )}
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Información del Sorteo
            </Typography>
            
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="body2">
                <strong>ID del Sorteo:</strong> {sorteo?.id}
              </Typography>
              <Typography variant="body2">
                <strong>Tipo:</strong> {sorteo?.tipo_sorteo || 'No especificado'}
              </Typography>
              <Typography variant="body2">
                <strong>Estado:</strong> {sorteo?.estado_actual || 'No especificado'}
              </Typography>
              <Typography variant="body2">
                <strong>Fecha Creación:</strong> {new Date(sorteo?.fecha_creacion).toLocaleString()}
              </Typography>
              <Typography variant="body2">
                <strong>Fecha Realización:</strong> {new Date(sorteo?.fecha_sorteo).toLocaleString()}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Pie de página para impresión */}
      <Box sx={{ mt: 4, display: 'none', '@media print': { display: 'block' } }}>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body2" align="center">
          © {new Date().getFullYear()} Sistema de Sorteos Pueblo Valiente
        </Typography>
        <Typography variant="caption" align="center" display="block">
          Este documento es confidencial y solo debe ser utilizado para propósitos oficiales.
          La información personal de los ganadores ha sido protegida por motivos de seguridad.
        </Typography>
      </Box>
    </Box>
  );
};

export default ResultadosSorteo; 