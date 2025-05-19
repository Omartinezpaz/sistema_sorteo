import React, { useState, useEffect } from 'react';
import {
  TextField,
  Grid,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Box,
  Chip,
  Tabs,
  Tab,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';

function GestionPremios({ data, onChange }) {
  const [activeTab, setActiveTab] = useState('nacionales');
  const [formData, setFormData] = useState({
    premiosNacionales: data.premiosNacionales || [],
    premiosRegionales: data.premiosRegionales || {}
  });
  
  const [nuevoPremio, setNuevoPremio] = useState({
    nombre: '',
    descripcion: '',
    valor: '',
    categoria: 'principal',
    orden: ''
  });
  
  const [editMode, setEditMode] = useState(false);
  const [premioEditado, setPremioEditado] = useState(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState('');
  
  // Estado para gestionar errores
  const [error, setError] = useState('');

  // Determinar si hay estados configurados
  const hayEstadosSeleccionados = 
    data.tipoSorteo === 'regional' || data.tipoSorteo === 'mixto' && 
    data.estadosSeleccionados && data.estadosSeleccionados.length > 0;

  // Categorías de premios
  const categorias = [
    { value: 'principal', label: 'Principal' },
    { value: 'secundario', label: 'Secundario' },
    { value: 'especial', label: 'Especial' }
  ];

  // Cambiar entre pestañas de premios nacionales y regionales
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    if (newValue === 'regionales' && !hayEstadosSeleccionados) {
      setError('No hay estados seleccionados. Configure estados en el paso anterior para crear premios regionales.');
    } else {
      setError('');
    }
  };

  // Manejar cambios en el formulario del premio
  const handlePremioChange = (e) => {
    const { name, value } = e.target;
    setNuevoPremio({
      ...nuevoPremio,
      [name]: value
    });
    setError('');
  };

  // Manejar selección de estado para premios regionales
  const handleEstadoChange = (e) => {
    setEstadoSeleccionado(e.target.value);
    setError('');
  };

  // Validar formulario de premio
  const validarPremio = () => {
    if (!nuevoPremio.nombre) {
      setError('El nombre del premio es obligatorio');
      return false;
    }
    
    if (!nuevoPremio.valor) {
      setError('El valor del premio es obligatorio');
      return false;
    }
    
    // Si estamos en la pestaña regional, validar selección de estado
    if (activeTab === 'regionales' && !estadoSeleccionado) {
      setError('Debe seleccionar un estado para el premio regional');
      return false;
    }
    
    return true;
  };

  // Agregar o actualizar premio
  const guardarPremio = async () => {
    if (!validarPremio()) return;
    
    try {
      if (activeTab === 'nacionales') {
        // Si estamos en modo edición
        if (editMode && premioEditado !== null) {
          const premioActualizado = {
            id: formData.premiosNacionales[premioEditado].id,
            sorteoId: data.sorteoId,
            nombre: nuevoPremio.nombre,
            descripcion: nuevoPremio.descripcion,
            valor: parseFloat(nuevoPremio.valor),
            categoria: nuevoPremio.categoria,
            orden: parseInt(nuevoPremio.orden) || 0,
            ambito: 'nacional',
            metadata: formData.premiosNacionales[premioEditado].metadata || {}
          };

          const result = await window.electron.invoke('premios:actualizar', premioActualizado);
          
          if (result.success) {
            const premiosActualizados = [...formData.premiosNacionales];
            premiosActualizados[premioEditado] = { 
              ...nuevoPremio, 
              id: premioActualizado.id,
              metadata: result.premio.metadata || {}
            };
            
            setFormData({
              ...formData,
              premiosNacionales: premiosActualizados
            });
            
            onChange({ premiosNacionales: premiosActualizados });
          }
        } else {
          // Agregar nuevo premio nacional
          const nuevoPremioData = {
            sorteoId: data.sorteoId,
            nombre: nuevoPremio.nombre,
            descripcion: nuevoPremio.descripcion,
            valor: parseFloat(nuevoPremio.valor),
            categoria: nuevoPremio.categoria,
            orden: parseInt(nuevoPremio.orden) || 0,
            ambito: 'nacional',
            metadata: {}
          };

          const result = await window.electron.invoke('premios:crear', nuevoPremioData);
          
          if (result.success) {
            const nuevosPremios = [...formData.premiosNacionales, { 
              ...nuevoPremio, 
              id: result.id,
              metadata: result.premio.metadata || {}
            }];
            
            setFormData({
              ...formData,
              premiosNacionales: nuevosPremios
            });
            
            onChange({ premiosNacionales: nuevosPremios });
          }
        }
      } else {
        // Premios regionales
        const premiosRegionalesActualizados = { ...formData.premiosRegionales };
        
        // Si no existe el estado, inicializar como array vacío
        if (!premiosRegionalesActualizados[estadoSeleccionado]) {
          premiosRegionalesActualizados[estadoSeleccionado] = [];
        }
        
        // Si estamos en modo edición
        if (editMode && premioEditado !== null) {
          const premioActualizado = {
            id: premiosRegionalesActualizados[estadoSeleccionado][premioEditado].id,
            sorteoId: data.sorteoId,
            nombre: nuevoPremio.nombre,
            descripcion: nuevoPremio.descripcion,
            valor: parseFloat(nuevoPremio.valor),
            categoria: nuevoPremio.categoria,
            orden: parseInt(nuevoPremio.orden) || 0,
            ambito: 'regional',
            estado: estadoSeleccionado,
            metadata: premiosRegionalesActualizados[estadoSeleccionado][premioEditado].metadata || {}
          };

          const result = await window.electron.invoke('premios:actualizar', premioActualizado);
          
          if (result.success) {
            const premiosEstadoActualizados = [...premiosRegionalesActualizados[estadoSeleccionado]];
            premiosEstadoActualizados[premioEditado] = { 
              ...nuevoPremio, 
              id: premioActualizado.id,
              metadata: result.premio.metadata || {}
            };
            premiosRegionalesActualizados[estadoSeleccionado] = premiosEstadoActualizados;
          }
        } else {
          // Agregar nuevo premio regional
          const nuevoPremioData = {
            sorteoId: data.sorteoId,
            nombre: nuevoPremio.nombre,
            descripcion: nuevoPremio.descripcion,
            valor: parseFloat(nuevoPremio.valor),
            categoria: nuevoPremio.categoria,
            orden: parseInt(nuevoPremio.orden) || 0,
            ambito: 'regional',
            estado: estadoSeleccionado,
            metadata: {}
          };

          const result = await window.electron.invoke('premios:crear', nuevoPremioData);
          
          if (result.success) {
            premiosRegionalesActualizados[estadoSeleccionado] = [
              ...premiosRegionalesActualizados[estadoSeleccionado],
              { 
                ...nuevoPremio, 
                id: result.id,
                metadata: result.premio.metadata || {}
              }
            ];
          }
        }
        
        setFormData({
          ...formData,
          premiosRegionales: premiosRegionalesActualizados
        });
        
        onChange({ premiosRegionales: premiosRegionalesActualizados });
      }
      
      // Resetear formulario y modo edición
      setNuevoPremio({
        nombre: '',
        descripcion: '',
        valor: '',
        categoria: 'principal',
        orden: ''
      });
      
      setEditMode(false);
      setPremioEditado(null);
      setError('');
    } catch (error) {
      console.error('Error al guardar premio:', error);
      setError(`Error al guardar premio: ${error.message || 'Error desconocido'}`);
    }
  };

  // Editar premio existente
  const editarPremio = (tipo, index, estado = null) => {
    if (tipo === 'nacional') {
      const premio = formData.premiosNacionales[index];
      setNuevoPremio({ ...premio });
      setPremioEditado(index);
      setActiveTab('nacionales');
    } else if (tipo === 'regional' && estado) {
      setActiveTab('regionales');
      setEstadoSeleccionado(estado);
      const premio = formData.premiosRegionales[estado][index];
      setNuevoPremio({ ...premio });
      setPremioEditado(index);
    }
    
    setEditMode(true);
    setError('');
  };

  // Eliminar premio
  const eliminarPremio = async (tipo, index, estado = null) => {
    try {
      if (tipo === 'nacional') {
        const premioId = formData.premiosNacionales[index].id;
        const result = await window.electron.invoke('premios:eliminar', { 
          premioId, 
          sorteoId: data.sorteoId 
        });
        
        if (result.success) {
          const premiosActualizados = formData.premiosNacionales.filter((_, i) => i !== index);
          
          setFormData({
            ...formData,
            premiosNacionales: premiosActualizados
          });
          
          onChange({ premiosNacionales: premiosActualizados });
        }
      } else if (tipo === 'regional' && estado) {
        const premioId = formData.premiosRegionales[estado][index].id;
        const result = await window.electron.invoke('premios:eliminar', { 
          premioId, 
          sorteoId: data.sorteoId 
        });
        
        if (result.success) {
          const premiosRegionalesActualizados = { ...formData.premiosRegionales };
          
          // Filtrar el premio a eliminar
          premiosRegionalesActualizados[estado] = premiosRegionalesActualizados[estado].filter((_, i) => i !== index);
          
          // Si quedó el array vacío, eliminar el estado del objeto
          if (premiosRegionalesActualizados[estado].length === 0) {
            delete premiosRegionalesActualizados[estado];
          }
          
          setFormData({
            ...formData,
            premiosRegionales: premiosRegionalesActualizados
          });
          
          onChange({ premiosRegionales: premiosRegionalesActualizados });
        }
      }
    } catch (error) {
      console.error('Error al eliminar premio:', error);
      setError(`Error al eliminar premio: ${error.message || 'Error desconocido'}`);
    }
  };

  // Cancelar edición
  const cancelarEdicion = () => {
    setNuevoPremio({
      nombre: '',
      descripcion: '',
      valor: '',
      categoria: 'principal',
      orden: ''
    });
    
    setEditMode(false);
    setPremioEditado(null);
    setError('');
  };

  // Obtener el nombre de categoría para mostrar
  const getNombreCategoria = (categoriaId) => {
    const categoria = categorias.find(cat => cat.value === categoriaId);
    return categoria ? categoria.label : 'Desconocida';
  };

  // Cargar premios al iniciar
  useEffect(() => {
    const cargarPremios = async () => {
      try {
        if (!data.sorteoId) return;
        
        const premiosDB = await window.electron.invoke('premios:obtenerPorSorteo', data.sorteoId);
        
        if (premiosDB && premiosDB.length > 0) {
          const premiosNacionales = [];
          const premiosRegionales = {};
          
          premiosDB.forEach(premio => {
            const premioFormateado = {
              id: premio.id,
              nombre: premio.nombre,
              descripcion: premio.descripcion,
              valor: premio.valor,
              categoria: premio.categoria_id,
              orden: premio.orden,
              metadata: premio.metadata || {}
            };
            
            if (premio.ambito === 'nacional') {
              premiosNacionales.push(premioFormateado);
            } else if (premio.ambito === 'regional' && premio.estado) {
              if (!premiosRegionales[premio.estado]) {
                premiosRegionales[premio.estado] = [];
              }
              premiosRegionales[premio.estado].push(premioFormateado);
            }
          });
          
          setFormData({
            ...formData,
            premiosNacionales,
            premiosRegionales
          });
        } else if (data.metadata && data.metadata.premiosNacionales) {
          // Si no hay premios en la BD pero sí en metadata, migrarlos
          try {
            const result = await window.electron.invoke('premios:migrarDesdeMetadata', data.sorteoId);
            if (result.success) {
              // Recargar los premios después de migrar
              const premiosActualizados = await window.electron.invoke('premios:obtenerPorSorteo', data.sorteoId);
              if (premiosActualizados && premiosActualizados.length > 0) {
                const premiosNacionales = premiosActualizados
                  .filter(p => p.ambito === 'nacional')
                  .map(p => ({
                    id: p.id,
                    nombre: p.nombre,
                    descripcion: p.descripcion,
                    valor: p.valor,
                    categoria: p.categoria_id,
                    orden: p.orden,
                    metadata: p.metadata || {}
                  }));
                
                setFormData({
                  ...formData,
                  premiosNacionales,
                  premiosRegionales: {}
                });
              }
            }
          } catch (migrationError) {
            console.error('Error al migrar premios desde metadata:', migrationError);
          }
        }
      } catch (error) {
        console.error('Error al cargar los premios:', error);
        setError('Error al cargar los premios del sorteo');
      }
    };
    
    cargarPremios();
  }, [data.sorteoId]);

  return (
    <div className="gestion-premios-form">
      <Typography variant="h2" className="form-section-title" id="gestion-premios-title">
        Gestión de Premios
      </Typography>
      
      <Tabs 
        value={activeTab} 
        onChange={handleTabChange}
        aria-label="tipo-premios"
        variant="fullWidth"
        sx={{ mb: 3 }}
      >
        <Tab value="nacionales" label="Premios Nacionales" />
        <Tab 
          value="regionales" 
          label="Premios Regionales" 
          disabled={data.tipoSorteo === 'nacional' || !hayEstadosSeleccionados}
        />
      </Tabs>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Formulario para agregar/editar premios */}
      <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5' }}>
        <Typography variant="subtitle1" gutterBottom>
          {editMode ? 'Editar Premio' : 'Agregar Nuevo Premio'}
        </Typography>
        
        <Grid container spacing={2}>
          {activeTab === 'regionales' && (
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="estado-label">Estado</InputLabel>
                <Select
                  labelId="estado-label"
                  id="estado"
                  value={estadoSeleccionado}
                  onChange={handleEstadoChange}
                  label="Estado"
                  disabled={editMode}
                >
                  <MenuItem value="">
                    <em>Seleccione un estado</em>
                  </MenuItem>
                  {data.estadosSeleccionados?.map((estado) => (
                    <MenuItem key={estado} value={estado}>
                      {estado}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
          
          <Grid item xs={12} md={activeTab === 'regionales' ? 6 : 12}>
            <TextField
              fullWidth
              label="Nombre del Premio"
              name="nombre"
              value={nuevoPremio.nombre}
              onChange={handlePremioChange}
              required
              placeholder="Ej: Primer Premio Nacional"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Valor del Premio"
              name="valor"
              type="number"
              InputProps={{ startAdornment: <CurrencyExchangeIcon fontSize="small" sx={{ mr: 1 }} /> }}
              value={nuevoPremio.valor}
              onChange={handlePremioChange}
              required
              placeholder="Valor en USD"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="categoria-label">Categoría</InputLabel>
              <Select
                labelId="categoria-label"
                id="categoria"
                name="categoria"
                value={nuevoPremio.categoria}
                onChange={handlePremioChange}
                label="Categoría"
              >
                {categorias.map((cat) => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Descripción"
              name="descripcion"
              value={nuevoPremio.descripcion}
              onChange={handlePremioChange}
              multiline
              rows={2}
              placeholder="Describa los detalles del premio"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Orden"
              name="orden"
              type="number"
              value={nuevoPremio.orden}
              onChange={handlePremioChange}
              placeholder="Orden de visualización (opcional)"
              helperText="Números menores aparecen primero"
            />
          </Grid>
          
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            {editMode && (
              <Button 
                variant="outlined" 
                color="secondary"
                onClick={cancelarEdicion}
              >
                Cancelar
              </Button>
            )}
            <Button 
              variant="contained" 
              color="primary"
              startIcon={editMode ? <EditIcon /> : <AddIcon />}
              onClick={guardarPremio}
            >
              {editMode ? 'Actualizar Premio' : 'Agregar Premio'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Lista de premios */}
      {activeTab === 'nacionales' && (
        <div>
          <Typography variant="subtitle1" gutterBottom>
            Premios Nacionales Configurados
          </Typography>
          
          {formData.premiosNacionales.length === 0 ? (
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No hay premios nacionales configurados.
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Categoría</TableCell>
                    <TableCell>Valor</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Orden</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.premiosNacionales.map((premio, index) => (
                    <TableRow key={index}>
                      <TableCell>{premio.nombre}</TableCell>
                      <TableCell>
                        <Chip 
                          label={getNombreCategoria(premio.categoria)} 
                          size="small"
                          color={premio.categoria === 'principal' ? 'primary' : premio.categoria === 'secundario' ? 'secondary' : 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{Number(premio.valor).toLocaleString('es-VE')}</TableCell>
                      <TableCell>{premio.descripcion || '-'}</TableCell>
                      <TableCell>{premio.orden || '-'}</TableCell>
                      <TableCell align="center">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => editarPremio('nacional', index)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => eliminarPremio('nacional', index)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </div>
      )}
      
      {activeTab === 'regionales' && (
        <div>
          <Typography variant="subtitle1" gutterBottom>
            Premios Regionales por Estado
          </Typography>
          
          {Object.keys(formData.premiosRegionales).length === 0 ? (
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No hay premios regionales configurados.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {Object.entries(formData.premiosRegionales).map(([estado, premios]) => (
                <Grid item xs={12} key={estado}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {estado}
                      </Typography>
                      
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Nombre</TableCell>
                              <TableCell>Categoría</TableCell>
                              <TableCell>Valor</TableCell>
                              <TableCell>Descripción</TableCell>
                              <TableCell align="center">Acciones</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {premios.map((premio, index) => (
                              <TableRow key={index}>
                                <TableCell>{premio.nombre}</TableCell>
                                <TableCell>
                                  <Chip 
                                    label={getNombreCategoria(premio.categoria)} 
                                    size="small"
                                    color={premio.categoria === 'principal' ? 'primary' : premio.categoria === 'secundario' ? 'secondary' : 'default'}
                                    variant="outlined"
                                  />
                                </TableCell>
                                <TableCell>{Number(premio.valor).toLocaleString('es-VE')}</TableCell>
                                <TableCell>{premio.descripcion || '-'}</TableCell>
                                <TableCell align="center">
                                  <IconButton 
                                    size="small" 
                                    color="primary"
                                    onClick={() => editarPremio('regional', index, estado)}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton 
                                    size="small" 
                                    color="error"
                                    onClick={() => eliminarPremio('regional', index, estado)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </div>
      )}
      
      {/* Resumen de premios */}
      <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="subtitle1" gutterBottom>
          Resumen de Premios
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2">
              <strong>Total Premios Nacionales:</strong> {formData.premiosNacionales.length}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="body2">
              <strong>Valor Total Premios Nacionales:</strong> {formData.premiosNacionales.reduce((total, premio) => total + Number(premio.valor || 0), 0).toLocaleString('es-VE')}
            </Typography>
          </Grid>
          
          {data.tipoSorteo !== 'nacional' && (
            <>
              <Grid item xs={12} md={6}>
                <Typography variant="body2">
                  <strong>Estados con Premios Regionales:</strong> {Object.keys(formData.premiosRegionales).length}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="body2">
                  <strong>Valor Total Premios Regionales:</strong> {
                    Object.values(formData.premiosRegionales)
                      .flat()
                      .reduce((total, premio) => total + Number(premio.valor || 0), 0)
                      .toLocaleString('es-VE')
                  }
                </Typography>
              </Grid>
            </>
          )}
        </Grid>
      </Box>
    </div>
  );
}

export default GestionPremios; 