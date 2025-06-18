import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { paginatePrisma } from 'src/common/pagination';
import { UploadService } from 'src/services/aws/aws.service';
import { PrismaService } from 'src/services/prisma/prisma.service';
import * as parseUtils from 'src/utils/parsers';
import { CreateProductDto } from './dto/product.dto';
import { ProductsService } from './products.service';
jest.mock('src/common/pagination');

describe('ProductsService - create', () => {
  let service: ProductsService;

  const mockPrisma = {
    product: { create: jest.fn() },
  };

  const mockUploadService = {
    upload: jest
      .fn()
      .mockResolvedValue('https://s3.amazonaws.com/fake-url.png'),
  };

  const mockI18n = {
    t: jest.fn((key) => key),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UploadService, useValue: mockUploadService },
        { provide: I18nService, useValue: mockI18n },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('lanza BadRequestException si el JSON de variants es inválido', async () => {
    const dto: Partial<CreateProductDto> = {
      name: 'Producto A',
      description: 'Descripción',
      price: 100,
      priceList: 120,
      isService: 'false',
      categoryId: 'uuid-cat',
      brandId: 'uuid-brand',
      variants: 'no-es-json',
    };

    await expect(service.create(dto as CreateProductDto)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('crea el producto sin variantes ni imágenes', async () => {
    const dto: CreateProductDto = {
      name: 'Producto B',
      description: 'Descripción',
      price: 100,
      priceList: 120,
      isService: 'true',
      isActive: 'true',
      hasDelivery: 'true',
      categoryId: 'uuid-cat',
      brandId: 'uuid-brand',
    };

    const created = {
      id: 'prod-1',
      variants: [],
      category: { children: [] },
      brand: { id: 'uuid-brand', name: 'Brand' },
    };

    mockPrisma.product.create.mockResolvedValue(created);

    const result = await service.create(dto, []);

    expect(mockPrisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Producto B',
          isService: true,
          isActive: true,
          hasDelivery: true,
          brand: { connect: { id: 'uuid-brand' } },
          category: { connect: { id: 'uuid-cat' } },
          variants: { create: [] },
        }),
      }),
    );

    expect(result.id).toBe('prod-1');
  });

  it('crea el producto con variantes y sube imágenes correctamente', async () => {
    const dto: CreateProductDto = {
      name: 'Producto C',
      description: 'Descripción',
      price: 100,
      priceList: 120,
      isService: 'false',
      categoryId: 'uuid-cat',
      brandId: 'uuid-brand',
      variants: JSON.stringify([
        { tempId: 'temp-1', stock: 10, size: 'size-uuid' },
      ]),
    };

    const files = [
      {
        fieldname: 'variantImages-temp-1',
        buffer: Buffer.from(''),
        originalname: 'img.png',
      },
    ] as unknown as Express.Multer.File[];

    const created = {
      id: 'prod-2',
      variants: [{ images: [] }],
      category: { children: [] },
      brand: { id: 'uuid-brand', name: 'Brand' },
    };

    mockPrisma.product.create.mockResolvedValue(created);

    const result = await service.create(dto, files);

    expect(mockUploadService.upload).toHaveBeenCalledWith(files[0]);

    expect(mockPrisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          variants: {
            create: [
              expect.objectContaining({
                stock: 10,
                size: { connect: { id: 'size-uuid' } },
                images: {
                  create: [
                    expect.objectContaining({
                      url: 'https://s3.amazonaws.com/fake-url.png',
                    }),
                  ],
                },
              }),
            ],
          },
        }),
      }),
    );

    expect(result.id).toBe('prod-2');
  });
});

describe('ProductsService - getRaw', () => {
  let productsService: ProductsService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    prisma = {
      product: {
        findUnique: jest.fn(),
      },
    } as any;

    productsService = new ProductsService(
      prisma,
      {} as I18nService,
      {} as UploadService,
    );
  });

  it('debería llamar a findUnique con isActive: true agregado al where', async () => {
    const input = {
      where: { id: 'prod-123' },
      include: { category: true },
    };

    const expected = {
      where: { id: 'prod-123', isActive: true },
      include: { category: true },
    };

    await productsService.getRaw(input);

    expect(prisma.product.findUnique).toHaveBeenCalledWith(expected);
  });
});

