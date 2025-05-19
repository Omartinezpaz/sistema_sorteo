import { Container, Box, Paper, useTheme } from '@mui/material';
import NavBar from './NavBar';
import Footer from './Footer';

// Uso de variables CSS desde :root
const MAIN_COLOR = 'var(--primary)';
const HOVER_COLOR = 'var(--primary-dark)';
const FOCUS_RING_COLOR = 'var(--primary-light)';

const Layout = ({ children, maxWidth = 'lg', withPaper = true }) => {
  const theme = useTheme();
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      background: `linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)`,
    }}>
      <NavBar />
      <Container 
        maxWidth={maxWidth} 
        sx={{ 
          py: 4, 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column'
        }}
      >
        {withPaper ? (
          <Paper sx={{ 
            p: 3, 
            flexGrow: 1, 
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)', 
            borderRadius: '16px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Elementos decorativos */}
            <div className="bg-decoration bg-decoration-top-right"></div>
            <div className="bg-decoration bg-decoration-bottom-left"></div>
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              {children}
            </Box>
          </Paper>
        ) : (
          <Box sx={{ flexGrow: 1 }}>
            {children}
          </Box>
        )}
      </Container>
      <Footer />
    </Box>
  );
};

export default Layout;