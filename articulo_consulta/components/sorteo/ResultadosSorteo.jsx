import { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Divider,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Collapse,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  EmojiEvents as TrophyIcon,
  Person as PersonIcon,
  Celebration as CelebrationIcon,
  Share as ShareIcon,
  FileCopy as CopyIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

const ResultadosSorteo = ({ sorteo, resultados, onGenerarSorteo }) => {
  const [mostrandoAnimacion, setMostrandoAnimacion] = useState(false);
  const [resultadosMostrados, setResultadosMostrados] = useState([]);
  const [indiceActual, setIndiceActual] = useState(0);
  const [expandido, setExpandido] = useState(false);
  const [compartirDialogo, setCompartirDialogo] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // Efectos para animaciones
  useEffect(() => {
    if (resultados && resultados.length > 0 && !mostrandoAnimacion) {
      iniciarAnimacion();
    }
  }, [resultados]);

  const iniciarAnimacion = () => {
    setMostrandoAnimacion(true);
    setResultadosMostrados([]);
    setIndiceActual(0);
    
    // Lanzar confetti
    lanzarConfetti();
    
    // Iniciar revelación secuencial de ganadores
    mostrarSiguienteGanador();
  };
  
  const mostrarSiguienteGanador = () => {
    if (indiceActual < resultados.length) {
      // Agregar el siguiente ganador a los mostrados
      setResultadosMostrados(prev => [...prev, resultados[indiceActual]]);
      
      // Incrementar índice para el próximo
      setIndiceActual(indiceActual + 1);
      
      // Si hay más, programar el siguiente después de un retraso
      if (indiceActual + 1 < resultados.length) {
        setTimeout(mostrarSiguienteGanador, 1500);
      } else {
        // Animación completa
        setTimeout(() => {
          lanzarConfetti();
        }, 500);
      }
    }
  };
  
  const lanzarConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });
  };
  
  const handleCompartir = () => {
    setCompartirDialogo(true);
  };
  
  const copiarResultados = () => {
    const texto = `Resultados del sorteo: ${sorteo.nombre}\n\n` + 
      resultados.map((resultado, idx) => 
        `${idx+1}. Premio: ${resultado.premio.nombre} - Ganador: ${resultado.ganador.nombre}`
      ).join('\n');
    
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  };
  
  // Si no hay resultados o sorteo finalizado, mostrar mensaje
  if (!sorteo || !resultados || resultados.length === 0) {
    return (
      <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
        <Box sx={{ mb: 2 }}>
          <TrophyIcon fontSize="large" color="primary" />
          <Typography variant="h5" component="h2" gutterBottom>
            Este sorteo aún no tiene resultados
          </Typography>
          
          {sorteo && sorteo.estado_actual === 'en_progreso' && onGenerarSorteo && (
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<CelebrationIcon />}
              onClick={onGenerarSorteo}
              sx={{ mt: 2 }}
            >
              Realizar Sorteo Ahora
            </Button>
          )}
          
          {sorteo && ['borrador', 'programado'].includes(sorteo.estado_actual) && (
            <Alert severity="info" sx={{ mt: 2 }}>
              El sorteo debe estar en progreso para generar resultados
            </Alert>
          )}
        </Box>
      </Paper>
    );
  }
  
  return (
    <Box sx={{ mb: 4 }}>
      <Paper 
        sx={{ 
          p: 3, 
          mb: 3, 
          textAlign: 'center',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)'
        }}
      >
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <TrophyIcon fontSize="large" color="primary" sx={{ mr: 1 }} />
          <Typography variant="h4" component="h1">
            Resultados del Sorteo
          </Typography>
        </Box>
        
        <Typography variant="h6" gutterBottom>
          {sorteo.nombre}
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Chip 
            icon={<CelebrationIcon />} 
            label={`Sorteo ${sorteo.estado_actual.replace('_', ' ')}`} 
            color="primary" 
          />
        </Box>
        
        <Box sx={{ textAlign: 'right', mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ShareIcon />}
            onClick={handleCompartir}
            size="small"
          >
            Compartir Resultados
          </Button>
        </Box>
      </Paper>
      
      <Grid container spacing={3}>
        {resultadosMostrados.map((resultado, index) => (
          <Grid item xs={12} md={6} key={resultado.premio.id}>
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  height: '100%',
                  borderRadius: '16px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
                  overflow: 'hidden',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 15px 30px rgba(0, 0, 0, 0.1)'
                  },
                  position: 'relative',
                  overflow: 'visible',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: -15,
                    left: 20,
                    width: 30,
                    height: 30,
                    backgroundColor: 'var(--primary)',  // Usar color primario
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    zIndex: 1,
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                  }
                }}
              >
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    top: -20, 
                    left: 15, 
                    width: 40, 
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? '#cd7f32' : 'primary.main',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: 2,
                    zIndex: 1
                  }}
                >
                  <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold' }}>
                    {index + 1}
                  </Typography>
                </Box>
                
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    {resultado.premio.nombre}
                  </Typography>
                  
                  <Divider sx={{ my: 1.5 }} />
                  
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    bgcolor: 'background.paper', 
                    p: 1.5, 
                    borderRadius: 1,
                    border: '1px dashed',
                    borderColor: 'primary.main'
                  }}>
                    <PersonIcon color="primary" sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {resultado.ganador.nombre}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {resultado.ganador.email || resultado.ganador.telefono || 'Sin contacto'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Collapse in={expandido}>
                    <Box sx={{ mt: 2 }}>
                      {resultado.premio.descripcion && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {resultado.premio.descripcion}
                        </Typography>
                      )}
                      
                      {resultado.premio.valor && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Valor:</strong> ${resultado.premio.valor}
                        </Typography>
                      )}
                      
                      {resultado.premio.fecha_entrega && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Fecha de entrega:</strong> {new Date(resultado.premio.fecha_entrega).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                  </Collapse>
                </CardContent>
                
                <Box sx={{ 
                  mt: 'auto', 
                  p: 1, 
                  textAlign: 'center', 
                  borderTop: '1px solid', 
                  borderColor: 'divider'
                }}>
                  <IconButton 
                    onClick={() => setExpandido(!expandido)}
                    size="small"
                  >
                    {expandido ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
      
      {/* Diálogo para compartir */}
      <Dialog open={compartirDialogo} onClose={() => setCompartirDialogo(false)}>
        <DialogTitle>Compartir Resultados</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Resultados del sorteo: {sorteo.nombre}
            </Typography>
            
            <Box sx={{ mt: 2, mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
              {resultados.map((resultado, idx) => (
                <Typography key={idx} variant="body2" gutterBottom>
                  {idx+1}. <strong>Premio:</strong> {resultado.premio.nombre} - <strong>Ganador:</strong> {resultado.ganador.nombre}
                </Typography>
              ))}
            </Box>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<CopyIcon />}
            onClick={copiarResultados}
            fullWidth
          >
            {copiado ? 'Copiado!' : 'Copiar al portapapeles'}
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompartirDialogo(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResultadosSorteo;