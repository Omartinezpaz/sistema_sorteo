import { 
  Box, 
  Stepper, 
  Step, 
  StepLabel, 
  Button, 
  Typography, 
  Paper,
  Container,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert
} from '@mui/material';
import { useState, useEffect } from 'react';
import InformacionBasica from '../../components/sorteo/InformacionBasica';
import ConfiguracionTickets from '../../components/sorteo/ConfiguracionTickets';
import GestionPremios from '../../components/sorteo/GestionPremios';
import MetodoSeleccion from '../../components/sorteo/MetodoSeleccion';
import RevisionConfirmacion from '../../components/sorteo/RevisionConfirmacion';
import './CreacionSorteo.css';
import dayjs from 'dayjs';
import { formatearFecha, fechaToISOString } from './utils/dates';

// Definición de los pasos del stepper
const steps = [
  'Información Básica',
  'Configuración de Tickets',
  'Gestión de Premios',
  'Método de Selección',
  'Revisión y Confirmación'
];

function CreacionSorteo({ sorteoId, onComplete, initialStep = 0, readOnly = false }) {
  const [activeStep, setActiveStep] = useState(initialStep);
  const [sorteoData, setSorteoData] = useState({
    // Información básica
    nombre: '',
    descripcion: '',
    fechaHora: null,
    tipoSorteo: 'nacional', // nacional, regional, mixto
    
    // Configuración de tickets
    formatoNumeracion: '',
    rangosEstado: [],
    prefijosRegionales: {},

    // Premios
    premiosNacionales: [],
    premiosRegionales: {},
    
    // Método de selección
    metodoSeleccion: 'aleatorio', // aleatorio, secuencial
    permitirRepeticion: false,
    restriccionesRegionales: [],
    
    // Metadata adicional
    estado: 'borrador', // borrador, configurado, en_progreso, completado
    creadoPor: '',
    fechaCreacion: null
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    content: '',
    actions: []
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Cargar datos del sorteo si se proporciona un ID
  useEffect(() => {
    if (sorteoId) {
      setIsEdit(true);
      loadSorteoData(sorteoId);
    }
  }, [sorteoId]);

  // Cargar datos del sorteo desde la base de datos
  const loadSorteoData = async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await window.electronAPI.dbQuery(
        'SELECT * FROM sorteos WHERE id = $1',
        [id]
      );
      
      if (response.rows && response.rows.length > 0) {
        const sorteo = response.rows[0];
        
        // Convertir la fecha de string ISO a objeto dayjs
        let fechaHora = null;
        if (sorteo.fecha_hora) {
          fechaHora = dayjs(sorteo.fecha_hora);
        }
        
        // Parsear metadata JSON
        let metadata = {};
        try {
          metadata = sorteo.metadata ? JSON.parse(sorteo.metadata) : {};
        } catch (e) {
          console.error('Error al parsear metadata:', e);
          metadata = {};
        }
        
        // Actualizar el estado con los datos cargados
        setSorteoData({
          nombre: sorteo.nombre || '',
          descripcion: sorteo.descripcion || '',
          fechaHora: fechaHora,
          tipoSorteo: sorteo.tipo_sorteo || 'nacional',
          formatoNumeracion: metadata.formatoNumeracion || '',
          rangosEstado: metadata.rangosEstado || [],
          prefijosRegionales: metadata.prefijosRegionales || {},
          premiosNacionales: metadata.premiosNacionales || [],
          premiosRegionales: metadata.premiosRegionales || {},
          metodoSeleccion: metadata.metodoSeleccion || 'aleatorio',
          permitirRepeticion: metadata.permitirRepeticion || false,
          restriccionesRegionales: metadata.restriccionesRegionales || [],
          estado: sorteo.estado || 'borrador',
          creadoPor: sorteo.creado_por || '',
          fechaCreacion: sorteo.fecha_creacion ? dayjs(sorteo.fecha_creacion) : null
        });
      } else {
        throw new Error(`No se encontró el sorteo con ID: ${id}`);
      }
    } catch (error) {
      console.error('Error al cargar datos del sorteo:', error);
      setError(`Error al cargar datos del sorteo: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Actualizar datos del sorteo
  const updateSorteoData = (newData) => {
    setSorteoData(prevData => ({
      ...prevData,
      ...newData
    }));
  };

  // Manejar el avance al siguiente paso
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  // Manejar el retroceso al paso anterior
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Manejar el guardado del sorteo
  const handleSaveSorteo = async () => {
    try {
      // Convertir la fecha a formato ISO estándar usando la función de utilidad
      const fechaISO = fechaToISOString(sorteoData.fechaHora);

      // Validar que tenemos una fecha válida
      if (!fechaISO) {
        throw new Error('La fecha del sorteo es requerida y debe ser válida');
      }

      // Crear objeto para guardar
      const sorteoDataParaGuardar = {
        ...sorteoData,
        fechaHora: fechaISO // Usar el string ISO en lugar del objeto dayjs
      };

      let response;
      
      // Determinar si es una actualización o inserción nueva
      if (isEdit && sorteoId) {
        // Actualizar sorteo existente
        response = await window.electronAPI.dbQuery(
          `UPDATE sorteos SET 
            nombre = $1, 
            descripcion = $2, 
            fecha_hora = $3, 
            tipo_sorteo = $4, 
            metadata = $5, 
            actualizado_en = NOW() 
          WHERE id = $6 
          RETURNING *`,
          [
            sorteoDataParaGuardar.nombre,
            sorteoDataParaGuardar.descripcion,
            fechaISO,
            sorteoDataParaGuardar.tipoSorteo,
            JSON.stringify({
              formatoNumeracion: sorteoDataParaGuardar.formatoNumeracion,
              rangosEstado: sorteoDataParaGuardar.rangosEstado,
              prefijosRegionales: sorteoDataParaGuardar.prefijosRegionales,
              premiosNacionales: sorteoDataParaGuardar.premiosNacionales,
              premiosRegionales: sorteoDataParaGuardar.premiosRegionales,
              metodoSeleccion: sorteoDataParaGuardar.metodoSeleccion,
              permitirRepeticion: sorteoDataParaGuardar.permitirRepeticion,
              restriccionesRegionales: sorteoDataParaGuardar.restriccionesRegionales
            }),
            sorteoId
          ]
        );
      } else {
        // Insertar nuevo sorteo
        response = await window.electronAPI.dbQuery(
          `INSERT INTO sorteos (
            nombre, 
            descripcion, 
            fecha_hora, 
            tipo_sorteo, 
            estado, 
            metadata, 
            creado_por, 
            creado_en
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) 
          RETURNING *`,
          [
            sorteoDataParaGuardar.nombre,
            sorteoDataParaGuardar.descripcion,
            fechaISO,
            sorteoDataParaGuardar.tipoSorteo,
            'configurado', // Estado inicial al guardar
            JSON.stringify({
              formatoNumeracion: sorteoDataParaGuardar.formatoNumeracion,
              rangosEstado: sorteoDataParaGuardar.rangosEstado,
              prefijosRegionales: sorteoDataParaGuardar.prefijosRegionales,
              premiosNacionales: sorteoDataParaGuardar.premiosNacionales,
              premiosRegionales: sorteoDataParaGuardar.premiosRegionales,
              metodoSeleccion: sorteoDataParaGuardar.metodoSeleccion,
              permitirRepeticion: sorteoDataParaGuardar.permitirRepeticion,
              restriccionesRegionales: sorteoDataParaGuardar.restriccionesRegionales
            }),
            'sistema' // Usuario por defecto
          ]
        );
      }

      if (response.rows && response.rows.length > 0) {
        const savedSorteo = response.rows[0];
        setSaveSuccess(true);
        
        // Notificar al componente padre que se ha completado la operación
        if (onComplete && typeof onComplete === 'function') {
          onComplete(savedSorteo);
        }
        
        // Mostrar mensaje de éxito
        showDialog(
          'Sorteo Guardado',
          `El sorteo "${savedSorteo.nombre}" ha sido guardado exitosamente.`,
          [
            {
              text: 'Aceptar',
              onClick: () => {
                setDialogOpen(false);
                // Redirigir o realizar otra acción después de guardar
              },
              color: 'primary'
            }
          ]
        );
      } else {
        throw new Error('No se recibió confirmación de la operación');
      }
    } catch (error) {
      console.error('Error al guardar sorteo:', error);
      setError(`Error al guardar sorteo: ${error.message || 'Error desconocido'}`);
      
      // Mostrar diálogo de error
      showDialog(
        'Error',
        `No se pudo guardar el sorteo: ${error.message || 'Error desconocido'}`,
        [
          {
            text: 'Aceptar',
            onClick: () => setDialogOpen(false),
            color: 'primary'
          }
        ]
      );
    }
  };

  // Mostrar diálogo personalizado
  const showDialog = (title, content, actions = []) => {
    setDialogConfig({
      title,
      content,
      actions: actions.length > 0 ? actions : [
        {
          text: 'Cerrar',
          onClick: () => setDialogOpen(false),
          color: 'primary'
        }
      ]
    });
    setDialogOpen(true);
  };

  // Renderizar el paso actual
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <InformacionBasica 
            data={sorteoData} 
            updateData={updateSorteoData} 
            readOnly={readOnly}
          />
        );
      case 1:
        return (
          <ConfiguracionTickets 
            data={sorteoData} 
            updateData={updateSorteoData} 
            readOnly={readOnly}
          />
        );
      case 2:
        return (
          <GestionPremios 
            data={sorteoData} 
            updateData={updateSorteoData} 
            readOnly={readOnly}
          />
        );
      case 3:
        return (
          <MetodoSeleccion 
            data={sorteoData} 
            updateData={updateSorteoData} 
            readOnly={readOnly}
          />
        );
      case 4:
        return (
          <RevisionConfirmacion 
            data={sorteoData} 
            readOnly={readOnly}
          />
        );
      default:
        return 'Paso desconocido';
    }
  };

  return (
    <Container maxWidth="lg" className="creacion-sorteo-container">
      <Paper elevation={3} className="creacion-sorteo-paper">
        <Typography variant="h4" component="h1" gutterBottom>
          {isEdit ? 'Editar Sorteo' : 'Crear Nuevo Sorteo'}
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {saveSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Sorteo guardado exitosamente.
          </Alert>
        )}
        
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Box sx={{ mt: 4, mb: 2 }}>
          {getStepContent(activeStep)}
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button
            disabled={activeStep === 0 || isLoading || readOnly}
            onClick={handleBack}
            variant="outlined"
          >
            Atrás
          </Button>
          
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSaveSorteo}
                disabled={isLoading || readOnly}
              >
                {isLoading ? 'Guardando...' : 'Guardar Sorteo'}
              </Button>
            ) : (
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleNext}
                disabled={isLoading || readOnly}
              >
                Siguiente
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
      
      {/* Diálogo personalizado */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {dialogConfig.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {dialogConfig.content}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          {dialogConfig.actions.map((action, index) => (
            <Button 
              key={index} 
              onClick={action.onClick} 
              color={action.color || 'primary'}
              variant={action.variant || 'text'}
            >
              {action.text}
            </Button>
          ))}
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default CreacionSorteo;