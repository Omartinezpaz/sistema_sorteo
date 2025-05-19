import React from 'react';
import {
  Typography,
  Paper,
  Grid,
  Box,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import EventIcon from '@mui/icons-material/Event';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SettingsIcon from '@mui/icons-material/Settings';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { DateTimePicker } from '@mui/x-date-pickers';
import EditIcon from '@mui/icons-material/Edit';
import dayjs from 'dayjs';

function RevisionConfirmacion({ data, readOnly = false, onUpdateFecha }) {
  const [openDialog, setOpenDialog] = React.useState(false);
  const [nuevaFecha, setNuevaFecha] = React.useState(data.fecha_sorteo ? dayjs(data.fecha_sorteo) : null);

  const handleUpdateFecha = () => {
    if (onUpdateFecha) {
      onUpdateFecha(nuevaFecha);
    }
    setOpenDialog(false);
  };

  // Función para formatear fechas
  const formatearFecha = (fecha) => {
    if (!fecha) return 'No definida';
    
    try {
      // Si recibimos un string que contiene un objeto dayjs serializado
      if (typeof fecha === 'string' && fecha.includes('$isDayjsObject')) {
        try {
          const parsedDayjs = JSON.parse(fecha);
          if (parsedDayjs && parsedDayjs.$d) {
            fecha = parsedDayjs.$d; // Usar la fecha ISO dentro del objeto dayjs
          }
        } catch (e) {
          console.warn("Error al parsear string de fecha en formatearFecha:", e);
        }
      }
      
      // Ahora intentamos convertir a objeto Date
      const date = new Date(fecha);
      
      // Verificar si es una fecha válida
      if (isNaN(date.getTime())) {
        console.warn('Fecha inválida en formatearFecha:', fecha);
        return 'Fecha inválida';
      }
      
      return new Intl.DateTimeFormat('es-VE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Error al formatear fecha:', error, fecha);
      return 'Fecha inválida';
    }
  };

  const getEstadoDisplayString = (estadoValue) => {
    // Caso 1: Valor nulo o indefinido
    if (estadoValue === null || estadoValue === undefined) {
      return 'Estado no definido';
    }

    try {
      // Caso 2: Valor primitivo (string, number, boolean)
      if (typeof estadoValue !== 'object') {
        return String(estadoValue);
      }

      // Caso 3: Es un array
      if (Array.isArray(estadoValue)) {
        console.warn('getEstadoDisplayString: Array de estado recibido:', JSON.stringify(estadoValue));
        return 'Estado (Array)';
      }

      // Caso 4: Es un objeto con propiedad nom_estado
      if (estadoValue && Object.prototype.hasOwnProperty.call(estadoValue, 'nom_estado') && 
          typeof estadoValue.nom_estado === 'string' && estadoValue.nom_estado.trim() !== '') {
        return estadoValue.nom_estado.trim();
      }

      // Caso 5: Es un objeto con propiedad cod_estado
      if (estadoValue && Object.prototype.hasOwnProperty.call(estadoValue, 'cod_estado')) {
        const cod = String(estadoValue.cod_estado || '').trim();
        if (cod !== '') {
          return `Código: ${cod}`;
        }
      }
      
      // Caso 6: Es un objeto pero no tiene las propiedades esperadas
      console.warn('getEstadoDisplayString: Objeto estado con formato inesperado:', 
                   JSON.stringify(estadoValue).substring(0, 100));
      return 'Estado (Info no disponible)';
    } catch (error) {
      // Caso 7: Error al procesar el valor
      console.error('Error en getEstadoDisplayString:', error);
      return 'Estado (Error de formato)';
    }
  };

  // Calcular el total de tickets configurados
  const calcularTotalTickets = () => {
    if (!data.rangosEstado || data.rangosEstado.length === 0) {
      return 0;
    }

    return data.rangosEstado.reduce((total, rango) => {
      const desde = parseInt(rango.desde || 0);
      const hasta = parseInt(rango.hasta || 0);
      if (!isNaN(desde) && !isNaN(hasta)) {
        return total + (hasta - desde + 1);
      }
      return total;
    }, 0);
  };

  // Calcular el total de premios configurados
  const calcularTotalPremios = () => {
    let total = 0;
    
    // Premios nacionales
    if (data.premiosNacionales && Array.isArray(data.premiosNacionales)) {
      total += data.premiosNacionales.length;
    }
    
    // Premios regionales
    if (data.premiosRegionales) {
      Object.values(data.premiosRegionales).forEach(premios => {
        if (Array.isArray(premios)) {
          total += premios.length;
        }
      });
    }
    
    return total;
  };

  // Calcular el valor total de los premios
  const calcularValorTotalPremios = () => {
    let total = 0;
    
    // Premios nacionales
    if (data.premiosNacionales && Array.isArray(data.premiosNacionales)) {
      total += data.premiosNacionales.reduce((sum, premio) => {
        return sum + (parseFloat(premio.valor) || 0);
      }, 0);
    }
    
    // Premios regionales
    if (data.premiosRegionales) {
      Object.values(data.premiosRegionales).forEach(premios => {
        if (Array.isArray(premios)) {
          total += premios.reduce((sum, premio) => {
            return sum + (parseFloat(premio.valor) || 0);
          }, 0);
        }
      });
    }
    
    return total;
  };

  // Verificar si hay errores u omisiones en la configuración
  const verificarConfiguracion = () => {
    const errores = [];
    
    // Verificar información básica
    if (!data.nombre) {
      errores.push('El nombre del sorteo no está definido');
    }
    
    if (!data.fechaHora) {
      errores.push('La fecha y hora del sorteo no está definida');
    }
    
    // Verificar rangos de tickets
    if (!data.rangosEstado || data.rangosEstado.length === 0) {
      errores.push('No se han configurado rangos de tickets');
    }
    
    // Verificar premios
    const totalPremios = calcularTotalPremios();
    if (totalPremios === 0) {
      errores.push('No se han configurado premios');
    }
    
    // Verificar reglas de sorteo
    if (!data.algoritmoSorteo) {
      errores.push('No se ha seleccionado el algoritmo de sorteo');
    }
    
    // Verificar estados en caso de sorteo regional o mixto
    if ((data.tipoSorteo === 'regional' || data.tipoSorteo === 'mixto') && 
        (!data.estadosSeleccionados || data.estadosSeleccionados.length === 0)) {
      errores.push('No se han seleccionado estados para el sorteo regional/mixto');
    }
    
    return errores;
  };

  const erroresConfiguracion = verificarConfiguracion();
  const hayErrores = erroresConfiguracion.length > 0;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Revisión y Confirmación del Sorteo
      </Typography>

      {/* Alertas y Advertencias */}
      {readOnly && (
        <Box sx={{ mb: 3 }}>
          {!data.metodo_seleccion && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              No se ha configurado el Método de Selección de Ganadores. 
              Se recomienda configurarlo antes de realizar el sorteo.
            </Alert>
          )}
          {data.fecha_sorteo && dayjs(data.fecha_sorteo).isBefore(dayjs()) && (
            <Alert severity="info" sx={{ mb: 2 }}>
              La fecha programada del sorteo ya pasó. ¿Desea actualizar la fecha?
              <Button 
                variant="outlined" 
                size="small" 
                sx={{ ml: 2 }}
                onClick={() => setOpenDialog(true)}
              >
                Actualizar Fecha
              </Button>
            </Alert>
          )}
        </Box>
      )}

      {/* Información General */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Información General
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2">ID del Sorteo</Typography>
            <Typography variant="body1" gutterBottom>{data.id}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2">Estado</Typography>
            <Chip 
              label={data.estado_actual || data.estado} 
              color={
                data.estado_actual === 'finalizado' ? 'success' :
                data.estado_actual === 'en_progreso' ? 'warning' :
                'primary'
              }
              size="small"
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2">Nombre</Typography>
            <Typography variant="body1" gutterBottom>{data.nombre}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2">Descripción</Typography>
            <Typography variant="body1" gutterBottom>{data.descripcion || 'Sin descripción'}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2">Fecha de Creación</Typography>
            <Typography variant="body1" gutterBottom>
              {dayjs(data.fecha_creacion).format('DD/MM/YYYY HH:mm')}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2">Fecha del Sorteo</Typography>
            <Typography variant="body1" gutterBottom>
              {data.fecha_sorteo ? dayjs(data.fecha_sorteo).format('DD/MM/YYYY HH:mm') : 'No definida'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Premios */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Premios Configurados
        </Typography>
        {data.premios && data.premios.length > 0 ? (
          <Grid container spacing={2}>
            {data.premios.map((premio, index) => (
              <Grid item xs={12} key={premio.id || index}>
                <Paper variant="outlined" sx={{ p: 1 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2">{premio.nombre}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Chip 
                        label={premio.categoria} 
                        size="small" 
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2">
                        Valor: {Number(premio.valor).toLocaleString('es-VE')}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Chip 
                        label={premio.ambito} 
                        size="small"
                        color={premio.ambito === 'nacional' ? 'primary' : 'secondary'}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert severity="info">No hay premios configurados</Alert>
        )}
      </Paper>

      {/* Método de Selección */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Método de Selección
        </Typography>
        {data.metodo_seleccion ? (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2">Algoritmo</Typography>
              <Typography variant="body1" gutterBottom>
                {data.metodo_seleccion.algoritmo || 'Simple'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2">Reglas de Participación</Typography>
              <Typography variant="body1" gutterBottom>
                {data.metodo_seleccion.reglas_participacion || 'Reglas por defecto'}
              </Typography>
            </Grid>
          </Grid>
        ) : (
          <Alert severity="warning">
            No se ha configurado el método de selección
          </Alert>
        )}
      </Paper>

      {/* Diálogo para actualizar fecha */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Actualizar Fecha del Sorteo</DialogTitle>
        <DialogContent>
          <DateTimePicker
            label="Nueva fecha y hora"
            value={nuevaFecha}
            onChange={setNuevaFecha}
            renderInput={(params) => <TextField {...params} fullWidth sx={{ mt: 2 }} />}
            minDateTime={dayjs()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleUpdateFecha} variant="contained">
            Actualizar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default RevisionConfirmacion;