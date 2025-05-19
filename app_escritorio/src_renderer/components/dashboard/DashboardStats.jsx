import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, SectionTitle } from '../common';
import { ButtonPrimary } from '../common';
import { Badge } from '../common';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import Chart from 'chart.js/auto';

const DashboardStats = () => {
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    finalizados: 0,
    cancelados: 0,
    participantesPorEstado: {}
  });

  const [chartInstance, setChartInstance] = useState(null);

  useEffect(() => {
    // Obtener estadísticas desde el proceso principal
    if (window.electronAPI && window.electronAPI.getDashboardStats) {
      window.electronAPI.getDashboardStats().then(data => {
        setStats(data);
      }).catch(err => {
        console.error('Error al obtener estadísticas:', err);
      });
    }
  }, []);

  useEffect(() => {
    // Crear gráfico de participantes por estado
    if (stats.participantesPorEstado && Object.keys(stats.participantesPorEstado).length > 0) {
      const ctx = document.getElementById('estadosChart');
      
      if (ctx) {
        // Destruir instancia previa del gráfico si existe
        if (chartInstance) {
          chartInstance.destroy();
        }
        
        // Crear nuevo gráfico
        const newChartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: Object.keys(stats.participantesPorEstado),
            datasets: [{
              label: 'Participantes por Estado',
              data: Object.values(stats.participantesPorEstado),
              backgroundColor: [
                'rgba(252, 4, 87, 0.7)',
                'rgba(255, 78, 128, 0.7)',
                'rgba(255, 179, 200, 0.7)',
                'rgba(255, 229, 236, 0.7)',
                'rgba(252, 4, 87, 0.5)',
                'rgba(255, 78, 128, 0.5)',
                'rgba(255, 179, 200, 0.5)',
                'rgba(255, 229, 236, 0.5)'
              ],
              borderColor: [
                'rgba(252, 4, 87, 1)',
                'rgba(255, 78, 128, 1)',
                'rgba(255, 179, 200, 1)',
                'rgba(255, 229, 236, 1)',
                'rgba(252, 4, 87, 0.8)',
                'rgba(255, 78, 128, 0.8)',
                'rgba(255, 179, 200, 0.8)',
                'rgba(255, 229, 236, 0.8)'
              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true
              }
            },
            plugins: {
              legend: {
                display: false
              }
            }
          }
        });
        
        setChartInstance(newChartInstance);
      }
    }
    
    // Cleanup al desmontar
    return () => {
      if (chartInstance) {
        chartInstance.destroy();
      }
    };
  }, [stats.participantesPorEstado]);

  return (
    <div>
      <SectionTitle title="Resumen de Sorteos" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-700">Total Sorteos</h3>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <div className="bg-primary-lighter p-3 rounded-full">
                <CalendarTodayIcon style={{ color: 'var(--primary)' }} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-700">Sorteos Activos</h3>
                <p className="text-3xl font-bold">{stats.activos}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <EventAvailableIcon style={{ color: '#0F5132' }} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-700">Sorteos Finalizados</h3>
                <p className="text-3xl font-bold">{stats.finalizados}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <EmojiEventsIcon style={{ color: '#0369A1' }} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-700">Sorteos Cancelados</h3>
                <p className="text-3xl font-bold">{stats.cancelados}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <DoNotDisturbIcon style={{ color: '#B91C1C' }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-6">
        <CardHeader 
          title="Participantes por Estado" 
          action={
            <ButtonPrimary 
              onClick={() => {
                if (window.electronAPI && window.electronAPI.getDashboardStats) {
                  window.electronAPI.getDashboardStats().then(data => {
                    setStats(data);
                  });
                }
              }}
            >
              Actualizar
            </ButtonPrimary>
          }
        />
        <CardContent>
          <div style={{ height: '300px' }}>
            <canvas id="estadosChart"></canvas>
          </div>
          
          {Object.keys(stats.participantesPorEstado).length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No hay datos de participantes por estado disponibles.
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Badge variant="primary">Actualizado: {new Date().toLocaleString()}</Badge>
      </div>
    </div>
  );
};

export default DashboardStats; 