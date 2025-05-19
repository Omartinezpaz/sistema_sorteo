// ... existing code ...
<Stepper activeStep={activeStep} alternativeLabel>
  {steps.map((label, index) => (
    <Step key={label}>
      <StepLabel 
        StepIconProps={{
          sx: {
            '&.Mui-active': {
              color: 'var(--primary)',
            },
            '&.Mui-completed': {
              color: 'var(--primary)',
            }
          }
        }}
      >
        {label}
      </StepLabel>
    </Step>
  ))}
</Stepper>
// ... existing code ...