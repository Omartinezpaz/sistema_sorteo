import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  CircularProgress,
  Chip
} from '@mui/material';
import IniciarSorteoComponent from '../../components/sorteo/IniciarSorteo';

const IniciarSorteoPage = () => {
  const [sorteos, setSorteos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSorteo, setSelectedSorteo] = useState(null);

  // Cargar lista de sorteos disponibles para ejecutar
  useEffect(() => {
    const loadSorteos = async () => {
      try {
        setLoading(true);
        
        // Obtener sorteos programados o en borrador (no finalizados ni cancelados)
        const sorteosData = await window.electron.invoke('db-query',
          `SELECT * FROM sorteos 
           WHERE estado_actual IN ('programado', 'borrador') 
           ORDER BY fecha_sorteo DESC`
        );
        
        setSorteos(sorteosData || []);
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar sorteos:', error);
        setError(`Error al cargar sorteos: ${error.message}`);
        setLoading(false);
      }
    };
    
    loadSorteos();
  }, []);

  // Renderizar chip de estado con color apropiado
  const renderEstadoChip = (estado) => {
    let color;
    
    switch (estado) {
      case 'programado':
        color = 'success';
        break;
      case 'en_progreso':
        color = 'warning';
        break;
      case 'finalizado':
        color = 'default';
        break;
      case 'cancelado':
        color = 'error';
        break;
      case 'borrador':
      default:
        color = 'info';
    }
    
    return <Chip label={estado} color={color} size="small" />;
  };

  // Formatea la fecha para mostrar
  const formatFecha = (fechaStr) => {
    if (!fechaStr) return 'Fecha no definida';
    
    try {
      // Crear objeto Date a partir del string ISO
      const fecha = new Date(fechaStr);
      
      // Verificar si la fecha es válida
      if (isNaN(fecha.getTime())) {
        console.error('Fecha inválida:', fechaStr);
        return 'Fecha inválida';
      }
      
      // Opciones para formatear la fecha con hora en formato local
      const opciones = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      };
      
      // Formatear según la configuración regional del navegador
      return fecha.toLocaleDateString(undefined, opciones);
    } catch (error) {
      console.error('Error al formatear fecha:', error, 'fechaStr:', fechaStr);
      return 'Fecha inválida';
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

  // Si hay un sorteo seleccionado, mostrar la interfaz de ejecución
  if (selectedSorteo) {
    return (
      <Box>
        <Button 
          variant="outlined" 
          sx={{ mb: 2 }}
          onClick={() => setSelectedSorteo(null)}
        >
          Volver a la lista de sorteos
        </Button>
        
        <IniciarSorteoComponent 
          sorteoId={selectedSorteo.id} 
          onComplete={() => setSelectedSorteo(null)}
        />
      </Box>
    );
  }

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Iniciar Sorteo
        </Typography>
        <Typography variant="body1" paragraph>
          Seleccione un sorteo de la lista para iniciar el proceso de selección de ganadores.
        </Typography>
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Sorteos Disponibles
        </Typography>
        
        {sorteos.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="subtitle1" color="textSecondary">
              No hay sorteos disponibles para iniciar.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              sx={{ mt: 2 }}
              onClick={() => window.electron.navegarApp('crear-sorteo')}
            >
              Crear Nuevo Sorteo
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Fecha Programada</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sorteos.map((sorteo) => (
                  <TableRow key={sorteo.id} hover>
                    <TableCell>{sorteo.nombre}</TableCell>
                    <TableCell>{sorteo.tipo_sorteo}</TableCell>
                    <TableCell>{formatFecha(sorteo.fecha_sorteo)}</TableCell>
                    <TableCell>{renderEstadoChip(sorteo.estado_actual)}</TableCell>
                    <TableCell align="center">
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => setSelectedSorteo(sorteo)}
                      >
                        Iniciar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default IniciarSorteoPage; 