describe('ProductsService - getAllProducts', () => {
  let service: ProductsService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    prisma = {
      product: {} as any,
    } as any;

    service = new ProductsService(
      prisma,
      {} as I18nService,
      {} as UploadService,
    );

    jest
      .spyOn(service as any, 'mapToParsedProduct')
      .mockImplementation((p: any) => ({ ...p, parsed: true }));

    jest.spyOn(parseUtils, 'parseSortBy').mockReturnValue({ name: 'asc' });

    jest.spyOn(parseUtils, 'parseDateToRange').mockReturnValue({
      gte: '2024-01-01T00:00:00.000Z',
      lt: '2024-01-01T23:59:59.999Z',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería construir correctamente el filtro y llamar a paginatePrisma', async () => {
    const mockPagination = {
      search: 'camisa',
      date: new Date('2024-01-01'),
      orderBy: 'name-asc',
      categoryIds: '1,2',
      brandIds: '10,11',
      minPrice: 100,
      maxPrice: 500,
      variantsName: 'S,M',
    };

    const mockProducts = [
      { id: 'p1', name: 'camisa' },
      { id: 'p2', name: 'pantalón' },
    ];

    (paginatePrisma as jest.Mock).mockResolvedValue({
      data: mockProducts,
      total: 2,
      page: 1,
      size: 10,
    });

    const result = await service.getAllProducts(mockPagination, 'user-123');

    expect(paginatePrisma).toHaveBeenCalledWith(
      expect.anything(), // this.product
      expect.objectContaining({
        where: expect.objectContaining({
          name: { contains: 'camisa', mode: 'insensitive' },
          createdAt: {
            gte: '2024-01-01T00:00:00.000Z',
            lt: '2024-01-01T23:59:59.999Z',
          },
          price: { gte: 100, lte: 500 },
          brandId: { in: ['10', '11'] },
        }),
        include: expect.objectContaining({
          favoritedBy: true,
          variants: expect.anything(),
          category: expect.anything(),
          brand: true,
        }),
        orderBy: { name: 'asc' },
      }),
      mockPagination,
    );

    expect(result).toEqual({
      data: [
        { id: 'p1', name: 'camisa', parsed: true },
        { id: 'p2', name: 'pantalón', parsed: true },
      ],
      total: 2,
      page: 1,
      size: 10,
    });
  });
});

describe('ProductsService - getProductById', () => {
  let service: ProductsService;
  let prisma: jest.Mocked<PrismaService>;
  let i18n: jest.Mocked<I18nService>;

  beforeEach(() => {
    prisma = {
      product: {
        findUnique: jest.fn(),
      },
    } as { product: { findUnique: jest.Mock } } as any;
    i18n = {
      t: jest.fn().mockReturnValue('Producto no encontrado'),
    } as any;

    service = new ProductsService(prisma, i18n, {} as UploadService);
  });

  it('debería retornar un producto transformado si existe', async () => {
    const rawProduct = { id: 'prod-123', name: 'Camisa' };

    jest.spyOn(service, 'getRaw').mockResolvedValue(rawProduct as any);
    jest
      .spyOn(service as any, 'mapToParsedProduct')
      .mockImplementation((p: any) => ({ ...p, parsed: true }));

    const result = await service.getProductById('prod-123');

    expect(service.getRaw).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'prod-123' },
        include: expect.anything(),
      }),
    );
    expect(result).toEqual({ id: 'prod-123', name: 'Camisa', parsed: true });
  });

  it('debería lanzar ForbiddenException si el producto no existe', async () => {
    jest.spyOn(service, 'getRaw').mockResolvedValue(null);

    await expect(service.getProductById('no-id')).rejects.toThrow(
      ForbiddenException,
    );

    expect(i18n.t).toHaveBeenCalledWith('errors.notFound', {
      args: { model: 'Product' },
    });
  });
});

