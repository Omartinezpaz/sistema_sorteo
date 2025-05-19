import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  CircularProgress,
  Grid,
  Chip,
  Divider,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions
} from '@mui/material';
import FlipNumbers from 'react-flip-numbers'; // Necesitamos agregar esta dependencia

const IniciarSorteo = ({ sorteoId, onComplete }) => {
  // Estados
  const [sorteo, setSorteo] = useState(null);
  const [premios, setPremios] = useState([]);
  const [participantes, setParticipantes] = useState([]);
  const [ganadores, setGanadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [premioActual, setPremioActual] = useState(null);
  const [ganadorActual, setGanadorActual] = useState(null);
  const [currentEstado, setCurrentEstado] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sorteoFinalizado, setSorteoFinalizado] = useState(false);
  const [vueltasCompletas, setVueltasCompletas] = useState(0);
  
  // Referencias
  const timerRef = useRef(null);
  const numeroRef = useRef(null);

  // Cargar datos iniciales
  useEffect(() => {
    if (sorteoId) {
      loadSorteoData();
    }
  }, [sorteoId]);

  // Cargar los datos del sorteo y sus recursos
  const loadSorteoData = async () => {
    try {
      setLoading(true);
      
      // Obtener datos del sorteo
      const sorteoData = await window.electron.invoke('sorteos:getSorteoById', sorteoId);
      setSorteo(sorteoData);
      
      // Cargar premios con la nueva función que también considera el metadata
      await cargarPremios();
      
      // Obtener participantes válidos
      const participantesData = await window.electron.invoke('participantes:getParticipantesBySorteo', sorteoId, true);
      setParticipantes(participantesData);
      
      // Obtener ganadores (si existen)
      const ganadores = await window.electron.invoke('ganadores:getGanadoresBySorteo', sorteoId);
      
      // Verificar y normalizar ganadores antes de establecerlos en el estado
      if (ganadores && Array.isArray(ganadores)) {
        const ganadoresNormalizados = ganadores.map(ganador => {
          // Verificar si el estado es un objeto en lugar de un string (caso de estado vs parroquia)
          if (ganador.estado && typeof ganador.estado === 'object') {
            console.warn('Detectado estado como objeto en lugar de string:', ganador.estado);
            // Transformar el objeto en un formato compatible
            return {
              ...ganador,
              estado: ganador.estado.nombre || ganador.estado.nom_estado || 'Estado sin nombre'
            };
          }
          return ganador;
        });
        setGanadores(ganadoresNormalizados);
      } else {
        setGanadores(ganadores || []);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar los datos del sorteo:', error);
      setError('Error al cargar los datos del sorteo');
      setLoading(false);
    }
  };

  // Cargar los premios del sorteo
  const cargarPremios = async () => {
    try {
      // Si no hay un sorteo seleccionado, no hacer nada
      if (!sorteoId) return;
      
      // Intentar cargar los premios desde la tabla premios
      const result = await window.electron.invoke('premios:getPremiosBySorteo', sorteoId);
      
      if (result && result.length > 0) {
        setPremios(result);
        setLoading(false);
        return;
      }
      
      // Si no hay premios en la tabla, intentar cargarlos desde el metadata del sorteo
      if (sorteo && sorteo.metadata) {
        try {
          const metadata = sorteo.metadata;
          
          if (metadata.premiosNacionales && metadata.premiosNacionales.length > 0) {
            // Mapear premios del metadata al formato esperado
            const premiosFromMetadata = metadata.premiosNacionales.map(premio => ({
              id: `temp-${Math.random().toString(36).substr(2, 9)}`,
              sorteo_id: sorteoId,
              nombre: premio.nombre,
              descripcion: premio.descripcion,
              valor: parseFloat(premio.valor) || 0,
              orden: parseInt(premio.orden) || 0,
              categoria_id: obtenerCategoriaId(premio.categoria),
              ambito: 'nacional',
              estado: 'pendiente',
              temp_desde_metadata: true
            }));
            
            setPremios(premiosFromMetadata);
            console.log("Premios cargados desde metadata:", premiosFromMetadata);
          }
        } catch (metadataError) {
          console.error("Error al procesar metadata:", metadataError);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar los premios:', error);
      setError('Error al cargar los premios del sorteo');
      setLoading(false);
    }
  };
  
  // Función auxiliar para mapear categoría de texto a ID
  const obtenerCategoriaId = (categoria) => {
    switch (categoria && categoria.toLowerCase()) {
      case 'principal': return 1;
      case 'secundario': return 2;
      case 'especial': return 3;
      default: return 1;
    }
  };

  // Cambiar estado del sorteo
  const actualizarEstadoSorteo = async (nuevoEstado) => {
    try {
      const response = await window.electron.invoke('db-query',
        'UPDATE sorteos SET estado_actual = $1 WHERE id = $2 RETURNING *',
        [nuevoEstado, sorteoId]
      );
      
      if (response && response.length > 0) {
        setSorteo({...sorteo, estado_actual: nuevoEstado});
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error al actualizar estado del sorteo:', error);
      setError(`Error al actualizar estado: ${error.message}`);
      return false;
    }
  };

  // Iniciar sorteo
  const iniciarSorteo = async () => {
    // Verificar si hay premios y participantes
    if (!premios || premios.length === 0) {
      // Si no hay premios en la tabla pero hay en el metadata, insertarlos primero
      if (sorteo && sorteo.metadata && sorteo.metadata.premiosNacionales && sorteo.metadata.premiosNacionales.length > 0) {
        try {
          const metadataPremios = sorteo.metadata.premiosNacionales;
          console.log("Insertando premios desde metadata antes de iniciar sorteo:", metadataPremios);
          
          // Insertar cada premio desde el metadata
          for (const premio of metadataPremios) {
            await window.electron.invoke('premios:createPremio', {
              sorteo_id: sorteoId,
              nombre: premio.nombre,
              descripcion: premio.descripcion,
              valor: parseFloat(premio.valor) || 0,
              orden: parseInt(premio.orden) || 0,
              categoria_id: obtenerCategoriaId(premio.categoria),
              ambito: 'nacional',
              estado: 'activo'
            });
          }
          
          // Recargar premios
          await cargarPremios();
        } catch (error) {
          console.error("Error al insertar premios desde metadata:", error);
          setError('Error al preparar los premios para el sorteo');
          return;
        }
      } else {
        setError('No hay premios configurados para este sorteo');
        return;
      }
    }
    
    if (!participantes || participantes.length === 0) {
      setError('No hay participantes válidos para este sorteo');
      return;
    }
    
    try {
      // Verificar el estado actual y aplicar lógica adecuada según el estado
      if (sorteo.estado_actual === 'borrador') {
        // Si está en borrador, primero cambiar a programado
        const programado = await actualizarEstadoSorteo('programado');
        if (!programado) {
          throw new Error('No se pudo actualizar el estado a programado');
        }
        // Pequeña pausa para asegurar que el cambio se refleje correctamente
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Ahora cambiar a en_progreso
      const updated = await actualizarEstadoSorteo('en_progreso');
      if (!updated) {
        throw new Error('No se pudo actualizar el estado del sorteo');
      }
      
      // Iniciar con el primer premio (el de mayor valor)
      setPremioActual(premios[0]);
      
      // Si es sorteo regional, empezar con el primer estado
      if (sorteo.tipo_sorteo !== 'nacional') {
        const metadata = sorteo.metadata ? JSON.parse(sorteo.metadata) : {};
        const estados = metadata.estadosSeleccionados || [];
        if (estados.length > 0) {
          setCurrentEstado(estados[0]);
        }
      }
      
      // Iniciar la animación
      iniciarAnimacion();
    } catch (error) {
      console.error('Error al iniciar sorteo:', error);
      setError(`Error al iniciar sorteo: ${error.message}`);
    }
  };

  // Animación de números
  const iniciarAnimacion = () => {
    setIsAnimating(true);
    let iteraciones = 0;
    const maxIteraciones = 30; // Duración de la animación
    
    // Simular giro de números aleatorios
    timerRef.current = setInterval(() => {
      iteraciones++;
      
      // Generar número aleatorio de 6 dígitos
      const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      
      // Si es la última iteración, seleccionar un ganador real
      if (iteraciones >= maxIteraciones) {
        clearInterval(timerRef.current);
        seleccionarGanador();
      } else {
        // Actualizar el número mostrado en la animación
        if (numeroRef.current) {
          numeroRef.current.innerHTML = randomNum;
        }
        
        // Actualizar contador de vueltas
        if (iteraciones % 3 === 0) {
          setVueltasCompletas(prev => prev + 1);
        }
      }
    }, 100);
  };

  // Seleccionar ganador
  const seleccionarGanador = async () => {
    try {
      // Ejecutar la función SQL para seleccionar un ganador
      const resultado = await window.electron.invoke('db-query',
        'SELECT realizar_sorteo($1, $2) as resultado',
        [sorteoId, 1] // Usar ID 1 como usuario por defecto
      );
      
      if (!resultado || resultado.length === 0) {
        throw new Error('Error al seleccionar ganador');
      }
      
      // Obtener el resultado de la función
      const ganadorInfo = JSON.parse(resultado[0].resultado);
      
      // Verificar si el estado del ganador es un objeto y normalizarlo
      if (ganadorInfo.estado && typeof ganadorInfo.estado === 'object') {
        console.warn('Detectado estado como objeto en el ganador seleccionado:', ganadorInfo.estado);
        ganadorInfo.estado = ganadorInfo.estado.nombre || ganadorInfo.estado.nom_estado || 'Estado sin nombre';
      }
      
      // Actualizar estado con el ganador seleccionado
      setGanadorActual(ganadorInfo);
      
      // Agregar a la lista de ganadores
      setGanadores(prev => [...prev, ganadorInfo]);
      
      // Detener animación
      setIsAnimating(false);
      setVueltasCompletas(0);
      
      // Mostrar diálogo de ganador
      setDialogOpen(true);
    } catch (error) {
      console.error('Error al seleccionar ganador:', error);
      setError(`Error al seleccionar ganador: ${error.message}`);
      setIsAnimating(false);
    }
  };

  // Obtener y mostrar nombre del estado (con verificación de tipo)
  const getNombreEstado = (estado) => {
    if (!estado) return 'Nacional';
    
    // Verificar si el estado es un objeto en lugar de un string
    if (typeof estado === 'object') {
      return estado.nombre || estado.nom_estado || 'Estado sin nombre';
    }
    
    return estado;
  };

  // Avanzar al siguiente premio
  const siguientePremio = () => {
    setDialogOpen(false);
    
    // Buscar el índice del premio actual
    const indiceActual = premios.findIndex(p => p.id === premioActual.id);
    
    // Si hay más premios, avanzar al siguiente
    if (indiceActual < premios.length - 1) {
      setPremioActual(premios[indiceActual + 1]);
      iniciarAnimacion();
    } else {
      // No hay más premios, finalizar sorteo
      finalizarSorteo();
    }
  };

  // Finalizar sorteo
  const finalizarSorteo = async () => {
    try {
      await actualizarEstadoSorteo('finalizado');
      setSorteoFinalizado(true);
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error al finalizar sorteo:', error);
      setError(`Error al finalizar sorteo: ${error.message}`);
    }
  };

  // Detener sorteo (pausa)
  const detenerSorteo = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      setIsAnimating(false);
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (sorteoFinalizado) {
    return (
      <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>¡FELICIDADES A TODOS LOS GANADORES!</Typography>
        <Typography variant="h5">Pueblo Valiente</Typography>
        <Typography variant="subtitle1" gutterBottom>
          Sorteo realizado el {new Date().toLocaleDateString()}, {new Date().toLocaleTimeString()}
        </Typography>
        
        {ganadores.map((ganador, index) => (
          <Paper key={index} elevation={1} sx={{ p: 2, mb: 2, mt: 2 }}>
            <Typography variant="h6">¡GANADOR DESTACADO!</Typography>
            <Typography variant="h5">Participante {ganador.participante_id}</Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body1" align="right">Estado:</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1" align="left">
                  {getNombreEstado(ganador.estado)}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body1" align="right">Premio:</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1" align="left" color="primary">
                  {ganador.premio}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        ))}
      </Paper>
    );
  }

  return (
    <Box>
      {!isAnimating && !premioActual ? (
        <Paper elevation={3} sx={{ p: 3, mb: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>Sorteo: {sorteo?.nombre}</Typography>
          <Typography variant="subtitle1">Tipo: {sorteo?.tipo_sorteo}</Typography>
          <Typography variant="subtitle1">Fecha: {new Date(sorteo?.fecha_sorteo).toLocaleString()}</Typography>
          
          <Box mt={3}>
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              onClick={iniciarSorteo}
              disabled={loading}
            >
              INICIAR SORTEO
            </Button>
          </Box>
          
          <Box mt={3}>
            <Typography variant="h6" gutterBottom>Premios disponibles:</Typography>
            {premios.map((premio, index) => (
              <Chip 
                key={index}
                label={`${index+1}° ${premio.nombre}`}
                color={index === 0 ? "primary" : "default"}
                sx={{ m: 0.5 }}
              />
            ))}
          </Box>
        </Paper>
      ) : (
        <Paper elevation={3} sx={{ p: 3, mb: 4, bgcolor: '#fff5f8' }}>
          <Typography variant="h5" gutterBottom align="center">
            {isAnimating ? 'Seleccionando ganador...' : '¡Ganador seleccionado!'}
          </Typography>
          
          <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Estado
            </Typography>
            <Typography variant="h6">
              Premio
            </Typography>
          </Box>
          
          <Box mb={2} display="flex" justifyContent="space-between" alignItems="center" p={1} bgcolor="#FFEB3B" borderRadius={1}>
            <Typography variant="body1">
              {getNombreEstado(currentEstado)}
            </Typography>
            <Typography variant="body1">
              {premioActual?.nombre || 'Premio Principal'}
            </Typography>
          </Box>
          
          <Paper
            elevation={5}
            sx={{
              bgcolor: '#ff4081',
              color: 'white',
              p: 2,
              my: 3,
              borderRadius: 2,
              textAlign: 'center'
            }}
          >
            <Box 
              display="flex" 
              justifyContent="center"
              sx={{
                '& > div': {
                  m: 0.5,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  borderRadius: 1,
                  width: '14%',
                  fontSize: '3rem',
                  fontWeight: 'bold',
                  padding: '10px 5px'
                }
              }}
            >
              {isAnimating ? (
                <>
                  {Array(6).fill(0).map((_, i) => (
                    <Box key={i}>
                      <Typography variant="h2">
                        {Math.floor(Math.random() * 10)}
                      </Typography>
                    </Box>
                  ))}
                </>
              ) : (
                ganadorActual && ganadorActual.numero_ganador && 
                ganadorActual.numero_ganador.toString().padStart(6, '0').split('').map((digit, i) => (
                  <Box key={i}>
                    <Typography variant="h2">
                      {digit}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
            
            <Typography variant="h6" gutterBottom>
              {ganadorActual 
                ? `Participante ${ganadorActual.participante_id}`
                : isAnimating 
                  ? `Completando ${vueltasCompletas} vueltas completas...` 
                  : 'Esperando resultado...'}
            </Typography>
            
            <Chip 
              label={getNombreEstado(currentEstado)} 
              color="secondary"
              sx={{ mt: 1, bgcolor: '#FFEB3B', color: 'black' }}
            />
          </Paper>
          
          {isAnimating && (
            <Box display="flex" justifyContent="center" mt={2}>
              <Button
                variant="contained"
                color="warning"
                onClick={detenerSorteo}
                startIcon={<span>⏸</span>}
              >
                DETENER
              </Button>
            </Box>
          )}
          
          {ganadores.length > 0 && (
            <Box mt={4}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="h6" gutterBottom>Ganadores anteriores:</Typography>
              
              <Grid container spacing={2}>
                {ganadores.slice(0, 4).map((ganador, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Paper elevation={1} sx={{ p: 1.5 }}>
                      <Typography variant="subtitle1">
                        <b>Participante {ganador.participante_id}</b>
                      </Typography>
                      <Typography variant="body2">
                        {getNombreEstado(ganador.estado)} - CI: V-{ganador.participante_id}
                      </Typography>
                      <Typography variant="body2" color="primary">
                        {ganador.posicion || (index + 1)} er Premio Por Estado #{index + 1}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Paper>
      )}

      {/* Diálogo de ganador */}
      <Dialog 
        open={dialogOpen} 
        maxWidth="md"
        PaperProps={{
          style: {
            borderRadius: '12px',
            padding: '12px'
          }
        }}
      >
        <DialogTitle>
          <Typography variant="h5" align="center">
            ¡TENEMOS UN GANADOR!
          </Typography>
        </DialogTitle>
        <DialogContent>
          {ganadorActual && (
            <Box textAlign="center" p={2}>
              <Typography variant="h4" gutterBottom>
                {getNombreEstado(ganadorActual.estado)}
              </Typography>
              
              <Box 
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  p: 2,
                  bgcolor: '#ff4081',
                  borderRadius: 2,
                  color: 'white',
                  '& > div': {
                    m: 0.5,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    borderRadius: 1,
                    width: '16%',
                    fontSize: '4rem',
                    fontWeight: 'bold',
                    padding: '15px 5px'
                  }
                }}
              >
                {ganadorActual.numero_ganador && 
                  ganadorActual.numero_ganador.toString().padStart(6, '0').split('').map((digit, i) => (
                    <Box key={i}>
                      <Typography variant="h1">
                        {digit}
                      </Typography>
                    </Box>
                  ))
                }
              </Box>
              
              <Typography variant="h6" mt={2}>
                Participante {ganadorActual.participante_id}
              </Typography>
              
              <Box mt={4}>
                <Typography variant="h5" gutterBottom>
                  PREMIO:
                </Typography>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {premioActual?.nombre || 'Premio Principal'}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={siguientePremio} 
            fullWidth
          >
            {premios.indexOf(premioActual) < premios.length - 1 ? 
              'Siguiente Premio' : 
              'Finalizar Sorteo'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IniciarSorteo; 