import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { paginatePrisma } from 'src/common/pagination';
import { CryptoService } from 'src/services/crypto/crypto.service';
import * as passwordUtil from 'src/utils/password';
import { MessagingService } from '../../services/messaging/messaging.service';
import { PrismaService } from '../../services/prisma/prisma.service';
import { UsersService } from './users.service';

jest.mock('src/common/pagination', () => ({
  paginatePrisma: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any;
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
    crypto = module.get<CryptoService>(CryptoService);
  });

  describe('getRaw', () => {
    it('should return a user with isDeleted: false', async () => {
      const user = { id: '1', isDeleted: false };
      prisma.user.findUnique.mockResolvedValue(user);
      const result = await service.getRaw({ where: { id: '1' } });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1', isDeleted: false },
      });
      expect(result).toEqual(user);
    });
  });

  describe('get', () => {
    it('should return a user with person and addresses', async () => {
      const user = { id: '1', isDeleted: false, person: {}, addresses: [] };
      prisma.user.findFirst.mockResolvedValue(user);
      const result = await service.get({ where: { id: '1' } });
      expect(result).toEqual(user);
    });
  });

  describe('registerUserClient', () => {
    it('should throw conflict if email already exists', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: '1' });
      await expect(
        service.registerUserClient({
          email: 'test',
          password: '123',
          person: {},
          address: {},
        } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should create a new user', async () => {
      prisma.user.findFirst.mockResolvedValue(undefined);
      prisma.user.create.mockResolvedValue({
        id: '2',
        person: {},
        addresses: [],
      });
      jest
        .spyOn(service, 'mapToBasicUserInfoFromUser')
        .mockResolvedValue({ id: '2' });
      const result = await service.registerUserClient({
        email: 'new@test.com',
        password: '123',
        person: {},
        address: {},
      } as any);
      expect(result).toMatchObject({ id: '2' });
    });
  });

  describe('getAllUsers', () => {
    it('should return paginated users', async () => {
      (paginatePrisma as jest.Mock).mockResolvedValue({ data: [], meta: {} });
      jest
        .spyOn(service, 'mapToBasicUserInfoFromUser')
        .mockResolvedValue({} as any);
      const result = await service.getAllUsers({} as any);
      expect(result).toHaveProperty('data');
    });
  });

  describe('getUserById', () => {
    it('should throw if user not found', async () => {
      jest.spyOn(service, 'getRaw').mockResolvedValue(undefined);
      await expect(service.getUserById('x')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return mapped user', async () => {
      const mockUser = {
        id: '1',
        email: 'test@email.com',
        password: 'hashedpassword',
        role: Role.USER,
        isActive: true,
        isDeleted: false,
        createdAt: new Date(),
        points: 0,
      };
      jest.spyOn(service, 'getRaw').mockResolvedValue(mockUser);
      jest.spyOn(service, 'mapToBasicUserInfoFromUser').mockResolvedValue({
        id: '1',
        email: 'test@email.com',
        role: Role.USER,
        isActive: true,
        points: 0,
      });
      const result = await service.getUserById('1');
      expect(result).toEqual({
        id: '1',
        email: 'test@email.com',
        role: Role.USER,
        isActive: true,
        points: 0,
      });
    });
  });

  describe('updateUser', () => {
    it('should throw if email exists', async () => {
      crypto.decrypt.mockResolvedValue('decrypted@email.com');
      prisma.user.findFirst.mockResolvedValue({ id: 'existing' });
      await expect(
        service.updateUser('1', { email: 'new@email.com' } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should update user and return mapped info', async () => {
      prisma.user.findFirst.mockResolvedValue(undefined);
      crypto.encrypt.mockResolvedValue('encrypted');
      prisma.user.update.mockResolvedValue({ id: '1', person: {} });
      jest
        .spyOn(service, 'mapToBasicUserInfoFromUser')
        .mockResolvedValue({ id: '1' });
      const result = await service.updateUser('1', {
        email: 'new@email.com',
      } as any);
      expect(result).toEqual({ id: '1' });
    });
  });

  describe('deleteUser', () => {
    it('should set isDeleted to true', async () => {
      const deletedUser = { id: '1', isDeleted: true };
      prisma.user.update.mockResolvedValue(deletedUser);
      const result = await service.deleteUser('1');
      expect(result).toEqual(deletedUser);
    });
  });

  describe('changePassword', () => {
    it('should update user password', async () => {
      const update = { id: '1', password: 'hashed' };
      jest.spyOn(passwordUtil, 'hashPassword').mockResolvedValue('hashed');
      prisma.user.update.mockResolvedValue(update);
      const result = await service.changePassword('1', {
        password: 'newpass',
        confirmPassword: 'newpass',
        token: 'token',
      });
      expect(result).toEqual(update);
    });
  });

  describe('addressDefaultUpdate', () => {
    it('should update address defaults', async () => {
      await service.addressDefaultUpdate('a1', 'u1');
      expect(prisma.address.updateMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        data: { isDefault: false },
      });
      expect(prisma.address.update).toHaveBeenCalledWith({
        where: { id: 'a1' },
        data: { isDefault: true },
      });
    });
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
      expect(result).toMatchObject({
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
