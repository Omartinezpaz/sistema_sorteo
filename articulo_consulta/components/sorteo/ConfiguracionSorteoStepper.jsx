import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
  Snackbar,
  Alert,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  Stack,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  Switch
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import es from 'date-fns/locale/es';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import sorteoService from '../../api/sorteo';
import { 
  obtenerEstados, 
  obtenerMunicipios,
  obtenerParroquias,
  obtenerColorEstado, 
  generarRangosEstados,
  buscarUbicaciones,
  verificarSaludSorteo 
} from '../../utils/estadosManager';
import Layout from '../common/Layout';
import BuscadorUbicaciones from '../shared/BuscadorUbicaciones';

// Pasos del formulario
const steps = [
  'Información General',
  'Tipo de Sorteo',
  'Configuración por Ubicación',
  'Configuración Nacional',
  'Categorías',
  'Revisar y Guardar'
];

function ConfiguracionSorteoStepper() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    fechaSorteo: new Date(),
    tipoSorteo: 'estados', // Por defecto, sorteo por estados
    estadosSeleccionados: [],
    municipiosSeleccionados: {}, // Municipios seleccionados por estado: { estadoId: [municipios] }
    parroquiasSeleccionadas: {}, // Parroquias seleccionadas por municipio: { `${estadoId}-${municipioId}`: [parroquias] }
    cuposEstados: {},
    cuposMunicipios: {}, // Cupos por municipio: { `${estadoId}-${municipioId}`: cupos }
    cuposParroquias: {}, // Cupos por parroquia: { `${estadoId}-${municipioId}-${parroquiaId}`: cupos }
    rangoNumerosEstados: {}, // Para almacenar los rangos de números por estado
    rangoNumerosMunicipios: {}, // Para almacenar los rangos de números por municipio
    rangoNumerosParroquias: {}, // Para almacenar los rangos de números por parroquia
    cuposNacionales: 100, // Valor por defecto para sorteo nacional
    categorias: ['Electrodomésticos', 'Electrónica', 'Vehículos', 'Viajes', 'Efectivo', 'Otros'] // Categorías predefinidas
  });
  
  // Estado para almacenar listas de estados, municipios y parroquias disponibles
  const [estados, setEstados] = useState([]);
  const [municipiosPorEstado, setMunicipiosPorEstado] = useState({});
  const [parroquiasPorMunicipio, setParroquiasPorMunicipio] = useState({});
  
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const [autoGenerarRangos, setAutoGenerarRangos] = useState(true); // Por defecto, generar rangos automáticamente

  // Cargar estados cuando el componente se monte
  useEffect(() => {
    const fetchEstados = async () => {
      try {
        setLoading(true);
        const estadosData = await obtenerEstados();
        setEstados(estadosData);
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar estados:', error);
        setAlert({
          open: true,
          message: 'Error al cargar los estados. Por favor, intente nuevamente.',
          severity: 'error'
        });
        setLoading(false);
      }
    };
    
    fetchEstados();
  }, []);

  // Cargar municipios cuando se selecciona un estado
  useEffect(() => {
    const fetchMunicipios = async () => {
      try {
        for (const estado of formData.estadosSeleccionados) {
          // Verificar si ya tenemos los municipios cargados para este estado
          if (!municipiosPorEstado[estado.codigo]) {
            setLoading(true);
            const municipiosData = await obtenerMunicipios(estado.codigo);
            setMunicipiosPorEstado(prev => ({
              ...prev,
              [estado.codigo]: municipiosData
            }));
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error al cargar municipios:', error);
        setAlert({
          open: true,
          message: 'Error al cargar los municipios. Por favor, intente nuevamente.',
          severity: 'error'
        });
        setLoading(false);
      }
    };
    
    if (formData.estadosSeleccionados.length > 0) {
      fetchMunicipios();
    }
  }, [formData.estadosSeleccionados]);

  // Cargar parroquias cuando se selecciona un municipio
  useEffect(() => {
    const fetchParroquias = async () => {
      try {
        for (const estadoId in formData.municipiosSeleccionados) {
          for (const municipio of formData.municipiosSeleccionados[estadoId] || []) {
            const cacheKey = `${estadoId}-${municipio.codigo}`;
            
            // Verificar si ya tenemos las parroquias cargadas para este municipio
            if (!parroquiasPorMunicipio[cacheKey]) {
              setLoading(true);
              const parroquiasData = await obtenerParroquias(estadoId, municipio.codigo);
              setParroquiasPorMunicipio(prev => ({
                ...prev,
                [cacheKey]: parroquiasData
              }));
              setLoading(false);
            }
          }
        }
      } catch (error) {
        console.error('Error al cargar parroquias:', error);
        setAlert({
          open: true,
          message: 'Error al cargar las parroquias. Por favor, intente nuevamente.',
          severity: 'error'
        });
        setLoading(false);
      }
    };
    
    // Si hay municipios seleccionados
    if (Object.keys(formData.municipiosSeleccionados).length > 0) {
      fetchParroquias();
    }
  }, [formData.municipiosSeleccionados]);

  // Manejar cambios en campos de texto
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Manejar cambio de fecha
  const handleFechaChange = (fecha) => {
    // Validar que la fecha sea válida antes de actualizar el estado
    if (fecha && fecha instanceof Date && !isNaN(fecha)) {
      // Asegurarnos de que la fecha tenga la hora correcta (12:00)
      const fechaAjustada = new Date(fecha);
      fechaAjustada.setHours(12, 0, 0, 0);
      
      console.log('Fecha seleccionada:', fechaAjustada.toISOString());
      
      setFormData({
        ...formData,
        fechaSorteo: fechaAjustada
      });
    } else {
      console.warn('Se intentó establecer una fecha inválida:', fecha);
      // Usar la fecha actual como respaldo, también a las 12:00
      const fechaRespaldo = new Date();
      fechaRespaldo.setHours(12, 0, 0, 0);
      setFormData({
        ...formData,
        fechaSorteo: fechaRespaldo
      });
      
      // Mostrar alerta al usuario
      setAlert({
        open: true,
        message: 'La fecha seleccionada no es válida. Se ha establecido la fecha actual como respaldo.',
        severity: 'warning'
      });
    }
  };

  // Manejar cambio de tipo de sorteo
  const handleTipoSorteoChange = (e) => {
    const tipo = e.target.value;
    setFormData({
      ...formData,
      tipoSorteo: tipo
    });
  };

  // Manejar selección de estados
  const handleEstadosChange = (e) => {
    const estadosSeleccionadosValues = e.target.value;
    
    // Convertir los valores seleccionados en objetos de estado completos
    const estadosSeleccionados = estadosSeleccionadosValues.map(estadoId => {
      // Buscar el estado completo por su código
      return estados.find(e => e.codigo === estadoId) || { codigo: estadoId, nombre: estadoId };
    });
    
    // Generar cupos iniciales para cada estado
    let cuposEstados = { ...formData.cuposEstados };
    
    // Añadir estados nuevos con cupos iniciales
    estadosSeleccionados.forEach(estado => {
      if (!cuposEstados[estado.nombre]) {
        cuposEstados[estado.nombre] = 100; // Valor inicial
      }
    });
    
    // Eliminar estados que ya no están seleccionados
    Object.keys(cuposEstados).forEach(estadoNombre => {
      if (!estadosSeleccionados.some(e => e.nombre === estadoNombre)) {
        delete cuposEstados[estadoNombre];
      }
    });
    
    // Filtrar municipiosSeleccionados para mantener solo los estados seleccionados
    const municipiosSeleccionados = { ...formData.municipiosSeleccionados };
    Object.keys(municipiosSeleccionados).forEach(estadoId => {
      if (!estadosSeleccionados.some(e => e.codigo === estadoId)) {
        delete municipiosSeleccionados[estadoId];
      }
    });
    
    // Si está activada la generación automática de rangos, generarlos
    let rangoNumerosEstados = { ...formData.rangoNumerosEstados };
    
    if (autoGenerarRangos && estadosSeleccionados.length > 0) {
      // Usar estadosManager para generar rangos óptimos
      const cuposTotal = 100000; // Número total de cupos a distribuir
      const rangosGenerados = generarRangosEstados(estadosSeleccionados, cuposTotal, true);
      
      // Actualizar cupos basados en los rangos generados
      Object.keys(rangosGenerados).forEach(estadoNombre => {
        cuposEstados[estadoNombre] = rangosGenerados[estadoNombre].cupos;
        
        // Actualizar rangos de numeración
        rangoNumerosEstados[estadoNombre] = {
          desde: rangosGenerados[estadoNombre].desde,
          hasta: rangosGenerados[estadoNombre].hasta
        };
      });
    }
    
    setFormData({
      ...formData,
      estadosSeleccionados,
      municipiosSeleccionados,
      cuposEstados,
      rangoNumerosEstados
    });
  };
  
  // Manejar búsqueda rápida de ubicaciones
  const handleBusquedaRapida = (ubicacionId) => {
    if (!ubicacionId) return;
    
    // Buscar el estado correspondiente
    const estadoSeleccionado = estados.find(e => e.codigo === ubicacionId);
    
    if (estadoSeleccionado) {
      // Añadir el estado a la selección si no está ya
      if (!formData.estadosSeleccionados.some(e => e.codigo === estadoSeleccionado.codigo)) {
        const nuevosEstadosSeleccionados = [
          ...formData.estadosSeleccionados,
          estadoSeleccionado
        ];
        
        // Actualizar formData con el nuevo estado seleccionado
        setFormData(prev => ({
          ...prev,
          estadosSeleccionados: nuevosEstadosSeleccionados,
          cuposEstados: {
            ...prev.cuposEstados,
            [estadoSeleccionado.nombre]: 100 // Valor inicial
          }
        }));
      }
    }
  };

  // Nueva función: Manejar selección de municipios
  const handleMunicipiosChange = (estadoId, e) => {
    const municipiosSeleccionadosValues = e.target.value;
    
    // Convertir los valores seleccionados en objetos de municipio completos
    const municipiosSeleccionados = municipiosSeleccionadosValues.map(municipioId => {
      // Buscar el municipio completo por su código
      return municipiosPorEstado[estadoId].find(m => m.codigo === municipioId) || 
             { codigo: municipioId, nombre: municipioId };
    });
    
    // Actualizar los municipios seleccionados para este estado
    const newMunicipiosSeleccionados = {
      ...formData.municipiosSeleccionados,
      [estadoId]: municipiosSeleccionados
    };
    
    // Generar cupos iniciales para cada municipio
    let cuposMunicipios = { ...formData.cuposMunicipios };
    
    // Añadir municipios nuevos con cupos iniciales
    municipiosSeleccionados.forEach(municipio => {
      const key = `${estadoId}-${municipio.codigo}`;
      if (!cuposMunicipios[key]) {
        cuposMunicipios[key] = 50; // Valor inicial
      }
    });
    
    // Eliminar municipios que ya no están seleccionados
    Object.keys(cuposMunicipios).forEach(key => {
      if (key.startsWith(`${estadoId}-`)) {
        const municipioId = key.split('-')[1];
        if (!municipiosSeleccionados.some(m => m.codigo === municipioId)) {
          delete cuposMunicipios[key];
        }
      }
    });
    
    // Filtrar parroquiasSeleccionadas para mantener solo los municipios seleccionados
    const parroquiasSeleccionadas = { ...formData.parroquiasSeleccionadas };
    Object.keys(parroquiasSeleccionadas).forEach(key => {
      if (key.startsWith(`${estadoId}-`)) {
        const municipioId = key.split('-')[1];
        if (!municipiosSeleccionados.some(m => m.codigo === municipioId)) {
          delete parroquiasSeleccionadas[key];
        }
      }
    });
    
    setFormData({
      ...formData,
      municipiosSeleccionados: newMunicipiosSeleccionados,
      parroquiasSeleccionadas,
      cuposMunicipios
    });
  };

  // Nueva función: Manejar selección de parroquias
  const handleParroquiasChange = (estadoId, municipioId, e) => {
    const parroquiasSeleccionadasValues = e.target.value;
    const cacheKey = `${estadoId}-${municipioId}`;
    
    // Convertir los valores seleccionados en objetos de parroquia completos
    const parroquiasSeleccionadas = parroquiasSeleccionadasValues.map(parroquiaId => {
      // Buscar la parroquia completa por su código
      return parroquiasPorMunicipio[cacheKey].find(p => p.codigo === parroquiaId) || 
             { codigo: parroquiaId, nombre: parroquiaId };
    });
    
    // Actualizar las parroquias seleccionadas para este municipio
    const newParroquiasSeleccionadas = {
      ...formData.parroquiasSeleccionadas,
      [cacheKey]: parroquiasSeleccionadas
    };
    
    // Generar cupos iniciales para cada parroquia
    let cuposParroquias = { ...formData.cuposParroquias };
    
    // Añadir parroquias nuevas con cupos iniciales
    parroquiasSeleccionadas.forEach(parroquia => {
      const key = `${estadoId}-${municipioId}-${parroquia.codigo}`;
      if (!cuposParroquias[key]) {
        cuposParroquias[key] = 20; // Valor inicial
      }
    });
    
    // Eliminar parroquias que ya no están seleccionadas
    Object.keys(cuposParroquias).forEach(key => {
      if (key.startsWith(`${estadoId}-${municipioId}-`)) {
        const parroquiaId = key.split('-')[2];
        if (!parroquiasSeleccionadas.some(p => p.codigo === parroquiaId)) {
          delete cuposParroquias[key];
        }
      }
    });
    
    setFormData({
      ...formData,
      parroquiasSeleccionadas: newParroquiasSeleccionadas,
      cuposParroquias
    });
  };

  // Manejar cambio en cupos de estado
  const handleCuposEstadoChange = (estado, value) => {
    const numValue = parseInt(value, 10);
    const cuposEstados = { ...formData.cuposEstados };
    
    // Almacenar el valor como número si es válido, o cadena vacía si no lo es
    cuposEstados[estado] = !isNaN(numValue) ? numValue : '';
    
    const newFormData = {
      ...formData,
      cuposEstados
    };
    
    // Actualizar automáticamente el campo "hasta" si ya existe un valor "desde"
    if (!isNaN(numValue) && numValue > 0) {
      const rangoNumerosEstados = { ...formData.rangoNumerosEstados };
      const desdeActual = rangoNumerosEstados[estado]?.desde;
      
      if (desdeActual && !isNaN(parseInt(desdeActual, 10))) {
        // Si ya hay un valor "desde", actualizar "hasta" = desde + cupos - 1
        rangoNumerosEstados[estado] = {
          ...rangoNumerosEstados[estado],
          hasta: parseInt(desdeActual, 10) + numValue - 1
        };
        
        newFormData.rangoNumerosEstados = rangoNumerosEstados;
      }
    }
    
    setFormData(newFormData);
    
    // Si está activado el autogenerador y hay un cambio significativo en los cupos
    if (autoGenerarRangos && !isNaN(numValue) && numValue > 0) {
      // Pequeño retraso para evitar múltiples actualizaciones rápidas
      setTimeout(() => {
        generarRangosAutomaticos();
      }, 300);
    }
  };

  // Manejar cambio en rango de numeración de estado
  const handleRangoNumeroChange = (estado, campo, value) => {
    const numValue = parseInt(value, 10);
    const rangoNumerosEstados = { ...formData.rangoNumerosEstados };
    
    if (!rangoNumerosEstados[estado]) {
      rangoNumerosEstados[estado] = { desde: '', hasta: '' };
    }
    
    // Convertir a número entero si es válido
    if (!isNaN(numValue)) {
      rangoNumerosEstados[estado][campo] = numValue;
      
      // Si estamos cambiando "desde" y el campo "hasta" está vacío o es menor que "desde"
      if (campo === 'desde') {
        const cupos = formData.cuposEstados[estado] || 0;
        // Si hay cupos definidos y "hasta" no es válido, calcularlo automáticamente
        if (cupos > 0 && 
            (!rangoNumerosEstados[estado].hasta || 
             rangoNumerosEstados[estado].hasta < numValue)) {
          rangoNumerosEstados[estado].hasta = numValue + cupos - 1;
        }
      }
      
      // Si estamos cambiando "hasta" y es menor que "desde", corregirlo
      if (campo === 'hasta' && 
          rangoNumerosEstados[estado].desde && 
          numValue < rangoNumerosEstados[estado].desde) {
        // Alerta para informar al usuario
        setAlert({
          open: true,
          message: `El valor "hasta" no puede ser menor que "desde" para ${estado}`,
          severity: 'warning'
        });
        // No aplicar el cambio si hace que el rango sea inválido
        return;
      }
      
      // Actualizar automáticamente los cupos basados en los rangos
      if (rangoNumerosEstados[estado].desde && rangoNumerosEstados[estado].hasta) {
        const desde = parseInt(rangoNumerosEstados[estado].desde, 10);
        const hasta = parseInt(rangoNumerosEstados[estado].hasta, 10);
        
        if (!isNaN(desde) && !isNaN(hasta) && hasta >= desde) {
          // Calcular cupos basados en el rango
          const cuposCalculados = hasta - desde + 1;
          const cuposEstados = { ...formData.cuposEstados };
          cuposEstados[estado] = cuposCalculados;
          
          // Mostrar un mensaje informativo sobre el cálculo automático
          console.log(`Cupos para ${estado} calculados automáticamente: ${cuposCalculados} (basado en rango ${desde}-${hasta})`);
          
          // Actualizar ambos: rangos y cupos
          setFormData({
            ...formData,
            rangoNumerosEstados,
            cuposEstados
          });
          return; // Terminar aquí porque ya hemos actualizado el estado
        }
      }
    } else {
      // Si no es un número válido, mantener el campo vacío
      rangoNumerosEstados[estado][campo] = '';
    }
    
    // Si no se calcularon los cupos, actualizar solo los rangos
    setFormData({
      ...formData,
      rangoNumerosEstados
    });
  };

  // Manejar cambio en cupos nacionales
  const handleCuposNacionalesChange = (e) => {
    setFormData({
      ...formData,
      cuposNacionales: e.target.value
    });
  };

  // Manejar adición de nueva categoría
  const handleAddCategoria = () => {
    if (nuevaCategoria.trim() === '') return;
    
    if (formData.categorias.includes(nuevaCategoria)) {
      setAlert({
        open: true,
        message: 'Esta categoría ya existe',
        severity: 'warning'
      });
      return;
    }
    
    setFormData({
      ...formData,
      categorias: [...formData.categorias, nuevaCategoria]
    });
    
    setNuevaCategoria('');
  };

  // Manejar eliminación de categoría
  const handleDeleteCategoria = (categoriaToDelete) => {
    setFormData({
      ...formData,
      categorias: formData.categorias.filter(categoria => categoria !== categoriaToDelete)
    });
  };

  // Generar rangos automáticos
  const generarRangosAutomaticos = () => {
    if (formData.estadosSeleccionados.length === 0) {
      setAlert({
        open: true,
        message: 'Debe seleccionar al menos un estado para generar rangos automáticos',
        severity: 'warning'
      });
      return;
    }
    
    // Verificar si hay cupos definidos para todos los estados
    const estadosSinCupos = formData.estadosSeleccionados.filter(
      estado => !formData.cuposEstados[estado.nombre] || formData.cuposEstados[estado.nombre] <= 0
    );
    
    if (estadosSinCupos.length > 0) {
      setAlert({
        open: true,
        message: `Defina cupos para los siguientes estados antes de generar rangos: ${estadosSinCupos.map(e => e.nombre).join(', ')}`,
        severity: 'warning'
      });
      return;
    }
    
    // Calcular cupos totales de los estados seleccionados
    let cuposTotal = 0;
    formData.estadosSeleccionados.forEach(estado => {
      cuposTotal += parseInt(formData.cuposEstados[estado.nombre] || 0, 10);
    });
    
    if (cuposTotal <= 0) {
      setAlert({
        open: true,
        message: 'El total de cupos debe ser mayor a cero para generar rangos',
        severity: 'warning'
      });
      return;
    }
    
    // Usar estadosManager para generar rangos óptimos
    // Podemos usar los cupos totales como base o un valor fijo
    const rangosGenerados = generarRangosEstados(formData.estadosSeleccionados, cuposTotal, true);
    
    // Actualizar estado con los rangos generados
    const rangoNumerosEstados = { ...formData.rangoNumerosEstados };
    
    // Punto de inicio para la numeración si queremos personalizarlo
    let numeroInicio = 100000; // Comenzar desde 100000 para tener 6 dígitos
    
    formData.estadosSeleccionados.forEach(estado => {
      const cupos = parseInt(formData.cuposEstados[estado.nombre] || 0, 10);
      
      // Establecer rangos
      rangoNumerosEstados[estado.nombre] = {
        desde: numeroInicio,
        hasta: numeroInicio + cupos - 1
      };
      
      // Actualizar número de inicio para el siguiente estado
      numeroInicio = rangoNumerosEstados[estado.nombre].hasta + 1;
    });
    
    setFormData({
      ...formData,
      rangoNumerosEstados
    });
    
    setAlert({
      open: true,
      message: 'Rangos generados automáticamente',
      severity: 'success'
    });
  };

  // Manejar navegación entre pasos
  const handleNext = () => {
    // Validar el paso actual
    if (!validateCurrentStep()) {
      return;
    }
    
    setActiveStep((prevStep) => {
      // Saltar pasos no necesarios según tipo de sorteo
      let nextStep = prevStep + 1;
      
      // Si es tipo nacional, saltar configuración por estados
      if (prevStep === 1 && formData.tipoSorteo === 'nacional') {
        nextStep = 3; // Ir a Configuración Nacional
      }
      
      // Si es tipo estados, saltar configuración nacional
      if (prevStep === 2 && formData.tipoSorteo === 'estados') {
        nextStep = 4; // Ir a Categorías
      }
      
      return nextStep;
    });
    setErrors({});
  };

  const handleBack = () => {
    setActiveStep((prevStep) => {
      // Saltar pasos no necesarios según tipo de sorteo
      let nextStep = prevStep - 1;
      
      // Si es tipo nacional y estamos en paso 3 (Configuración Nacional), saltar a paso 1 (Tipo de Sorteo)
      if (prevStep === 3 && formData.tipoSorteo === 'nacional') {
        nextStep = 1; // Volver a Tipo de Sorteo
      }
      
      // Si es tipo estados y estamos en paso 4 (Categorías), saltar a paso 2 (Configuración por Estados)
      if (prevStep === 4 && formData.tipoSorteo === 'estados') {
        nextStep = 2; // Volver a Configuración por Estados
      }
      
      return nextStep;
    });
    setErrors({});
  };

  // Validar el paso actual
  const validateCurrentStep = () => {
    const newErrors = {};
    
    switch (activeStep) {
      case 0: // Información General
        if (!formData.nombre.trim()) {
          newErrors.nombre = 'El nombre es obligatorio';
        }
        break;
      case 1: // Tipo de Sorteo
        // No necesita validación específica
        break;
      case 2: // Configuración por Ubicación
        if (formData.tipoSorteo === 'estados' || formData.tipoSorteo === 'ambos') {
          if (formData.estadosSeleccionados.length === 0) {
            newErrors.estadosSeleccionados = 'Debe seleccionar al menos un estado';
          }
          
          // Validar que todos los estados tengan cupos asignados
          const estadosSinCupos = formData.estadosSeleccionados.filter(
            estado => !formData.cuposEstados[estado.nombre] || formData.cuposEstados[estado.nombre] <= 0
          );
          
          if (estadosSinCupos.length > 0) {
            newErrors.cuposEstados = `Los siguientes estados no tienen cupos asignados: ${estadosSinCupos.map(e => e.nombre).join(', ')}`;
          }
        }
        break;
      case 3: // Configuración Nacional
        if (formData.tipoSorteo === 'nacional' || formData.tipoSorteo === 'ambos') {
          if (!formData.cuposNacionales || formData.cuposNacionales <= 0) {
            newErrors.cuposNacionales = 'Debe especificar un número válido de cupos nacionales';
          }
        }
        break;
      case 4: // Categorías
        if (formData.categorias.length === 0) {
          newErrors.categorias = 'Debe especificar al menos una categoría de premios';
        }
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Función principal de envío del formulario
  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      setAlert({
        open: true,
        message: 'Por favor, corrija los errores antes de continuar',
        severity: 'error'
      });
      return;
    }
    
    // Crear objeto de datos para enviar al API
    const sorteoData = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      fecha_sorteo: formatearFechaParaDB(formData.fechaSorteo),
      estado: 'pendiente',
      estado_actual: 'borrador',
      es_publico: false,
      tipoSorteo: formData.tipoSorteo,
      estadosSeleccionados: formData.estadosSeleccionados,
      cuposEstados: formData.cuposEstados,
      cuposNacionales: formData.cuposNacionales,
      rangoNumerosEstados: formData.rangoNumerosEstados,
      categorias_json: JSON.stringify(formData.categorias)
    };
    
    // Función para formatear fecha para la base de datos
    function formatearFechaParaDB(fecha) {
      if (!(fecha instanceof Date) || isNaN(fecha)) {
        console.error('Fecha inválida recibida en formatearFechaParaDB:', fecha);
        return new Date().toISOString();
      }
      
      // Asegurar que la hora sea 12:00
      const fechaAjustada = new Date(fecha);
      fechaAjustada.setHours(12, 0, 0, 0);
      
      return fechaAjustada.toISOString();
    }
    
    // Verificar configuración con estadosManager antes de enviar
    const resultadoVerificacion = verificarSaludSorteo('nuevo_sorteo', sorteoData);
    
    if (!resultadoVerificacion.ok) {
      setAlert({
        open: true,
        message: `Problemas detectados: ${resultadoVerificacion.problemas.join(', ')}`,
        severity: 'error'
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Usar el mismo servicio que CrearSorteo.jsx
      const response = await sorteoService.create(sorteoData);
      
      // Verificar si la respuesta es válida (más flexible)
      const sorteoId = response?.sorteo?.id;
      
      if (sorteoId) {
        setAlert({
          open: true,
          message: 'Sorteo creado correctamente',
          severity: 'success'
        });
        
        // Navegar a la página de premios con los datos del sorteo
        setTimeout(() => {
        navigate(`/sorteos/${sorteoId}`, { 
          state: { 
              sorteoId: sorteoId,
              sorteoData: {
                ...sorteoData,
                id: sorteoId
              }
            } 
          });
        }, 1500);
      } else {
        throw new Error('No se recibió un ID válido del sorteo');
      }
    } catch (error) {
      console.error('Error al crear sorteo:', error);
      setAlert({
        open: true,
        message: `Error al crear sorteo: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Renderizar el contenido del paso actual
  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Información General
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6">Datos Básicos</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Nombre del Sorteo"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                error={!!errors.nombre}
                helperText={errors.nombre}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <DateTimePicker
                label="Fecha del Sorteo"
                value={formData.fechaSorteo}
                onChange={handleFechaChange}
                slotProps={{ textField: { fullWidth: true } }}
                minDate={new Date()}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        );
      
      case 1: // Tipo de Sorteo
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6">Tipo de Sorteo</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <RadioGroup
                  row
                  name="tipoSorteo"
                  value={formData.tipoSorteo}
                  onChange={handleTipoSorteoChange}
                >
                  <FormControlLabel 
                    value="estados" 
                    control={<Radio />} 
                    label="Por Estados" 
                  />
                  <FormControlLabel 
                    value="nacional" 
                    control={<Radio />} 
                    label="Nacional" 
                  />
                  <FormControlLabel 
                    value="ambos" 
                    control={<Radio />} 
                    label="Mixto (Estados y Nacional)" 
                  />
                </RadioGroup>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mt: 2 }}>
                {formData.tipoSorteo === 'estados' && 'En este modo, los participantes serán agrupados por estados y cada estado tendrá sus propios ganadores.'}
                {formData.tipoSorteo === 'nacional' && 'En este modo, todos los participantes competirán en un sorteo a nivel nacional.'}
                {formData.tipoSorteo === 'ambos' && 'En este modo, habrá sorteos separados por estados y además un sorteo a nivel nacional.'}
              </Alert>
            </Grid>
          </Grid>
        );
      
      case 2: // Paso: Configuración por Ubicación
        return (
          <Paper style={{ padding: '16px' }}>
            <Typography variant="h6" gutterBottom>
              Configuración por Ubicación
            </Typography>
            
            <Grid container spacing={3}>
              {/* Buscador rápido de ubicaciones */}
              <Grid item xs={12}>
                <BuscadorUbicaciones 
                  onChange={(ubicacion) => {
                    // Si es un estado, seleccionarlo
                    if (ubicacion.cod_estado && !ubicacion.cod_municipio) {
                      const estado = {
                        nombre: ubicacion.nom_estado,
                        codigo: ubicacion.cod_estado
                      };
                      
                      if (!formData.estadosSeleccionados.some(e => e.codigo === estado.codigo)) {
                        handleEstadosChange({
                          target: {
                            value: [...formData.estadosSeleccionados.map(e => e.codigo), estado.codigo]
                          }
                        });
                      }
                    }
                    // Si es un municipio, seleccionar su estado y el municipio
                    else if (ubicacion.cod_estado && ubicacion.cod_municipio && !ubicacion.cod_parroquia) {
                      const estado = {
                        nombre: ubicacion.nom_estado,
                        codigo: ubicacion.cod_estado
                      };
                      
                      // Primero asegurarse de que el estado está seleccionado
                      if (!formData.estadosSeleccionados.some(e => e.codigo === estado.codigo)) {
                        handleEstadosChange({
                          target: {
                            value: [...formData.estadosSeleccionados.map(e => e.codigo), estado.codigo]
                          }
                        });
                      }
                      
                      // Luego seleccionar el municipio (después de un pequeño retraso para que se carguen los municipios)
                      setTimeout(() => {
                        const municipio = {
                          nombre: ubicacion.nom_municipio,
                          codigo: ubicacion.cod_municipio
                        };
                        
                        handleMunicipiosChange(estado.codigo, {
                          target: {
                            value: [
                              ...(formData.municipiosSeleccionados[estado.codigo] || []).map(m => m.codigo),
                              municipio.codigo
                            ]
                          }
                        });
                      }, 500);
                    }
                    // Si es una parroquia, seleccionar su estado, municipio y la parroquia
                    else if (ubicacion.cod_estado && ubicacion.cod_municipio && ubicacion.cod_parroquia) {
                      const estado = {
                        nombre: ubicacion.nom_estado,
                        codigo: ubicacion.cod_estado
                      };
                      
                      // Primero asegurarse de que el estado está seleccionado
                      if (!formData.estadosSeleccionados.some(e => e.codigo === estado.codigo)) {
                        handleEstadosChange({
                          target: {
                            value: [...formData.estadosSeleccionados.map(e => e.codigo), estado.codigo]
                          }
                        });
                      }
                      
                      // Luego seleccionar el municipio y la parroquia después de un pequeño retraso
                      setTimeout(() => {
                        const municipio = {
                          nombre: ubicacion.nom_municipio,
                          codigo: ubicacion.cod_municipio
                        };
                        
                        if (!(formData.municipiosSeleccionados[estado.codigo] || []).some(m => m.codigo === municipio.codigo)) {
                          handleMunicipiosChange(estado.codigo, {
                            target: {
                              value: [
                                ...(formData.municipiosSeleccionados[estado.codigo] || []).map(m => m.codigo),
                                municipio.codigo
                              ]
                            }
                          });
                        }
                        
                        // Finalmente seleccionar la parroquia después de otro pequeño retraso
                        setTimeout(() => {
                          const parroquia = {
                            nombre: ubicacion.nom_parroquia,
                            codigo: ubicacion.cod_parroquia
                          };
                          
                          const cacheKey = `${estado.codigo}-${municipio.codigo}`;
                          
                          handleParroquiasChange(estado.codigo, municipio.codigo, {
                            target: {
                              value: [
                                ...(formData.parroquiasSeleccionadas[cacheKey] || []).map(p => p.codigo),
                                parroquia.codigo
                              ]
                            }
                          });
                        }, 500);
                      }, 500);
                    }
                  }}
                  placeholder="Buscar estado, municipio o parroquia para añadir"
                  label="Búsqueda rápida"
                />
              </Grid>
              
              {/* Búsqueda rápida con selector */}
              <Grid item xs={12}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="busqueda-rapida-label">Búsqueda rápida con selector</InputLabel>
                  <Select
                    labelId="busqueda-rapida-label"
                    id="busqueda-rapida"
                    value=""
                    label="Búsqueda rápida con selector"
                    onChange={(e) => handleBusquedaRapida(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Seleccione una ubicación</em>
                    </MenuItem>
                    {estados.map((estado) => (
                      <MenuItem key={estado.codigo} value={estado.codigo}>
                        {estado.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Selección de Estados */}
              <Grid item xs={12}>
                <FormControl 
                  fullWidth 
                  error={Boolean(errors.estadosSeleccionados)}
                >
                  <InputLabel id="estados-label">Estados</InputLabel>
                  <Select
                    labelId="estados-label"
                    id="estados"
                    multiple
                    value={formData.estadosSeleccionados.map(e => e.codigo)}
                    onChange={handleEstadosChange}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const estadoNombre = estados.find(e => e.codigo === value)?.nombre || value;
                          return (
                            <Chip 
                              key={value} 
                              label={estadoNombre} 
                              sx={{ 
                                bgcolor: obtenerColorEstado(estadoNombre),
                                color: 'white' 
                              }} 
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {estados.map((estado) => (
                      <MenuItem key={estado.codigo} value={estado.codigo}>
                        {estado.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.estadosSeleccionados && (
                    <FormHelperText>{errors.estadosSeleccionados}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              
              {/* Si hay estados seleccionados, mostrar configuración de cupos por estado */}
              {formData.estadosSeleccionados.length > 0 && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Configuración de Cupos por Estado
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={autoGenerarRangos}
                          onChange={(e) => setAutoGenerarRangos(e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Generar rangos automáticamente"
                    />
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      style={{ marginLeft: '16px' }}
                      onClick={generarRangosAutomaticos}
                      disabled={!autoGenerarRangos}
                    >
                      Regenerar Rangos
                    </Button>
                  </Grid>
                  
                  {/* Tabla de cupos por estado */}
                  <Grid item xs={12}>
                    <Box sx={{ overflow: 'auto', maxHeight: '300px' }}>
                      <Grid container spacing={2}>
                        <Grid item xs={4}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Estado</Typography>
                        </Grid>
                        <Grid item xs={2}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Cupos</Typography>
                        </Grid>
                        <Grid item xs={3}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Desde</Typography>
                        </Grid>
                        <Grid item xs={3}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Hasta</Typography>
                        </Grid>
                      </Grid>
                      
                      {formData.estadosSeleccionados.map((estado) => (
                        <Grid container spacing={2} key={estado.codigo} sx={{ mt: 1 }}>
                          <Grid item xs={4}>
                            <Typography>{estado.nombre}</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <TextField
                              type="number"
                              size="small"
                              value={formData.cuposEstados[estado.nombre] || ''}
                              onChange={(e) => handleCuposEstadoChange(estado.nombre, e.target.value)}
                              InputProps={{
                                inputProps: { min: 1 }
                              }}
                            />
                          </Grid>
                          <Grid item xs={3}>
                            <TextField
                              type="number"
                              size="small"
                              value={formData.rangoNumerosEstados[estado.nombre]?.desde || ''}
                              onChange={(e) => handleRangoNumeroChange(estado.nombre, 'desde', e.target.value)}
                              disabled={autoGenerarRangos}
                              InputProps={{
                                inputProps: { min: 1 }
                              }}
                            />
                          </Grid>
                          <Grid item xs={3}>
                            <TextField
                              type="number"
                              size="small"
                              value={formData.rangoNumerosEstados[estado.nombre]?.hasta || ''}
                              onChange={(e) => handleRangoNumeroChange(estado.nombre, 'hasta', e.target.value)}
                              disabled={autoGenerarRangos}
                              InputProps={{
                                inputProps: { min: 1 }
                              }}
                            />
                          </Grid>
                        </Grid>
                      ))}
                    </Box>
                  </Grid>
                  
                  {/* Configuración de Municipios */}
                  <Grid item xs={12} sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Configuración de Municipios
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    {formData.estadosSeleccionados.map((estado) => (
                      <Box key={`municipios-${estado.codigo}`} sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {estado.nombre}
                        </Typography>
                        
                        {/* Selección de Municipios */}
                        <FormControl fullWidth sx={{ mb: 2 }}>
                          <InputLabel id={`municipios-label-${estado.codigo}`}>Municipios de {estado.nombre}</InputLabel>
                          <Select
                            labelId={`municipios-label-${estado.codigo}`}
                            id={`municipios-${estado.codigo}`}
                            multiple
                            value={(formData.municipiosSeleccionados[estado.codigo] || []).map(m => m.codigo)}
                            onChange={(e) => handleMunicipiosChange(estado.codigo, e)}
                            renderValue={(selected) => (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selected.map((value) => {
                                  const municipioNombre = municipiosPorEstado[estado.codigo]?.find(m => m.codigo === value)?.nombre || value;
                                  return (
                                    <Chip key={value} label={municipioNombre} />
                                  );
                                })}
                              </Box>
                            )}
                          >
                            {(municipiosPorEstado[estado.codigo] || []).map((municipio) => (
                              <MenuItem key={municipio.codigo} value={municipio.codigo}>
                                {municipio.nombre}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        
                        {/* Si hay municipios seleccionados, mostrar parroquias */}
                        {(formData.municipiosSeleccionados[estado.codigo] || []).length > 0 && (
                          <Box sx={{ ml: 2 }}>
                            {(formData.municipiosSeleccionados[estado.codigo] || []).map((municipio) => (
                              <Box key={`parroquias-${estado.codigo}-${municipio.codigo}`} sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                  {municipio.nombre}
                                </Typography>
                                
                                {/* Selección de Parroquias */}
                                <FormControl fullWidth sx={{ mb: 1 }}>
                                  <InputLabel id={`parroquias-label-${estado.codigo}-${municipio.codigo}`}>
                                    Parroquias de {municipio.nombre}
                                  </InputLabel>
                                  <Select
                                    labelId={`parroquias-label-${estado.codigo}-${municipio.codigo}`}
                                    id={`parroquias-${estado.codigo}-${municipio.codigo}`}
                                    multiple
                                    value={(formData.parroquiasSeleccionadas[`${estado.codigo}-${municipio.codigo}`] || []).map(p => p.codigo)}
                                    onChange={(e) => handleParroquiasChange(estado.codigo, municipio.codigo, e)}
                                    renderValue={(selected) => (
                                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((value) => {
                                          const parroquiaNombre = parroquiasPorMunicipio[`${estado.codigo}-${municipio.codigo}`]?.find(p => p.codigo === value)?.nombre || value;
                                          return (
                                            <Chip key={value} label={parroquiaNombre} size="small" />
                                          );
                                        })}
                                      </Box>
                                    )}
                                  >
                                    {(parroquiasPorMunicipio[`${estado.codigo}-${municipio.codigo}`] || []).map((parroquia) => (
                                      <MenuItem key={parroquia.codigo} value={parroquia.codigo}>
                                        {parroquia.nombre}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Grid>
                </>
              )}
            </Grid>
          </Paper>
        );
      
      case 3: // Configuración Nacional
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6">Configuración Nacional</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Cupos Nacionales"
                value={formData.cuposNacionales}
                onChange={handleCuposNacionalesChange}
                error={!!errors.cuposNacionales}
                helperText={errors.cuposNacionales}
                inputProps={{ min: 1 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  Los cupos nacionales determinan la cantidad de participantes que podrán ser registrados en el sorteo a nivel nacional.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        );
      
      case 4: // Categorías
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6">Categorías de Premios</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <TextField
                  label="Nueva Categoría"
                  value={nuevaCategoria}
                  onChange={(e) => setNuevaCategoria(e.target.value)}
                  size="small"
                />
                <Button 
                  variant="outlined" 
                  onClick={handleAddCategoria}
                  disabled={!nuevaCategoria.trim()}
                >
                  Añadir
                </Button>
              </Stack>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.categorias.map((categoria) => (
                  <Chip
                    key={categoria}
                    label={categoria}
                    onDelete={() => handleDeleteCategoria(categoria)}
                  />
                ))}
              </Box>
              
              {errors.categorias && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {errors.categorias}
                </Alert>
              )}
              
              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  Las categorías de premios le permitirán clasificar los premios que asignará en la siguiente pantalla.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        );
      
      case 5: // Revisar y Guardar
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Resumen del Sorteo
              </Typography>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Nombre del Sorteo
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formData.nombre}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Descripción
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formData.descripcion || 'No especificada'}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Fecha del Sorteo
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {new Date(formData.fechaSorteo).toLocaleDateString('es-ES')} {new Date(formData.fechaSorteo).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Tipo de Sorteo
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {formData.tipoSorteo === 'estados' ? 'Por Estados' :
                       formData.tipoSorteo === 'nacional' ? 'Nacional' : 'Mixto (Estados y Nacional)'}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 2 }} />
                
                {(formData.tipoSorteo === 'estados' || formData.tipoSorteo === 'ambos') && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary">
                      Estados Seleccionados
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, mt: 1 }}>
                      {formData.estadosSeleccionados.map(estado => (
                        <Chip 
                          key={estado.codigo} 
                          label={estado.nombre} 
                          sx={{ 
                            bgcolor: obtenerColorEstado(estado.nombre),
                            color: 'white'
                          }}
                        />
                      ))}
                    </Box>
                    
                    <Typography variant="subtitle2" color="text.secondary">
                      Resumen de Cupos por Estado
                    </Typography>
                    <Grid container spacing={1} sx={{ mt: 1, mb: 2 }}>
                      {formData.estadosSeleccionados.map(estado => (
                        <Grid item xs={6} sm={4} md={3} key={estado.codigo}>
                          <Paper sx={{ p: 1, textAlign: 'center' }}>
                            <Typography variant="body2">{estado.nombre}</Typography>
                            <Typography variant="h6">{formData.cuposEstados[estado.nombre] || 0}</Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                    
                    <Divider sx={{ my: 2 }} />
                  </>
                )}
                
                {(formData.tipoSorteo === 'nacional' || formData.tipoSorteo === 'ambos') && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary">
                      Cupos Nacionales
                    </Typography>
                    <Typography variant="body1" gutterBottom sx={{ mt: 1 }}>
                      {formData.cuposNacionales}
                    </Typography>
                    
                    <Divider sx={{ my: 2 }} />
                  </>
                )}
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Categorías de Premios
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {formData.categorias.map((categoria) => (
                      <Chip
                        key={categoria}
                        label={categoria}
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        );
      
      default:
        return null;
    }
  };

  return (
    <Layout>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Configuración del Sorteo
          </Typography>
          
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          <Paper sx={{ p: 3, mb: 3 }}>
            {renderStepContent()}
          </Paper>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<ArrowBackIcon />}
            >
              Anterior
            </Button>
            
            <Box>
              <Button
                onClick={() => navigate('/dashboard')}
                sx={{ mr: 1 }}
              >
                Cancelar
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  startIcon={<SaveIcon />}
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Guardar Sorteo'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  endIcon={<ArrowForwardIcon />}
                >
                  Siguiente
                </Button>
              )}
            </Box>
          </Box>
          
          <Snackbar
            open={alert.open}
            autoHideDuration={6000}
            onClose={() => setAlert({ ...alert, open: false })}
          >
            <Alert 
              onClose={() => setAlert({ ...alert, open: false })} 
              severity={alert.severity}
              sx={{ width: '100%' }}
            >
              {alert.message}
            </Alert>
          </Snackbar>
        </Box>
      </LocalizationProvider>
    </Layout>
  );
}

export default ConfiguracionSorteoStepper;