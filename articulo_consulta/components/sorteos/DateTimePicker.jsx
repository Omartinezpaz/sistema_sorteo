// ... existing code ...
<DateTimePicker
  label="Fecha del Sorteo"
  value={value}
  onChange={handleChange}
  renderInput={(params) => (
    <TextField 
      {...params} 
      fullWidth 
      sx={{
        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: 'var(--primary)',
        },
        '& .MuiInputLabel-root.Mui-focused': {
          color: 'var(--primary)',
        }
      }}
    />
  )}
  sx={{
    '& .MuiPickersDay-daySelected': {
      backgroundColor: 'var(--primary)',
      '&:hover': {
        backgroundColor: 'var(--primary-dark)',
      }
    }
  }}
/>
// ... existing code ...