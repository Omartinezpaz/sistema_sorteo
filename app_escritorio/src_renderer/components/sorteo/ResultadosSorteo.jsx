import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid,
  Card,
  CardContent,
  CardMedia,
  Avatar,
  CircularProgress,
  Chip,
  Button,
  Divider
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const ResultadosSorteo = ({ sorteoId, onExportarResultados }) => {
  const theme = useTheme();
  const [sorteo, setSorteo] = useState(null);
  const [ganadores, setGanadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mostrando, setMostrando] = useState(false);
  const [ganadorDestacado, setGanadorDestacado] = useState(null);
  const [exportado, setExportado] = useState(false);

  // Cargar datos del sorteo y sus ganadores
  useEffect(() => {
    const cargarDatos = async () => {
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
        
        // Obtener ganadores
        const ganadoresData = await window.electronAPI.dbQuery(
          `SELECT g.*, p.nombre AS nombre_premio, pa.nombre AS nombre_participante, 
            pa.apellido AS apellido_participante, pa.documento_identidad,
            pa.estado AS estado_participante
          FROM ganadores g
          JOIN premios p ON g.premio_id = p.id
          JOIN participantes pa ON g.participante_id = pa.id
          WHERE g.sorteo_id = $1
          ORDER BY g.fecha_sorteo`,
          [sorteoId]
        );
        
        setGanadores(ganadoresData || []);
        
        // Mostrar secuencialmente los ganadores con efecto de animación
        if (ganadoresData && ganadoresData.length > 0) {
          setMostrando(true);
          
          // Mostrar primer ganador como destacado después de cargar
          setTimeout(() => {
            setGanadorDestacado(ganadoresData[0]);
          }, 500);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar resultados del sorteo:', error);
        setError(`Error al cargar resultados: ${error.message}`);
        setLoading(false);
      }
    };
    
    cargarDatos();
  }, [sorteoId]);

  // Manejar exportación de resultados
  const handleExportar = () => {
    // Mostrar notificación de exportación
    setExportado(true);
    
    // Llamar al callback proporcionado si existe
    if (onExportarResultados) {
      onExportarResultados(sorteoId, ganadores);
    }
    
    // Ocultar notificación después de 3 segundos
    setTimeout(() => {
      setExportado(false);
    }, 3000);
  };

  // Mostrar otro ganador destacado
  const mostrarOtroGanador = (ganador) => {
    setGanadorDestacado(ganador);
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ animation: mostrando ? 'fadeIn 1s ease-in' : 'none' }}>
      {/* Notificación de exportación */}
      {exportado && (
        <Box 
          sx={{ 
            position: 'fixed', 
            top: 20, 
            right: 20, 
            zIndex: 9999,
            bgcolor: 'success.light',
            color: 'white',
            p: 2,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <CheckCircleIcon />
          <Typography>Resultados exportados en formato excel</Typography>
        </Box>
      )}
    
      {/* Encabezado */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          textAlign: 'center',
          bgcolor: theme.palette.primary.light,
          color: theme.palette.primary.contrastText,
          mb: 4
        }}
      >
        <Typography variant="h4" gutterBottom>¡FELICIDADES A TODOS LOS GANADORES!</Typography>
        <Typography variant="h5">🎊 Pueblo Valiente 🎊</Typography>
        <Typography variant="subtitle1" gutterBottom>
          Sorteo realizado el {new Date(sorteo?.fecha_sorteo).toLocaleDateString()}, 
          {new Date(sorteo?.fecha_sorteo).toLocaleTimeString()}
        </Typography>
        
        <Button 
          variant="contained" 
          color="secondary"
          onClick={handleExportar}
          sx={{ mt: 2 }}
        >
          Exportar Resultados
        </Button>
      </Paper>
      
      {/* Ganador destacado */}
      {ganadorDestacado && (
        <Card 
          elevation={5} 
          sx={{ 
            mb: 4,
            overflow: 'hidden',
            border: `2px solid ${theme.palette.secondary.main}`,
            borderRadius: 2,
            animation: 'pulse 2s infinite'
          }}
        >
          <Box 
            sx={{ 
              bgcolor: theme.palette.secondary.main, 
              color: theme.palette.secondary.contrastText,
              p: 2,
              textAlign: 'center'
            }}
          >
            <Typography variant="h5">
              <EmojiEventsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              ¡GANADOR DESTACADO!
            </Typography>
          </Box>
          
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={3} sx={{ textAlign: 'center' }}>
                <Avatar 
                  sx={{ 
                    width: 120, 
                    height: 120, 
                    bgcolor: theme.palette.primary.main,
                    margin: '0 auto',
                    fontSize: '3rem'
                  }}
                >
                  {(ganadorDestacado.nombre_participante || 'P').charAt(0)}
                </Avatar>
              </Grid>
              
              <Grid item xs={12} md={9}>
                <Typography variant="h5" gutterBottom>
                  Participante {ganadorDestacado.participante_id}
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="textSecondary">Estado:</Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body1">
                      {ganadorDestacado.estado_participante || 'Nacional'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="textSecondary">CI:</Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body1">
                      {ganadorDestacado.documento_identidad || '-'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="h6" color="primary" gutterBottom>
                      Premio: {ganadorDestacado.nombre_premio}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Categoría: {ganadorDestacado.categoria || 'Principal'}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
      
      {/* Lista de todos los ganadores */}
      <Typography variant="h5" gutterBottom align="center" sx={{ mt: 4, mb: 3 }}>
        Nuestros Ganadores
        <Divider sx={{ mt: 1 }} />
      </Typography>
      
      <Grid container spacing={3}>
        {ganadores.map((ganador, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
            <Card 
              elevation={2} 
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.03)',
                  boxShadow: 6
                }
              }}
              onClick={() => mostrarOtroGanador(ganador)}
            >
              <Box sx={{ position: 'relative' }}>
                <Box 
                  sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    zIndex: 1,
                    color: 'white'
                  }}
                >
                  <EmojiEventsIcon color="secondary" />
                </Box>
              </Box>
              
              <CardContent>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  noWrap 
                  title={`Participante ${ganador.participante_id}`}
                >
                  Participante {ganador.participante_id}
                </Typography>
                
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {ganador.estado_participante || 'Nacional'} - CI: {ganador.documento_identidad || '-'}
                </Typography>
                
                <Divider sx={{ my: 1 }} />
                
                <Typography 
                  variant="body1" 
                  color="primary"
                  sx={{ 
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {ganador.nombre_premio}
                </Typography>
                
                <Typography variant="body2" color="textSecondary">
                  Categoría: {ganador.categoria || 'Principal'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* CSS para animaciones */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 64, 129, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(255, 64, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 64, 129, 0); }
        }
      `}</style>
    </Box>
  );
};

export default ResultadosSorteo; 