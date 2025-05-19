import React, { useState, useEffect } from 'react';
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Box,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CancelIcon from '@mui/icons-material/Cancel';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useNavigate } from 'react-router-dom';

function ListadoSorteos({ onNuevoSorteo, onVerSorteo, onEditarSorteo, onIniciarSorteo, onVerResultados }) {
  const [sorteos, setSorteos] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  
  // Estado para el menú de acciones
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [sorteoSeleccionado, setSorteoSeleccionado] = useState(null);
  
  // Estado para diálogo de confirmación
  const [dialogoConfirmacion, setDialogoConfirmacion] = useState({
    abierto: false,
    tipo: '', // 'eliminar', 'cancelar', 'iniciar'
    sorteoId: null,
    mensaje: ''
  });

  const navigate = useNavigate();

  // Cargar sorteos desde la base de datos
  useEffect(() => {
    const cargarSorteos = async () => {
      try {
        setCargando(true);
        setError('');
        
        const resultado = await window.electronAPI.dbQuery(`
          SELECT 
            id, 
            nombre, 
            fecha_creacion, 
            fecha_sorteo, 
            estado_actual AS estado, 
            descripcion,
            (SELECT COUNT(*) FROM premios WHERE sorteo_id = sorteos.id) AS total_premios,
            (
              SELECT COALESCE(SUM(valor), 0) 
              FROM premios 
              WHERE sorteo_id = sorteos.id
            ) AS valor_premios
          FROM sorteos
          ORDER BY 
            CASE 
              WHEN estado_actual = 'programado' THEN 1
              WHEN estado_actual = 'borrador' THEN 2
              WHEN estado_actual = 'activo' THEN 3
              WHEN estado_actual = 'finalizado' THEN 4
              ELSE 5
            END,
            fecha_sorteo DESC
        `);
        
        setSorteos(resultado || []);
      } catch (err) {
        console.error('Error al cargar sorteos:', err);
        setError(`Error al cargar los sorteos: ${err.message}`);
      } finally {
        setCargando(false);
      }
    };

    cargarSorteos();
  }, []);

  // Obtener color para el chip de estado
  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'borrador':
        return 'default';
      case 'programado':
        return 'primary';
      case 'activo':
        return 'success';
      case 'finalizado':
        return 'info';
      case 'cancelado':
        return 'error';
      default:
        return 'default';
    }
  };

  // Formatear fecha para mostrar
  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    
    try {
      const date = new Date(fecha);
      return new Intl.DateTimeFormat('es-VE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Fecha inválida';
    }
  };

  // Abrir menú de acciones
  const handleMenuClick = (event, sorteo) => {
    setMenuAnchorEl(event.currentTarget);
    setSorteoSeleccionado(sorteo);
  };

  // Cerrar menú de acciones
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  // Manejar cambio en el filtro
  const handleFiltroChange = (e) => {
    setFiltro(e.target.value);
  };

  // Filtrar sorteos según el texto de búsqueda
  const filtrarSorteos = () => {
    if (!filtro.trim()) return sorteos;
    
    const termino = filtro.toLowerCase();
    return sorteos.filter(sorteo => 
      sorteo.nombre.toLowerCase().includes(termino) ||
      sorteo.descripcion?.toLowerCase().includes(termino) ||
      sorteo.estado.toLowerCase().includes(termino)
    );
  };

  // Abrir diálogo de confirmación
  const abrirDialogoConfirmacion = (tipo, sorteoId) => {
    let mensaje = '';
    
    switch (tipo) {
      case 'eliminar':
        mensaje = '¿Está seguro de que desea eliminar este sorteo? Esta acción no se puede deshacer.';
        break;
      case 'cancelar':
        mensaje = '¿Está seguro de que desea cancelar este sorteo? Esta acción no se puede deshacer.';
        break;
      case 'iniciar':
        mensaje = '¿Está seguro de que desea iniciar este sorteo? Asegúrese de que todo esté configurado correctamente.';
        break;
      default:
        mensaje = '¿Está seguro de que desea continuar?';
    }
    
    setDialogoConfirmacion({
      abierto: true,
      tipo,
      sorteoId,
      mensaje
    });
    
    handleMenuClose();
  };

  // Cerrar diálogo de confirmación
  const cerrarDialogoConfirmacion = () => {
    setDialogoConfirmacion({
      abierto: false,
      tipo: '',
      sorteoId: null,
      mensaje: ''
    });
  };

  // Confirmar acción en diálogo
  const confirmarAccion = async () => {
    const { tipo, sorteoId } = dialogoConfirmacion;
    
    try {
      switch (tipo) {
        case 'eliminar':
          await eliminarSorteo(sorteoId);
          break;
        case 'cancelar':
          await cambiarEstadoSorteo(sorteoId, 'cancelado');
          break;
        case 'iniciar':
          // En lugar de simplemente cambiar el estado, redirigimos a la página de inicio de sorteo
          cerrarDialogoConfirmacion();
          if (onIniciarSorteo) onIniciarSorteo(sorteoId);
          return; // Salir temprano para evitar cerrar el diálogo dos veces
        default:
          break;
      }
    } catch (error) {
      console.error(`Error al ${tipo} sorteo:`, error);
      setError(`Error al ${tipo} sorteo: ${error.message}`);
    }
    
    cerrarDialogoConfirmacion();
  };

  // Eliminar sorteo
  const eliminarSorteo = async (sorteoId) => {
    try {
      // Usar el nuevo manejador IPC que maneja la eliminación en cascada
      const resultado = await window.electronAPI.invoke('sorteos:eliminarSorteo', sorteoId);
      
      if (resultado.success) {
        // Actualizar lista de sorteos
        setSorteos(prevSorteos => prevSorteos.filter(sorteo => sorteo.id !== sorteoId));
        
        // Mostrar mensaje de éxito
        setMensaje({
          tipo: 'success',
          texto: `Sorteo eliminado correctamente. Se eliminaron: ${resultado.eliminados.ganadores} ganadores, ${resultado.eliminados.participantes} participantes y ${resultado.eliminados.premios} premios.`
        });
      }
    } catch (error) {
      console.error('Error al eliminar sorteo:', error);
      setError(`Error al eliminar sorteo: ${error.message}`);
      throw error;
    }
  };

  // Cambiar estado del sorteo
  const cambiarEstadoSorteo = async (sorteoId, nuevoEstado) => {
    try {
      // Si estamos cancelando un sorteo que está en progreso, cambiarlo a borrador
      if (nuevoEstado === 'cancelado') {
        // Verificar el estado actual del sorteo
        const [sorteoActual] = await window.electronAPI.dbQuery(
          'SELECT estado_actual FROM sorteos WHERE id = $1',
          [sorteoId]
        );
        
        if (sorteoActual && sorteoActual.estado_actual === 'en_progreso') {
          nuevoEstado = 'borrador';
        }
      }
      
      await window.electronAPI.dbQuery(
        'UPDATE sorteos SET estado_actual = $1 WHERE id = $2',
        [nuevoEstado, sorteoId]
      );
      
      // Actualizar lista de sorteos
      setSorteos(prevSorteos => 
        prevSorteos.map(sorteo => 
          sorteo.id === sorteoId 
            ? { ...sorteo, estado: nuevoEstado }
            : sorteo
        )
      );
      
      // Mostrar mensaje informativo
      setMensaje({
        tipo: 'success',
        texto: `El sorteo ha sido ${nuevoEstado === 'cancelado' ? 'cancelado' : 
               (nuevoEstado === 'borrador' ? 'movido a borradores' : 'actualizado')} correctamente.`
      });
    } catch (error) {
      console.error(`Error al cambiar estado del sorteo: ${error}`);
      setError(`Error al cambiar el estado del sorteo: ${error.message}`);
      throw error;
    }
  };

  // Duplicar sorteo
  const duplicarSorteo = async (sorteoId) => {
    try {
      // Obtener datos del sorteo original
      const [sorteoOriginal] = await window.electronAPI.dbQuery(
        'SELECT * FROM sorteos WHERE id = $1',
        [sorteoId]
      );
      
      if (!sorteoOriginal) {
        throw new Error('No se encontró el sorteo para duplicar');
      }
      
      // Verificar si hay metadata y convertirla a objeto si es string
      let metadata = sorteoOriginal.metadata;
      if (metadata && typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata);
        } catch (e) {
          console.warn('Error al parsear metadata:', e);
          metadata = {};
        }
      }
      
      // Insertar nuevo sorteo con datos del original (sin fecha_sorteo)
      const resultado = await window.electronAPI.dbQuery(
        `INSERT INTO sorteos (
          nombre, descripcion, fecha_creacion, estado_actual, 
          metadata, creado_por, es_publico, reglas
        ) VALUES (
          $1, $2, NOW(), 'borrador', $3, $4, $5, $6
        ) RETURNING id`,
        [
          `${sorteoOriginal.nombre} (Copia)`,
          sorteoOriginal.descripcion,
          sorteoOriginal.metadata,
          sorteoOriginal.creado_por,
          sorteoOriginal.es_publico,
          sorteoOriginal.reglas
        ]
      );
      
      if (!resultado || resultado.length === 0) {
        throw new Error('Error al duplicar el sorteo');
      }
      
      const nuevoSorteoId = resultado[0].id;
      
      // Duplicar premios
      await window.electronAPI.dbQuery(
        `INSERT INTO premios (
          sorteo_id, nombre, descripcion, valor, orden, 
          categoria_id, patrocinador, condiciones, ambito, estado
        )
        SELECT 
          $1, nombre, descripcion, valor, orden,
          categoria_id, patrocinador, condiciones, ambito, estado
        FROM premios 
        WHERE sorteo_id = $2`,
        [nuevoSorteoId, sorteoId]
      );
      
      // Recargar lista de sorteos
      const sorteoActualizado = await window.electronAPI.dbQuery(
        `SELECT 
          id, nombre, fecha_creacion, fecha_sorteo, 
          estado_actual AS estado, descripcion,
          (SELECT COUNT(*) FROM premios WHERE sorteo_id = sorteos.id) AS total_premios,
          (
            SELECT COALESCE(SUM(valor), 0) 
            FROM premios 
            WHERE sorteo_id = sorteos.id
          ) AS valor_premios
        FROM sorteos
        WHERE id = $1`,
        [nuevoSorteoId]
      );
      
      if (sorteoActualizado && sorteoActualizado.length > 0) {
        setSorteos(prevSorteos => [...prevSorteos, sorteoActualizado[0]]);
        // Mostrar mensaje de éxito
        setMensaje({
          tipo: 'success',
          texto: `Sorteo "${sorteoOriginal.nombre}" duplicado correctamente.`
        });
      }
      
      handleMenuClose();
    } catch (error) {
      console.error('Error al duplicar sorteo:', error);
      setError(`Error al duplicar sorteo: ${error.message}`);
      handleMenuClose();
    }
  };

  // Renderizar acciones del menú según el estado del sorteo
  const renderOpcionesMenu = (sorteo) => {
    const opciones = [];
    
    // Ver detalles (siempre disponible)
    opciones.push(
      <MenuItem key="ver" onClick={() => { handleMenuClose(); handleVerSorteo(sorteo.id); }}>
        <ListItemIcon>
          <VisibilityIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Ver Detalles</ListItemText>
      </MenuItem>
    );
    
    // Editar (solo para borradores o programados)
    if (['borrador', 'programado'].includes(sorteo.estado)) {
      opciones.push(
        <MenuItem key="editar" onClick={() => { handleMenuClose(); onEditarSorteo(sorteo.id); }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
      );
    }
    
    // Iniciar sorteo (solo para programados)
    if (['programado', 'borrador'].includes(sorteo.estado)) {
      opciones.push(
        <MenuItem key="iniciar" onClick={() => { handleMenuClose(); onIniciarSorteo(sorteo.id); }}>
          <ListItemIcon>
            <PlayArrowIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Iniciar Sorteo</ListItemText>
        </MenuItem>
      );
    }
    
    // Ver resultados (solo para finalizados)
    if (['finalizado'].includes(sorteo.estado) && onVerResultados) {
      opciones.push(
        <MenuItem key="resultados" onClick={() => { handleMenuClose(); onVerResultados(sorteo.id); }}>
          <ListItemIcon>
            <PictureAsPdfIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ver Resultados</ListItemText>
        </MenuItem>
      );
    }
    
    // Duplicar (siempre disponible)
    opciones.push(
      <MenuItem key="duplicar" onClick={() => { handleMenuClose(); duplicarSorteo(sorteo.id); }}>
        <ListItemIcon>
          <ContentCopyIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Duplicar</ListItemText>
      </MenuItem>
    );
    
    // Cancelar (solo para borradores o programados)
    if (['borrador', 'programado'].includes(sorteo.estado)) {
      opciones.push(
        <MenuItem key="cancelar" onClick={() => abrirDialogoConfirmacion('cancelar', sorteo.id)}>
          <ListItemIcon>
            <CancelIcon fontSize="small" color="warning" />
          </ListItemIcon>
          <ListItemText>Cancelar</ListItemText>
        </MenuItem>
      );
    }
    
    // Eliminar (siempre disponible pero con precaución)
    opciones.push(
      <MenuItem key="eliminar" onClick={() => abrirDialogoConfirmacion('eliminar', sorteo.id)}>
        <ListItemIcon>
          <DeleteIcon fontSize="small" color="error" />
        </ListItemIcon>
        <ListItemText>Eliminar</ListItemText>
      </MenuItem>
    );
    
    return opciones;
  };

  const sorteosFiltrados = filtrarSorteos();

  const handleVerSorteo = (sorteoId) => {
    handleMenuClose();
    navigate(`/sorteos/ver/${sorteoId}`);
  };

  return (
    <div className="listado-sorteos">
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextField
          placeholder="Buscar sorteos..."
          variant="outlined"
          size="small"
          value={filtro}
          onChange={handleFiltroChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ width: '300px' }}
        />
        
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<FilterListIcon />}
          sx={{ ml: 1 }}
        >
          Filtros
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {mensaje.texto && (
        <Alert 
          severity={mensaje.tipo || 'info'} 
          sx={{ mb: 2 }}
          onClose={() => setMensaje({ tipo: '', texto: '' })}
        >
          {mensaje.texto}
        </Alert>
      )}
      
      {cargando ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : sorteosFiltrados.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No hay sorteos disponibles
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filtro ? 'No se encontraron sorteos que coincidan con tu búsqueda' : 'Crea tu primer sorteo para comenzar'}
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={onNuevoSorteo}
            sx={{ mt: 2 }}
          >
            Crear Nuevo Sorteo
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Creación</TableCell>
                <TableCell>Fecha Sorteo</TableCell>
                <TableCell>Premios</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sorteosFiltrados.map((sorteo) => (
                <TableRow key={sorteo.id} hover>
                  <TableCell>
                    <Typography variant="body1">{sorteo.nombre}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {sorteo.descripcion ? sorteo.descripcion.substring(0, 50) + (sorteo.descripcion.length > 50 ? '...' : '') : 'Sin descripción'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={sorteo.estado} 
                      size="small" 
                      color={getEstadoColor(sorteo.estado)} 
                    />
                  </TableCell>
                  <TableCell>{formatearFecha(sorteo.fecha_creacion)}</TableCell>
                  <TableCell>{formatearFecha(sorteo.fecha_sorteo)}</TableCell>
                  <TableCell>
                    {sorteo.total_premios > 0 ? (
                      <>
                        <Typography variant="body2">
                          {sorteo.total_premios} premios
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Valor: {new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(sorteo.valor_premios || 0)}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        Sin premios
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      {/* Botones de acción rápida */}
                      {['programado', 'borrador'].includes(sorteo.estado) && (
                        <Tooltip title="Iniciar Sorteo">
                          <IconButton 
                            size="small" 
                            color="success"
                            onClick={() => onIniciarSorteo(sorteo.id)}
                          >
                            <PlayArrowIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      <Tooltip title="Ver detalles">
                        <IconButton 
                          size="small"
                          onClick={() => handleVerSorteo(sorteo.id)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      
                      {['finalizado'].includes(sorteo.estado) && onVerResultados && (
                        <Tooltip title="Ver Resultados">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => onVerResultados(sorteo.id)}
                          >
                            <PictureAsPdfIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      <Tooltip title="Más acciones">
                        <IconButton 
                          size="small"
                          onClick={(e) => handleMenuClick(e, sorteo)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Menú de acciones */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        {sorteoSeleccionado && renderOpcionesMenu(sorteoSeleccionado)}
      </Menu>
      
      {/* Diálogo de confirmación */}
      <Dialog
        open={dialogoConfirmacion.abierto}
        onClose={cerrarDialogoConfirmacion}
      >
        <DialogTitle>
          {dialogoConfirmacion.tipo === 'eliminar' ? 'Eliminar Sorteo' : 
           dialogoConfirmacion.tipo === 'cancelar' ? 'Cancelar Sorteo' : 
           dialogoConfirmacion.tipo === 'iniciar' ? 'Iniciar Sorteo' : 
           'Confirmar Acción'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {dialogoConfirmacion.mensaje}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogoConfirmacion}>
            Cancelar
          </Button>
          <Button 
            onClick={confirmarAccion} 
            variant="contained"
            color={dialogoConfirmacion.tipo === 'eliminar' ? 'error' : 'primary'}
            autoFocus
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default ListadoSorteos; 