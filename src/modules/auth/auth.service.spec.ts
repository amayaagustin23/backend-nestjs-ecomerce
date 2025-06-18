import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { CryptoService } from 'src/services/crypto/crypto.service';
import { MessagingService } from '../../services/messaging/messaging.service';
import { PrismaService } from '../../services/prisma/prisma.service';
import { UsersService } from '../users/users.service';

jest.mock('src/common/pagination', () => ({
  paginatePrisma: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any;
  let i18n: any;
  let crypto: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            address: {
              updateMany: jest.fn(),
              update: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
            },
            coupon: { findFirst: jest.fn(), create: jest.fn() },
            userCoupon: { create: jest.fn() },
            favoriteProduct: { create: jest.fn(), deleteMany: jest.fn() },
          },
        },
        {
          provide: I18nService,
          useValue: { t: jest.fn().mockImplementation((key) => key) },
        },
        { provide: JwtService, useValue: {} },
        { provide: MessagingService, useValue: {} },
        {
          provide: CryptoService,
          useValue: { encrypt: jest.fn(), decrypt: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
    i18n = module.get<I18nService>(I18nService);
    crypto = module.get<CryptoService>(CryptoService);
  });

  describe('exchangeCoupon', () => {
    it('should throw if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.exchangeCoupon('CODE', 'u1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw if coupon not found', async () => {
      prisma.user.findUnique.mockResolvedValue({ points: 100 });
      prisma.coupon.findFirst.mockResolvedValue(null);
      await expect(service.exchangeCoupon('CODE', 'u1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw if coupon is expired', async () => {
      prisma.user.findUnique.mockResolvedValue({ points: 100 });
      prisma.coupon.findFirst.mockResolvedValue({
        id: 'c1',
        price: 50,
        expiresAt: new Date(Date.now() - 1000),
      });
      await expect(service.exchangeCoupon('CODE', 'u1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if insufficient points', async () => {
      prisma.user.findUnique.mockResolvedValue({ points: 10 });
      prisma.coupon.findFirst.mockResolvedValue({
        id: 'c1',
        price: 50,
        expiresAt: new Date(Date.now() + 1000),
      });
      await expect(service.exchangeCoupon('CODE', 'u1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should exchange coupon successfully', async () => {
      prisma.user.findUnique.mockResolvedValue({ points: 100 });
      prisma.coupon.findFirst.mockResolvedValue({
        id: 'c1',
        price: 50,
        expiresAt: new Date(Date.now() + 1000),
      });
      prisma.coupon.create.mockResolvedValue({ id: 'c2' });
      prisma.userCoupon.create.mockResolvedValue({});
      prisma.user.update.mockResolvedValue({});

      const fullUser = {
        id: 'u1',
        email: 'user@email.com',
        password: 'hashedpassword',
        role: Role.USER,
        isActive: true,
        isDeleted: false,
        createdAt: new Date(),
        points: 50,
      };

      jest.spyOn(service, 'getRaw').mockResolvedValue(fullUser);
      jest.spyOn(service, 'mapToBasicUserInfoFromUser').mockResolvedValue({
        id: 'u1',
        email: 'user@email.com',
        role: Role.USER,
        isActive: true,
        points: 50,
      });
      const result = await service.exchangeCoupon('CODE', 'u1');
      expect(result).toEqual({
        id: 'u1',
        email: 'user@email.com',
        role: Role.USER,
        isActive: true,
        points: 50,
      });
    });
  });

  describe('addFavoriteProduct', () => {
    it('should add favorite product', async () => {
      prisma.favoriteProduct.create.mockResolvedValue({});
      await expect(
        service.addFavoriteProduct({ productId: 'p1' }, 'u1'),
      ).resolves.not.toThrow();
    });

    it('should throw if already favorite', async () => {
      prisma.favoriteProduct.create.mockRejectedValue({ code: 'P2002' });
      await expect(
        service.addFavoriteProduct({ productId: 'p1' }, 'u1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deleteFavoriteProduct', () => {
    it('should delete favorite product', async () => {
      prisma.favoriteProduct.deleteMany.mockResolvedValue({});
      await expect(
        service.deleteFavoriteProduct({ productId: 'p1' }, 'u1'),
      ).resolves.not.toThrow();
    });
  });

  describe('addAddressByUser', () => {
    it('should add address', async () => {
      const address = {
        id: 'a1',
        street: 'street',
        city: 'city',
        province: 'prov',
        postalCode: '1234',
        lat: 0,
        lng: 0,
      };
      prisma.address.create.mockResolvedValue(address);
      const result = await service.addAddressByUser('u1', address);
      expect(result).toEqual(address);
    });
  });

  describe('deleteAddressByUser', () => {
    it('should delete address', async () => {
      prisma.address.delete.mockResolvedValue({});
      await expect(service.deleteAddressByUser('a1')).resolves.not.toThrow();
    });
  });

  describe('updateAddressByUser', () => {
    it('should update address', async () => {
      const address = {
        id: 'a1',
        street: 'new street',
        city: 'new city',
        province: 'prov',
        postalCode: '1234',
        lat: 0,
        lng: 0,
      };
      prisma.address.update.mockResolvedValue(address);
      const result = await service.updateAddressByUser('a1', 'u1', address);
      expect(result).toEqual(address);
    });
  });
});
