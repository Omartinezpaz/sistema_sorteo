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
  InputAdornment,
  Tooltip,
  Alert,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  MenuItem,
  Select,
  Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

function ConfiguracionTickets({ data, onChange }) {
  // Estado local
  const [formData, setFormData] = useState({
    formatoNumeracion: data?.formatoNumeracion || '2552025-{PREFIJO}{NUMERO}',
    rangosEstado: data?.rangosEstado || [],
    prefijosRegionales: data?.prefijosRegionales || {}
  });
  
  // Estado para manejar los rangos nuevos
  const [nuevoRango, setNuevoRango] = useState({
    estado: '',
    prefijo: '',
    inicio: '',
    fin: '',
    cantidad: 0
  });
  
  // Lista simplificada de estados para el selector
  const estadosDisponibles = [
    { nombre: "DTTO. CAPITAL", prefijo: "DC" },
    { nombre: "EDO. AMAZONAS", prefijo: "AMA" },
    { nombre: "EDO. ANZOATEGUI", prefijo: "ANZ" },
    { nombre: "EDO. APURE", prefijo: "APU" },
    { nombre: "EDO. ARAGUA", prefijo: "ARA" },
    { nombre: "EDO. BARINAS", prefijo: "BAR" },
    { nombre: "EDO. BOLIVAR", prefijo: "BOL" },
    { nombre: "EDO. CARABOBO", prefijo: "CAR" },
    { nombre: "EDO. COJEDES", prefijo: "COJ" },
    { nombre: "EDO. FALCON", prefijo: "FAL" },
    { nombre: "EDO. GUARICO", prefijo: "GUA" },
    { nombre: "EDO. LARA", prefijo: "LAR" },
    { nombre: "EDO. MERIDA", prefijo: "MER" },
    { nombre: "EDO. MIRANDA", prefijo: "MIR" },
    { nombre: "EDO. MONAGAS", prefijo: "MON" },
    { nombre: "EDO. NUEVA ESPARTA", prefijo: "ESP" },
    { nombre: "EDO. PORTUGUESA", prefijo: "POR" },
    { nombre: "EDO. SUCRE", prefijo: "SUC" },
    { nombre: "EDO. TACHIRA", prefijo: "TAC" },
    { nombre: "EDO. TRUJILLO", prefijo: "TRU" },
    { nombre: "EDO. YARACUY", prefijo: "YAR" },
    { nombre: "EDO. ZULIA", prefijo: "ZUL" },
    { nombre: "EDO. DELTA AMACURO", prefijo: "EDA" },
    { nombre: "EDO. LA GUAIRA", prefijo: "ELG" }
  ];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogTitle, setDialogTitle] = useState('Información');
  const [error, setError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [dialogButtons, setDialogButtons] = useState(null);
  
  // Recalcular cantidad cuando cambian inicio o fin
  useEffect(() => {
    if (nuevoRango.inicio && nuevoRango.fin) {
      const inicio = parseInt(nuevoRango.inicio);
      const fin = parseInt(nuevoRango.fin);
      
      if (!isNaN(inicio) && !isNaN(fin) && fin >= inicio) {
        const cantidad = fin - inicio + 1;
        setNuevoRango({ ...nuevoRango, cantidad });
      }
    }
  }, [nuevoRango.inicio, nuevoRango.fin]);
  
  // Propagación de cambios al componente padre
  useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);
  
  // Mostrar diálogo con mensaje y botones personalizados
  const showDialog = (title, message, buttons = null) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogButtons(buttons);
    setDialogOpen(true);
  };
  
  // Manejar cambios en el formato de numeración
  const handleFormatoChange = (e) => {
    const newFormData = { ...formData, formatoNumeracion: e.target.value };
    setFormData(newFormData);
  };
  
  // Manejar cambios en los campos del nuevo rango
  const handleNuevoRangoChange = (e) => {
    const { name, value } = e.target;
    
    // Si se selecciona un estado, obtener su prefijo predefinido
    if (name === 'estado') {
      const estadoSeleccionado = estadosDisponibles.find(edo => edo.nombre === value);
      if (estadoSeleccionado) {
        setNuevoRango({
          ...nuevoRango,
          estado: value,
          prefijo: estadoSeleccionado.prefijo
        });
      } else {
        setNuevoRango({ ...nuevoRango, estado: value });
      }
    } else {
      setNuevoRango({ ...nuevoRango, [name]: value });
    }
  };
  
  // Función para mostrar el ejemplo de numeración
  const getEjemploFormatoNumero = () => {
    const prefijoEjemplo = "EZ";
    const numeroEjemplo = "0330224";
    return formData.formatoNumeracion
      .replace('{PREFIJO}', prefijoEjemplo)
      .replace('{NUMERO}', numeroEjemplo);
  };
  
  // Probar distribución
  const probarDistribucion = () => {
    if (formData.rangosEstado.length === 0) {
      setError('No hay rangos definidos para probar la distribución.');
      return;
    }

    // Calcular estadísticas de distribución
    const totalTickets = formData.rangosEstado.reduce((sum, rango) => sum + rango.cantidad, 0);
    const distribucionPorEstado = formData.rangosEstado.map(rango => ({
      estado: rango.estado,
      cantidad: rango.cantidad,
      porcentaje: ((rango.cantidad / totalTickets) * 100).toFixed(2) + '%'
    }));

    // Mostrar información en diálogo
    const mensaje = (
      <Box>
        <Typography variant="subtitle1" gutterBottom>Resumen de distribución de tickets</Typography>
        <Typography variant="body2" gutterBottom>Total de tickets: {totalTickets}</Typography>
        <TableContainer component={Paper} variant="outlined" sx={{ mt: 2, maxHeight: 300 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Cantidad</TableCell>
                <TableCell align="right">Porcentaje</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {distribucionPorEstado.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.estado}</TableCell>
                  <TableCell align="right">{item.cantidad}</TableCell>
                  <TableCell align="right">{item.porcentaje}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );

    setDialogTitle('Distribución de Tickets');
    setDialogMessage(mensaje);
    setDialogOpen(true);
  };
  
  // Exportar configuración
  const exportarConfiguracion = async () => {
    try {
      if (formData.rangosEstado.length === 0) {
        setError('No hay rangos definidos para exportar.');
        return;
      }

      // Crear contenido del archivo
      let contenido = 'Estado\tPrefijo\tDesde\tHasta\tCantidad\n';
      
      formData.rangosEstado.forEach(rango => {
        contenido += `${rango.estado}\t${rango.prefijo}\t${rango.inicio}\t${rango.fin}\t${rango.cantidad}\n`;
      });

      // Abrir diálogo para guardar archivo
      const result = await window.electron.invoke('dialog:saveFile', {
        title: 'Guardar configuración de rangos',
        defaultPath: 'configuracion_rangos.txt',
        filters: [
          { name: 'Archivos de texto', extensions: ['txt'] }
        ]
      });

      if (result.canceled) {
        return;
      }

      // Guardar archivo
      await window.electron.invoke('fs:writeFile', result.filePath, contenido);
      
      showDialog('Exportación Exitosa', `La configuración se ha guardado exitosamente en:\n${result.filePath}`);
    } catch (error) {
      console.error('Error al exportar configuración:', error);
      setError(`Error al exportar configuración: ${error.message || 'Error desconocido'}`);
    }
  };
  
  // Importar rangos
  const importarRangos = async () => {
    try {
      // Abrir diálogo para seleccionar archivo
      const result = await window.electron.invoke('dialog:openFile', {
        title: 'Seleccionar archivo de rangos de tickets',
        filters: [
          { name: 'Archivos de texto', extensions: ['txt'] }
        ],
        properties: ['openFile']
      });
      
      if (result.canceled) {
        return; // Usuario canceló la selección
      }
      
      const filePath = result.filePaths[0];
      
      // Leer el contenido del archivo
      const fileContent = await window.electron.invoke('fs:readFile', filePath);
      
      if (!fileContent) {
        setError('El archivo seleccionado está vacío o no se pudo leer.');
        return;
      }
      
      // Procesar el contenido del archivo
      const lines = fileContent.split('\n');
      // Eliminar la primera línea si es un encabezado
      if (lines[0].includes('Estado') && lines[0].includes('Prefijo')) {
        lines.shift();
      }
      
      const rangosImportados = [];
      
      for (const line of lines) {
        if (!line.trim()) continue; // Ignorar líneas vacías
        
        const parts = line.trim().split('\t');
        
        if (parts.length >= 5) {
          const [estado, prefijo, inicio, fin, cantidad] = parts;
          
          // Verificar que los valores sean válidos
          if (estado && prefijo && !isNaN(parseInt(inicio)) && !isNaN(parseInt(fin))) {
            rangosImportados.push({
              estado: estado.trim(),
              prefijo: prefijo.trim(),
              inicio: inicio.trim(),
              fin: fin.trim(),
              cantidad: parseInt(cantidad) || (parseInt(fin) - parseInt(inicio) + 1)
            });
          }
        }
      }
      
      if (rangosImportados.length === 0) {
        setError('No se encontraron rangos válidos en el archivo seleccionado.');
        return;
      }
      
      // Actualizar el estado con los rangos importados
      setFormData({
        ...formData,
        rangosEstado: rangosImportados
      });
      
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 5000);
      
    } catch (error) {
      console.error('Error al importar rangos:', error);
      setError(`Error al importar rangos: ${error.message || 'Error desconocido'}`);
    }
  };
  
  // Función para guardar la distribución en la base de datos
  const guardarDistribucion = async () => {
    try {
      if (formData.rangosEstado.length === 0) {
        setError('No hay rangos definidos para guardar.');
        return false;
      }

      const result = await window.electron.invoke('distribucion:guardar', {
        sorteoId: data.sorteoId,
        distribucion: formData.rangosEstado
      });

      if (result.success) {
        showDialog('Éxito', 'La distribución de tickets se ha guardado correctamente en la base de datos.');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error al guardar distribución:', error);
      setError(`Error al guardar la distribución: ${error.message || 'Error desconocido'}`);
      return false;
    }
  };
  
  // Distribuir tickets
  const distribuirTickets = async () => {
    try {
      // Primero guardar la distribución
      const guardadoExitoso = await guardarDistribucion();
      
      if (!guardadoExitoso) {
        return;
      }

      // Mostrar confirmación
      showDialog(
        'Distribución Lista',
        '¿Desea proceder con la generación de tickets?',
        [
          <Button onClick={() => setDialogOpen(false)} color="primary">
            Cancelar
          </Button>,
          <Button 
            onClick={() => {
              setDialogOpen(false);
              // Aquí iría la lógica para iniciar la generación
              if (onChange) {
                onChange({
                  ...formData,
                  accion: 'GENERAR_TICKETS'
                });
              }
            }} 
            color="primary" 
            variant="contained"
            autoFocus
          >
            Generar Tickets
          </Button>
        ]
      );
    } catch (error) {
      console.error('Error al preparar distribución:', error);
      setError(`Error al preparar la distribución: ${error.message || 'Error desconocido'}`);
    }
  };
  
  // Agregar un nuevo rango
  const agregarRango = async () => {
    // Validaciones existentes
    if (!nuevoRango.estado || !nuevoRango.inicio || !nuevoRango.fin) {
      setError('Por favor complete todos los campos obligatorios.');
      return;
    }

    const inicio = parseInt(nuevoRango.inicio);
    const fin = parseInt(nuevoRango.fin);

    if (isNaN(inicio) || isNaN(fin) || inicio > fin) {
      setError('Los rangos numéricos no son válidos.');
      return;
    }

    // Verificar si el estado ya existe
    if (formData.rangosEstado.some(rango => rango.estado === nuevoRango.estado)) {
      setError('Ya existe un rango para este estado.');
      return;
    }

    // Verificar superposición de rangos
    for (const rango of formData.rangosEstado) {
      const rangoInicio = parseInt(rango.inicio);
      const rangoFin = parseInt(rango.fin);

      if ((inicio >= rangoInicio && inicio <= rangoFin) ||
          (fin >= rangoInicio && fin <= rangoFin) ||
          (inicio <= rangoInicio && fin >= rangoFin)) {
        setError('El rango se superpone con otro existente.');
        return;
      }
    }

    // Agregar el nuevo rango
    const nuevosRangos = [...formData.rangosEstado, { ...nuevoRango }];
    setFormData({ ...formData, rangosEstado: nuevosRangos });

    // Limpiar el formulario
    setNuevoRango({
      estado: '',
      prefijo: '',
      inicio: '',
      fin: '',
      cantidad: 0
    });

    setError('');

    // Guardar en la base de datos
    await guardarDistribucion();
  };
  
  // Eliminar un rango
  const eliminarRango = async (index) => {
    const nuevosRangos = formData.rangosEstado.filter((_, i) => i !== index);
    setFormData({ ...formData, rangosEstado: nuevosRangos });

    // Guardar en la base de datos
    await guardarDistribucion();
  };
  
  // Calcular el total de tickets
  const totalTickets = formData.rangosEstado.reduce((sum, rango) => sum + rango.cantidad, 0);
  
  return (
    <div className="configuracion-tickets">
      <Typography variant="h6" component="h2" gutterBottom sx={{ color: '#e91e63' }}>
        Configuración de Tickets
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Sección de importar rangos */}
      <Paper elevation={0} sx={{ mb: 3, p: 2, border: '1px solid #ffd699', bgcolor: '#fff9e6' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" component="h3" color="warning.dark" gutterBottom>
              ¡IMPORTAR RANGOS DE TICKETS!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Carga de manera sencilla los rangos ya definidos desde un archivo de texto (.txt)
            </Typography>
            
            {importSuccess || formData.rangosEstado.length > 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <CheckCircleOutlineIcon color="success" fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2" color="success.main">
                  {formData.rangosEstado.length} rangos configurados ({totalTickets} tickets)
                </Typography>
              </Box>
            ) : null}
          </Box>
          
          <Button 
            variant="contained" 
            color="warning" 
            startIcon={<FileUploadIcon />}
            onClick={importarRangos}
            sx={{ bgcolor: '#ff7043', '&:hover': { bgcolor: '#f4511e' } }}
          >
            IMPORTAR TXT
          </Button>
        </Box>
      </Paper>
      
      {importSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Se cargaron {formData.rangosEstado.length} nuevos rangos de tickets exitosamente. Total: {totalTickets} tickets
        </Alert>
      )}
      
      {/* Formato de numeración */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Formato de Numeración
        </Typography>
        
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          value={formData.formatoNumeracion}
          onChange={handleFormatoChange}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <InfoIcon color="primary" sx={{ fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
        />
        
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          Ejemplo: {getEjemploFormatoNumero()}
        </Typography>
      </Box>
      
      {/* Configuración de rangos */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Configuración de Rangos por Estado
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={3}>
            <Select
              fullWidth
              size="small"
              displayEmpty
              name="estado"
              value={nuevoRango.estado}
              onChange={handleNuevoRangoChange}
            >
              <MenuItem value="" disabled>Estado</MenuItem>
              {estadosDisponibles.map((estado, index) => (
                <MenuItem key={index} value={estado.nombre}>
                  {estado.nombre}
                </MenuItem>
              ))}
            </Select>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              placeholder="Desde"
              size="small"
              name="inicio"
              value={nuevoRango.inicio}
              onChange={handleNuevoRangoChange}
            />
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              placeholder="Hasta"
              size="small"
              name="fin"
              value={nuevoRango.fin}
              onChange={handleNuevoRangoChange}
            />
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              placeholder="Prefijo"
              size="small"
              name="prefijo"
              value={nuevoRango.prefijo}
              onChange={handleNuevoRangoChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <InfoIcon color="primary" sx={{ fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={agregarRango}
            sx={{ textTransform: 'uppercase' }}
          >
            Agregar
          </Button>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
            Configure primero el nivel de distribución territorial en el paso anterior
          </Typography>
          
          <Button
            variant="outlined"
            color="inherit"
            onClick={distribuirTickets}
            sx={{ mr: 1, textTransform: 'uppercase' }}
          >
            Distribuir tickets
          </Button>
          
          <Button
            variant="outlined"
            color="inherit"
            onClick={probarDistribucion}
            sx={{ textTransform: 'uppercase' }}
          >
            Probar
          </Button>
        </Box>
      </Box>
      
      {/* Tabla de rangos */}
      {formData.rangosEstado.length > 0 && (
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Estado</TableCell>
                <TableCell>Prefijo</TableCell>
                <TableCell>Desde</TableCell>
                <TableCell>Hasta</TableCell>
                <TableCell>Cantidad</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {formData.rangosEstado.map((rango, index) => (
                <TableRow key={index}>
                  <TableCell>{rango.estado}</TableCell>
                  <TableCell>{rango.prefijo}</TableCell>
                  <TableCell>{rango.inicio}</TableCell>
                  <TableCell>{rango.fin}</TableCell>
                  <TableCell>{rango.cantidad}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => eliminarRango(index)}
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
      
      {/* Total y exportar */}
      {formData.rangosEstado.length > 0 && (
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2">
            Total de tickets: <strong>{totalTickets}</strong>
          </Typography>
          
          <Box>
            <Button
              variant="outlined"
              startIcon={<FileUploadIcon />}
              onClick={importarRangos}
              size="small"
              sx={{ mr: 2 }}
            >
              IMPORTAR ARCHIVO TXT
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={exportarConfiguracion}
              size="small"
            >
              EXPORTAR CONFIGURACIÓN
            </Button>
          </Box>
        </Box>
      )}
      
      {/* Diálogo para mensajes */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md">
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          {typeof dialogMessage === 'string' ? (
            <DialogContentText>{dialogMessage}</DialogContentText>
          ) : (
            dialogMessage
          )}
        </DialogContent>
        <DialogActions>
          {dialogButtons ? (
            dialogButtons.map((button, index) => (
              <Button 
                key={index} 
                onClick={() => {
                  if (button.onClick) button.onClick();
                  else setDialogOpen(false);
                }} 
                color={button.color || 'inherit'}
                variant={button.variant || 'text'}
              >
                {button.text}
              </Button>
            ))
          ) : (
            <Button onClick={() => setDialogOpen(false)} color="primary">
              Aceptar
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default ConfiguracionTickets;