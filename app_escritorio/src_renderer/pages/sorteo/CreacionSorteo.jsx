import React, { useState, useEffect } from 'react';
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
import InformacionBasica from '../../components/sorteo/InformacionBasica';
import ConfiguracionTickets from '../../components/sorteo/ConfiguracionTickets';
import GestionPremios from '../../components/sorteo/GestionPremios';
import MetodoSeleccion from '../../components/sorteo/MetodoSeleccion';
import RevisionConfirmacion from '../../components/sorteo/RevisionConfirmacion';
import './CreacionSorteo.css';
import dayjs from 'dayjs';
import { useParams } from 'react-router-dom';

// Definición de los pasos del stepper
const steps = [
  'Información Básica',
  'Configuración de Tickets',
  'Gestión de Premios',
  'Método de Selección',
  'Revisión y Confirmación'
];

const CreacionSorteo = ({ onComplete, initialStep = 0, readOnly = false }) => {
  const { sorteoId } = useParams();
  const [activeStep, setActiveStep] = useState(readOnly ? 4 : initialStep);
  const [sorteoData, setSorteoData] = useState({
    nombre: '',
    descripcion: '',
    fecha_sorteo: null,
    estado: 'borrador',
    premios: [],
    participantes: [],
    metodo_seleccion: null,
    metadata: {}
  });
  const [loading, setLoading] = useState(!!sorteoId);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogSuccess, setDialogSuccess] = useState(true);

  // Cargar datos del sorteo si existe ID
  useEffect(() => {
    const cargarDatosSorteo = async () => {
      if (!sorteoId) return;
      
      try {
        setLoading(true);
        // Obtener datos básicos del sorteo
        const sorteo = await window.electron.invoke('sorteos:getSorteoById', sorteoId);
        
        if (!sorteo) {
          throw new Error('No se encontró el sorteo');
        }

        // Obtener premios del sorteo
        const premios = await window.electron.invoke('premios:obtenerPorSorteo', sorteoId);
        
        // Obtener método de selección si existe
        let metodoSeleccion = null;
        try {
          metodoSeleccion = await window.electron.invoke('sorteos:getMetodoSeleccion', sorteoId);
        } catch (error) {
          console.warn('No se encontró método de selección:', error);
        }

        // Combinar todos los datos
        setSorteoData({
          ...sorteo,
          premios: premios || [],
          metodo_seleccion: metodoSeleccion,
          metadata: sorteo.metadata || {}
        });

        // Si estamos en modo lectura y no hay método de selección configurado
        if (readOnly && !metodoSeleccion) {
          setDialogMessage('Se recomienda configurar el Método de Selección de Ganadores antes de continuar.');
          setDialogSuccess(false);
          setDialogOpen(true);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error al cargar datos del sorteo:', error);
        setError(`Error al cargar el sorteo: ${error.message}`);
        setLoading(false);
      }
    };

    cargarDatosSorteo();
  }, [sorteoId, readOnly]);

  // Manejar el cambio de datos en cada paso
  const handleDataChange = (data) => {
    // Imprimir los datos recibidos para depuración
    console.log('Datos recibidos en handleDataChange:', data);
    
    // Si hay una fecha en los datos, añadir logs específicos
    if (data.fechaHora !== undefined) {
      console.log('Tipo de fechaHora recibida:', typeof data.fechaHora);
      console.log('Valor de fechaHora recibida:', data.fechaHora);
    }
    
    setSorteoData(prevData => {
      const newData = { ...prevData, ...data };
      console.log('Nuevo estado de sorteoData:', newData);
      return newData;
    });
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
      console.log('Iniciando guardado de sorteo:', {
        sorteoData,
        premios: sorteoData.premiosNacionales,
        distribucionTiques: sorteoData.rangosEstado
      });

      // Paso 1: Extraer la fecha en formato ISO string
      let fechaISO = null;

      if (sorteoData.fechaHora) {
        console.log('Procesando fecha para guardar:', {
          valor: sorteoData.fechaHora,
          tipo: typeof sorteoData.fechaHora,
          isDayjs: sorteoData.fechaHora && typeof sorteoData.fechaHora.format === 'function',
          propiedades: sorteoData.fechaHora && typeof sorteoData.fechaHora === 'object' ? Object.keys(sorteoData.fechaHora) : []
        });

        // Caso 1: Es un objeto dayjs directamente
        if (sorteoData.fechaHora && typeof sorteoData.fechaHora.format === 'function') {
          // Usar formato ISO estricto para preservar zona horaria
          fechaISO = sorteoData.fechaHora.format('YYYY-MM-DDTHH:mm:ss.SSSZ');
          console.log('Fecha procesada con dayjs.format():', fechaISO);
        }
        // Caso 2: Es un objeto Date
        else if (sorteoData.fechaHora && typeof sorteoData.fechaHora.toISOString === 'function') {
          fechaISO = sorteoData.fechaHora.toISOString();
          console.log('Fecha procesada con toISOString():', fechaISO);
        }
        // Caso 3: Es un objeto dayjs serializado como string
        else if (typeof sorteoData.fechaHora === 'string' && sorteoData.fechaHora.includes('$isDayjsObject')) {
          try {
            const parsedDayjs = JSON.parse(sorteoData.fechaHora);
            if (parsedDayjs && parsedDayjs.$d) {
              const jsDate = new Date(parsedDayjs.$d);
              fechaISO = jsDate.toISOString();
              console.log('Fecha procesada desde objeto dayjs serializado:', fechaISO);
            }
          } catch (e) {
            console.warn("Error al parsear string de fecha:", e);
          }
        }
        // Caso 4: Es un objeto con propiedad $d (interno de dayjs)
        else if (typeof sorteoData.fechaHora === 'object' && sorteoData.fechaHora.$d) {
          const jsDate = new Date(sorteoData.fechaHora.$d);
          fechaISO = jsDate.toISOString();
          console.log('Fecha procesada desde propiedad $d:', fechaISO, 'JS Date:', jsDate);
        }
        // Caso 5: Ya es un string ISO
        else if (typeof sorteoData.fechaHora === 'string') {
          // Verificar si ya es un formato ISO válido
          if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?([+-]\d{2}:\d{2}|Z)?$/.test(sorteoData.fechaHora)) {
            fechaISO = sorteoData.fechaHora;
            console.log('Fecha ya está en formato ISO:', fechaISO);
          } else {
            // Intentar convertir un string no-ISO a fecha
            try {
              const jsDate = new Date(sorteoData.fechaHora);
              if (!isNaN(jsDate.getTime())) {
                fechaISO = jsDate.toISOString();
                console.log('Fecha convertida desde string no-ISO:', fechaISO);
              } else {
                throw new Error('Formato de fecha inválido');
              }
            } catch (e) {
              console.error('Error procesando string de fecha:', e);
              throw new Error(`Formato de fecha inválido: ${sorteoData.fechaHora}`);
            }
          }
        }
      }

      console.log("Fecha final procesada para guardar:", fechaISO);

      // Validar que tenemos una fecha válida
      if (!fechaISO) {
        throw new Error('La fecha del sorteo es requerida y debe ser válida');
      }

      // Crear una copia del objeto sorteoData para modificar la fecha antes de serializar
      const sorteoDataParaGuardar = {
        ...sorteoData,
        fechaHora: fechaISO
      };

      let response;
      let sorteoId = null;
      
      // Determinar si es una actualización o inserción nueva
      if (sorteoId) {
        console.log('Actualizando sorteo existente:', sorteoId);
        
        // Actualizar sorteo principal
        response = await window.electronAPI.dbQuery(
          `UPDATE sorteos 
           SET nombre = $1, descripcion = $2, fecha_sorteo = $3, estado = $4, 
               estado_actual = $5, metadata = $6, es_publico = $7 
           WHERE id = $8 
           RETURNING id`,
          [
            sorteoData.nombre,
            sorteoData.descripcion,
            fechaISO,
            sorteoData.tipoSorteo,
            sorteoData.estado,
            JSON.stringify(sorteoDataParaGuardar),
            sorteoData.estado === 'programado' ? true : false,
            sorteoId
          ]
        );

        // Actualizar premios
        if (sorteoData.premiosNacionales && sorteoData.premiosNacionales.length > 0) {
          console.log('Actualizando premios para sorteo:', sorteoId);
          
          // Primero eliminar premios existentes
          await window.electronAPI.dbQuery(
            'DELETE FROM premios WHERE sorteo_id = $1',
            [sorteoId]
          );
          
          // Insertar nuevos premios
          for (const premio of sorteoData.premiosNacionales) {
            await window.electronAPI.dbQuery(
              `INSERT INTO premios 
               (sorteo_id, nombre, descripcion, valor, orden, categoria, ambito, estado) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [
                sorteoId,
                premio.nombre,
                premio.descripcion,
                premio.valor,
                premio.orden,
                premio.categoria,
                'nacional',
                'activo'
              ]
            );
          }
        }

        // Actualizar distribución de tiques
        if (sorteoData.rangosEstado && sorteoData.rangosEstado.length > 0) {
          console.log('Actualizando distribución de tiques para sorteo:', sorteoId);
          
          // Primero eliminar distribución existente
          await window.electronAPI.dbQuery(
            'DELETE FROM distribucion_tiques WHERE sorteo_id = $1',
            [sorteoId]
          );
          
          // Insertar nueva distribución
          for (const rango of sorteoData.rangosEstado) {
            await window.electronAPI.dbQuery(
              `INSERT INTO distribucion_tiques 
               (sorteo_id, estado, inicio, fin, prefijo, cantidad) 
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                sorteoId,
                rango.estado,
                rango.inicio,
                rango.fin,
                rango.prefijo,
                rango.cantidad
              ]
            );
          }
        }
        
        setDialogSuccess(true);
        setDialogMessage(`Sorteo actualizado exitosamente con ID: ${sorteoId}`);
      } else {
        console.log('Creando nuevo sorteo');
        // Insertar nuevo sorteo
        response = await window.electronAPI.dbQuery(
          `INSERT INTO sorteos 
           (nombre, descripcion, fecha_sorteo, estado, creado_por, estado_actual, metadata, es_publico) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
           RETURNING id`,
          [
            sorteoData.nombre,
            sorteoData.descripcion,
            fechaISO,
            sorteoData.tipoSorteo,
            1, // ID del usuario actual (mejorar para obtener el ID real)
            sorteoData.estado,
            JSON.stringify(sorteoDataParaGuardar),
            sorteoData.estado === 'programado' ? true : false
          ]
        );
        
        if (response && response.length > 0) {
          sorteoId = response[0].id;
          console.log('Nuevo sorteo creado con ID:', sorteoId);

          // Guardar premios
          if (sorteoData.premiosNacionales && sorteoData.premiosNacionales.length > 0) {
            console.log('Guardando premios nacionales:', sorteoData.premiosNacionales);
            
            for (const premio of sorteoData.premiosNacionales) {
              await window.electronAPI.dbQuery(
                `INSERT INTO premios 
                 (sorteo_id, nombre, descripcion, valor, orden, categoria, ambito, estado) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                  sorteoId,
                  premio.nombre,
                  premio.descripcion,
                  premio.valor,
                  premio.orden,
                  premio.categoria,
                  'nacional',
                  'activo'
                ]
              );
            }
          }

          // Guardar distribución de tiques
          if (sorteoData.rangosEstado && sorteoData.rangosEstado.length > 0) {
            console.log('Guardando distribución de tiques:', sorteoData.rangosEstado);
            
            for (const rango of sorteoData.rangosEstado) {
              await window.electronAPI.dbQuery(
                `INSERT INTO distribucion_tiques 
                 (sorteo_id, estado, inicio, fin, prefijo, cantidad) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                  sorteoId,
                  rango.estado,
                  rango.inicio,
                  rango.fin,
                  rango.prefijo,
                  rango.cantidad
                ]
              );
            }
          }
        }
      }
      
      setDialogSuccess(true);
      setDialogMessage(`Sorteo ${sorteoId ? 'actualizado' : 'creado'} exitosamente con ID: ${sorteoId}`);
      setDialogOpen(true);
      
      // Solo avanzamos al paso final si estamos guardando como programado
      if (sorteoData.estado === 'programado') {
        handleNext();
        // Redirigir automáticamente después de mostrar la pantalla final
        setTimeout(() => {
          if (onComplete) {
            onComplete('sorteos');
          } else {
            window.electronAPI.navegarApp('sorteos');
          }
        }, 2500);
      }
      
      // Redirigir automáticamente después de guardar
      if (sorteoData.estado === 'borrador') {
        // Esperamos un poco para asegurar que el diálogo se muestre al usuario
        setTimeout(() => {
          setDialogOpen(false);
          if (onComplete) {
            onComplete('sorteos');
          } else {
            window.electronAPI.navegarApp('sorteos');
          }
        }, 1500);
      }
    } catch (error) {
      console.error('Error al guardar el sorteo:', error);
      setDialogSuccess(false);
      setDialogMessage(`Error al guardar el sorteo: ${error.message}`);
      setDialogOpen(true);
    }
  };

  // Renderizar el contenido actual basado en el paso activo
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return <InformacionBasica data={sorteoData} onChange={handleDataChange} />;
      case 1:
        return <ConfiguracionTickets data={sorteoData} onChange={handleDataChange} />;
      case 2:
        return <GestionPremios data={sorteoData} onChange={handleDataChange} />;
      case 3:
        return <MetodoSeleccion data={sorteoData} onChange={handleDataChange} />;
      case 4:
        return <RevisionConfirmacion data={sorteoData} />;
      default:
        return 'Paso desconocido';
    }
  };

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} className="creacion-sorteo-paper">
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          {readOnly ? 'Detalles del Sorteo' : 'Creación de Sorteo'}
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <Typography>Cargando datos del sorteo...</Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        ) : (
          <>
            <Stepper activeStep={activeStep} alternativeLabel className="sorteo-stepper">
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <Box className="step-content-container">
              {activeStep === steps.length ? (
                <Box className="sorteo-finalizado">
                  <Typography variant="h5" gutterBottom>
                    Sorteo configurado correctamente
                  </Typography>
                  <Typography variant="subtitle1">
                    El sorteo "{sorteoData.nombre}" ha sido guardado como {sorteoData.estado}.
                    Puede proceder a realizar el sorteo cuando esté listo.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={() => {
                      if (onComplete) onComplete('sorteos');
                      else window.electronAPI.navegarApp('sorteos');
                    }}
                    sx={{ mt: 2, mr: 1 }}
                  >
                    Ver Sorteos
                  </Button>
                  <Button 
                    variant="outlined"
                    onClick={() => {
                      if (onComplete) onComplete('dashboard');
                      else window.electronAPI.navegarApp('dashboard');
                    }}
                    sx={{ mt: 2 }}
                  >
                    Ir al Dashboard
                  </Button>
                </Box>
              ) : (
                <>
                  <Box className="step-content">
                    {getStepContent(activeStep)}
                  </Box>
                  {!readOnly && (
                    <Box className="navigation-buttons">
                      <Button
                        color="inherit"
                        disabled={activeStep === 0}
                        onClick={handleBack}
                        sx={{ mr: 1 }}
                      >
                        Atrás
                      </Button>
                      <Box sx={{ flex: '1 1 auto' }} />
                      <Button 
                        variant="contained" 
                        color="secondary"
                        onClick={() => {
                          setSorteoData({...sorteoData, estado: 'borrador'});
                          handleSaveSorteo();
                        }}
                        sx={{ mr: 1 }}
                      >
                        Guardar Borrador
                      </Button>
                      {activeStep === steps.length - 1 ? (
                        <Button 
                          variant="contained" 
                          color="primary"
                          onClick={() => {
                            setSorteoData({...sorteoData, estado: 'programado'});
                            handleSaveSorteo();
                          }}
                        >
                          Finalizar y Programar
                        </Button>
                      ) : (
                        <Button 
                          variant="contained" 
                          color="primary"
                          onClick={handleNext}
                        >
                          Siguiente
                        </Button>
                      )}
                    </Box>
                  )}
                  {readOnly && (
                    <Box className="navigation-buttons">
                      <Button
                        color="inherit"
                        disabled={activeStep === 0}
                        onClick={handleBack}
                        sx={{ mr: 1 }}
                      >
                        Atrás
                      </Button>
                      <Box sx={{ flex: '1 1 auto' }} />
                      <Button 
                        variant="contained" 
                        color="primary"
                        onClick={() => {
                          if (onComplete) onComplete('sorteos');
                          else window.electronAPI.navegarApp('sorteos');
                        }}
                      >
                        Volver a Sorteos
                      </Button>
                    </Box>
                  )}
                </>
              )}
            </Box>

            {/* Diálogo para mostrar mensajes */}
            <Dialog
              open={dialogOpen}
              onClose={() => {
                setDialogOpen(false);
                if (dialogSuccess) {
                  // Redirigir después de cerrar el diálogo
                  if (onComplete) {
                    onComplete('sorteos');
                  } else {
                    window.electronAPI.navegarApp('sorteos');
                  }
                }
              }}
            >
              <DialogTitle>{dialogSuccess ? "Éxito" : "Error"}</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  {dialogMessage}
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button 
                  onClick={() => {
                    setDialogOpen(false);
                    if (dialogSuccess) {
                      // Redirigir después de hacer clic en Aceptar
                      if (onComplete) {
                        onComplete('sorteos');
                      } else {
                        window.electronAPI.navegarApp('sorteos');
                      }
                    }
                  }} 
                  color="primary" 
                  autoFocus
                >
                  Aceptar
                </Button>
              </DialogActions>
            </Dialog>
          </>
        )}
      </Paper>
    </Container>
  );
}

export default CreacionSorteo;