import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Person, Prisma, Role, User } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { BasicUserInfo } from 'src/common/interfaces/index.interface';
import { paginatePrisma } from 'src/common/pagination';
import { PaginationArgs } from 'src/common/pagination/pagination.interface';
import { CryptoService } from 'src/services/crypto/crypto.service';
import { parseDateToRange } from 'src/utils/parsers';
import { hashPassword } from 'src/utils/password';
import { MessagingService } from '../../services/messaging/messaging.service';
import { PrismaService } from '../../services/prisma/prisma.service';
import {
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
      include: { person: true },
    });
    if (!user) return undefined;
    return user;
  }

  async registerUserClient(
    body: RegisterUserDto,
  ): Promise<Partial<BasicUserInfo>> {
    const { email, password, person } = body;

    const passwordHashed = await hashPassword(password);

    const existingActiveUser = await this.get({
      where: {
        email,
        isDeleted: false,
      },
    });

    if (existingActiveUser) {
      throw new ConflictException(
        this.i18n.t('errors.conflict', { args: { model: 'User' } }),
      );
    }

    const user = await this.user
      .create({
        data: {
          email,
          password: passwordHashed,
          person: {
            create: { ...person },
          },
        },
        include: { person: true },
      })
      .catch((e) => {
        if (e.code === 'P2002') {
          throw new ConflictException(
            this.i18n.t('errors.conflict', { args: { model: 'User' } }),
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
      include: { person: true },
    });

    if (!findUser) {
      throw new ForbiddenException(
        this.i18n.t('errors.notFound', { args: { model: 'User' } }),
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
          this.i18n.t('errors.conflict', { args: { model: 'User' } }),
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

  async mapToBasicUserInfoFromUser(
    user: Partial<User> & { person?: Person },
  ): Promise<Partial<BasicUserInfo>> {
    if (!user) return {};
    const { id, email, role, person } = user;
    return {
      id,
      email,
      role,
      name: person?.name,
      phone: person?.phone,
      cuitOrDni: person?.cuitOrDni,
    };
  }
}