describe('ProductsService - updateProduct', () => {
  let service: ProductsService;
  let prisma: jest.Mocked<PrismaService>;
  let uploadService: jest.Mocked<UploadService>;
  let i18n: jest.Mocked<I18nService>;

  beforeEach(() => {
    prisma = {
      product: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      productVariant: {
        update: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
      },
      image: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
    } as any;

    uploadService = {
      upload: jest.fn().mockResolvedValue('http://image.url/file.jpg'),
    } as any;

    i18n = {
      t: jest.fn().mockImplementation((_, { args }) => `Error: ${args.model}`),
    } as any;

    service = new ProductsService(prisma, i18n, uploadService);

    jest
      .spyOn(service as any, 'mapToParsedProduct')
      .mockImplementation((p: any) => ({ ...p, parsed: true }));
  });

  it('debería lanzar BadRequestException si JSON es inválido', async () => {
    const body = {
      variants: '{invalid}',
    } as any;

    await expect(service.updateProduct('123', body)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('debería lanzar ConflictException si no encuentra el producto', async () => {
    jest.spyOn(prisma.product, 'findUnique').mockResolvedValue(null);

    const body = {
      variants: '[]',
      variantsToUpdate: '[]',
      variantsToDelete: '[]',
      imagesToDelete: '[]',
    } as any;

    await expect(service.updateProduct('123', body)).rejects.toThrow(
      ConflictException,
    );
  });

  it('debería actualizar correctamente un producto', async () => {
    (prisma.product.findUnique as jest.Mock).mockResolvedValue({
      id: '123',
      variants: [],
    });
    (prisma.product.update as jest.Mock).mockResolvedValue({
      id: '123',
      name: 'Camisa',
    });

    const body = {
      variants: '[]',
      variantsToUpdate: '[]',
      variantsToDelete: '["v1"]',
      imagesToDelete: '["img1"]',
      isService: false,
      isActive: true,
      hasDelivery: false,
    } as any;

    const result = await service.updateProduct('123', body);

    expect(prisma.product.update).toHaveBeenCalled();
    expect(prisma.productVariant.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['v1'] }, productId: '123' },
      data: { isDeleted: true },
    });
    expect(prisma.image.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['img1'] } },
    });
    expect(result).toEqual({ id: '123', name: 'Camisa', parsed: true });
  });
});

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: jest.Mocked<PrismaService>;
  let i18n: jest.Mocked<I18nService>;

  beforeEach(() => {
    prisma = {
      size: { findMany: jest.fn() },
      color: { findMany: jest.fn() },
      gender: { findMany: jest.fn() },
      brand: { findMany: jest.fn() },
      product: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      image: { deleteMany: jest.fn() },
    } as any;

    i18n = {
      t: jest.fn(),
    } as any;

    service = new ProductsService(prisma, i18n, {} as UploadService);

    jest
      .spyOn(service as any, 'mapToParsedProduct')
      .mockImplementation((p: any) => ({ ...p, parsed: true }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería retornar todos los tamaños únicos', async () => {
    jest.spyOn(prisma.size, 'findMany').mockResolvedValue([
      { id: '1', name: 'S' },
      { id: '2', name: 'M' },
    ]);
    const result = await service.getUniqueSizes();
    expect(result).toEqual([
      { id: '1', name: 'S' },
      { id: '2', name: 'M' },
    ]);
  });

  it('debería retornar todos los colores únicos', async () => {
    jest
      .spyOn(prisma.color, 'findMany')
      .mockResolvedValue([{ id: '1', name: 'Rojo', hex: '#FF0000' }]);
    const result = await service.getUniqueColors();
    expect(result).toEqual([{ id: '1', name: 'Rojo', hex: '#FF0000' }]);
  });

  it('debería retornar todos los géneros únicos', async () => {
    jest
      .spyOn(prisma.gender, 'findMany')
      .mockResolvedValue([{ id: '1', name: 'Unisex' }]);
    const result = await service.getUniqueGenders();
    expect(result).toEqual([{ id: '1', name: 'Unisex' }]);
  });

  it('debería retornar todas las marcas', async () => {
    jest.spyOn(prisma.brand, 'findMany').mockResolvedValue([
      {
        id: 'brand-1',
        name: 'Nike',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const result = await service.getAllBrands();
    expect(result).toEqual([
      {
        id: 'brand-1',
        name: 'Nike',
        isDeleted: false,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      },
    ]);
  });

  it('debería retornar productos favoritos transformados', async () => {
    const userId = 'user-1';
    jest.spyOn(prisma.product, 'findMany').mockResolvedValue([
      {
        id: 'p1',
        name: 'Camisa',
        description: 'Desc Camisa',
        price: 100,
        priceList: 120,
        isService: false,
        isActive: true,
        hasDelivery: true,
        categoryId: 'cat-1',
        brandId: 'brand-1',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'p2',
        name: 'Zapato',
        description: 'Desc Zapato',
        price: 200,
        priceList: 220,
        isService: false,
        isActive: true,
        hasDelivery: true,
        categoryId: 'cat-2',
        brandId: 'brand-2',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await service.getAllFavorites(userId);

    expect(prisma.product.findMany).toHaveBeenCalledWith({
      take: 4,
      where: { favoritedBy: { some: { userId } } },
      include: expect.anything(),
    });

    expect(result).toEqual([
      expect.objectContaining({
        id: 'p1',
        name: 'Camisa',
        parsed: true,
      }),
      expect.objectContaining({
        id: 'p2',
        name: 'Zapato',
        parsed: true,
      }),
    ]);
  });

  it('debería lanzar ForbiddenException si el producto no existe (delete)', async () => {
    jest.spyOn(prisma.product, 'findUnique').mockResolvedValue(null);
    i18n.t.mockReturnValue('No encontrado');

    await expect(service.deleteProductById('x')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('debería lanzar BadRequestException si el producto tiene variantes', async () => {
    jest
      .spyOn(prisma.product, 'findUnique')
      .mockResolvedValue({ id: 'p1', variants: [{ id: 'v1' }] } as any);
    i18n.t.mockReturnValue('Conflicto');

    await expect(service.deleteProductById('p1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('debería eliminar imágenes y marcar producto como no eliminado', async () => {
    jest.spyOn(prisma.product, 'findUnique').mockResolvedValue({
      id: 'p2',
      name: 'Camisa',
      description: '',
      price: 100,
      priceList: 100,
      isService: false,
      isActive: true,
      hasDelivery: false,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      categoryId: 'cat-1',
      brandId: 'brand-1',
      variants: [] as any,
    });

    const deleteMany = jest.spyOn(prisma.image, 'deleteMany');
    const update = jest.spyOn(prisma.product, 'update');

    await service.deleteProductById('p2');

    expect(deleteMany).toHaveBeenCalledWith({ where: { productId: 'p2' } });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'p2' },
      data: { isDeleted: false },
    });
  });
});

describe('ProductsService - updateProduct - imágenes agrupadas', () => {
  let service: ProductsService;
  let prisma: jest.Mocked<PrismaService>;
  let uploadService: jest.Mocked<UploadService>;
  let i18n: jest.Mocked<I18nService>;

  beforeEach(() => {
    prisma = {
      product: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      productVariant: {
        update: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
      },
      image: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
    } as any;

    uploadService = {
      upload: jest.fn().mockResolvedValue('http://image.url/file.jpg'),
    } as any;

    i18n = {
      t: jest.fn().mockImplementation((_, { args }) => `Error: ${args.model}`),
    } as any;

    service = new ProductsService(prisma, i18n, uploadService);

    jest
      .spyOn(service as any, 'mapToParsedProduct')
      .mockImplementation((p: any) => ({ ...(p || {}), parsed: true }));
  });

  it('debería procesar imágenes por variante y subirlas correctamente', async () => {
    const mockFile: Express.Multer.File = {
      originalname: 'variant-1__imagen.png',
      buffer: Buffer.from('fake'),
      mimetype: 'image/png',
    } as any;

    const body = {
      variants: JSON.stringify([]),
      variantsToUpdate: JSON.stringify([{ id: 'variant-1' }]),
      variantsToDelete: '[]',
      imagesToDelete: '[]',
    } as any;

    jest
      .spyOn(prisma.product, 'findUnique')
      .mockResolvedValue({ id: 'p123', variants: [] } as any);

    jest
      .spyOn(prisma.product, 'update')
      .mockResolvedValue({ id: 'p123', name: 'producto actualizado' } as any);

    const uploadSpy = jest.spyOn(uploadService, 'upload');
    jest
      .spyOn(prisma.image, 'createMany')
      .mockResolvedValue({ count: 1 } as any);

    const result = await service.updateProduct('p123', body, [mockFile]);

    expect(uploadSpy).toHaveBeenCalledWith(mockFile);
    expect(prisma.image.createMany).toHaveBeenCalledWith({
      data: [
        {
          url: 'http://image.url/file.jpg',
          order: 0,
          description: '',
          type: 'VARIANT',
          variantId: 'variant-1',
        },
      ],
    });

    expect(result).toEqual(
      expect.objectContaining({ parsed: true, id: 'p123' }),
    );
  });

  it('debería crear nuevas variantes y asociar imágenes según tempId', async () => {
    const mockFile: Express.Multer.File = {
      originalname: 'temp-99__img.png',
      buffer: Buffer.from('fake'),
      mimetype: 'image/png',
    } as any;

    const newVariant = { tempId: 'temp-99', stock: 5 };
    const body: any = {
      variants: JSON.stringify([newVariant]),
      variantsToUpdate: '[]',
      variantsToDelete: '[]',
      imagesToDelete: '[]',
    };

    jest
      .spyOn(prisma.product, 'findUnique')
      .mockResolvedValue({ id: 'pX', variants: [] } as any);
    jest
      .spyOn(prisma.product, 'update')
      .mockResolvedValue({ id: 'pX', name: 'prodX' } as any);
    jest
      .spyOn(prisma.productVariant, 'create')
      .mockResolvedValue({ id: 'v99' } as any);
    const uploadSpy = jest
      .spyOn(uploadService, 'upload')
      .mockResolvedValue('urlX');
    jest
      .spyOn(prisma.image, 'createMany')
      .mockResolvedValue({ count: 1 } as any);

    const result = await service.updateProduct('pX', body, [mockFile]);

    expect(uploadSpy).toHaveBeenCalledWith(mockFile);
    expect(prisma.productVariant.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          stock: 5,
          product: { connect: { id: 'pX' } },
        }),
      }),
    );
    expect(prisma.image.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({
            variantId: 'v99',
            url: 'urlX',
            type: 'VARIANT',
          }),
        ],
      }),
    );
    expect(result).toEqual(expect.objectContaining({ parsed: true, id: 'pX' }));
  });
});
