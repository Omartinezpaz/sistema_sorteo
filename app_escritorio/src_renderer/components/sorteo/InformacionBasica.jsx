import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  Grid, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormHelperText,
  Paper,
  Chip,
  Autocomplete,
  Box,
  FormControlLabel,
  Switch,
  Divider,
  Alert,
  Button
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

// Componente para manejo de errores
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error('Error capturado por ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '10px', border: '1px solid #f44336', borderRadius: '4px', marginTop: '10px' }}>
          <Typography color="error" variant="subtitle2">
            {this.props.fallbackMessage || 'Error al renderizar componente'}
          </Typography>
          {this.props.fallbackComponent || null}
        </div>
      );
    }

    return this.props.children;
  }
}

console.log('=== Cargando componente InformacionBasica con corrección para error React #31 ===');

function InformacionBasica({ data, onChange }) {
  console.log('Iniciando renderizado de InformacionBasica');
  
  // Verificar y sanear los datos de entrada
  const dataSaneados = (() => {
    try {
      // Crear copia para no modificar el original
      const result = { ...data };
      
      // Verificar estados
      if (!result.estadosSeleccionados) {
        result.estadosSeleccionados = [];
      } else if (!Array.isArray(result.estadosSeleccionados)) {
        console.error('estadosSeleccionados no es un array, se inicializará como array vacío');
        result.estadosSeleccionados = [];
      }
      
      // Verificar municipios
      if (!result.municipiosSeleccionados) {
        result.municipiosSeleccionados = [];
      } else if (!Array.isArray(result.municipiosSeleccionados)) {
        console.error('municipiosSeleccionados no es un array, se inicializará como array vacío');
        result.municipiosSeleccionados = [];
      }
      
      // Verificar parroquias
      if (!result.parroquiasSeleccionadas) {
        result.parroquiasSeleccionadas = [];
      } else if (!Array.isArray(result.parroquiasSeleccionadas)) {
        console.error('parroquiasSeleccionadas no es un array, se inicializará como array vacío');
        result.parroquiasSeleccionadas = [];
      }
      
      return result;
    } catch (error) {
      console.error('Error al sanear datos de entrada:', error);
      return {
        ...data,
        estadosSeleccionados: [],
        municipiosSeleccionados: [],
        parroquiasSeleccionadas: []
      };
    }
  })();
  
  // Agregar este log para verificar qué datos están entrando al componente
  console.log('Datos de InformacionBasica:', {
    estadosSeleccionados: dataSaneados?.estadosSeleccionados,
    municipiosSeleccionados: dataSaneados?.municipiosSeleccionados,
    parroquiasSeleccionadas: dataSaneados?.parroquiasSeleccionadas,
  });
  
  // Estados para las listas de territorios
  const [estados, setEstados] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [parroquias, setParroquias] = useState([]);
  
  // Estados para la selección actual (para cascada)
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);
  const [municipioSeleccionado, setMunicipioSeleccionado] = useState(null);
  
  // Estado para errores de carga
  const [loadingError, setLoadingError] = useState('');
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: dataSaneados?.nombre || '',
    descripcion: dataSaneados?.descripcion || '',
    fechaHora: dataSaneados?.fechaHora ? dayjs(dataSaneados.fechaHora) : dayjs().add(1, 'day').hour(12).minute(0),
    tipoSorteo: dataSaneados?.tipoSorteo || 'nacional',
    estadosSeleccionados: dataSaneados.estadosSeleccionados,
    municipiosSeleccionados: dataSaneados.municipiosSeleccionados,
    parroquiasSeleccionadas: dataSaneados.parroquiasSeleccionadas,
    nivelDetalle: dataSaneados?.nivelDetalle || 'estado',
    usarMunicipios: Boolean(dataSaneados?.usarMunicipios) || false,
    usarParroquias: Boolean(dataSaneados?.usarParroquias) || false
  });
  
  // Estado para validación
  const [errors, setErrors] = useState({
    nombre: '',
    fechaHora: ''
  });

  // Normalizar los datos al iniciar el componente para prevenir errores de renderizado
  useEffect(() => {
    try {
      console.log('Normalizando datos iniciales de InformacionBasica');
      
      // Asegurar que todos los arreglos de selección son arrays válidos
      const normalizarSelecciones = {
        estadosSeleccionados: Array.isArray(formData.estadosSeleccionados) 
          ? formData.estadosSeleccionados.map(e => {
              if (!e) return null;
              return typeof e === 'object' ? e : { cod_estado: e, nom_estado: `Estado ${e}` };
            }).filter(Boolean)
          : [],
        
        municipiosSeleccionados: Array.isArray(formData.municipiosSeleccionados)
          ? formData.municipiosSeleccionados.map(m => {
              if (!m) return null;
              return typeof m === 'object' ? m : { cod_municipio: m, nom_municipio: `Municipio ${m}` };
            }).filter(Boolean)
          : [],
        
        parroquiasSeleccionadas: Array.isArray(formData.parroquiasSeleccionadas)
          ? formData.parroquiasSeleccionadas.map(p => {
              if (!p) return null;
              return typeof p === 'object' ? p : { cod_parroquia: p, nom_parroquia: `Parroquia ${p}` };
            }).filter(Boolean)
          : []
      };
      
      // Actualizar el estado solo si es necesario
      const requiereActualizacion = 
        normalizarSelecciones.estadosSeleccionados.length !== formData.estadosSeleccionados.length ||
        normalizarSelecciones.municipiosSeleccionados.length !== formData.municipiosSeleccionados.length ||
        normalizarSelecciones.parroquiasSeleccionadas.length !== formData.parroquiasSeleccionadas.length;
      
      if (requiereActualizacion) {
        console.log('Actualizando formData con selecciones normalizadas');
        setFormData(prev => ({
          ...prev,
          ...normalizarSelecciones
        }));
      }
    } catch (error) {
      console.error('Error al normalizar datos iniciales:', error);
    }
  }, []);

  // Cargar lista de estados desde la BD
  useEffect(() => {
    const cargarEstados = async () => {
      try {
        setLoadingError('');
        
        // Consulta para obtener estados desde la base de datos
        const resultado = await window.electronAPI.dbQuery(`
          SELECT cod_estado, nom_estado, COALESCE(poblacion, 0) as poblacion 
          FROM estados 
          WHERE activo = true 
          ORDER BY nom_estado
        `);
        
        if (resultado && resultado.length > 0) {
          setEstados(resultado);
          console.log("Estados cargados:", resultado.length);
        } else {
          setLoadingError('No se encontraron estados activos en la base de datos.');
        }
      } catch (error) {
        console.error("Error al cargar estados:", error);
        setLoadingError(`Error al cargar estados: ${error.message}`);
        
        // Valores por defecto en caso de error para no bloquear la aplicación
        setEstados([
          { cod_estado: 1, nom_estado: 'Amazonas', poblacion: 150000 },
          { cod_estado: 2, nom_estado: 'Anzoátegui', poblacion: 1600000 },
          { cod_estado: 3, nom_estado: 'Apure', poblacion: 550000 },
          { cod_estado: 4, nom_estado: 'Aragua', poblacion: 1800000 },
          { cod_estado: 5, nom_estado: 'Barinas', poblacion: 900000 },
        ]); 
      }
    };

    cargarEstados();
  }, []);

  // Cargar municipios cuando se selecciona un estado
  useEffect(() => {
    const cargarMunicipios = async () => {
      if (!estadoSeleccionado) {
        setMunicipios([]);
        return;
      }

      try {
        setLoadingError('');
        
        const resultado = await window.electronAPI.dbQuery(`
          SELECT cod_municipio, nom_municipio, COALESCE(poblacion, 0) as poblacion 
          FROM municipios 
          WHERE cod_estado = $1 AND activo = true 
          ORDER BY nom_municipio
        `, [estadoSeleccionado.cod_estado]);
        
        if (resultado && resultado.length > 0) {
          setMunicipios(resultado);
          console.log(`Municipios cargados para ${estadoSeleccionado.nom_estado}:`, resultado.length);
        } else {
          setMunicipios([]);
          setLoadingError(`No se encontraron municipios para ${estadoSeleccionado.nom_estado}`);
        }
      } catch (error) {
        console.error("Error al cargar municipios:", error);
        setLoadingError(`Error al cargar municipios: ${error.message}`);
        setMunicipios([]);
      }
    };

    cargarMunicipios();
  }, [estadoSeleccionado]);

  // Cargar parroquias cuando se selecciona un municipio
  useEffect(() => {
    const cargarParroquias = async () => {
      if (!municipioSeleccionado || !estadoSeleccionado) {
        setParroquias([]);
        return;
      }

      try {
        setLoadingError('');
        
        const resultado = await window.electronAPI.dbQuery(`
          SELECT cod_parroquia, nom_parroquia, COALESCE(poblacion, 0) as poblacion 
          FROM parroquias 
          WHERE cod_estado = $1 AND cod_municipio = $2 AND activo = true 
          ORDER BY nom_parroquia
        `, [estadoSeleccionado.cod_estado, municipioSeleccionado.cod_municipio]);
        
        if (resultado && resultado.length > 0) {
          setParroquias(resultado);
          console.log(`Parroquias cargadas para ${municipioSeleccionado.nom_municipio}:`, resultado.length);
        } else {
          setParroquias([]);
          setLoadingError(`No se encontraron parroquias para ${municipioSeleccionado.nom_municipio}`);
        }
      } catch (error) {
        console.error("Error al cargar parroquias:", error);
        setLoadingError(`Error al cargar parroquias: ${error.message}`);
        setParroquias([]);
      }
    };

    cargarParroquias();
  }, [estadoSeleccionado, municipioSeleccionado]);

  // Validar campos cuando cambian
  const validateField = (name, value) => {
    let errorMsg = '';
    
    switch (name) {
      case 'nombre':
        if (!value.trim()) {
          errorMsg = 'El nombre del sorteo es obligatorio';
        } else if (value.length < 5) {
          errorMsg = 'El nombre debe tener al menos 5 caracteres';
        }
        break;
      case 'fechaHora':
        if (!value) {
          errorMsg = 'La fecha y hora es obligatoria';
        } else {
          const now = dayjs();
          if (value.isBefore(now)) {
            errorMsg = 'La fecha debe ser futura';
          }
        }
        break;
      default:
        break;
    }
    
    return errorMsg;
  };

  // Manejar cambios en campos de texto
  const handleTextChange = (e) => {
    const { name, value } = e.target;
    const errorMsg = validateField(name, value);
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    setErrors({
      ...errors,
      [name]: errorMsg
    });
    
    // Propagar cambios al componente padre solo si no hay errores
    if (!errorMsg) {
      onChange({ [name]: value });
    }
  };

  // Manejar cambios en la fecha y hora
  const handleDateChange = (newValue) => {
    const errorMsg = validateField('fechaHora', newValue);
    
    // Log detallado para depuración
    console.log('Fecha seleccionada:', {
      value: newValue,
      type: typeof newValue,
      isDayjs: newValue && typeof newValue === 'object' && typeof newValue.format === 'function',
      jsDate: newValue && newValue.$d ? new Date(newValue.$d) : null,
      localString: newValue && newValue.$d ? new Date(newValue.$d).toLocaleString() : null
    });
    
    setFormData({
      ...formData,
      fechaHora: newValue
    });
    
    setErrors({
      ...errors,
      fechaHora: errorMsg
    });
    
    // Propagar cambios al componente padre
    if (!errorMsg) {
      try {
        let fechaISO = null;
        
        if (newValue) {
          // Para dayjs, usar la fecha actual en formato ISO
          if (typeof newValue.format === 'function') {
            // Usar formato ISO estricto con offset de zona horaria explícito
            fechaISO = newValue.format('YYYY-MM-DDTHH:mm:ss.SSSZ');
            console.log('Fecha convertida con dayjs.format():', fechaISO);
          } 
          // Si tenemos un objeto Date o algo con $d (internal dayjs) 
          else if (newValue.$d) {
            const jsDate = new Date(newValue.$d);
            // Usar toISOString para garantizar un formato ISO8601 correcto
            fechaISO = jsDate.toISOString();
            console.log('Fecha convertida desde $d:', fechaISO, 'JS Date:', jsDate);
          }
          // Fallback para objetos Date
          else if (typeof newValue.toISOString === 'function') {
            fechaISO = newValue.toISOString();
            console.log('Fecha convertida con toISOString():', fechaISO);
          }
        }
        
        console.log('Fecha final que será enviada:', fechaISO);
        
        // Pasar el objeto dayjs original para evitar conversiones adicionales
        onChange({ fechaHora: newValue }); 
      } catch (error) {
        console.error('Error al procesar la fecha:', error);
        setErrors({
          ...errors,
          fechaHora: 'Error al procesar la fecha: ' + error.message
        });
      }
    }
  };

  // Manejar cambio en el tipo de sorteo
  const handleTipoSorteoChange = (e) => {
    const tipoSorteo = e.target.value;
    
    // Si cambia de regional/mixto a nacional, limpiar los estados seleccionados
    let updatedFormData = {
      ...formData,
      tipoSorteo
    };
    
    if (tipoSorteo === 'nacional') {
      updatedFormData = {
        ...updatedFormData,
        estadosSeleccionados: [],
        municipiosSeleccionados: [],
        parroquiasSeleccionadas: []
      };
    }
    
    setFormData(updatedFormData);
    
    // Notificar al componente padre
    onChange({
      tipoSorteo,
      ...(tipoSorteo === 'nacional' && {
        estadosSeleccionados: [],
        municipiosSeleccionados: [],
        parroquiasSeleccionadas: []
      })
    });
  };

  // Manejar el cambio de datos en cada paso
  const handleDataChange = (data) => {
    // Propagar cambios al componente padre
    onChange({
      ...data
    });
  };

  // Manejar selección múltiple de estados
  const handleEstadosChange = (event, newValue) => {
    // Verificar que newValue no sea null antes de usarlo
    if (!newValue) {
      newValue = [];
    }
    
    // Actualizar formData
    setFormData({
      ...formData,
      estadosSeleccionados: newValue
    });
    
    // Notificar al componente padre con la estructura esperada
    // Asegurarse de que solo se envían las propiedades necesarias
    const estadosSimplificados = newValue.map(estado => ({
      cod_estado: estado.cod_estado,
      nom_estado: estado.nom_estado
    }));
    
    onChange({ estadosSeleccionados: estadosSimplificados });
    
    // Si estamos utilizando la cascada, actualizar estado seleccionado
    if (newValue && newValue.length === 1) {
      setEstadoSeleccionado(newValue[0]);
    } else if (!newValue || newValue.length === 0) {
      setEstadoSeleccionado(null);
      setMunicipioSeleccionado(null);
    }
  };

  // Manejar selección múltiple de municipios
  const handleMunicipiosChange = (event, newValue) => {
    // Verificar que newValue no sea null antes de usarlo
    if (!newValue) {
      newValue = [];
    }

    // Asegurarse de que todos los elementos tengan el formato correcto
    const valoresNormalizados = newValue.map(municipio => {
      // Si es un objeto completo, usarlo directamente
      if (municipio && typeof municipio === 'object' && municipio.cod_municipio && municipio.nom_municipio) {
        return municipio;
      }
      
      // Si es un objeto parcial o un ID, buscar los datos completos
      const cod = typeof municipio === 'object' ? municipio.cod_municipio : municipio;
      const municipioCompleto = municipios.find(m => m.cod_municipio === cod);
      
      if (municipioCompleto) {
        return municipioCompleto;
      }
      
      // Si no se encuentra, crear un objeto válido
      return {
        cod_municipio: cod,
        nom_municipio: typeof municipio === 'object' && municipio.nom_municipio 
          ? municipio.nom_municipio 
          : `Municipio ${cod}`
      };
    });
    
    // Actualizar formData
    setFormData({
      ...formData,
      municipiosSeleccionados: valoresNormalizados
    });
    
    // Notificar al componente padre con la estructura esperada
    const municipiosSimplificados = valoresNormalizados.map(municipio => ({
      cod_municipio: municipio.cod_municipio,
      nom_municipio: municipio.nom_municipio
    }));
    
    onChange({ municipiosSeleccionados: municipiosSimplificados });
    
    // Si estamos utilizando la cascada, actualizar municipio seleccionado
    if (valoresNormalizados.length === 1) {
      setMunicipioSeleccionado(valoresNormalizados[0]);
    } else if (valoresNormalizados.length === 0) {
      setMunicipioSeleccionado(null);
    }
  };

  // Manejar selección múltiple de parroquias
  const handleParroquiasChange = (event, newValue) => {
    // Verificar que newValue no sea null antes de usarlo
    if (!newValue) {
      newValue = [];
    }
    
    try {
      console.log('handleParroquiasChange recibió:', newValue);
      
      // Asegurarse de que todos los elementos de newValue tengan el formato correcto
      const valoresNormalizados = newValue.map(parroquia => {
        if (!parroquia) {
          return {
            cod_parroquia: '',
            nom_parroquia: 'Parroquia sin nombre'
          };
        }
        
        // Detectar si es un objeto de estado en lugar de parroquia
        if (parroquia && 
            typeof parroquia === 'object' && 
            parroquia.cod_estado && 
            parroquia.nom_estado && 
            !parroquia.cod_parroquia) {
          console.warn('Detectado y transformando objeto de estado en parroquia:', parroquia);
          // Crear un objeto con formato de parroquia a partir del estado
          return {
            cod_parroquia: `e${parroquia.cod_estado}`,
            nom_parroquia: `Estado: ${parroquia.nom_estado}`,
            tipo: 'estado_convertido' // Marcar para identificarlo fácilmente
          };
        }
        
        // Si es un objeto completo con todas las propiedades necesarias, usarlo directamente
        if (parroquia && 
            typeof parroquia === 'object' && 
            parroquia.cod_parroquia && 
            parroquia.nom_parroquia) {
          return parroquia;
        }
        
        // Si es un objeto parcial o un ID, buscar los datos completos
        const cod = typeof parroquia === 'object' ? parroquia.cod_parroquia : parroquia;
        const parroquiaCompleta = parroquias.find(p => p && p.cod_parroquia === cod);
        
        if (parroquiaCompleta) {
          return parroquiaCompleta;
        }
        
        // Si no se encuentra en la lista de parroquias, crear un objeto válido
        return {
          cod_parroquia: cod,
          nom_parroquia: typeof parroquia === 'object' && parroquia.nom_parroquia 
            ? parroquia.nom_parroquia 
            : `Parroquia ${cod || ''}`
        };
      });
      
      console.log('Valores normalizados de parroquias:', valoresNormalizados);
      
      // Actualizar formData con los valores normalizados
      setFormData({
        ...formData,
        parroquiasSeleccionadas: valoresNormalizados
      });
      
      // Notificar al componente padre con la estructura esperada
      // Solo enviamos los datos mínimos necesarios (cod_parroquia y nom_parroquia)
      const parroquiasSimplificadas = valoresNormalizados.map(parroquia => ({
        cod_parroquia: parroquia.cod_parroquia,
        nom_parroquia: parroquia.nom_parroquia
      }));
      
      console.log('Parroquias simplificadas para onChange:', parroquiasSimplificadas);
      onChange({ parroquiasSeleccionadas: parroquiasSimplificadas });
    } catch (error) {
      console.error('Error al procesar parroquias seleccionadas:', error);
      // En caso de error, establecer un valor vacío para evitar problemas
      setFormData({
        ...formData,
        parroquiasSeleccionadas: []
      });
      onChange({ parroquiasSeleccionadas: [] });
    }
  };

  // Manejar selección de estado individual (para cascada)
  const handleEstadoChange = (event, estado) => {
    // Manejo seguro cuando estado es null
    setEstadoSeleccionado(estado || null);
    setMunicipioSeleccionado(null);
    
    setFormData({
      ...formData,
      municipiosSeleccionados: [],
      parroquiasSeleccionadas: []
    });
    
    onChange({ 
      municipiosSeleccionados: [],
      parroquiasSeleccionadas: []
    });
  };

  // Manejar selección de municipio individual (para cascada)
  const handleMunicipioChange = (event, municipio) => {
    // Manejo seguro cuando municipio es null
    setMunicipioSeleccionado(municipio || null);
    
    setFormData({
      ...formData,
      parroquiasSeleccionadas: []
    });
    
    onChange({ parroquiasSeleccionadas: [] });
  };

  // Manejar cambio en nivel de detalle (Estado/Municipio/Parroquia)
  const handleNivelDetalleChange = (e) => {
    const nuevoNivel = e.target.value;
    setFormData({
      ...formData,
      nivelDetalle: nuevoNivel
    });
    onChange({ nivelDetalle: nuevoNivel });
  };

  // Manejar activación/desactivación de selección por municipios
  const handleUsarMunicipiosChange = (event) => {
    const usarMunicipios = event.target.checked;
    
    let updatedData = {
      ...formData,
      usarMunicipios
    };
    
    // Si se desactiva municipios, desactivar parroquias también
    if (!usarMunicipios) {
      updatedData = {
        ...updatedData,
        usarParroquias: false,
        municipiosSeleccionados: [],
        parroquiasSeleccionadas: [],
        nivelDetalle: 'estado'
      };
      setNivelDetalle('estado');
      setMunicipioSeleccionado(null);
    }
    
    setFormData(updatedData);
    
    // Notificar al componente padre
    onChange({
      usarMunicipios,
      ...(usarMunicipios === false && {
        usarParroquias: false,
        municipiosSeleccionados: [],
        parroquiasSeleccionadas: [],
        nivelDetalle: 'estado'
      })
    });
  };

  // Manejar activación/desactivación de selección por parroquias
  const handleUsarParroquiasChange = (event) => {
    const usarParroquias = event.target.checked;
    
    // Si se activan parroquias, activar municipios también
    const updatedData = {
      ...formData,
      usarParroquias,
      usarMunicipios: usarParroquias ? true : formData.usarMunicipios,
      ...(usarParroquias === false && {
        parroquiasSeleccionadas: [],
        nivelDetalle: formData.usarMunicipios ? 'municipio' : 'estado'
      })
    };
    
    setFormData(updatedData);
    
    // Si cambia el nivel, actualizar el estado
    if (usarParroquias === false && formData.nivelDetalle === 'parroquia') {
      setNivelDetalle(formData.usarMunicipios ? 'municipio' : 'estado');
    }
    
    // Notificar al componente padre
    onChange({
      usarParroquias,
      usarMunicipios: usarParroquias ? true : formData.usarMunicipios,
      ...(usarParroquias === false && {
        parroquiasSeleccionadas: [],
        nivelDetalle: formData.usarMunicipios ? 'municipio' : 'estado'
      })
    });
  };

  // Añadir la función handleAutocompleteChange que falta
  const handleAutocompleteChange = (field, newValue) => {
    // Verificar que newValue no sea null antes de usarlo
    if (!newValue) {
      newValue = [];
    }
    
    // Actualizar formData
    setFormData({
      ...formData,
      [field]: newValue
    });
    
    // Si es parroquiasSeleccionadas, usar la función específica que ya existe
    if (field === 'parroquiasSeleccionadas') {
      handleParroquiasChange(null, newValue);
    } else {
      // Para otros campos, notificar al componente padre directamente
      onChange({ [field]: newValue });
    }
  };

  // Determinar si la sección de territorios debe ser visible según el tipo de sorteo
  const mostrarSeleccionTerritorios = formData.tipoSorteo === 'regional' || formData.tipoSorteo === 'mixto';

  React.useEffect(() => {
    console.log('InformacionBasica montado - Estado actual:', {
      estadosSeleccionados: formData.estadosSeleccionados,
      municipiosSeleccionados: formData.municipiosSeleccionados,
      parroquiasSeleccionadas: formData.parroquiasSeleccionadas,
    });
  }, []);

  // Función auxiliar para asegurar formato correcto de elementos seleccionados
  const asegurarFormatoSeleccion = (option, tipo = 'elemento') => {
    try {
      if (!option) return null;
      
      // Si ya es una cadena, devolverla directamente
      if (typeof option === 'string') return option;
      
      // Si es un número, convertirlo a cadena
      if (typeof option === 'number') return `${tipo} ${option}`;
      
      // Si es un objeto, extraer el nombre según el tipo
      if (typeof option === 'object') {
        // Verificar específicamente si es un objeto de estado en lugar de parroquia
        if (option.cod_estado && option.nom_estado && !option.cod_parroquia && tipo === 'parroquia') {
          return `Estado: ${option.nom_estado}`;
        }
        
        // Usar la propiedad correspondiente según el tipo
        switch (tipo) {
          case 'estado':
            return option.nom_estado || `Estado sin nombre`;
          case 'municipio':
            return option.nom_municipio || `Municipio sin nombre`;
          case 'parroquia':
            return option.nom_parroquia || `Parroquia sin nombre`;
          default:
            return Object.values(option).find(v => typeof v === 'string') || `${tipo} sin nombre`;
        }
      }
      
      // Por defecto, retornar un mensaje genérico
      return `${tipo} desconocido`;
    } catch (error) {
      console.error(`Error al asegurar formato para ${tipo}:`, error, option);
      return `${tipo} con error`;
    }
  };

  return (
    <div className="sorteo-form">
      <Typography variant="h2" className="form-section-title" id="info-basica-title">
        Información Básica del Sorteo
      </Typography>
      
      <Grid container spacing={3}>
        {loadingError && (
          <Grid item xs={12}>
            <Alert severity="warning">
              {loadingError}
            </Alert>
          </Grid>
        )}
        
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            id="nombre"
            label="Nombre del Sorteo"
            name="nombre"
            value={formData.nombre}
            onChange={handleTextChange}
            error={!!errors.nombre}
            helperText={errors.nombre}
            aria-describedby="nombre-descripcion"
          />
          <span id="nombre-descripcion" className="visually-hidden">Ingresa el nombre del sorteo a realizar</span>
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            id="descripcion"
            label="Descripción"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleTextChange}
            multiline
            rows={2}
            aria-describedby="descripcion-ayuda"
          />
          <span id="descripcion-ayuda" className="visually-hidden">Ingresa una descripción detallada del sorteo</span>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
            <DateTimePicker
              label="Fecha y Hora del Sorteo"
              value={formData.fechaHora}
              onChange={handleDateChange}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  fullWidth 
                  required
                  error={!!errors.fechaHora}
                  helperText={errors.fechaHora}
                />
              )}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  error: !!errors.fechaHora,
                  helperText: errors.fechaHora
                }
              }}
            />
          </LocalizationProvider>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel id="tipo-sorteo-label">Tipo de Sorteo</InputLabel>
            <Select
              labelId="tipo-sorteo-label"
              id="tipoSorteo"
              value={formData.tipoSorteo}
              label="Tipo de Sorteo"
              onChange={handleTipoSorteoChange}
            >
              <MenuItem value="nacional">Nacional (Todo el país)</MenuItem>
              <MenuItem value="regional">Regional (Estados específicos)</MenuItem>
              <MenuItem value="mixto">Mixto (Premios nacionales y regionales)</MenuItem>
            </Select>
            <FormHelperText>
              {formData.tipoSorteo === 'nacional' && 'Sorteo aplicable a todo el país'}
              {formData.tipoSorteo === 'regional' && 'Sorteo limitado a estados específicos'}
              {formData.tipoSorteo === 'mixto' && 'Sorteo con premios nacionales y regionales'}
            </FormHelperText>
          </FormControl>
        </Grid>
        
        {mostrarSeleccionTerritorios && (
          <>
            <Grid item xs={12}>
              <Divider textAlign="left">
                <Typography variant="subtitle1" color="primary">Selección de Territorios</Typography>
              </Divider>
            </Grid>
            
            <Grid item xs={12}>
              <Paper elevation={1} sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl component="fieldset">
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={formData.usarMunicipios}
                            onChange={handleUsarMunicipiosChange}
                          />
                        }
                        label="Usar selección por Municipios"
                      />
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControl component="fieldset">
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={formData.usarParroquias}
                            onChange={handleUsarParroquiasChange}
                            disabled={!formData.usarMunicipios}
                          />
                        }
                        label="Usar selección por Parroquias"
                      />
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel id="nivel-detalle-label">Nivel de Distribución</InputLabel>
                      <Select
                        labelId="nivel-detalle-label"
                        id="nivelDetalle"
                        value={formData.nivelDetalle}
                        label="Nivel de Distribución"
                        onChange={handleNivelDetalleChange}
                      >
                        <MenuItem value="estado">Por Estado</MenuItem>
                        <MenuItem value="municipio" disabled={!formData.usarMunicipios}>Por Municipio</MenuItem>
                        <MenuItem value="parroquia" disabled={!formData.usarParroquias}>Por Parroquia</MenuItem>
                      </Select>
                      <FormHelperText>
                        Determina cómo se distribuirán los tickets según población
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <ErrorBoundary 
                fallbackMessage="Error al mostrar la selección de estados"
                fallbackComponent={
                  <Box mt={2}>
                    <Alert severity="warning">
                      Ha ocurrido un error al cargar el selector de estados. 
                      Intente refrescar la página.
                    </Alert>
                  </Box>
                }
              >
                <Autocomplete
                  multiple={formData.tipoSorteo !== 'nacional'}
                  id="estados-seleccionados"
                  options={estados}
                  getOptionLabel={(option) => {
                    try {
                      return asegurarFormatoSeleccion(option, 'estado');
                    } catch (error) {
                      console.error('Error en getOptionLabel para estado:', error);
                      return '';
                    }
                  }}
                  value={formData.estadosSeleccionados || []}
                  onChange={handleEstadosChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                      label="Estados Participantes"
                      placeholder="Seleccionar estados"
                    />
                  )}
                  renderTags={(value, getTagProps) => {
                    console.log('renderTags recibe:', value);
                    // Verificar que value sea un array
                    if (!Array.isArray(value)) {
                      console.error('renderTags recibió un valor no array:', value);
                      return null;
                    }
                    
                    return value.map((option, index) => {
                      console.log(`renderTags procesando elemento ${index}:`, option);
                      
                      // Usar función auxiliar para obtener la etiqueta segura
                      const label = asegurarFormatoSeleccion(option, 'estado');
                      console.log(`renderTags resultado final para elemento ${index}:`, label);
                      
                      return (
                        <Chip
                          variant="outlined"
                          label={label}
                          {...getTagProps({ index })}
                        />
                      );
                    });
                  }}
                />
              </ErrorBoundary>
            </Grid>
            
            {formData.estadosSeleccionados && formData.estadosSeleccionados.length > 0 && !formData.usarMunicipios && (
              <Grid item xs={12}>
                <ErrorBoundary 
                  fallbackMessage="Error al mostrar la selección de estado actual"
                  fallbackComponent={
                    <Box mt={2}>
                      <Alert severity="warning">
                        Ha ocurrido un error al cargar el selector de estado actual. 
                        Intente refrescar la página.
                      </Alert>
                    </Box>
                  }
                >
                  <Autocomplete
                    id="estadoSeleccionado"
                    options={formData.estadosSeleccionados || []}
                    getOptionLabel={(option) => {
                      try {
                        return asegurarFormatoSeleccion(option, 'estado');
                      } catch (error) {
                        console.error('Error en getOptionLabel para estado seleccionado:', error);
                        return '';
                      }
                    }}
                    value={estadoSeleccionado}
                    onChange={handleEstadoChange}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="outlined"
                        label="Estado Seleccionado (para cascada)"
                        placeholder="Seleccione un estado para ver municipios"
                      />
                    )}
                  />
                </ErrorBoundary>
              </Grid>
            )}
            
            {formData.usarMunicipios && estadoSeleccionado && (
              <Grid item xs={12}>
                <ErrorBoundary 
                  fallbackMessage="Error al mostrar la selección de municipios"
                  fallbackComponent={
                    <Box mt={2}>
                      <Alert severity="warning">
                        Ha ocurrido un error al cargar el selector de municipios. 
                        Intente seleccionar otro estado o refrescar la página.
                      </Alert>
                      <Button 
                        variant="outlined" 
                        color="primary" 
                        size="small" 
                        sx={{ mt: 1 }}
                        onClick={() => {
                          // Limpiar selección de municipios
                          setFormData({
                            ...formData,
                            municipiosSeleccionados: [],
                            parroquiasSeleccionadas: []
                          });
                          onChange({ 
                            municipiosSeleccionados: [],
                            parroquiasSeleccionadas: []
                          });
                        }}
                      >
                        Limpiar selección de municipios
                      </Button>
                    </Box>
                  }
                >
                  <Autocomplete
                    multiple={formData.nivelDetalle !== 'municipio'}
                    id="municipiosSeleccionados"
                    options={municipios || []}
                    getOptionLabel={(option) => {
                      try {
                        return asegurarFormatoSeleccion(option, 'municipio');
                      } catch (error) {
                        console.error('Error en getOptionLabel para municipio:', error);
                        return '';
                      }
                    }}
                    value={formData.municipiosSeleccionados || []}
                    onChange={handleMunicipiosChange}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="outlined"
                        label={`Municipios de ${estadoSeleccionado?.nom_estado || 'Estado seleccionado'}`}
                        placeholder="Seleccionar municipios"
                      />
                    )}
                    renderTags={(value, getTagProps) => {
                      console.log('renderTags recibe:', value);
                      // Verificar que value sea un array
                      if (!Array.isArray(value)) {
                        console.error('renderTags recibió un valor no array:', value);
                        return null;
                      }
                      
                      return value.map((option, index) => {
                        console.log(`renderTags procesando elemento ${index}:`, option);
                        
                        // Usar función auxiliar para obtener la etiqueta segura
                        const label = asegurarFormatoSeleccion(option, 'municipio');
                        console.log(`renderTags resultado final para elemento ${index}:`, label);
                        
                        return (
                          <Chip
                            variant="outlined"
                            label={label}
                            {...getTagProps({ index })}
                          />
                        );
                      });
                    }}
                    noOptionsText={`No hay municipios disponibles para ${estadoSeleccionado?.nom_estado || 'este estado'}`}
                  />
                </ErrorBoundary>
              </Grid>
            )}
            
            {formData.usarMunicipios && municipioSeleccionado && (
              <Grid item xs={12}>
                <ErrorBoundary 
                  fallbackMessage="Error al mostrar la selección de municipio actual"
                  fallbackComponent={
                    <Box mt={2}>
                      <Alert severity="warning">
                        Ha ocurrido un error al cargar el selector de municipio actual. 
                        Intente refrescar la página.
                      </Alert>
                    </Box>
                  }
                >
                  <Autocomplete
                    id="municipioSeleccionado"
                    options={formData.municipiosSeleccionados || []}
                    getOptionLabel={(option) => {
                      try {
                        return asegurarFormatoSeleccion(option, 'municipio');
                      } catch (error) {
                        console.error('Error en getOptionLabel para municipio seleccionado:', error);
                        return '';
                      }
                    }}
                    value={municipioSeleccionado}
                    onChange={handleMunicipioChange}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="outlined"
                        label="Municipio Seleccionado (para cascada)"
                        placeholder="Seleccione un municipio para ver parroquias"
                      />
                    )}
                  />
                </ErrorBoundary>
              </Grid>
            )}
            
            {formData.usarParroquias && estadoSeleccionado && municipioSeleccionado && (
              <Grid item xs={12}>
                <ErrorBoundary 
                  fallbackMessage="Error al mostrar la selección de parroquias"
                  fallbackComponent={
                    <Box mt={2}>
                      <Alert severity="warning">
                        Ha ocurrido un error al cargar el selector de parroquias. 
                        Intente seleccionar otro municipio o refrescar la página.
                      </Alert>
                      <Button 
                        variant="outlined" 
                        color="primary" 
                        size="small" 
                        sx={{ mt: 1 }}
                        onClick={() => {
                          // Limpiar selección de parroquias
                          setFormData({
                            ...formData,
                            parroquiasSeleccionadas: []
                          });
                          onChange({ parroquiasSeleccionadas: [] });
                        }}
                      >
                        Limpiar selección de parroquias
                      </Button>
                    </Box>
                  }
                >
                  <Autocomplete
                    multiple
                    id="parroquias-seleccionados"
                    options={parroquias || []}
                    getOptionLabel={(option) => {
                      try {
                        console.log('getOptionLabel parroquia recibe:', option);
                        return asegurarFormatoSeleccion(option, 'parroquia');
                      } catch (error) {
                        console.error('Error en getOptionLabel para parroquia:', error);
                        return '';
                      }
                    }}
                    value={
                      // Transformar los datos de parroquias a un formato consistente
                      Array.isArray(formData.parroquiasSeleccionadas) 
                        ? (() => {
                            console.log('Transformando valor de parroquiasSeleccionadas:', formData.parroquiasSeleccionadas);
                            return formData.parroquiasSeleccionadas.map(ps => {
                              try {
                                // Manejo de valores nulos/undefined
                                if (!ps) {
                                  return {
                                    cod_parroquia: '',
                                    nom_parroquia: 'Parroquia sin especificar'
                                  };
                                }
                                
                                // Si es objeto, imprimir sus keys para diagnóstico
                                if (typeof ps === 'object') {
                                  console.log('Keys del objeto en parroquiasSeleccionadas:', Object.keys(ps));
                                }
                                
                                // Detectar si es un objeto de estado en lugar de parroquia
                                if (ps && 
                                    typeof ps === 'object' && 
                                    ps.cod_estado && 
                                    ps.nom_estado && 
                                    !ps.cod_parroquia) {
                                  console.warn('Detectado objeto de estado en value del Autocomplete:', ps);
                                  return {
                                    cod_parroquia: `e${ps.cod_estado}`,
                                    nom_parroquia: `Estado: ${ps.nom_estado}`
                                  };
                                }
                                
                                // Caso 1: Ya es un objeto completo de parroquia
                                if (ps && typeof ps === 'object' && ps.nom_parroquia && ps.cod_parroquia) {
                                  return ps;
                                }
                                
                                // Caso 2: Es solo un ID o código
                                let codigo = typeof ps === 'object' ? ps.cod_parroquia : ps;
                                
                                // Buscar la parroquia completa por su código
                                const parroquiaCompleta = parroquias.find(p => p && p.cod_parroquia === codigo);
                                
                                // Si la encontramos, devolver el objeto completo
                                if (parroquiaCompleta) {
                                  return parroquiaCompleta;
                                }
                                
                                // Si no la encontramos, devolver un objeto simple pero completo
                                return {
                                  cod_parroquia: codigo,
                                  nom_parroquia: `Parroquia ${codigo || ''}`
                                };
                              } catch (error) {
                                console.error('Error al procesar parroquia seleccionada:', error, ps);
                                return {
                                  cod_parroquia: '',
                                  nom_parroquia: 'Error en parroquia'
                                };
                              }
                            });
                          })()
                        : []
                    }
                    isOptionEqualToValue={(option, value) => {
                      if (!option || !value) return false;
                      
                      // Si ambos son objetos, comparar sus códigos
                      if (typeof option === 'object' && typeof value === 'object') {
                        return option.cod_parroquia === value.cod_parroquia;
                      }
                      
                      // Si uno es objeto y otro es primitivo
                      if (typeof option === 'object' && (typeof value === 'string' || typeof value === 'number')) {
                        return option.cod_parroquia === value;
                      }
                      
                      if ((typeof option === 'string' || typeof option === 'number') && typeof value === 'object') {
                        return option === value.cod_parroquia;
                      }
                      
                      // Si ambos son primitivos
                      return option === value;
                    }}
                    onChange={handleParroquiasChange}
                    disabled={!formData.usarMunicipios || !estadoSeleccionado || !municipioSeleccionado}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="outlined"
                        label={`Parroquias de ${municipioSeleccionado?.nom_municipio || 'Municipio seleccionado'}`}
                        placeholder="Seleccionar parroquias"
                      />
                    )}
                    renderTags={(value, getTagProps) => {
                      console.log('renderTags recibe:', value);
                      // Verificar que value sea un array
                      if (!Array.isArray(value)) {
                        console.error('renderTags recibió un valor no array:', value);
                        return null;
                      }
                      
                      return value.map((option, index) => {
                        console.log(`renderTags procesando elemento ${index}:`, option);
                        
                        // Usar función auxiliar para obtener la etiqueta segura
                        const label = asegurarFormatoSeleccion(option, 'parroquia');
                        console.log(`renderTags resultado final para elemento ${index}:`, label);
                        
                        return (
                          <Chip
                            variant="outlined"
                            label={label}
                            {...getTagProps({ index })}
                          />
                        );
                      });
                    }}
                    noOptionsText={`No hay parroquias disponibles para ${municipioSeleccionado?.nom_municipio || 'este municipio'}`}
                  />
                </ErrorBoundary>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Typography variant="body2" color="error">
                {formData.estadosSeleccionados?.length === 0 && 'Debe seleccionar al menos un estado'}
                {formData.usarMunicipios && formData.municipiosSeleccionados?.length === 0 && estadoSeleccionado && 
                  'Debe seleccionar al menos un municipio'}
                {formData.usarParroquias && formData.parroquiasSeleccionadas?.length === 0 && municipioSeleccionado && 
                  'Debe seleccionar al menos una parroquia'}
              </Typography>
            </Grid>
          </>
        )}
      </Grid>
    </div>
  );
}

export default InformacionBasica;