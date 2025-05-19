import { useState, useEffect } from 'react';
import { 
  Layout, 
  SectionTitle, 
  ButtonPrimary, 
  Card, 
  CardHeader, 
  CardContent, 
  Chip,
  Table,
  TableContainer
} from '../common';
import sorteoService from '../../api/sorteo';
import { CircularProgress, Typography } from '@mui/material';
import { Add as AddIcon, FilterList as FilterListIcon } from '@mui/icons-material';

const ListaSorteos = () => {
  const [sorteos, setSorteos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');

  useEffect(() => {
    const fetchSorteos = async () => {
      try {
        setLoading(true);
        const response = await sorteoService.getAll();
        
        if (response.success) {
          setSorteos(response.sorteos || []);
        }
      } catch (error) {
        console.error('Error al obtener sorteos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSorteos();
  }, []);

  const sorteosFiltrados = sorteos.filter(sorteo => {
    if (filtro === 'todos') return true;
    if (filtro === 'activos') return sorteo.estado === 'activo';
    if (filtro === 'pendientes') return sorteo.estado === 'pendiente';
    if (filtro === 'nacionales') return sorteo.tipo === 'nacional' || sorteo.tipo === 'ambos';
    if (filtro === 'regionales') return sorteo.tipo === 'regional' || sorteo.tipo === 'ambos';
    return true;
  });

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  // Definición de columnas para la tabla
  const columns = [
    {
      id: 'nombre',
      label: 'Nombre',
      render: (sorteo) => sorteo.nombre
    },
    {
      id: 'descripcion',
      label: 'Descripción',
      render: (sorteo) => sorteo.descripcion
    },
    {
      id: 'fecha',
      label: 'Fecha',
      render: (sorteo) => formatDate(sorteo.fecha_sorteo)
    },
    {
      id: 'estado',
      label: 'Estado',
      render: (sorteo) => (
        <Chip 
          label={sorteo.estado} 
          color={sorteo.estado === 'activo' ? 'success' : 'warning'} 
        />
      )
    },
    {
      id: 'tipo',
      label: 'Tipo',
      render: (sorteo) => {
        let label = '';
        let color = 'default';
        
        switch(sorteo.tipo) {
          case 'nacional':
            label = 'Nacional';
            color = 'primary';
            break;
          case 'regional':
            label = 'Regional';
            color = 'secondary';
            break;
          case 'ambos':
            label = 'Nacional/Regional';
            color = 'info';
            break;
          default:
            label = sorteo.tipo;
        }
        
        return <Chip label={label} color={color} />;
      }
    },
    {
      id: 'participantes',
      label: 'Participantes',
      render: (sorteo) => sorteo.total_participantes
    },
    {
      id: 'acciones',
      label: 'Acciones',
      render: (sorteo) => (
        <div className="flex space-x-2">
          <ButtonPrimary
            to={`/sorteos/${sorteo.id}`}
            size="small"
          >
            Ver detalles
          </ButtonPrimary>
        </div>
      )
    }
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <SectionTitle>Sorteos</SectionTitle>
          
          <ButtonPrimary
            to="/sorteos/crear"
            startIcon={<AddIcon />}
          >
            Crear Nuevo
          </ButtonPrimary>
        </div>
        
        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader title="Filtros" icon={<FilterListIcon />} />
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <FilterButton 
                active={filtro === 'todos'} 
                onClick={() => setFiltro('todos')}
              >
                Todos
              </FilterButton>
              
              <FilterButton 
                active={filtro === 'activos'} 
                onClick={() => setFiltro('activos')}
                color="success"
              >
                Activos
              </FilterButton>
              
              <FilterButton 
                active={filtro === 'pendientes'} 
                onClick={() => setFiltro('pendientes')}
                color="warning"
              >
                Pendientes
              </FilterButton>
              
              <FilterButton 
                active={filtro === 'nacionales'} 
                onClick={() => setFiltro('nacionales')}
                color="primary"
              >
                Nacionales
              </FilterButton>
              
              <FilterButton 
                active={filtro === 'regionales'} 
                onClick={() => setFiltro('regionales')}
                color="secondary"
              >
                Regionales
              </FilterButton>
            </div>
          </CardContent>
        </Card>
        
        {/* Tabla de sorteos */}
        <Card>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <CircularProgress />
              </div>
            ) : sorteosFiltrados.length === 0 ? (
              <div className="text-center py-8">
                <Typography variant="body1">
                  No hay sorteos que coincidan con los criterios de búsqueda.
                </Typography>
              </div>
            ) : (
              <TableContainer>
                <Table
                  columns={columns}
                  data={sorteosFiltrados}
                  keyExtractor={(item) => item.id}
                />
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

// Componente auxiliar para los botones de filtro
const FilterButton = ({ children, active, onClick, color = 'default' }) => {
  const baseClass = "px-4 py-2 rounded-full text-sm font-medium border-none cursor-pointer transition-all duration-200";
  
  const getColorClasses = () => {
    if (!active) return "bg-gray-100 text-gray-600 hover:bg-gray-200";
    
    switch (color) {
      case 'success':
        return "bg-green-100 text-green-800";
      case 'warning':
        return "bg-yellow-100 text-yellow-800";
      case 'primary':
        return "bg-blue-100 text-blue-800";
      case 'secondary':
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };
  
  return (
    <button 
      onClick={onClick}
      className={`${baseClass} ${getColorClasses()}`}
    >
      {children}
    </button>
  );
};

export default ListaSorteos; 