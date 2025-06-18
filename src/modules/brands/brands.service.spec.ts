jest.mock('src/common/pagination'); // 👈 Mockeamos antes de importar

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { paginatePrisma } from 'src/common/pagination';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { BrandsService } from './brands.service';

const mockPrisma = {
  brand: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const mockI18n = {
  t: jest.fn().mockImplementation((key) => key),
  translate: jest.fn().mockImplementation((key) => key),
};

describe('BrandsService', () => {
  let service: BrandsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: I18nService, useValue: mockI18n },
      ],
    }).compile();

    service = module.get<BrandsService>(BrandsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debería crear una marca correctamente', async () => {
      const dto = { name: 'Nike' };
      mockPrisma.brand.create.mockResolvedValue(dto);

      const result = await service.create(dto);

      expect(result).toEqual(dto);
      expect(mockPrisma.brand.create).toHaveBeenCalledWith({ data: dto });
    });

    it('debería lanzar ConflictException si hay duplicado', async () => {
      mockPrisma.brand.create.mockRejectedValue({ code: 'P2002' });

      await expect(service.create({ name: 'Nike' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('debería lanzar BadRequestException si es un error inesperado', async () => {
      mockPrisma.brand.create.mockRejectedValue({ code: 'P9999' });

      await expect(service.create({ name: 'Nike' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getBrandAll', () => {
    it('debería devolver marcas paginadas si hay page y size', async () => {
      const brands = [
        {
          id: '1',
          name: 'Adidas',
          createdAt: new Date(),
          updatedAt: new Date(),
          isDeleted: false,
        },
      ];
      (paginatePrisma as jest.Mock).mockResolvedValue({
        data: brands,
        meta: { total: 1 },
      });

      const result = await service.getBrandAll({ page: 1, size: 10 });

      if (Array.isArray(result)) {
        expect(result.length).toBe(1);
      } else {
        expect(result.data.length).toBe(1);
      }
      expect(paginatePrisma).toHaveBeenCalled();
    });

    it('debería devolver marcas sin paginación si no hay page y size', async () => {
      const brands = [
        {
          id: '1',
          name: 'Nike',
          createdAt: new Date(),
          updatedAt: new Date(),
          isDeleted: false,
        },
      ];
      mockPrisma.brand.findMany.mockResolvedValue(brands);

      const result = await service.getBrandAll({});

      expect(result).toEqual(brands);
      expect(mockPrisma.brand.findMany).toHaveBeenCalledWith({ where: {} });
    });

    it('debería aplicar filtros de búsqueda y fecha', async () => {
      const brands = [];
      mockPrisma.brand.findMany.mockResolvedValue(brands);

      await service.getBrandAll({
        search: 'nike',
        date: new Date(),
      });

      expect(mockPrisma.brand.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'nike', mode: 'insensitive' },
            createdAt: expect.any(Object),
          }),
        }),
      );
    });
  });

  describe('getBrandId', () => {
    it('debería devolver una marca si existe', async () => {
      const brand = { id: '1', name: 'Adidas' };
      mockPrisma.brand.findUnique.mockResolvedValue(brand);

      const result = await service.getBrandId('1');

      expect(result).toEqual(brand);
    });

    it('debería lanzar ForbiddenException si no existe', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue(null);

      await expect(service.getBrandId('1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('debería actualizar una marca', async () => {
      const updated = { id: '1', name: 'Puma' };
      mockPrisma.brand.update.mockResolvedValue(updated);

      const result = await service.update('1', { name: 'Puma' });

      expect(result).toEqual(updated);
    });

    it('debería lanzar ConflictException si hay duplicado', async () => {
      mockPrisma.brand.update.mockRejectedValue({ code: 'P2002' });

      await expect(service.update('1', { name: 'Nike' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('debería lanzar BadRequestException si es un error inesperado', async () => {
      mockPrisma.brand.update.mockRejectedValue({ code: 'OtroError' });

      await expect(service.update('1', { name: 'Nike' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deleteBrandId', () => {
    it('debería borrar la marca si no tiene productos', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue({ id: '1', products: [] });
      mockPrisma.brand.delete.mockResolvedValue({});

      const result = await service.deleteBrandId('1');

      expect(result).toEqual({ message: 'translations.deleted' });
    });

    it('debería lanzar NotFoundException si no existe', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue(null);

      await expect(service.deleteBrandId('1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debería lanzar ConflictException si tiene productos', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue({
        id: '1',
        products: [{}],
      });

      await expect(service.deleteBrandId('1')).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
