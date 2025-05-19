import React, { useState } from 'react';
import {
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  Switch,
  TextField,
  Typography,
  Paper,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import CasinoIcon from '@mui/icons-material/Casino';
import BallotIcon from '@mui/icons-material/Ballot';
import VisibilityIcon from '@mui/icons-material/Visibility';

function MetodoSeleccion({ data, onChange }) {
  const [formData, setFormData] = useState({
    algoritmoSorteo: data.algoritmoSorteo || 'simple',
    reglasParticipacion: {
      unPremioParticipante: data.reglasParticipacion?.unPremioParticipante !== false,
      filtrosElegibilidad: data.reglasParticipacion?.filtrosElegibilidad || []
    },
    configuracionVisual: data.configuracionVisual || {
      mostrarAnimacion: true,
      duracionAnimacion: 10,
      mostrarNombres: true
    },
    mezclarSecuencia: data.mezclarSecuencia !== false
  });

  // Manejar cambios en el algoritmo de sorteo
  const handleAlgoritmoChange = (e) => {
    const algoritmoSorteo = e.target.value;
    setFormData({
      ...formData,
      algoritmoSorteo
    });
    onChange({ algoritmoSorteo });
  };

  // Manejar cambios en reglas de participación
  const handleReglasChange = (e) => {
    const { name, checked } = e.target;
    const nuevasReglas = {
      ...formData.reglasParticipacion,
      [name]: checked
    };
    
    setFormData({
      ...formData,
      reglasParticipacion: nuevasReglas
    });
    
    onChange({ reglasParticipacion: nuevasReglas });
  };

  // Manejar cambios en configuración visual
  const handleConfigVisualChange = (e) => {
    const { name, checked, value, type } = e.target;
    const nuevaConfiguracion = {
      ...formData.configuracionVisual,
      [name]: type === 'checkbox' ? checked : value
    };
    
    setFormData({
      ...formData,
      configuracionVisual: nuevaConfiguracion
    });
    
    onChange({ configuracionVisual: nuevaConfiguracion });
  };

  // Manejar cambios en opción de mezclar secuencia
  const handleMezclarChange = (e) => {
    const mezclarSecuencia = e.target.checked;
    setFormData({
      ...formData,
      mezclarSecuencia
    });
    onChange({ mezclarSecuencia });
  };

  // Renderizar descripción del algoritmo seleccionado
  const renderDescripcionAlgoritmo = () => {
    switch (formData.algoritmoSorteo) {
      case 'simple':
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Algoritmo Simple
            </Typography>
            <Typography variant="body2">
              Este algoritmo selecciona ganadores completamente al azar entre todos los participantes elegibles.
              Utiliza un generador de números pseudoaleatorios criptográficamente seguro.
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleOutlineIcon fontSize="small" color="success" />
                </ListItemIcon>
                <ListItemText primary="Selección completamente aleatoria" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleOutlineIcon fontSize="small" color="success" />
                </ListItemIcon>
                <ListItemText primary="Proceso transparente y verificable" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleOutlineIcon fontSize="small" color="success" />
                </ListItemIcon>
                <ListItemText primary="Generación de certificado de aleatoriedad" />
              </ListItem>
            </List>
          </Box>
        );
      case 'fases':
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Algoritmo por Fases
            </Typography>
            <Typography variant="body2">
              Este algoritmo realiza el sorteo en varias fases, agrupando premios por categorías o tipos.
              Ideal para sorteos con múltiples tipos de premios y criterios complejos.
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleOutlineIcon fontSize="small" color="success" />
                </ListItemIcon>
                <ListItemText primary="Premios agrupados por categorías" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleOutlineIcon fontSize="small" color="success" />
                </ListItemIcon>
                <ListItemText primary="Control avanzado de la secuencia del sorteo" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleOutlineIcon fontSize="small" color="success" />
                </ListItemIcon>
                <ListItemText primary="Posibilidad de pausas programadas entre fases" />
              </ListItem>
            </List>
          </Box>
        );
      case 'manual':
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Selección Manual
            </Typography>
            <Typography variant="body2">
              Permite al operador seleccionar manualmente cada ganador. Útil para sorteos presenciales
              donde se utilizan métodos físicos como tómbolas o extracciones manuales.
            </Typography>
            <Alert severity="info" sx={{ mt: 1 }}>
              Este método requiere la intervención del operador durante todo el proceso del sorteo.
            </Alert>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <div className="metodo-seleccion-form">
      <Typography variant="h2" className="form-section-title" id="metodo-seleccion-title">
        Método de Selección de Ganadores
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>
              <ShuffleIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Algoritmo de Sorteo
            </Typography>
            
            <FormControl component="fieldset">
              <RadioGroup
                aria-label="algoritmo-sorteo"
                name="algoritmoSorteo"
                value={formData.algoritmoSorteo}
                onChange={handleAlgoritmoChange}
              >
                <FormControlLabel 
                  value="simple" 
                  control={<Radio />} 
                  label="Algoritmo Simple (Selección directa)" 
                />
                <FormControlLabel 
                  value="fases" 
                  control={<Radio />} 
                  label="Algoritmo por Fases (Por categorías)" 
                />
                <FormControlLabel 
                  value="manual" 
                  control={<Radio />} 
                  label="Selección Manual (Con intervención)" 
                />
              </RadioGroup>
              <FormHelperText>
                Seleccione el algoritmo que se utilizará para determinar los ganadores
              </FormHelperText>
            </FormControl>
            
            {renderDescripcionAlgoritmo()}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>
              <BallotIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Reglas de Participación
            </Typography>
            
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.reglasParticipacion.unPremioParticipante}
                    onChange={handleReglasChange}
                    name="unPremioParticipante"
                    color="primary"
                  />
                }
                label="Un solo premio por participante"
              />
              <FormHelperText>
                Si está activado, un participante sólo podrá ganar un premio. Si está desactivado, 
                podría ganar múltiples premios.
              </FormHelperText>
            </FormGroup>
            
            <Divider sx={{ my: 2 }} />
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.mezclarSecuencia}
                  onChange={handleMezclarChange}
                  name="mezclarSecuencia"
                  color="primary"
                />
              }
              label="Mezclar secuencia de premios"
            />
            <FormHelperText>
              Si está activado, el orden de selección de ganadores será aleatorio.
              Si está desactivado, seguirá el orden definido en la configuración de premios.
            </FormHelperText>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              <VisibilityIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Configuración Visual del Sorteo
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.configuracionVisual.mostrarAnimacion}
                      onChange={handleConfigVisualChange}
                      name="mostrarAnimacion"
                      color="primary"
                    />
                  }
                  label="Mostrar animación de selección"
                />
              </Grid>
              
              {formData.configuracionVisual.mostrarAnimacion && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Duración de la animación (segundos)"
                    type="number"
                    name="duracionAnimacion"
                    value={formData.configuracionVisual.duracionAnimacion}
                    onChange={handleConfigVisualChange}
                    InputProps={{ inputProps: { min: 1, max: 60 } }}
                    variant="outlined"
                    size="small"
                    fullWidth
                  />
                </Grid>
              )}
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.configuracionVisual.mostrarNombres}
                      onChange={handleConfigVisualChange}
                      name="mostrarNombres"
                      color="primary"
                    />
                  }
                  label="Mostrar nombres de ganadores"
                />
                <FormHelperText>
                  Si está activado, se mostrarán los nombres de los ganadores durante el sorteo.
                  Si está desactivado, sólo se mostrarán los códigos de los tickets.
                </FormHelperText>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Información adicional */}
      <Box mt={3}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>
              <SettingsIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Configuración Avanzada del Sorteo
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              El sistema de sorteos utiliza un generador de números pseudoaleatorios criptográficamente seguro 
              para garantizar la transparencia e imparcialidad del proceso.
            </Typography>
            
            <Typography variant="body2" paragraph>
              Para todos los sorteos, se genera un certificado digital que incluye:
            </Typography>
            
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <CasinoIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="Semilla aleatoria utilizada" 
                  secondary="Valor inicial que alimenta el generador de números aleatorios"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CasinoIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="Método de selección" 
                  secondary="Detalles del algoritmo utilizado"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CasinoIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="Secuencia completa de selección" 
                  secondary="Orden exacto en que se seleccionaron los ganadores"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CasinoIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="Hash de verificación" 
                  secondary="Permite verificar que el sorteo no fue alterado"
                />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>
      </Box>
    </div>
  );
}

export default MetodoSeleccion;