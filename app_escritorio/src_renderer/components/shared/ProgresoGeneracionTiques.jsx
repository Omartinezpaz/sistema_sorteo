import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  LinearProgress,
  Card, 
  CardContent, 
  Divider,
  List,
  ListItem,
  ListItemText,
  Button
} from '@mui/material';
import { verificarGeneracionCompleta } from '../../utils/verificarGeneracionTiques';

/**
 * Componente para mostrar el progreso de generación de tiques
 * 
 * @param {Object} props
 * @param {number} props.sorteoId - ID del sorteo
 * @param {function} props.onComplete - Función a ejecutar cuando se complete la generación
 */
const ProgresoGeneracionTiques = ({ sorteoId, onComplete }) => {
  const [progreso, setProgreso] = useState(null);
  const [estado, setEstado] = useState('esperando'); // esperando, en_progreso, completado, error
  const [error, setError] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState(0);
  const [estadoVerificacion, setEstadoVerificacion] = useState(null);
  
  // Efecto para verificar el estado periódicamente
  useEffect(() => {
    let verificacionInterval;
    
    const verificarEstado = async () => {
      try {
        if (sorteoId) {
          const verificacion = await verificarGeneracionCompleta(sorteoId);
          setEstadoVerificacion(verificacion);
          
          // Si detectamos que la generación está completa pero el estado no se ha actualizado
          if (verificacion.estado === 'COMPLETADO' && estado === 'en_progreso') {
            setEstado('completado');
            if (onComplete) {
              onComplete({
                sorteoId,
                resultado: {
                  total_tiques: verificacion.detalles.tiques.total,
                  tiques_por_estado: JSON.stringify(verificacion.detalles.tiques.porEstado),
                  mensaje: verificacion.mensaje
                }
              });
            }
          }
        }
      } catch (error) {
        console.error('Error al verificar estado:', error);
      }
    };
    
    if (estado === 'en_progreso') {
      verificarEstado(); // Verificar inmediatamente
      verificacionInterval = setInterval(verificarEstado, 5000); // Verificar cada 5 segundos
    }
    
    return () => {
      if (verificacionInterval) {
        clearInterval(verificacionInterval);
      }
    };
  }, [sorteoId, estado, onComplete]);
  
  // Efecto para el contador de tiempo
  useEffect(() => {
    let intervalId;
    
    if (estado === 'en_progreso' || estado === 'esperando') {
      intervalId = setInterval(() => {
        setTiempoTranscurrido(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [estado]);
  
  useEffect(() => {
    // Registrar listeners para recibir actualizaciones de progreso
    const onInicio = (_, data) => {
      // Verificar que data existe antes de acceder a sorteoId
      if (data && sorteoId && data.sorteoId === sorteoId) {
        setEstado('en_progreso');
        setTiempoTranscurrido(0);
        setProgreso({
          generados: 0,
          total_a_generar: 0,
          porcentaje: 0,
          estado_actual: 'Iniciando...',
          estados_procesados: 0,
          total_estados: 0
        });
      }
    };
    
    const onProgreso = (_, data) => {
      if (data && sorteoId && data.sorteoId === sorteoId) {
        setEstado('en_progreso');
        setProgreso(data.progreso);
      }
    };
    
    const onCompletado = (_, data) => {
      if (data && sorteoId && data.sorteoId === sorteoId) {
        setEstado('completado');
        setResultado(data.resultado);
        
        // Notificar al componente padre
        if (onComplete) {
          onComplete(data);
        }
      }
    };
    
    const onError = (_, data) => {
      if (data && sorteoId && data.sorteoId === sorteoId) {
        setEstado('error');
        setError(data.error);
      }
    };
    
    // Solo registrar escuchas si tenemos un sorteoId
    if (sorteoId) {
      // Registrar escuchas
      const removeInicio = window.electron.on('generacion-tiques:inicio', onInicio);
      const removeProgreso = window.electron.on('generacion-tiques:progreso', onProgreso);
      const removeCompletado = window.electron.on('generacion-tiques:completado', onCompletado);
      const removeError = window.electron.on('generacion-tiques:error', onError);
      
      // Limpiar escuchas al desmontar
      return () => {
        removeInicio();
        removeProgreso();
        removeCompletado();
        removeError();
      };
    }
  }, [sorteoId, onComplete]);
  
  const formatTiempo = (segundos) => {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  };
  
  const renderEstadoEspera = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
      <CircularProgress size={40} />
      <Typography variant="body1" sx={{ mt: 2 }}>
        Preparando la generación de tiques...
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Tiempo transcurrido: {formatTiempo(tiempoTranscurrido)}
      </Typography>
      {estadoVerificacion && (
        <Typography variant="body2" color="info.main" sx={{ mt: 1 }}>
          {estadoVerificacion.mensaje}
        </Typography>
      )}
    </Box>
  );
  
  const renderEstadoEnProgreso = () => {
    if (!progreso) return renderEstadoEspera();
    
    const porcentajeRedondeado = Math.round(progreso.porcentaje * 10) / 10;
    
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Generando tiques para el sorteo
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {progreso.generados} de {progreso.total_a_generar} tiques generados ({porcentajeRedondeado}%)
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={porcentajeRedondeado} 
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="body2">
            Estado actual: <strong>{progreso.estado_actual}</strong>
          </Typography>
          <Typography variant="body2">
            Estados: {progreso.estados_procesados} de {progreso.total_estados}
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
          Tiempo transcurrido: {formatTiempo(tiempoTranscurrido)}
        </Typography>
        
        {estadoVerificacion && estadoVerificacion.estado !== 'EN_PROGRESO' && (
          <Typography variant="body2" color="warning.main" sx={{ mt: 2, textAlign: 'center' }}>
            {estadoVerificacion.mensaje}
          </Typography>
        )}
      </Box>
    );
  };
  
  const renderEstadoCompletado = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" color="success.main" sx={{ mb: 2 }}>
        ¡Generación completada!
      </Typography>
      
      {resultado && (
        <>
          <Typography variant="body1" gutterBottom>
            {resultado.mensaje}
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="body2" gutterBottom>
            Total de tiques generados: <strong>{resultado.total_tiques}</strong>
          </Typography>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Tiempo total: {formatTiempo(tiempoTranscurrido)}
          </Typography>
          
          {resultado.tiques_por_estado && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Distribución por estado:
              </Typography>
              <List dense>
                {Object.entries(JSON.parse(resultado.tiques_por_estado)).map(([codEstado, cantidad]) => (
                  <ListItem key={codEstado}>
                    <ListItemText 
                      primary={`Estado ${codEstado}: ${cantidad} tiques`} 
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </>
      )}
      
      {estadoVerificacion && estadoVerificacion.estado !== 'COMPLETADO' && (
        <Typography variant="body2" color="warning.main" sx={{ mt: 2 }}>
          Advertencia: {estadoVerificacion.mensaje}
        </Typography>
      )}
    </Box>
  );
  
  const renderEstadoError = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" color="error.main" sx={{ mb: 2 }}>
        Error en la generación
      </Typography>
      
      <Typography variant="body1" gutterBottom>
        {error || 'Ocurrió un error durante la generación de tiques.'}
      </Typography>
      
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Tiempo transcurrido: {formatTiempo(tiempoTranscurrido)}
      </Typography>
      
      {estadoVerificacion && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="info.main" gutterBottom>
            Estado actual: {estadoVerificacion.mensaje}
          </Typography>
          <Button 
            variant="outlined" 
            color="primary" 
            size="small"
            onClick={() => window.location.reload()}
            sx={{ mt: 1 }}
          >
            Reintentar
          </Button>
        </Box>
      )}
    </Box>
  );
  
  const renderContenido = () => {
    switch (estado) {
      case 'esperando':
        return renderEstadoEspera();
      case 'en_progreso':
        return renderEstadoEnProgreso();
      case 'completado':
        return renderEstadoCompletado();
      case 'error':
        return renderEstadoError();
      default:
        return renderEstadoEspera();
    }
  };
  
  return (
    <Card variant="outlined" sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
      <CardContent>
        {renderContenido()}
      </CardContent>
    </Card>
  );
};

export default ProgresoGeneracionTiques; 