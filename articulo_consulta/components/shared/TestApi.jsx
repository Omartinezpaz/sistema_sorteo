import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, CircularProgress, TextField, Grid } from '@mui/material';
import estadosService from '../../api/estados';

/**
 * Componente para probar las rutas de API de estados
 */
function TestApi() {
  const [estadosLista, setEstadosLista] = useState([]);
  const [loadingEstados, setLoadingEstados] = useState(false);
  const [error, setError] = useState(null);
  
  const [municipiosLista, setMunicipiosLista] = useState([]);
  const [loadingMunicipios, setLoadingMunicipios] = useState(false);
  const [selectedEstado, setSelectedEstado] = useState(null);
  
  const [parroquiasLista, setParroquiasLista] = useState([]);
  const [loadingParroquias, setLoadingParroquias] = useState(false);
  const [selectedMunicipio, setSelectedMunicipio] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Cargar lista de estados al montar el componente
  useEffect(() => {
    loadEstados();
  }, []);

  // Cargar municipios cuando se selecciona un estado
  useEffect(() => {
    if (selectedEstado) {
      loadMunicipios(selectedEstado.cod_estado);
    }
  }, [selectedEstado]);

  // Cargar parroquias cuando se selecciona un municipio
  useEffect(() => {
    if (selectedEstado && selectedMunicipio) {
      loadParroquias(selectedEstado.cod_estado, selectedMunicipio.cod_municipio);
    }
  }, [selectedMunicipio]);

  // Cargar estados
  const loadEstados = async () => {
    setLoadingEstados(true);
    setError(null);
    try {
      const response = await estadosService.getEstados();
      setEstadosLista(response.estados || []);
    } catch (error) {
      console.error('Error al cargar estados:', error);
      setError(error.message || 'Error al cargar los estados');
    } finally {
      setLoadingEstados(false);
    }
  };

  // Cargar municipios
  const loadMunicipios = async (codEstado) => {
    setLoadingMunicipios(true);
    setError(null);
    try {
      const response = await estadosService.getMunicipios(codEstado);
      setMunicipiosLista(response.municipios || []);
    } catch (error) {
      console.error('Error al cargar municipios:', error);
      setError(error.message || 'Error al cargar los municipios');
    } finally {
      setLoadingMunicipios(false);
    }
  };

  // Cargar parroquias
  const loadParroquias = async (codEstado, codMunicipio) => {
    setLoadingParroquias(true);
    setError(null);
    try {
      const response = await estadosService.getParroquias(codEstado, codMunicipio);
      setParroquiasLista(response.parroquias || []);
    } catch (error) {
      console.error('Error al cargar parroquias:', error);
      setError(error.message || 'Error al cargar las parroquias');
    } finally {
      setLoadingParroquias(false);
    }
  };

  // Buscar ubicaciones
  const handleSearch = async () => {
    if (!searchTerm || searchTerm.length < 3) return;
    
    setLoadingSearch(true);
    setError(null);
    try {
      const response = await estadosService.buscar(searchTerm);
      setSearchResults(response.resultados || []);
    } catch (error) {
      console.error('Error al buscar ubicaciones:', error);
      setError(error.message || 'Error al buscar ubicaciones');
    } finally {
      setLoadingSearch(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Test de API de Estados</Typography>
      
      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light' }}>
          <Typography variant="body1" color="error">
            {error}
          </Typography>
        </Paper>
      )}
      
      <Grid container spacing={3}>
        {/* Prueba de lista de estados */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Lista de Estados</Typography>
            <Button 
              variant="contained" 
              onClick={loadEstados} 
              disabled={loadingEstados}
              sx={{ mb: 2 }}
            >
              {loadingEstados ? 'Cargando...' : 'Cargar Estados'}
            </Button>
            
            {loadingEstados ? (
              <CircularProgress />
            ) : (
              <Box sx={{ mt: 2 }}>
                {estadosLista.map(estado => (
                  <Button
                    key={estado.cod_estado}
                    variant={selectedEstado && selectedEstado.cod_estado === estado.cod_estado ? 'contained' : 'outlined'}
                    sx={{ m: 0.5 }}
                    onClick={() => setSelectedEstado(estado)}
                  >
                    {estado.nom_estado}
                  </Button>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Prueba de lista de municipios */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Municipios</Typography>
            
            {selectedEstado ? (
              <Typography variant="subtitle1" gutterBottom>
                Estado seleccionado: {selectedEstado.nom_estado}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Selecciona un estado para ver sus municipios
              </Typography>
            )}
            
            {loadingMunicipios ? (
              <CircularProgress />
            ) : (
              <Box sx={{ mt: 2 }}>
                {municipiosLista.map(municipio => (
                  <Button
                    key={municipio.cod_municipio}
                    variant={selectedMunicipio && selectedMunicipio.cod_municipio === municipio.cod_municipio ? 'contained' : 'outlined'}
                    sx={{ m: 0.5 }}
                    onClick={() => setSelectedMunicipio(municipio)}
                  >
                    {municipio.nom_municipio}
                  </Button>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Prueba de lista de parroquias */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Parroquias</Typography>
            
            {selectedMunicipio ? (
              <Typography variant="subtitle1" gutterBottom>
                Municipio seleccionado: {selectedMunicipio.nom_municipio}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Selecciona un municipio para ver sus parroquias
              </Typography>
            )}
            
            {loadingParroquias ? (
              <CircularProgress />
            ) : (
              <Box sx={{ mt: 2 }}>
                {parroquiasLista.map(parroquia => (
                  <Button
                    key={parroquia.cod_parroquia}
                    variant="outlined"
                    sx={{ m: 0.5 }}
                  >
                    {parroquia.nom_parroquia}
                  </Button>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Prueba de búsqueda */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mt: 3 }}>
            <Typography variant="h6" gutterBottom>Búsqueda de Ubicaciones</Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TextField
                label="Término de búsqueda"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                variant="outlined"
                fullWidth
                sx={{ mr: 2 }}
              />
              <Button
                variant="contained"
                onClick={handleSearch}
                disabled={!searchTerm || searchTerm.length < 3 || loadingSearch}
              >
                {loadingSearch ? 'Buscando...' : 'Buscar'}
              </Button>
            </Box>
            
            {loadingSearch ? (
              <CircularProgress />
            ) : (
              <Box sx={{ mt: 2 }}>
                {searchResults.length > 0 ? (
                  <Grid container spacing={2}>
                    {searchResults.map((result) => (
                      <Grid item xs={12} sm={6} md={4} key={result.id}>
                        <Paper
                          elevation={2}
                          sx={{ p: 2, height: '100%' }}
                        >
                          <Typography variant="subtitle1">
                            {result.nombre_completo}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Código: {result.codigo_completo}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  searchTerm.length >= 3 && (
                    <Typography variant="body2" color="text.secondary">
                      No se encontraron resultados.
                    </Typography>
                  )
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default TestApi; 