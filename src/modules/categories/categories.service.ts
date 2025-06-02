import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import {
  CategoryParsed,
  CategoryRaw,
} from 'src/common/interfaces/index.interface';
import { paginatePrisma } from 'src/common/pagination';
import { PaginationArgs } from 'src/common/pagination/pagination.interface';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { parseDateToRange } from 'src/utils/parsers';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  private category: Prisma.CategoryDelegate;
  constructor(
    private prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {
    this.category = prisma.category;
  }

  async getRaw<T extends Prisma.CategoryFindUniqueArgs>(
    input: Prisma.SelectSubset<T, Prisma.CategoryFindUniqueArgs>,
  ) {
    input.where = {
      ...input.where,
    };
    return this.category.findUnique<T>(input);
  }

  async create(body: CreateCategoryDto) {
    const { subcategories, ...rest } = body;
    const category = await this.category
      .create({ data: { ...rest } })
      .catch((e) => {
        if (e.code === 'P2002') {
          throw new ConflictException(
            this.i18n.t('errors.conflict', { args: { model: 'Category' } }),
          );
        }
        throw e;
      });
    const subCategoriesList = subcategories?.length
      ? await Promise.all(
          subcategories.map(async ({ name, description }) => ({
            name,
            description,
            parent: { connect: { id: category.id } },
          })),
        )
      : [];
    const subCategoriesParsed = [];
    for (const data of subCategoriesList) {
      const sub = await this.category.create({ data });
      subCategoriesParsed.push(sub);
    }
    return { ...category, subcategories: subCategoriesParsed };
  }

  async getAllCategories(pagination: PaginationArgs) {
    const { search, date, startDate, endDate } = pagination;

    const dateFilter = date
      ? parseDateToRange(date)
      : startDate && endDate
        ? { gte: startDate, lte: endDate }
        : undefined;

    const where: Prisma.CategoryWhereInput = {
      ...(search && {
        OR: [
          {
            name: { contains: search, mode: 'insensitive' },
          },
          {
            description: { contains: search, mode: 'insensitive' },
          },
        ],
      }),
      parent: null,
      ...(dateFilter && { createdAt: dateFilter }),
    };

    const prismaArgs = {
      where,
      include: { children: true },
    };

    if (pagination) {
      const paginated = await paginatePrisma(
        this.category,
        prismaArgs,
        pagination,
      );
      const { data, ...rest } = paginated;

      return {
        data: this.parseCategories(data),
        ...rest,
      };
    } else {
      const results = await this.category.findMany(prismaArgs);
      return this.parseCategories(results);
    }
  }

  async getCategoryId(id: string) {
    const category = await this.getRaw({
      where: { id },
      include: {
        children: true,
      },
    });

    if (!category) {
      throw new ForbiddenException(
        this.i18n.t('errors.notFound', { args: { model: 'Category' } }),
      );
    }

    return await this.transformCategory(category);
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const { name, description, subcategories, subcategoriesToDelete } = dto;

    const categoryUsed = await this.prisma.product.findFirst({
      where: { categoryId: id },
      select: { id: true },
    });

    if (categoryUsed) {
      throw new BadRequestException(
        await this.i18n.t('errors.conflict', {
          args: { model: 'Categoría' },
        }),
      );
    }

    await this.prisma.category.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
      },
    });

    if (subcategoriesToDelete?.length) {
      await this.prisma.category.deleteMany({
        where: {
          id: { in: subcategoriesToDelete },
          parentId: id,
        },
      });
    }

    if (subcategories?.length) {
      const operations = subcategories.map((sub) => {
        if (sub.id) {
          return this.prisma.category.update({
            where: { id: sub.id },
            data: {
              name: sub.name,
              description: sub.description,
            },
          });
        } else {
          return this.prisma.category.create({
            data: {
              name: sub.name,
              description: sub.description,
              parentId: id,
            },
          });
        }
      });

      await Promise.all(operations);
    }

    return {
      message: await this.i18n.t('translations.updated', {
        args: { model: 'Categoría' },
      }),
    };
  }

  private parseCategories(data: CategoryRaw[]): CategoryParsed[] {
    return data
      .filter((cat) => cat.parentId === null)
      .map((cat) => this.transformCategory(cat));
  }

  private transformCategory(cat: CategoryRaw): CategoryParsed {
    return {
      id: cat.id,
      name: cat.name,
      description: cat.description,
      subcategories: (cat.children || []).map((child) =>
        this.transformCategory(child),
      ),
    };
  }
}
