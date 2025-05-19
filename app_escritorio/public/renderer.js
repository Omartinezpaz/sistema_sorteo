// Este script maneja la lógica del renderer, usando API expuestas desde preload.js

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM cargado, inicializando renderer...');
  
  // Referencias a elementos del DOM
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const dashboardEl = document.getElementById('dashboard');
  const loginContainerEl = document.getElementById('login-container');
  const usernameDisplay = document.getElementById('username-display');
  const roleDisplay = document.getElementById('role-display');
  const logoutBtn = document.getElementById('logout-btn');
  const dbResult = document.getElementById('db-result');
  const dbResultText = document.getElementById('db-result-text');
  
  // Referencias a elementos del dashboard
  const countActivos = document.getElementById('count-activos');
  const countFinalizados = document.getElementById('count-finalizados');
  const countCancelados = document.getElementById('count-cancelados');
  const countTotal = document.getElementById('count-total');
  const participationChartCanvas = document.getElementById('participation-chart');
  
  // Variables para los charts
  let participationChart = null;
  
  // Estado de la aplicación
  let currentUser = null;
  
  // Función para mostrar errores de login
  const showLoginError = (message) => {
    loginError.textContent = message;
    loginError.style.display = 'block';
  };
  
  // Función para ocultar el error de login
  const hideLoginError = () => {
    loginError.style.display = 'none';
  };
  
  // Función para mostrar el dashboard y ocultar el login
  const showDashboard = (user) => {
    loginContainerEl.style.display = 'none';
    dashboardEl.style.display = 'block';
    
    // Mostrar información del usuario
    if (user) {
      usernameDisplay.textContent = user.username;
      roleDisplay.textContent = user.role;
    }
    
    // Cargar datos del dashboard
    loadDashboardData();
    
    // Realizar una consulta de prueba a la BD
    testDbConnection();
  };
  
  // Función para mostrar el login y ocultar el dashboard
  const showLogin = () => {
    loginContainerEl.style.display = 'block';
    dashboardEl.style.display = 'none';
    hideLoginError();
    loginForm.reset();
    currentUser = null;
    
    // Destruir los charts si existen
    if (participationChart) {
      participationChart.destroy();
      participationChart = null;
    }
  };
  
  // Función para probar la conexión a la BD después del login
  const testDbConnection = async () => {
    try {
      const result = await window.electronAPI.dbQuery('SELECT NOW()');
      console.log('Resultado de consulta a BD:', result);
      
      if (result && result.length > 0) {
        dbResultText.textContent = `Hora del servidor de BD: ${result[0].now}. ¡Bienvenido ${currentUser.username}!`;
        dbResult.style.display = 'block';
      }
    } catch (error) {
      console.error('Error al consultar la BD:', error);
      dbResultText.textContent = `Error al conectar con BD: ${error.message}`;
      dbResult.style.display = 'block';
    }
  };
  
  // Función para cargar los datos del dashboard
  const loadDashboardData = async () => {
    try {
      // Cargar conteo de sorteos
      const sorteosCounts = await window.electronAPI.getDashboardSorteosCount();
      updateSorteosCounters(sorteosCounts);
      
      // Cargar datos de participación
      const participacionData = await window.electronAPI.getDashboardParticipacion();
      createParticipationChart(participacionData);
      
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
    }
  };
  
  // Función para actualizar los contadores de sorteos
  const updateSorteosCounters = (data) => {
    // Inicializar contadores en 0
    let activos = 0;
    let finalizados = 0;
    let cancelados = 0;
    let total = 0;
    
    // Procesar los datos
    data.forEach(item => {
      const count = parseInt(item.total);
      total += count;
      
      // Agrupar estados similares
      switch(item.estado_actual) {
        case 'programado':
        case 'en_progreso':
          activos += count;
          break;
        case 'finalizado':
          finalizados += count;
          break;
        case 'cancelado':
        case 'suspendido':
          cancelados += count;
          break;
        default:
          // Otros estados
          break;
      }
    });
    
    // Actualizar la UI
    countActivos.textContent = activos;
    countFinalizados.textContent = finalizados;
    countCancelados.textContent = cancelados;
    countTotal.textContent = total;
  };
  
  // Función para crear el gráfico de participación
  const createParticipationChart = (data) => {
    // Destruir el gráfico existente si hay uno
    if (participationChart) {
      participationChart.destroy();
    }
    
    // Preparar los datos para el gráfico
    const estados = data.map(item => item.estado);
    const participantes = data.map(item => parseInt(item.participantes));
    const ganadores = data.map(item => parseInt(item.ganadores));
    
    // Configuración optimizada para mejor visualización
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          align: 'start',
          labels: {
            boxWidth: 15,
            padding: 15
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          titleFont: {
            size: 14
          },
          bodyFont: {
            size: 13
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            font: {
              size: 11
            }
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 11
            },
            maxRotation: 45,
            minRotation: 45
          }
        }
      },
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: 0,
          bottom: 10
        }
      }
    };
    
    // Crear el nuevo gráfico con opciones mejoradas
    participationChart = new Chart(participationChartCanvas, {
      type: 'bar',
      data: {
        labels: estados,
        datasets: [
          {
            label: 'Participantes',
            data: participantes,
            backgroundColor: 'rgba(252, 4, 87, 0.7)',
            borderColor: 'rgba(252, 4, 87, 1)',
            borderWidth: 1,
            barPercentage: 0.6,
            categoryPercentage: 0.8
          },
          {
            label: 'Ganadores',
            data: ganadores,
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            barPercentage: 0.6,
            categoryPercentage: 0.8
          }
        ]
      },
      options: options
    });
  };
  
  // Evento submit del formulario de login
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideLoginError();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
      showLoginError('Por favor, ingrese usuario y contraseña.');
      return;
    }
    
    try {
      console.log('Intentando login con:', { username });
      const response = await window.electronAPI.loginAttempt({ username, password });
      console.log('Respuesta del login:', response);
      
      if (response.success) {
        currentUser = response.user;
        showDashboard(currentUser);
      } else {
        showLoginError(response.message || 'Error de autenticación');
      }
    } catch (error) {
      console.error('Error al intentar login:', error);
      showLoginError(`Error de comunicación: ${error.message}`);
    }
  });
  
  // Evento click del botón de logout
  logoutBtn.addEventListener('click', () => {
    showLogin();
  });
  
  // Configurar las pestañas
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Activar pestaña actual
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Por ahora sólo tenemos una vista de dashboard, 
      // pero aquí podrías cambiar la vista según la pestaña
      const tabId = tab.getAttribute('data-tab');
      console.log(`Cambio a pestaña: ${tabId}`);
      
      // Futuro: mostrar/ocultar contenido según la pestaña activa
      // document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
      // document.getElementById(`${tabId}-content`).style.display = 'block';
    });
  });
  
  // Inicialmente, mostrar la pantalla de login
  showLogin();
}); 