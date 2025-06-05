import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  Address,
  CouponStatus,
  Person,
  Prisma,
  Role,
  User,
} from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { BasicUserInfo } from 'src/common/interfaces/index.interface';
import { paginatePrisma } from 'src/common/pagination';
import { PaginationArgs } from 'src/common/pagination/pagination.interface';
import { CryptoService } from 'src/services/crypto/crypto.service';
import { generateCustomCode, parseDateToRange } from 'src/utils/parsers';
import { hashPassword } from 'src/utils/password';
import { MessagingService } from '../../services/messaging/messaging.service';
import { PrismaService } from '../../services/prisma/prisma.service';
import {
  AddressDto,
  RegisterUserDto,
  ResetPasswordDto,
  UpdateUserDto,
} from './dto/user.dto';

@Injectable()
export class UsersService {
  private user: Prisma.UserDelegate;
  constructor(
    private prisma: PrismaService,
    private readonly i18n: I18nService,
    private jwtService: JwtService,
    private messagingService: MessagingService,
    private cryptoService: CryptoService,
  ) {
    this.user = prisma.user;
  }

  async getRaw<T extends Prisma.UserFindUniqueArgs>(
    input: Prisma.SelectSubset<T, Prisma.UserFindUniqueArgs>,
  ) {
    input.where = {
      ...input.where,
      isDeleted: false,
    };
    return this.user.findUnique<T>(input);
  }

  async get(input: { where: Prisma.UserWhereInput }) {
    const { where } = input;
    const user = await this.user.findFirst({
      where: { ...where, isDeleted: false },
      include: { person: true, addresses: true },
    });
    if (!user) return undefined;
    return user;
  }

  async registerUserClient(
    body: RegisterUserDto,
  ): Promise<Partial<BasicUserInfo>> {
    const { email, password, person, address } = body;

    const passwordHashed = await hashPassword(password);

    const existingActiveUser = await this.get({
      where: {
        email,
        isDeleted: false,
      },
    });

    if (existingActiveUser) {
      throw new ConflictException('Ya existe un usuario con ese correo');
    }

    const addressIsComplete =
      address?.street && address.city && address.province && address.postalCode;

    const user = await this.user
      .create({
        data: {
          email,
          password: passwordHashed,
          person: {
            create: { ...person },
          },
          ...(addressIsComplete
            ? {
                addresses: {
                  create: {
                    street: address.street,
                    city: address.city,
                    province: address.province,
                    postalCode: address.postalCode,
                    lat: address.lat ?? 0,
                    lng: address.lng ?? 0,
                  },
                },
              }
            : {}),
        },
        include: { person: true, addresses: true },
      })
      .catch((e) => {
        if (e.code === 'P2002') {
          throw new ConflictException(
            this.i18n.t('errors.conflict').replace('{{model}}', 'User'),
          );
        }
        throw e;
      });

    return await this.mapToBasicUserInfoFromUser(user);
  }

  async getAllUsers(pagination: PaginationArgs) {
    const { search, date, startDate, endDate, orderBy } = pagination;

    const dateFilter = date
      ? parseDateToRange(date)
      : startDate && endDate
        ? { gte: startDate, lte: endDate }
        : undefined;

    const where: Prisma.UserWhereInput = {
      isDeleted: false,
      role: Role.CLIENT,
      person: search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : undefined,
      ...(dateFilter && { createdAt: dateFilter }),
    };

    const paginated = await paginatePrisma(
      this.user,
      {
        where,
        include: { person: true },
        orderBy: {
          [orderBy ?? 'createdAt']: 'desc',
        },
      },
      pagination,
    );

    const { data, ...rest } = paginated;
    const dataParsed = await Promise.all(
      data.map(this.mapToBasicUserInfoFromUser),
    );

    return { data: dataParsed, ...rest };
  }

  async getUserById(id: string): Promise<Partial<BasicUserInfo>> {
    const findUser = await this.getRaw({
      where: { id },
      include: { person: true, addresses: true },
    });

    if (!findUser) {
      throw new ForbiddenException(
        this.i18n.t('errors.notFound').replace('{{model}}', 'User'),
      );
    }

    return await this.mapToBasicUserInfoFromUser(findUser);
  }

