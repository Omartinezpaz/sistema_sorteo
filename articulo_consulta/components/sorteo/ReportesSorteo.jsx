import { useState } from 'react';
import {
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  FileDownload as FileDownloadIcon,
  Description as DescriptionIcon,
  TableChart as TableChartIcon,
  PictureAsPdf as PdfIcon
} from '@mui/icons-material';
import { saveAs } from 'file-saver';
import api from '../../api/config';

const ReportesSorteo = ({ sorteoId, sorteoNombre }) => {
  const [loading, setLoading] = useState({
    excel: false,
    csv: false,
    pdf: false
  });
  const [error, setError] = useState(null);

  const handleDescargarReporte = async (tipo) => {
    try {
      setLoading({ ...loading, [tipo]: true });
      setError(null);
      
      // URL del endpoint según el tipo de reporte
      const url = `/api/reportes/sorteo/${sorteoId}/${tipo}`;
      
      // Realizar solicitud con responseType blob para archivos
      const response = await api.get(url, {
        responseType: 'blob'
      });
      
      // Obtener el nombre del archivo de los headers de respuesta, o generar uno
      let filename;
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
        filename = filenameMatch ? filenameMatch[1] : null;
      }
      
      if (!filename) {
        // Nombres por defecto si no se pudo obtener del header
        const extension = tipo === 'excel' ? 'xlsx' : (tipo === 'csv' ? 'csv' : 'pdf');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        filename = `sorteo_${sorteoId}_${timestamp}.${extension}`;
      }
      
      // Descargar el archivo
      saveAs(new Blob([response.data]), filename);
      
    } catch (error) {
      console.error(`Error al descargar reporte ${tipo}:`, error);
      setError(`No se pudo descargar el reporte. ${error.message || 'Intente nuevamente.'}`);
    } finally {
      setLoading({ ...loading, [tipo]: false });
    }
  };
  
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Reportes y Exportación
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Card 
            sx={{ 
              borderRadius: '16px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
              overflow: 'hidden',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 15px 30px rgba(0, 0, 0, 0.1)'
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TableChartIcon sx={{ mr: 1 }} color="primary" />
                <Typography variant="h6">Excel</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Exportar todos los datos del sorteo incluyendo premios y participantes en formato Excel (.xlsx).
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                startIcon={loading.excel ? <CircularProgress size={20} color="inherit" /> : <FileDownloadIcon />}
                onClick={() => handleDescargarReporte('excel')}
                disabled={loading.excel || loading.csv || loading.pdf}
              >
                Descargar Excel
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Card 
            sx={{ 
              borderRadius: '16px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
              overflow: 'hidden',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 15px 30px rgba(0, 0, 0, 0.1)'
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <DescriptionIcon sx={{ mr: 1 }} color="success" />
                <Typography variant="h6">CSV</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Exportar la lista de participantes en formato CSV para uso en hojas de cálculo o importación.
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                fullWidth
                variant="contained"
                color="success"
                startIcon={loading.csv ? <CircularProgress size={20} color="inherit" /> : <FileDownloadIcon />}
                onClick={() => handleDescargarReporte('csv')}
                disabled={loading.excel || loading.csv || loading.pdf}
              >
                Descargar CSV
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Card 
            sx={{ 
              borderRadius: '16px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
              overflow: 'hidden',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 15px 30px rgba(0, 0, 0, 0.1)'
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PdfIcon sx={{ mr: 1 }} color="error" />
                <Typography variant="h6">PDF</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Generar un informe completo del sorteo en formato PDF para imprimir o compartir.
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                fullWidth
                variant="contained"
                color="error"
                startIcon={loading.pdf ? <CircularProgress size={20} color="inherit" /> : <FileDownloadIcon />}
                onClick={() => handleDescargarReporte('pdf')}
                disabled={loading.excel || loading.csv || loading.pdf}
              >
                Descargar PDF
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReportesSorteo; 