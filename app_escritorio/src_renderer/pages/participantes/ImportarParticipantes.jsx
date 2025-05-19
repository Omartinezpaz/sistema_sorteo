import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Grid, 
  TextField, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  CircularProgress,
  Alert,
  IconButton,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { styled } from '@mui/material/styles';

// Componente personalizado para el input de archivo
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const ImportarParticipantes = () => {
  // Estados
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [sorteos, setSorteos] = useState([]);
  const [selectedSorteo, setSelectedSorteo] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [importedData, setImportedData] = useState([]);
  const [errorRows, setErrorRows] = useState([]);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [importResult, setImportResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Cargar lista de sorteos disponibles
  useEffect(() => {
    const loadSorteos = async () => {
      try {
        setLoading(true);
        const response = await window.electronAPI.dbQuery(
          `SELECT id, nombre, fecha_sorteo, estado_actual 
           FROM sorteos 
           WHERE estado_actual IN ('borrador', 'programado') 
           ORDER BY fecha_sorteo DESC`
        );
        setSorteos(response || []);
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar sorteos:', error);
        setErrorMessage('Error al cargar sorteos: ' + error.message);
        setLoading(false);
      }
    };

    loadSorteos();
  }, []);

  // Manejar cambio de sorteo seleccionado
  const handleSorteoChange = (event) => {
    setSelectedSorteo(event.target.value);
  };

  // Manejar selección de archivo
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      // Resetear datos previos
      setImportedData([]);
      setErrorRows([]);
      setSuccessCount(0);
      setErrorCount(0);
      setImportResult(null);
    }
  };

  // Leer archivo y procesar datos
  const processFile = async () => {
    if (!file || !selectedSorteo) {
      setErrorMessage('Por favor seleccione un sorteo y un archivo para importar');
      return;
    }

    setLoading(true);
    try {
      // Solicitar al proceso principal que lea el archivo
      const fileData = await window.electronAPI.readFile(file.path);
      
      if (!fileData || !fileData.rows || fileData.rows.length === 0) {
        throw new Error('El archivo no contiene datos válidos');
      }

      // Procesar los datos leídos
      const processedData = fileData.rows.map((row, index) => ({
        ...row,
        rowId: index + 1,
        validado: true,
        sorteo_id: parseInt(selectedSorteo),
        // Enmascarar documento de identidad para visualización
        documento_identidad_masked: row.documento_identidad 
          ? `${row.documento_identidad.substring(0, 2)}****${row.documento_identidad.substring(row.documento_identidad.length - 2)}` 
          : '',
        // Enmascarar email para visualización
        email_masked: row.email
          ? `${row.email.substring(0, 3)}***@${row.email.split('@')[1]}`
          : '',
        // Validar datos mínimos requeridos
        isValid: Boolean(
          row.nombre && 
          row.documento_identidad && 
          (row.estado || row.codigo_estado || row.region)
        )
      }));

      // Separar filas válidas e inválidas
      const validRows = processedData.filter(row => row.isValid);
      const invalidRows = processedData.filter(row => !row.isValid);
      
      setImportedData(processedData);
      setSuccessCount(validRows.length);
      setErrorCount(invalidRows.length);
      setErrorRows(invalidRows);
      
      // Avanzar al siguiente paso si hay datos válidos
      if (validRows.length > 0) {
        setActiveStep(1);
      } else {
        setErrorMessage('No hay datos válidos para importar en el archivo');
      }
    } catch (error) {
      console.error('Error al procesar archivo:', error);
      setErrorMessage('Error al procesar archivo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Guardar participantes en la base de datos
  const saveParticipants = async () => {
    if (!importedData || importedData.length === 0) {
      setErrorMessage('No hay datos para guardar');
      return;
    }

    setLoading(true);
    try {
      // Filtrar solo filas válidas
      const validRows = importedData.filter(row => row.isValid);
      
      if (validRows.length === 0) {
        throw new Error('No hay datos válidos para importar');
      }

      // Preparar consulta SQL para inserción masiva
      const values = validRows.map(row => `(
        ${parseInt(selectedSorteo)}, 
        '${row.nombre.replace(/'/g, "''")}', 
        '${(row.apellido || '').replace(/'/g, "''")}', 
        '${(row.telefono || '').replace(/'/g, "''")}', 
        '${row.documento_identidad.replace(/'/g, "''")}', 
        ${row.email ? `'${row.email.replace(/'/g, "''")}'` : 'NULL'}, 
        NOW(), 
        true, 
        'importacion', 
        '${(row.estado || row.region || '').replace(/'/g, "''")}',
        '${JSON.stringify({codigo: row.codigo_estado || null}).replace(/'/g, "''")}'
      )`).join(',');

      const query = `
        INSERT INTO participantes (
          sorteo_id, 
          nombre, 
          apellido, 
          telefono, 
          documento_identidad, 
          email, 
          fecha_registro, 
          validado, 
          metodo_registro, 
          estado,
          datos_adicionales
        ) VALUES ${values}
        RETURNING id;
      `;

      const result = await window.electronAPI.dbQuery(query);
      
      // Actualizar resultados
      setImportResult({
        total: validRows.length,
        saved: result.length,
        errors: validRows.length - result.length
      });
      
      // Avanzar al paso final
      setActiveStep(2);
    } catch (error) {
      console.error('Error al guardar participantes:', error);
      setErrorMessage('Error al guardar participantes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Descargar plantilla para importación
  const downloadTemplate = () => {
    const templateData = [
      // Encabezados
      ["nombre", "apellido", "documento_identidad", "telefono", "email", "estado", "codigo_estado"],
      // Ejemplo de datos
      ["Juan", "Pérez", "V12345678", "1234567890", "email@ejemplo.com", "DTTO. CAPITAL", "1"],
      ["María", "Gómez", "V87654321", "0987654321", "email2@ejemplo.com", "EDO. ZULIA", "2"]
    ];
    
    // Convertir a CSV
    const csvContent = templateData.map(row => row.join(",")).join("\n");
    
    // Crear blob y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_participantes.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reiniciar proceso
  const resetProcess = () => {
    setActiveStep(0);
    setFile(null);
    setFileName('');
    setImportedData([]);
    setErrorRows([]);
    setSuccessCount(0);
    setErrorCount(0);
    setImportResult(null);
    setErrorMessage('');
  };

  // Pasos del proceso
  const steps = ['Seleccionar archivo', 'Revisar datos', 'Completado'];

  // Renderizar contenido según el paso actual
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ my: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="sorteo-select-label">Seleccione un sorteo</InputLabel>
                  <Select
                    labelId="sorteo-select-label"
                    id="sorteo-select"
                    value={selectedSorteo}
                    label="Seleccione un sorteo"
                    onChange={handleSorteoChange}
                    disabled={loading}
                  >
                    {sorteos.map((sorteo) => (
                      <MenuItem key={sorteo.id} value={sorteo.id}>
                        {sorteo.nombre} ({new Date(sorteo.fecha_sorteo).toLocaleDateString()})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <Button
                  component="label"
                  variant="contained"
                  startIcon={<CloudUploadIcon />}
                  disabled={loading || !selectedSorteo}
                  fullWidth
                >
                  Seleccionar archivo CSV
                  <VisuallyHiddenInput type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} />
                </Button>
                {fileName && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Archivo: {fileName}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  onClick={downloadTemplate}
                >
                  Descargar plantilla
                </Button>
              </Grid>
              <Grid item xs={12} sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  disabled={loading || !file || !selectedSorteo}
                  onClick={processFile}
                  fullWidth
                >
                  Procesar archivo
                </Button>
              </Grid>
            </Grid>
          </Box>
        );
      case 1:
        return (
          <Box sx={{ my: 4 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Alert severity="success">
                  {successCount} registros válidos listos para importar
                </Alert>
              </Grid>
              <Grid item xs={6}>
                <Alert severity={errorCount > 0 ? "error" : "info"}>
                  {errorCount} registros con problemas
                </Alert>
              </Grid>
              <Grid item xs={12}>
                <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                  <TableContainer sx={{ maxHeight: 440 }}>
                    <Table stickyHeader aria-label="tabla de participantes">
                      <TableHead>
                        <TableRow>
                          <TableCell>#</TableCell>
                          <TableCell>Nombre</TableCell>
                          <TableCell>Apellido</TableCell>
                          <TableCell>Documento ID</TableCell>
                          <TableCell>Teléfono</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell>Estado/Región</TableCell>
                          <TableCell>Estado</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {importedData.slice(0, 100).map((row) => (
                          <TableRow 
                            key={row.rowId}
                            sx={{ 
                              backgroundColor: row.isValid ? 'inherit' : '#fff4f4'
                            }}
                          >
                            <TableCell>{row.rowId}</TableCell>
                            <TableCell>{row.nombre || '—'}</TableCell>
                            <TableCell>{row.apellido || '—'}</TableCell>
                            <TableCell>{row.documento_identidad_masked || '—'}</TableCell>
                            <TableCell>{row.telefono || '—'}</TableCell>
                            <TableCell>{row.email_masked || '—'}</TableCell>
                            <TableCell>{row.estado || row.region || '—'}</TableCell>
                            <TableCell>
                              {row.isValid ? 
                                <Alert severity="success" sx={{ py: 0 }}>OK</Alert> : 
                                <Alert severity="error" sx={{ py: 0 }}>Error</Alert>
                              }
                            </TableCell>
                          </TableRow>
                        ))}
                        {importedData.length > 100 && (
                          <TableRow>
                            <TableCell colSpan={8} align="center">
                              Mostrando 100 de {importedData.length} registros
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
              <Grid item xs={12} sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  disabled={loading || successCount === 0}
                  onClick={saveParticipants}
                  fullWidth
                >
                  Guardar {successCount} participantes
                </Button>
              </Grid>
            </Grid>
          </Box>
        );
      case 2:
        return (
          <Box sx={{ my: 4, textAlign: 'center' }}>
            {importResult && (
              <>
                <Alert 
                  severity={importResult.errors === 0 ? "success" : "warning"}
                  sx={{ mb: 3 }}
                >
                  {importResult.saved} de {importResult.total} participantes importados correctamente
                </Alert>
                
                <Typography variant="h6" gutterBottom>
                  Resumen de la importación
                </Typography>
                
                <Grid container spacing={2} sx={{ justifyContent: 'center', mb: 4 }}>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h4" color="primary">
                        {importResult.total}
                      </Typography>
                      <Typography variant="body2">
                        Total procesados
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h4" color="success.main">
                        {importResult.saved}
                      </Typography>
                      <Typography variant="body2">
                        Guardados con éxito
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h4" color="error">
                        {importResult.errors}
                      </Typography>
                      <Typography variant="body2">
                        Con errores
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
                
                <Button
                  variant="contained"
                  color="primary"
                  onClick={resetProcess}
                >
                  Realizar otra importación
                </Button>
              </>
            )}
          </Box>
        );
      default:
        return 'Paso desconocido';
    }
  };

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Importar Participantes
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage('')}>
            {errorMessage}
          </Alert>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          getStepContent(activeStep)
        )}
      </Paper>
    </Box>
  );
};

export default ImportarParticipantes; 