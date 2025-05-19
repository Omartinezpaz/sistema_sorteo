const participanteController = require('./participanteController');
const Participante = require('../../models/Participante');
const Sorteo = require('../../models/Sorteo');

// Mock de los modelos
jest.mock('../models/Participante');
jest.mock('../models/Sorteo');

describe('Participante Controller', () => {
  let req;
  let res;
  let mockIO;

  beforeEach(() => {
    // Reiniciar todos los mocks
    jest.clearAllMocks();

    // Mock de req y res
    req = {
      params: {},
      query: {},
      body: {},
      user: {
        id: 'user-1',
        rol: 'admin'
      },
      app: {
        get: jest.fn()
      }
    };

    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    // Mock de Socket.io
    mockIO = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn()
    };

    req.app.get.mockReturnValue(mockIO);
  });

  describe('getById', () => {
    it('debería devolver un participante cuando existe', async () => {
      // Datos de prueba
      const mockParticipante = {
        id: 'participante-1',
        nombre: 'Juan Pérez',
        email: 'juan@ejemplo.com'
      };

      // Configurar el mock
      Participante.getById.mockResolvedValue(mockParticipante);

      // Parámetros de la solicitud
      req.params.id = 'participante-1';

      // Ejecutar el controlador
      await participanteController.getById(req, res);

      // Verificar resultado
      expect(Participante.getById).toHaveBeenCalledWith('participante-1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        participante: mockParticipante
      });
    });

    it('debería devolver 404 cuando el participante no existe', async () => {
      // Configurar el mock para devolver null (participante no encontrado)
      Participante.getById.mockResolvedValue(null);

      // Parámetros de la solicitud
      req.params.id = 'participante-inexistente';

      // Ejecutar el controlador
      await participanteController.getById(req, res);

      // Verificar resultado
      expect(Participante.getById).toHaveBeenCalledWith('participante-inexistente');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Participante no encontrado'
      });
    });
  });

  describe('create', () => {
    it('debería crear un nuevo participante correctamente', async () => {
      // Datos de prueba
      const mockSorteo = {
        id: 'sorteo-1',
        nombre: 'Sorteo de Prueba'
      };

      const mockParticipanteData = {
        sorteo_id: 'sorteo-1',
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
        telefono: '123456789'
      };

      const mockNuevoParticipante = {
        ...mockParticipanteData,
        id: 'participante-1',
        validado: false,
        fecha_registro: new Date().toISOString()
      };

      // Configurar mocks
      Sorteo.getById.mockResolvedValue(mockSorteo);
      Participante.verificarEmailEnSorteo.mockResolvedValue(false);
      Participante.create.mockResolvedValue(mockNuevoParticipante);

      // Establecer datos de la solicitud
      req.body = mockParticipanteData;

      // Ejecutar el controlador
      await participanteController.create(req, res);

      // Verificar resultado
      expect(Sorteo.getById).toHaveBeenCalledWith(mockParticipanteData.sorteo_id);
      expect(Participante.verificarEmailEnSorteo).toHaveBeenCalledWith(
        mockParticipanteData.email,
        mockParticipanteData.sorteo_id
      );
      expect(Participante.create).toHaveBeenCalledWith(mockParticipanteData);
      expect(mockIO.to).toHaveBeenCalledWith(`sorteo:${mockParticipanteData.sorteo_id}`);
      expect(mockIO.emit).toHaveBeenCalledWith('nuevo-participante', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Participante registrado exitosamente',
        participante: mockNuevoParticipante
      });
    });

    it('debería validar que el sorteo y el nombre son requeridos', async () => {
      // Datos de prueba incompletos
      req.body = {
        email: 'juan@example.com',
        telefono: '123456789'
      };

      // Ejecutar el controlador
      await participanteController.create(req, res);

      // Verificar resultado
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'El sorteo y el nombre del participante son requeridos'
      });
    });

    it('debería validar email duplicado en el mismo sorteo', async () => {
      // Datos de prueba
      const mockParticipanteData = {
        sorteo_id: 'sorteo-1',
        nombre: 'Juan Pérez',
        email: 'duplicado@example.com',
      };

      // Configurar mocks
      Sorteo.getById.mockResolvedValue({ id: 'sorteo-1' });
      Participante.verificarEmailEnSorteo.mockResolvedValue(true); // Email duplicado

      // Establecer datos de la solicitud
      req.body = mockParticipanteData;

      // Ejecutar el controlador
      await participanteController.create(req, res);

      // Verificar resultado
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Este email ya está registrado en el sorteo'
      });
    });
  });
}); 