  async updateUser(
    id: string,
    data: UpdateUserDto,
  ): Promise<Partial<BasicUserInfo>> {
    const { email, person, ...rest } = data;

    if (email) {
      const existingEmailUser = await this.user.findFirst({
        where: {
          id: { not: id },
          isDeleted: false,
          email: await this.cryptoService.decrypt(email),
        },
      });
      if (existingEmailUser) {
        throw new ConflictException(
          this.i18n.t('errors.conflict').replace('{{model}}', 'User'),
        );
      }
    }

    const updateData: Prisma.UserUpdateInput = {
      ...rest,
      ...(email && { email: await this.cryptoService.encrypt(email) }),
      ...(person && {
        person: {
          update: {
            ...person,
          },
        },
      }),
    };

    const updatedUser = await this.user.update({
      where: { id },
      data: updateData,
      include: { person: true },
    });

    return await this.mapToBasicUserInfoFromUser(updatedUser);
  }

  async deleteUser(id: string): Promise<User> {
    const deletedUser = await this.user.update({
      where: { id },
      data: {
        isDeleted: true,
      },
    });
    return deletedUser;
  }

  async changePassword(id: string, body: ResetPasswordDto): Promise<User> {
    const updatedUserPassword = await this.user.update({
      where: { id },
      data: {
        password: await hashPassword(body.password),
      },
    });
    return updatedUserPassword;
  }

  async addressDefaultUpdate(id: string, userId: string) {
    await this.prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
    await this.prisma.address.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  async exchangeCoupon(code: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });

    if (!user) {
      throw new NotFoundException(
        this.i18n.t('errors.notFound').replace('{{model}}', 'Usuario'),
      );
    }

    const coupon = await this.prisma.coupon.findFirst({ where: { code } });

    if (!coupon) {
      throw new NotFoundException(
        this.i18n.t('errors.notFound').replace('{{model}}', 'Cupón'),
      );
    }

    const now = new Date();
    if (coupon.expiresAt < now) {
      throw new BadRequestException(this.i18n.t('errors.couponExpired'));
    }

    if (user.points < coupon.price) {
      const message = this.i18n
        .t('errors.insufficientPoints')
        .replace('{{required}}', String(coupon.price))
        .replace('{{available}}', String(user.points));

      throw new BadRequestException(message);
    }

    const { id, ...couponData } = coupon;
    const newCoupon = await this.prisma.coupon.create({
      data: {
        ...couponData,
        status: CouponStatus.REDEEMED,
        code: generateCustomCode(),
      },
    });

    await this.prisma.userCoupon.create({
      data: { userId, couponId: newCoupon.id, parentCouponId: id },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { points: { decrement: coupon.price } },
    });

    return this.getRaw({ where: { id: userId } });
  }

  async addFavoriteProduct(data: { productId: string }, userId: string) {
    await this.prisma.favoriteProduct
      .create({
        data: {
          product: { connect: { id: data.productId } },
          user: { connect: { id: userId } },
        },
      })
      .catch((e) => {
        if (e.code === 'P2002') {
          throw new ConflictException('El producto ya es favorito');
        }
        throw e;
      });
  }

  async deleteFavoriteProduct(data: { productId: string }, userId: string) {
    await this.prisma.favoriteProduct
      .deleteMany({
        where: {
          productId: data.productId,
          userId,
        },
      })
      .catch((e) => {
        if (e.code === 'P2002') {
          throw new ConflictException('El producto ya es favorito');
        }
        throw e;
      });
  }

  async addAddressByUser(userId: string, data: AddressDto): Promise<Address> {
    const { street, city, province, postalCode, lat, lng } = data;

    const address = await this.prisma.address.create({
      data: {
        street,
        city,
        province,
        postalCode,
        lat: lat ?? 0,
        lng: lng ?? 0,
        user: { connect: { id: userId } },
      },
    });

    return address;
  }

  async deleteAddressByUser(id: string) {
    const address = await this.prisma.address.delete({
      where: { id },
    });
    if (!address) {
      throw new NotFoundException(
        this.i18n.t('errors.notFound').replace('{{model}}', 'Dirección'),
      );
    }
  }

  async updateAddressByUser(
    id: string,
    userId: string,
    data: AddressDto,
  ): Promise<Address> {
    const { street, city, province, postalCode, lat, lng } = data;

    const address = await this.prisma.address.update({
      where: { id, userId },
      data: {
        street,
        city,
        province,
        postalCode,
        lat: lat ?? 0,
        lng: lng ?? 0,
      },
    });

    return address;
  }

  async mapToBasicUserInfoFromUser(
    user: Partial<User> & { person?: Person; addresses?: Address[] },
  ): Promise<Partial<BasicUserInfo>> {
    if (!user) return {};

    const { id, email, role, person, addresses, points } = user;

    return {
      id,
      email,
      role,
      name: person?.name,
      phone: person?.phone,
      cuitOrDni: person?.cuitOrDni,
      points,
      addresses,
    };
  }
}
