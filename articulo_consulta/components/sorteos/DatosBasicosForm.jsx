// ... existing code ...
<TextField
  required
  fullWidth
  id="nombre"
  name="nombre"
  label="Nombre del Sorteo"
  value={formData.nombre || ''}
  onChange={handleChange}
  margin="normal"
  variant="outlined"
  sx={{
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: 'var(--primary)',
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: 'var(--primary)',
    }
  }}
/>

<TextField
  fullWidth
  id="descripcion"
  name="descripcion"
  label="Descripción"
  multiline
  rows={4}
  value={formData.descripcion || ''}
  onChange={handleChange}
  margin="normal"
  variant="outlined"
  sx={{
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: 'var(--primary)',
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: 'var(--primary)',
    }
  }}
/>
// ... existing code ...