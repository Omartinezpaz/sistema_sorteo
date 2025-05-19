import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Box, 
  Divider,
  useMediaQuery,
  useTheme,
  Avatar
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Dashboard as DashboardIcon, 
  EmojiEvents as SorteoIcon, 
  Logout as LogoutIcon, 
  Login as LoginIcon,
  Home as HomeIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import AuthContext from '../../context/AuthContext';

const NavBar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setDrawerOpen(false);
  };

  const menuItems = [
    {
      text: 'Inicio',
      icon: <HomeIcon />,
      path: '/',
      requireAuth: false
    },
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
      requireAuth: true
    },
    {
      text: 'Mis Sorteos',
      icon: <SorteoIcon />,
      path: '/mis-sorteos',
      requireAuth: true
    }
  ];

  const authMenuItems = isAuthenticated
    ? [
        {
          text: `Perfil (${user?.username || 'Usuario'})`,
          icon: <PersonIcon />,
          path: '/perfil',
          onClick: () => setDrawerOpen(false)
        },
        {
          text: 'Cerrar Sesión',
          icon: <LogoutIcon />,
          onClick: handleLogout
        }
      ]
    : [
        {
          text: 'Iniciar Sesión',
          icon: <LoginIcon />,
          path: '/login',
          onClick: () => setDrawerOpen(false)
        }
      ];

  const drawer = (
    <Box
      sx={{ width: 250 }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
        <Avatar src="/assets/logo.svg" alt="Logo" sx={{ width: 40, height: 40, mr: 2 }} />
        <Typography variant="h6" component="div">
          Sistema de Sorteos
        </Typography>
      </Box>
      <Divider />
      <List>
        {menuItems
          .filter(item => !item.requireAuth || (item.requireAuth && isAuthenticated))
          .map((item) => (
            <ListItem 
              button 
              component={Link} 
              to={item.path} 
              key={item.text}
              onClick={item.onClick}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
      </List>
      <Divider />
      <List>
        {authMenuItems.map((item) => (
          <ListItem 
            button 
            key={item.text}
            component={item.path ? Link : 'div'}
            to={item.path}
            onClick={item.onClick}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar 
        position="static" 
        sx={{ 
          backgroundColor: 'var(--primary)', // Color rosa principal
          boxShadow: '0 2px 10px rgba(252, 4, 87, 0.2)' 
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={toggleDrawer(true)}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Avatar src="/assets/logo.svg" alt="Logo" sx={{ width: 40, height: 40, mr: 2 }} />
            <Typography variant="h6" component="div">
              <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
                Sistema de Sorteos
              </Link>
            </Typography>
          </Box>
          
          {!isMobile && (
            <Box>
              {isAuthenticated ? (
                <>
                  <Button component={Link} to="/dashboard" color="inherit">
                    Dashboard
                  </Button>
                  <Button component={Link} to="/mis-sorteos" color="inherit">
                    Mis Sorteos
                  </Button>
                  <Button color="inherit" onClick={handleLogout}>
                    Cerrar Sesión
                  </Button>
                </>
              ) : (
                <Button component={Link} to="/login" color="inherit">
                  Iniciar Sesión
                </Button>
              )}
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default NavBar;