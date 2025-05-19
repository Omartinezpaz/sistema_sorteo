import React from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  InputAdornment,
  Tooltip
} from '@mui/material';
import { 
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  UploadFile as UploadFileIcon,
  FileDownload as FileDownloadIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ParticipantesToolbar = ({ 
  searchTerm, 
  onSearchChange, 
  onAddClick, 
  onBatchAddClick, 
  onExportClick 
}) => {
  const navigate = useNavigate();

  const handleImportClick = () => {
    navigate('/participantes/importar');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        mb: 2,
        gap: 1
      }}
    >
      <TextField
        size="small"
        variant="outlined"
        placeholder="Buscar participante..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        sx={{ flexGrow: 1 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
      
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Tooltip title="Agregar participante individual">
          <Button
            variant="outlined"
            color="primary"
            startIcon={<PersonAddIcon />}
            onClick={onAddClick}
          >
            Agregar
          </Button>
        </Tooltip>
        
        <Tooltip title="Importar participantes desde archivo">
          <Button
            variant="contained"
            color="primary"
            startIcon={<UploadFileIcon />}
            onClick={handleImportClick}
          >
            Importar
          </Button>
        </Tooltip>
        
        <Tooltip title="Exportar lista de participantes">
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={onExportClick}
          >
            Exportar
          </Button>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default ParticipantesToolbar; 