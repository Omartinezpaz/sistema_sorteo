import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { Upload as UploadIcon, CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import Layout from '../common/Layout';
import participanteService from '../../api/participante';
import sorteoService from '../../api/sorteo';

const ImportarParticipantes = () => {
  const { sorteoId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSorteo, setLoadingSorteo] = useState(true);
  const [sorteo, setSorteo] = useState(null);
  const [participantes, setParticipantes] = useState([]);
  const [validarAutomaticamente, setValidarAutomaticamente] = useState(false);
  const [importando, setImportando] = useState(false);
  const [resultadoImportacion, setResultadoImportacion] = useState(null);

  // Cargar datos del sorteo
  useEffect(() => {
    const cargarSorteo = async () => {
      try {
        setLoadingSorteo(true);
        const response = await sorteoService.getById(sorteoId);
        
        if (response.success && response.sorteo) {
          setSorteo(response.sorteo);
        } else {
          setError('No se pudo cargar la información del sorteo');
        }
      } catch (error) {
        console.error('Error al cargar sorteo:', error);
        setError('Error al cargar el sorteo. Por favor, intente nuevamente.');
      } finally {
        setLoadingSorteo(false);
      }
    };

    cargarSorteo();
  }, [sorteoId]);

  const handleFileSelect = () => {
    fileInputRef.current.click();
  };

  const parseCSV = (text) => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(header => header.trim());
    
    const requiredFields = ['nombre', 'email'];
    const missingFields = requiredFields.filter(field => !headers.includes(field));
    
    if (missingFields.length > 0) {
      throw new Error(`El archivo CSV debe contener las columnas: ${missingFields.join(', ')}`);
    }

    const participantesList = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',').map(value => value.trim());
      
      if (values.length !== headers.length) {
        throw new Error(`La línea ${i+1} no tiene el formato correcto`);
      }
      
      const participante = {};
      
      for (let j = 0; j < headers.length; j++) {
        participante[headers[j]] = values[j];
      }
      
      // Verificar campos requeridos
      if (!participante.nombre || !participante.email) {
        throw new Error(`La línea ${i+1} no tiene todos los campos requeridos`);
      }
      
      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(participante.email)) {
        throw new Error(`El email en la línea ${i+1} no tiene un formato válido`);
      }
      
      participantesList.push(participante);
    }
    
    return participantesList;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvText = event.target.result;
        const participantesImportados = parseCSV(csvText);
        
        // Preparar datos
        const participantesFormateados = participantesImportados.map(p => ({
          nombre: p.nombre,
          email: p.email,
          telefono: p.telefono || '',
          validado: validarAutomaticamente,
          metodo_registro: 'importacion',
          datos_adicionales: p.datos_adicionales || null
        }));
        
        setParticipantes(participantesFormateados);
        setError(null);
      } catch (error) {
        console.error('Error al procesar CSV:', error);
        setError(error.message || 'Error al procesar el archivo');
        setParticipantes([]);
      }
    };
    reader.onerror = () => {
      setError('Error al leer el archivo');
    };
    reader.readAsText(file);
  };

  const handleImportar = async () => {
    try {
      setImportando(true);
      setError(null);
      
      if (participantes.length === 0) {
        throw new Error('No hay participantes para importar');
      }
      
      const response = await participanteService.importarLote(sorteoId, participantes);
      
      setResultadoImportacion({
        exitosos: response.participantes.length,
        total: participantes.length
      });
      
      setSuccess(true);
      setParticipantes([]);
      
    } catch (error) {
      console.error('Error al importar participantes:', error);
      setError(error.message || 'Error al importar los participantes');
    } finally {
      setImportando(false);
    }
  };

  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    setValidarAutomaticamente(checked);
    
    // Actualizar todos los participantes
    if (participantes.length > 0) {
      setParticipantes(participantes.map(p => ({
        ...p,
        validado: checked
      })));
    }
  };

  if (loadingSorteo) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (!sorteo) {
    return (
      <Layout>
        <Alert severity="error" sx={{ mb: 2 }}>
          Sorteo no encontrado
        </Alert>
        <Button variant="contained" onClick={() => navigate('/dashboard')}>
          Volver al Dashboard
        </Button>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Importar Participantes
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Sorteo: {sorteo.nombre}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Importación completada exitosamente.
            {resultadoImportacion && (
              <Typography variant="body2">
                Se importaron {resultadoImportacion.exitosos} de {resultadoImportacion.total} participantes.
              </Typography>
            )}
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Instrucciones
            </Typography>
            <Typography variant="body2" gutterBottom>
              1. Prepare un archivo CSV con las siguientes columnas:
            </Typography>
            <Box component="ul" sx={{ pl: 4 }}>
              <li>nombre (obligatorio)</li>
              <li>email (obligatorio)</li>
              <li>telefono (opcional)</li>
              <li>datos_adicionales (opcional)</li>
            </Box>
            <Typography variant="body2" gutterBottom>
              2. El archivo debe tener encabezados en la primera fila.
            </Typography>
            <Typography variant="body2" gutterBottom>
              3. Haga clic en "Seleccionar archivo" para cargar el CSV.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <Button
              variant="contained"
              startIcon={<CloudUploadIcon />}
              onClick={handleFileSelect}
              disabled={loading || importando}
              sx={{ mb: 2 }}
            >
              Seleccionar archivo CSV
            </Button>
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={validarAutomaticamente}
                  onChange={handleCheckboxChange}
                  name="validarAutomaticamente"
                  disabled={loading || importando}
                />
              }
              label="Validar participantes automáticamente"
            />
          </Box>
        </Paper>

        {participantes.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Participantes a importar ({participantes.length})
            </Typography>
            
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Teléfono</TableCell>
                    <TableCell>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {participantes.slice(0, 10).map((participante, index) => (
                    <TableRow key={index}>
                      <TableCell>{participante.nombre}</TableCell>
                      <TableCell>{participante.email}</TableCell>
                      <TableCell>{participante.telefono || '-'}</TableCell>
                      <TableCell>
                        {participante.validado ? (
                          <Chip size="small" color="success" label="Validado" />
                        ) : (
                          <Chip size="small" color="warning" label="Pendiente" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {participantes.length > 10 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        ... y {participantes.length - 10} más
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<UploadIcon />}
                onClick={handleImportar}
                disabled={loading || importando}
              >
                {importando ? <CircularProgress size={24} color="inherit" /> : 'Importar Participantes'}
              </Button>
            </Box>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 3 }}>
          <Button
            variant="outlined"
            onClick={() => navigate(`/sorteos/${sorteoId}`)}
            disabled={loading || importando}
          >
            Volver al Sorteo
          </Button>
        </Box>
      </Box>
    </Layout>
  );
};

export default ImportarParticipantes; 