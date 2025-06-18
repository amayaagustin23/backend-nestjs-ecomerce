import { paginatePrisma } from '.';

describe('paginatePrisma', () => {
  const mockModel = {
    findMany: jest.fn(),
    count: jest.fn(),
  };

  const dataMock = [{ id: 1 }, { id: 2 }];
  const totalMock = 20;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debería paginar correctamente con valores por defecto', async () => {
    mockModel.findMany.mockResolvedValue(dataMock);
    mockModel.count.mockResolvedValue(totalMock);

    const result = await paginatePrisma(mockModel, {}, { page: 2, size: 5 });

    expect(mockModel.count).toHaveBeenCalledWith({ where: undefined });
    expect(mockModel.findMany).toHaveBeenCalledWith({
      skip: 5,
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    expect(result).toEqual({
      data: dataMock,
      total: totalMock,
      page: 2,
      size: 5,
    });
  });

  it('debería usar orderBy personalizado si se pasa', async () => {
    mockModel.findMany.mockResolvedValue(dataMock);
    mockModel.count.mockResolvedValue(totalMock);

    const result = await paginatePrisma(
      mockModel,
      { orderBy: { name: 'asc' } },
      { page: 1, size: 10 },
    );

    expect(mockModel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { name: 'asc' },
      }),
    );
    expect(result.page).toBe(1);
    expect(result.size).toBe(10);
  });

  it('debería usar valores por defecto cuando no se pasan page/size', async () => {
    mockModel.findMany.mockResolvedValue(dataMock);
    mockModel.count.mockResolvedValue(totalMock);

    const result = await paginatePrisma(mockModel, {}, {} as any);

    expect(mockModel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 10,
      }),
    );
    expect(result.page).toBe(1);
    expect(result.size).toBe(10);
  });
});
