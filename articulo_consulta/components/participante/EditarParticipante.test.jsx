import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import EditarParticipante from './EditarParticipante';
import { AuthContext } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';
import participanteService from '../../api/participante';
import sorteoService from '../../api/sorteo';

// Mock de los servicios y contextos
vi.mock('../../api/participante');
vi.mock('../../api/sorteo');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockSocketService = {
  getSocket: vi.fn().mockReturnValue({
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  }),
  connect: vi.fn(),
  disconnect: vi.fn(),
  isConnected: vi.fn().mockReturnValue(true),
  joinSorteo: vi.fn(),
  leaveSorteo: vi.fn(),
};

describe('EditarParticipante', () => {
  const mockSorteo = {
    id: '1',
    nombre: 'Sorteo de Prueba',
    creado_por: '1',
    estado: 'activo',
  };

  const mockParticipante = {
    id: '1',
    sorteo_id: '1',
    nombre: 'Juan Pérez',
    email: 'juan@example.com',
    telefono: '123456789',
    validado: false,
    metodo_registro: 'manual',
    datos_adicionales: 'Datos de prueba',
  };

  const mockUser = {
    id: '1',
    username: 'admin',
    rol: 'admin',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock de las respuestas de la API
    sorteoService.getById = vi.fn().mockResolvedValue({
      success: true,
      sorteo: mockSorteo,
    });
    
    participanteService.getById = vi.fn().mockResolvedValue({
      success: true,
      participante: mockParticipante,
    });
    
    participanteService.update = vi.fn().mockResolvedValue({
      success: true,
      participante: { ...mockParticipante, nombre: 'Juan Actualizado' },
    });
  });

  const renderWithProviders = (sorteoId = '1', participanteId = '1') => {
    return render(
      <AuthContext.Provider value={{ user: mockUser, isAuthenticated: true }}>
        <SocketContext.Provider value={{ 
          socketService: mockSocketService,
          connected: true,
        }}>
          <MemoryRouter initialEntries={[`/sorteos/${sorteoId}/participantes/${participanteId}/editar`]}>
            <Routes>
              <Route 
                path="/sorteos/:sorteoId/participantes/:participanteId/editar" 
                element={<EditarParticipante />} 
              />
            </Routes>
          </MemoryRouter>
        </SocketContext.Provider>
      </AuthContext.Provider>
    );
  };

  it('debería cargar los datos del participante correctamente', async () => {
    renderWithProviders();
    
    // Verificar que se muestren los datos del participante
    await waitFor(() => {
      expect(sorteoService.getById).toHaveBeenCalledWith('1');
      expect(participanteService.getById).toHaveBeenCalledWith('1');
      expect(screen.getByLabelText(/nombre completo/i)).toHaveValue('Juan Pérez');
      expect(screen.getByLabelText(/email/i)).toHaveValue('juan@example.com');
      expect(screen.getByLabelText(/teléfono/i)).toHaveValue('123456789');
    });
  });

  it('debería mostrar error si no se puede cargar el sorteo', async () => {
    sorteoService.getById = vi.fn().mockResolvedValue({
      success: false,
    });
    
    renderWithProviders();
    
    await waitFor(() => {
      expect(screen.getByText(/no se pudo cargar la información del sorteo/i)).toBeInTheDocument();
    });
  });

  it('debería enviar los datos actualizados al guardar', async () => {
    renderWithProviders();
    
    await waitFor(() => {
      expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
    });
    
    // Actualizar el nombre
    fireEvent.change(screen.getByLabelText(/nombre completo/i), {
      target: { value: 'Juan Actualizado' },
    });
    
    // Enviar el formulario
    fireEvent.click(screen.getByText(/guardar cambios/i));
    
    await waitFor(() => {
      expect(participanteService.update).toHaveBeenCalledWith('1', {
        ...mockParticipante,
        nombre: 'Juan Actualizado',
      });
      expect(mockSocketService.getSocket().emit).toHaveBeenCalledWith(
        'participante-actualizado',
        expect.any(Object)
      );
      expect(screen.getByText(/participante actualizado exitosamente/i)).toBeInTheDocument();
    });
  });

  it('debería mostrar errores de validación', async () => {
    renderWithProviders();
    
    await waitFor(() => {
      expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
    });
    
    // Borrar el nombre
    fireEvent.change(screen.getByLabelText(/nombre completo/i), {
      target: { value: '' },
    });
    
    // Borrar email y teléfono
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: '' },
    });
    
    fireEvent.change(screen.getByLabelText(/teléfono/i), {
      target: { value: '' },
    });
    
    // Enviar el formulario
    fireEvent.click(screen.getByText(/guardar cambios/i));
    
    await waitFor(() => {
      expect(screen.getByText(/el nombre del participante es requerido/i)).toBeInTheDocument();
    });
  });
}); 