// ... existing code ...
<Button 
  variant="outlined" 
  startIcon={<ArrowBackIcon />} 
  onClick={handleBack}
  sx={{ 
    color: 'var(--primary)',
    borderColor: 'var(--primary)',
    '&:hover': {
      borderColor: 'var(--primary-dark)',
      backgroundColor: 'rgba(252, 4, 87, 0.04)'
    }
  }}
>
  ANTERIOR
</Button>

<Button 
  variant="outlined" 
  onClick={handleCancel}
  sx={{ 
    color: 'var(--primary)',
    borderColor: 'var(--primary)',
    '&:hover': {
      borderColor: 'var(--primary-dark)',
      backgroundColor: 'rgba(252, 4, 87, 0.04)'
    }
  }}
>
  CANCELAR
</Button>

<Button 
  variant="contained" 
  endIcon={<ArrowForwardIcon />} 
  onClick={handleNext}
  sx={{ 
    backgroundColor: 'var(--primary)',
    '&:hover': {
      backgroundColor: 'var(--primary-dark)',
    }
  }}
>
  SIGUIENTE
</Button>
// ... existing code ...