import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Build as BuildIcon,
  Storage as StorageIcon
} from '@mui/icons-material';

// En un entorno real, esto usaría IPC para comunicarse con el proceso principal
// Aquí simulamos una capa de comunicación con el backend
const api = {
  runChecks: () => {
    return window.electron.invoke('run-checks');
  },
  fixSchema: () => {
    return window.electron.invoke('fix-schema');
  }
};

// Componente para mostrar el estado de la verificación
const StatusIcon = ({ status }) => {
  switch (status) {
    case 'success':
      return <CheckCircleIcon color="success" />;
    case 'warning':
      return <WarningIcon color="warning" />;
    case 'error':
      return <ErrorIcon color="error" />;
    default:
      return <CircularProgress size={24} />;
  }
};

// Componente principal de verificación previa
const VerificacionPrevia = () => {
  const [verificacion, setVerificacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [fixingSchema, setFixingSchema] = useState(false);
  const [fixResult, setFixResult] = useState(null);

  // Ejecutar verificaciones al cargar el componente
  useEffect(() => {
    runVerificaciones();
  }, []);

  // Función para ejecutar verificaciones
  const runVerificaciones = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.runChecks();
      setVerificacion(result);
    } catch (err) {
      setError('Error al ejecutar verificaciones: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para abrir diálogo de detalles
  const showDetails = (check) => {
    setSelectedDetails(check);
    setDetailsOpen(true);
  };

  // Función para reparar el esquema de la base de datos
  const repararEsquema = async () => {
    setFixingSchema(true);
    setFixResult(null);
    try {
      const result = await api.fixSchema();
      setFixResult({
        success: true,
        message: 'Esquema reparado correctamente. Se recomienda ejecutar una nueva verificación.'
      });
      // Refrescar verificaciones después de reparar
      setTimeout(() => {
        runVerificaciones();
      }, 2000);
    } catch (err) {
      setFixResult({
        success: false,
        message: 'Error al reparar esquema: ' + err.message
      });
    } finally {
      setFixingSchema(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Ejecutando verificaciones previas...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={runVerificaciones}
          startIcon={<RefreshIcon />}
          sx={{ mt: 2 }}
        >
          Reintentar
        </Button>
      </Box>
    );
  }

  if (!verificacion) {
    return null;
  }

  // Determinar el color general según el resultado
  const getOverallColor = () => {
    switch (verificacion.overall) {
      case 'success': return 'success.main';
      case 'warning': return 'warning.main';
      case 'error': return 'error.main';
      default: return 'text.primary';
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Verificación Previa al Sorteo
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <StatusIcon status={verificacion.overall} />
          <Typography variant="h6" sx={{ ml: 1, color: getOverallColor() }}>
            Estado General: {verificacion.overall.toUpperCase()}
          </Typography>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Fecha: {new Date(verificacion.date).toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sistema: {verificacion.system.platform} {verificacion.system.arch}
          </Typography>
        </Box>
        
        <Button 
          variant="contained" 
          color="primary" 
          onClick={runVerificaciones}
          startIcon={<RefreshIcon />}
          sx={{ mr: 1 }}
        >
          Actualizar Verificación
        </Button>
      </Paper>
      
      <Typography variant="h6" gutterBottom>
        Resultados de las verificaciones
      </Typography>
      
      <List>
        {Object.entries(verificacion.checks).map(([checkName, check]) => (
          <Paper key={checkName} sx={{ mb: 2 }}>
            <ListItem
              button
              onClick={() => showDetails(check)}
              secondaryAction={
                checkName === 'schemaValid' && check.status !== 'success' ? (
                  <Button
                    variant="contained"
                    color="warning"
                    size="small"
                    startIcon={<BuildIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      repararEsquema();
                    }}
                    disabled={fixingSchema}
                  >
                    {fixingSchema ? 'Reparando...' : 'Reparar'}
                  </Button>
                ) : null
              }
            >
              <ListItemIcon>
                <StatusIcon status={check.status} />
              </ListItemIcon>
              <ListItemText 
                primary={translateCheckName(checkName)}
                secondary={getStatusDescription(check.status)}
                primaryTypographyProps={{
                  fontWeight: check.status !== 'success' ? 'bold' : 'normal'
                }}
              />
            </ListItem>
          </Paper>
        ))}
      </List>
      
      {fixResult && (
        <Alert 
          severity={fixResult.success ? "success" : "error"}
          sx={{ mt: 2 }}
        >
          {fixResult.message}
        </Alert>
      )}
      
      {/* Diálogo de detalles */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Detalles de verificación: {selectedDetails && translateCheckName(Object.keys(verificacion.checks)
            .find(key => verificacion.checks[key] === selectedDetails))}
        </DialogTitle>
        <DialogContent dividers>
          {selectedDetails && (
            <DetailsContent details={selectedDetails} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Componente para mostrar detalles de cada verificación
const DetailsContent = ({ details }) => {
  if (!details || !details.details) {
    return <Typography>No hay detalles disponibles</Typography>;
  }
  
  // Renderizar contenido específico según el tipo de verificación
  if (details.details.missingTables) {
    return (
      <Box>
        <Typography variant="subtitle1">Tablas Requeridas:</Typography>
        <Box component="ul">
          {details.details.required.map(table => (
            <Box component="li" key={table}>
              {table} - {details.details.missing.includes(table) ? (
                <Chip size="small" label="Faltante" color="error" />
              ) : (
                <Chip size="small" label="Presente" color="success" />
              )}
            </Box>
          ))}
        </Box>
      </Box>
    );
  }
  
  if (details.details.invalidTables) {
    return (
      <Box>
        <Typography variant="subtitle1">Validación de Estructura:</Typography>
        
        {details.details.missingTables.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="error.main">
              Tablas Faltantes:
            </Typography>
            <Box component="ul">
              {details.details.missingTables.map(table => (
                <Box component="li" key={table}>{table}</Box>
              ))}
            </Box>
          </Box>
        )}
        
        <Typography variant="subtitle2">
          Detalles por Tabla:
        </Typography>
        
        {Object.entries(details.details.tables).map(([tableName, tableDetails]) => (
          <Accordion key={tableName}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <StatusIcon status={tableDetails.valid ? 'success' : 'warning'} />
                <Typography sx={{ ml: 1 }}>{tableName}</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {!tableDetails.valid && tableDetails.error && (
                <Alert severity="error" sx={{ mb: 2 }}>{tableDetails.error}</Alert>
              )}
              
              {tableDetails.details && (
                <Box>
                  {tableDetails.details.missingColumns.length > 0 && (
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2">Columnas faltantes:</Typography>
                      <Box component="ul" sx={{ ml: 1 }}>
                        {tableDetails.details.missingColumns.map(col => (
                          <Box component="li" key={col}>{col}</Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                  
                  {tableDetails.details.typeMismatchColumns.length > 0 && (
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2">Tipos de datos incorrectos:</Typography>
                      <Box component="ul" sx={{ ml: 1 }}>
                        {tableDetails.details.typeMismatchColumns.map(col => (
                          <Box component="li" key={col.column}>
                            {col.column}: Esperado {col.expected}, Actual {col.actual}
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                  
                  {tableDetails.details.primaryKey && !tableDetails.details.primaryKey.valid && (
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="error.main">
                        Problema con clave primaria: {tableDetails.details.primaryKey.error}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  }
  
  if (details.details.dependencies) {
    return (
      <Box>
        <Typography variant="subtitle1">Dependencias:</Typography>
        <Box component="ul">
          {Object.entries(details.details.dependencies).map(([dep, installed]) => (
            <Box component="li" key={dep}>
              {dep} - {installed ? (
                <Chip size="small" label="Instalada" color="success" />
              ) : (
                <Chip size="small" label="Faltante" color="error" />
              )}
            </Box>
          ))}
        </Box>
      </Box>
    );
  }
  
  if (details.details.memory) {
    return (
      <Box>
        <Typography variant="subtitle1">Recursos del Sistema:</Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Memoria:</Typography>
          <Box component="ul">
            <Box component="li">Total: {details.details.memory.totalMemoryMB} MB</Box>
            <Box component="li">Libre: {details.details.memory.freeMemoryMB} MB</Box>
            <Box component="li">Uso: {details.details.memory.usagePercent}%</Box>
            <Box component="li">Mínimo recomendado: {details.details.memory.minimum.totalMemoryMB} MB</Box>
          </Box>
        </Box>
        
        <Box>
          <Typography variant="subtitle2">CPU:</Typography>
          <Box component="ul">
            <Box component="li">Núcleos: {details.details.cpu.cores}</Box>
            <Box component="li">Mínimo recomendado: {details.details.cpu.minimum.cores} núcleos</Box>
          </Box>
        </Box>
      </Box>
    );
  }
  
  // Si no hay un formato específico, mostrar los detalles como JSON
  return (
    <Box component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
      {JSON.stringify(details.details, null, 2)}
    </Box>
  );
};

// Función para traducir nombres de verificaciones
function translateCheckName(checkName) {
  const translations = {
    database: 'Conexión a Base de Datos',
    diskSpace: 'Espacio en Disco',
    directories: 'Directorios de la Aplicación',
    tablesExist: 'Tablas Requeridas',
    schemaValid: 'Estructura de Base de Datos',
    dependencies: 'Dependencias del Sistema',
    systemResources: 'Recursos del Sistema'
  };
  
  return translations[checkName] || checkName;
}

// Función para obtener una descripción del estado
function getStatusDescription(status) {
  switch (status) {
    case 'success':
      return 'Correctamente configurado';
    case 'warning':
      return 'Hay advertencias que deberían revisarse';
    case 'error':
      return 'Existe un problema crítico que debe solucionarse';
    default:
      return 'Estado desconocido';
  }
}

export default VerificacionPrevia; 