import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  VerifiedUser as VerifiedUserIcon,
  Upload as UploadIcon,
  Check as CheckIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { 
  Layout, 
  SectionTitle, 
  ButtonPrimary, 
  ButtonSecondary, 
  ButtonText,
  Card, 
  CardContent,
  CardHeader,
  CardActions,
  Table,
  TableContainer,
  TablePagination,
  Chip,
  Form,
  FormGroup,
  FormRow,
  FormCol,
  SearchBar,
  FilterTags,
  ConfirmDialog
} from '../common';
import AuthContext from '../../context/AuthContext';
import participanteService from '../../api/participante';
import sorteoService from '../../api/sorteo';

const ListaParticipantes = () => {
  const { sorteoId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  // Estados
  const [sorteo, setSorteo] = useState(null);
  const [participantes, setParticipantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Estado para paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  
  // Estado para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filters, setFilters] = useState({
    validados: 'todos', // 'todos', 'validados', 'pendientes'
    orderBy: 'fecha_registro' // 'nombre', 'fecha_registro'
  });
  
  // Estado para selección múltiple
  const [selected, setSelected] = useState([]);
  
  // Estado para diálogos
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    action: null
  });

  // Cargar datos del sorteo y participantes
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Cargar info del sorteo
        const sorteoResponse = await sorteoService.getById(sorteoId);
        if (!sorteoResponse.success || !sorteoResponse.sorteo) {
          setError('No se pudo cargar la información del sorteo');
          return;
        }
        
        setSorteo(sorteoResponse.sorteo);
        
        // Cargar participantes con paginación
        await cargarParticipantes();
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setError('Error al cargar los datos. Por favor, intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };
    
    cargarDatos();
  }, [sorteoId]);
  
  // Función para cargar participantes con filtros y paginación
  const cargarParticipantes = async (pageIndex = page, rowsCount = rowsPerPage, search = searchTerm, filterOptions = filters) => {
    try {
      setLoading(true);
      
      // Preparar parámetros para la API
      const params = {
        page: pageIndex + 1, // API espera páginas desde 1
        limit: rowsCount,
        search: search || undefined,
        validados: filterOptions.validados !== 'todos' ? (filterOptions.validados === 'validados') : undefined,
        orderBy: filterOptions.orderBy || undefined
      };
      
      const response = await participanteService.getBySorteo(sorteoId, params);
      
      if (response.success) {
        setParticipantes(response.participantes || []);
        setTotal(response.pagination?.total || 0);
      } else {
        setError('Error al cargar los participantes');
      }
    } catch (error) {
      console.error('Error al cargar participantes:', error);
      setError('Error al cargar los participantes. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Manejo de cambio de página
  const handleChangePage = (pageNumber) => {
    setPage(pageNumber);
    cargarParticipantes(pageNumber, rowsPerPage);
  };
  
  // Manejo de cambio de filas por página
  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    cargarParticipantes(0, newRowsPerPage);
  };
  
  // Manejo de búsqueda
  const handleSearch = (value) => {
    setSearchTerm(value);
    setPage(0);
    cargarParticipantes(0, rowsPerPage, value);
  };
  
  // Manejo de filtros
  const handleFilterChange = (filterName, value) => {
    const newFilters = {
      ...filters,
      [filterName]: value
    };
    setFilters(newFilters);
    setPage(0);
    cargarParticipantes(0, rowsPerPage, searchTerm, newFilters);
  };

  // Manejar cambio en el filtro de etiquetas
  const handleFilterTagChange = (value) => {
    setFiltroEstado(value);
    
    let validadosValue = 'todos';
    switch (value) {
      case 'validados':
        validadosValue = 'validados';
        break;
      case 'pendientes':
        validadosValue = 'pendientes';
        break;
      default:
        validadosValue = 'todos';
    }
    
    handleFilterChange('validados', validadosValue);
  };
  
  // Manejo de selección
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelected(participantes.map(p => p.id));
    } else {
      setSelected([]);
    }
  };
  
  const handleSelectOne = (event, id) => {
    if (event.target.checked) {
      setSelected([...selected, id]);
    } else {
      setSelected(selected.filter(selectedId => selectedId !== id));
    }
  };
  
  // Verificar permisos
  const tienePermisos = () => {
    return user && (user.role === 'admin' || user.role === 'supervisor');
  };
  
  // Funciones para acciones masivas
  const handleValidarSeleccionados = async () => {
    try {
      setLoading(true);
      const response = await participanteService.validarMultiple(sorteoId, selected);
      
      if (response.success) {
        setSuccess(`Se han validado ${selected.length} participantes correctamente`);
        setSelected([]);
        await cargarParticipantes();
      } else {
        setError(response.message || 'Error al validar participantes');
      }
    } catch (error) {
      console.error('Error al validar participantes:', error);
      setError('Error al validar participantes. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };
  
  const handleEliminarSeleccionados = async () => {
    try {
      setLoading(true);
      const response = await participanteService.eliminarMultiple(sorteoId, selected);
      
      if (response.success) {
        setSuccess(`Se han eliminado ${selected.length} participantes correctamente`);
        setSelected([]);
        await cargarParticipantes();
      } else {
        setError(response.message || 'Error al eliminar participantes');
      }
    } catch (error) {
      console.error('Error al eliminar participantes:', error);
      setError('Error al eliminar participantes. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };
  
  // Funciones para acciones individuales
  const handleValidarParticipante = async (id) => {
    try {
      setLoading(true);
      const response = await participanteService.validar(sorteoId, id);
      
      if (response.success) {
        setSuccess('Participante validado correctamente');
        await cargarParticipantes();
      } else {
        setError(response.message || 'Error al validar participante');
      }
    } catch (error) {
      console.error('Error al validar participante:', error);
      setError('Error al validar participante. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };
  
  const handleEliminarParticipante = async (id) => {
    try {
      setLoading(true);
      const response = await participanteService.eliminar(sorteoId, id);
      
      if (response.success) {
        setSuccess('Participante eliminado correctamente');
        await cargarParticipantes();
      } else {
        setError(response.message || 'Error al eliminar participante');
      }
    } catch (error) {
      console.error('Error al eliminar participante:', error);
      setError('Error al eliminar participante. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };
  
  // Configuración del diálogo de confirmación
  const mostrarConfirmDialog = (title, message, action) => {
    setConfirmDialog({
      open: true,
      title,
      message,
      action
    });
  };
  
  const cerrarConfirmDialog = () => {
    setConfirmDialog({ ...confirmDialog, open: false });
  };
  
  // Definición de columnas para la tabla
  const columns = [
    {
      id: 'seleccion',
      label: (
        <Checkbox
          checked={participantes.length > 0 && selected.length === participantes.length}
          onChange={handleSelectAll}
          disabled={!tienePermisos()}
        />
      ),
      render: (participante) => (
        <Checkbox
          checked={selected.includes(participante.id)}
          onChange={(e) => handleSelectOne(e, participante.id)}
          disabled={!tienePermisos()}
        />
      ),
      width: '50px',
      align: 'center'
    },
    {
      id: 'documento',
      label: 'Documento',
      render: (participante) => participante.documento
    },
    {
      id: 'nombre',
      label: 'Nombre',
      render: (participante) => `${participante.nombres} ${participante.apellidos}`
    },
    {
      id: 'email',
      label: 'Email',
      render: (participante) => participante.email || 'N/A'
    },
    {
      id: 'telefono',
      label: 'Teléfono',
      render: (participante) => participante.telefono || 'N/A'
    },
    {
      id: 'estado',
      label: 'Estado',
      render: (participante) => (
        <Chip 
          label={participante.validado ? 'Validado' : 'Pendiente'} 
          color={participante.validado ? 'success' : 'warning'} 
        />
      )
    },
    {
      id: 'acciones',
      label: 'Acciones',
      render: (participante) => (
        <div className="flex space-x-2">
          {tienePermisos() && !participante.validado && (
            <ButtonText
              onClick={() => mostrarConfirmDialog(
                'Validar participante', 
                `¿Está seguro que desea validar a ${participante.nombres} ${participante.apellidos}?`,
                () => handleValidarParticipante(participante.id)
              )}
              startIcon={<CheckIcon />}
            >
              Validar
            </ButtonText>
          )}
          
          {tienePermisos() && (
            <>
              <ButtonText
                to={`/sorteos/${sorteoId}/participantes/editar/${participante.id}`}
                startIcon={<EditIcon />}
              >
                Editar
              </ButtonText>
              
              <ButtonText
                onClick={() => mostrarConfirmDialog(
                  'Eliminar participante', 
                  `¿Está seguro que desea eliminar a ${participante.nombres} ${participante.apellidos}?`,
                  () => handleEliminarParticipante(participante.id)
                )}
                startIcon={<DeleteIcon />}
                className="text-red-600 hover:text-red-800"
              >
                Eliminar
              </ButtonText>
            </>
          )}
        </div>
      ),
      width: '200px'
    }
  ];

  // Opciones de filtro para etiquetas
  const filtroOptions = [
    { value: 'todos', label: 'Todos' },
    { value: 'validados', label: 'Validados' },
    { value: 'pendientes', label: 'Pendientes' }
  ];
  
  // Mapeo de colores para etiquetas
  const filtroColorMapping = {
    'validados': 'success',
    'pendientes': 'warning'
  };
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Encabezado y navegación */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center mb-4 md:mb-0">
            <ButtonText
              to={`/sorteos/${sorteoId}`}
              startIcon={<ArrowBackIcon />}
              className="mr-4"
            >
              Volver al sorteo
            </ButtonText>
            
            <SectionTitle>Participantes</SectionTitle>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <ButtonPrimary
              to={`/sorteos/${sorteoId}/participantes/crear`}
              startIcon={<AddIcon />}
            >
              Nuevo Participante
            </ButtonPrimary>
            
            <ButtonSecondary
              to={`/sorteos/${sorteoId}/participantes/importar`}
              startIcon={<UploadIcon />}
            >
              Importar
            </ButtonSecondary>
          </div>
        </div>
        
        {/* Mensajes de error o éxito */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent>
              <Typography color="error">{error}</Typography>
            </CardContent>
          </Card>
        )}
        
        {success && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent>
              <Typography color="success">{success}</Typography>
            </CardContent>
          </Card>
        )}
        
        {/* Información del sorteo */}
        {sorteo && (
          <Card className="mb-6">
            <CardHeader title={sorteo.nombre} />
            <CardContent>
              <FormRow>
                <FormCol width="1/3">
                  <Typography variant="body2" color="textSecondary">
                    Fecha del sorteo:
                  </Typography>
                  <Typography variant="body1">
                    {new Date(sorteo.fecha_sorteo).toLocaleDateString()}
                  </Typography>
                </FormCol>
                
                <FormCol width="1/3">
                  <Typography variant="body2" color="textSecondary">
                    Estado:
                  </Typography>
                  <Chip
                    label={sorteo.estado}
                    color={sorteo.estado === 'Activo' ? 'success' : 'default'}
                  />
                </FormCol>
                
                <FormCol width="1/3">
                  <Typography variant="body2" color="textSecondary">
                    Total participantes:
                  </Typography>
                  <Typography variant="body1">
                    {total}
                  </Typography>
                </FormCol>
              </FormRow>
            </CardContent>
          </Card>
        )}
        
        {/* Filtros y búsqueda */}
        <Card className="mb-6">
          <CardHeader title="Búsqueda y filtros" />
          <CardContent>
            <FormRow>
              <FormCol width="2/3">
                <SearchBar
                  value={searchTerm}
                  onChange={setSearchTerm}
                  onSearch={handleSearch}
                  placeholder="Buscar participante por nombre, documento o email"
                  searchOnEnter
                />
              </FormCol>
            </FormRow>
            
            <FormRow className="mt-4">
              <FormCol>
                <Typography variant="subtitle2" className="mb-2">Filtrar por estado:</Typography>
                <FilterTags
                  options={filtroOptions}
                  selectedValue={filtroEstado}
                  onChange={handleFilterTagChange}
                  colorMapping={filtroColorMapping}
                />
              </FormCol>
            </FormRow>
          </CardContent>
        </Card>
        
        {/* Acciones de selección */}
        {selected.length > 0 && tienePermisos() && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent>
              <div className="flex items-center justify-between">
                <Typography>
                  {selected.length} participante(s) seleccionado(s)
                </Typography>
                
                <div className="flex space-x-2">
                  <ButtonPrimary
                    onClick={() => mostrarConfirmDialog(
                      'Validar participantes', 
                      `¿Está seguro que desea validar ${selected.length} participante(s)?`,
                      handleValidarSeleccionados
                    )}
                    startIcon={<VerifiedUserIcon />}
                  >
                    Validar seleccionados
                  </ButtonPrimary>
                  
                  <ButtonSecondary
                    onClick={() => mostrarConfirmDialog(
                      'Eliminar participantes', 
                      `¿Está seguro que desea eliminar ${selected.length} participante(s)?`,
                      handleEliminarSeleccionados
                    )}
                    startIcon={<DeleteIcon />}
                  >
                    Eliminar seleccionados
                  </ButtonSecondary>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Tabla de participantes */}
        <Card>
          <CardContent>
            {loading && participantes.length === 0 ? (
              <div className="flex justify-center items-center py-8">
                <CircularProgress />
              </div>
            ) : participantes.length === 0 ? (
              <div className="text-center py-8">
                <Typography variant="body1">
                  No hay participantes registrados para este sorteo.
                </Typography>
              </div>
            ) : (
              <TableContainer>
                <Table
                  columns={columns}
                  data={participantes}
                  keyExtractor={(item) => item.id}
                />
                
                <TablePagination
                  page={page}
                  total={total}
                  rowsPerPage={rowsPerPage}
                  onChangePage={handleChangePage}
                  onChangeRowsPerPage={handleChangeRowsPerPage}
                />
              </TableContainer>
            )}
          </CardContent>
        </Card>
        
        {/* Diálogo de confirmación */}
        <ConfirmDialog
          open={confirmDialog.open}
          onClose={cerrarConfirmDialog}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.action}
        />
      </div>
    </Layout>
  );
};

export default ListaParticipantes; 