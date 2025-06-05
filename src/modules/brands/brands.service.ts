import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { paginatePrisma } from 'src/common/pagination';
import { PaginationArgs } from 'src/common/pagination/pagination.interface';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { parseDateToRange } from 'src/utils/parsers';
import { CreateBrandDto, UpdateBrandDto } from './dto/brands.dto';

@Injectable()
export class BrandsService {
  private brand: Prisma.BrandDelegate;
  constructor(
    private prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {
    this.brand = prisma.brand;
  }

  async getRaw<T extends Prisma.BrandFindUniqueArgs>(
    input: Prisma.SelectSubset<T, Prisma.BrandFindUniqueArgs>,
  ) {
    input.where = {
      ...input.where,
    };
    return this.brand.findUnique<T>(input);
  }

  async create(body: CreateBrandDto) {
    return await this.brand.create({ data: body }).catch((e) => {
      if (e.code === 'P2002') {
        throw new ConflictException(
          this.i18n.t('errors.conflict', { args: { model: 'Brand' } }),
        );
      }
      throw e;
    });
  }

  async getBrandAll(pagination: PaginationArgs) {
    const { search, date, startDate, endDate } = pagination;

    const dateFilter = date
      ? parseDateToRange(date)
      : startDate && endDate
        ? { gte: startDate, lte: endDate }
        : undefined;

    const where: Prisma.BrandWhereInput = {
      ...(search && {
        name: { contains: search, mode: 'insensitive' },
      }),
      ...(dateFilter && { createdAt: dateFilter }),
    };
    const prismaArgs = {
      where,
    };

    if (pagination.page && pagination.size) {
      return await paginatePrisma(this.brand, prismaArgs, pagination);
    } else {
      return await this.brand.findMany(prismaArgs);
    }
  }

  async getBrandId(id: string) {
    const brand = await this.getRaw({
      where: { id },
    });

    if (!brand) {
      throw new ForbiddenException(
        this.i18n.t('errors.notFound', { args: { model: 'Brand' } }),
      );
    }

    return brand;
  }

  async update(id: string, body: UpdateBrandDto) {
    return await this.brand.update({ where: { id }, data: body }).catch((e) => {
      if (e.code === 'P2002') {
        throw new ConflictException(
          this.i18n.t('errors.conflict', { args: { model: 'Brand' } }),
        );
      }
      throw e;
    });
  }

  async deleteBrandId(id: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: { products: true },
    });

    if (!brand) {
      throw new NotFoundException(
        await this.i18n.translate('notFound', { args: { model: 'Brand' } }),
      );
    }

    if (brand.products.length) {
      throw new ConflictException(
        await this.i18n.translate('conflict', { args: { model: 'Brand' } }),
      );
    }

    await this.prisma.brand.delete({ where: { id } });

    return { message: await this.i18n.translate('translations.deleted') };
  }
}
