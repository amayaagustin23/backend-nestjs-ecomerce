// prisma.service.spec.ts
import { Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(() => {
    service = new PrismaService();

    // Mock de Logger.log
    jest.spyOn(Logger, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería conectar exitosamente y registrar el mensaje', async () => {
    const connectMock = jest
      .spyOn(service, '$connect')
      .mockResolvedValueOnce(undefined);

    await service.onModuleInit();

    expect(connectMock).toHaveBeenCalled();
    expect(Logger.log).toHaveBeenCalledWith(
      '✅ Database connection successful',
      'PrismaService',
    );
  });

  it('debería manejar errores de conexión y registrar el error', async () => {
    const error = new Error('Falló la conexión');
    jest.spyOn(service, '$connect').mockRejectedValueOnce(error);

    await service.onModuleInit();

    expect(Logger.log).toHaveBeenCalledWith(error, 'PrismaService');
  });
});
