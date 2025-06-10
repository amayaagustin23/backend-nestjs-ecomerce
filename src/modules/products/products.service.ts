import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import {
  Brand,
  Category,
  FavoriteProduct,
  Image,
  ImageType,
  Prisma,
  Product,
  ProductVariant,
} from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { ParsedProduct } from 'src/common/interfaces/index.interface';
import { paginatePrisma } from 'src/common/pagination';
import { PaginationAndProductArgs } from 'src/common/pagination/pagination.interface';
import { UploadService } from 'src/services/aws/aws.service';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { parseDateToRange, parseSortBy, toBoolean } from 'src/utils/parsers';
import {
  CreateProductDto,
  UpdateProductDto,
  UpdateProductVariantDto,
} from './dto/product.dto';

@Injectable()
export class ProductsService {
  private product: Prisma.ProductDelegate;
  constructor(
    private prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly uploadService: UploadService,
  ) {
    this.product = prisma.product;
  }

  async getRaw<T extends Prisma.ProductFindUniqueArgs>(
    input: Prisma.SelectSubset<T, Prisma.ProductFindUniqueArgs>,
  ) {
    input.where = {
      ...input.where,
      isActive: true,
    };
    return this.product.findUnique<T>(input);
  }

  async create(body: CreateProductDto, files: Express.Multer.File[] = []) {
    const { variants: variantsRaw, categoryId, brandId, ...rest } = body;

    let variants: any[] = [];
    const imagesGroupedByVariant: Record<string, Prisma.ImageCreateInput[]> =
      {};
    const productImages: Prisma.ImageCreateInput[] = [];

    if (variantsRaw) {
      try {
        variants = JSON.parse(variantsRaw as unknown as string);
      } catch (e) {
        throw new BadRequestException('Formato de variantes inválido');
      }
    }

    for (const file of files) {
      const fieldname = file.fieldname;
      const url = await this.uploadService.upload(file);
      const image: Prisma.ImageCreateInput = {
        url,
        order: 0,
        description: '',
        type: ImageType.VARIANT,
      };

      const match = fieldname.match(/^variantImages-(temp-\d+)$/);
      if (match) {
        const tempId = match[1];
        if (!imagesGroupedByVariant[tempId]) {
          imagesGroupedByVariant[tempId] = [];
        }
        imagesGroupedByVariant[tempId].push(image);
      } else {
        productImages.push({ ...image, type: ImageType.PRODUCT });
      }
    }

    const product = await this.prisma.product.create({
      data: {
        ...rest,
        isService: toBoolean(rest.isService),
        isActive: toBoolean(rest.isActive),
        hasDelivery: toBoolean(rest.hasDelivery),
        category: { connect: { id: categoryId } },
        brand: { connect: { id: brandId } },
        variants: {
          create: variants.map((variant) => {
            const { stock, size, color, gender, tempId } = variant;

            return {
              stock,
              ...(size && {
                size: {
                  connect: { id: typeof size === 'string' ? size : size.id },
                },
              }),
              ...(color && {
                color: {
                  connect: { id: typeof color === 'string' ? color : color.id },
                },
              }),
              ...(gender && {
                gender: {
                  connect: {
                    id: typeof gender === 'string' ? gender : gender.id,
                  },
                },
              }),
              images:
                imagesGroupedByVariant[tempId]?.length > 0
                  ? {
                      create: imagesGroupedByVariant[tempId],
                    }
                  : undefined,
            };
          }),
        },
      },
      include: {
        variants: { include: { images: true } },
        category: { include: { children: true } },
        brand: true,
      },
    });

    return this.mapToParsedProduct(product);
  }

  async getAllProducts(pagination: PaginationAndProductArgs, userId?: string) {
    const {
      search,
      date,
      startDate,
      endDate,
      orderBy,
      categoryIds,
      category,
      brandIds,
      minPrice,
      maxPrice,
      variantsName,
    } = pagination;

    const dateFilter = date
      ? parseDateToRange(date)
      : startDate && endDate
        ? { gte: startDate, lte: endDate }
        : undefined;

    const min = minPrice !== undefined ? Number(minPrice) : undefined;
    const max = maxPrice !== undefined ? Number(maxPrice) : undefined;

    const priceFilter =
      min !== undefined || max !== undefined
        ? {
            ...(min !== undefined && { gte: min }),
            ...(max !== undefined && { lte: max }),
          }
        : undefined;

    const parsedCategoryIds = categoryIds?.split(',') ?? [];
    const parsedBrandIds = brandIds?.split(',') ?? [];
    const parsedVariants =
      variantsName
        ?.split(',')
        .map((v) => v.trim())
        .filter((v) => v) ?? [];

    const where: Prisma.ProductWhereInput = {
      ...(search && {
        name: { contains: search, mode: 'insensitive' },
      }),

      ...(dateFilter && { createdAt: dateFilter }),

      ...(priceFilter && { price: priceFilter }),

      ...(parsedCategoryIds.length > 0 && {
        OR: [
          {
            category: {
              id: { in: parsedCategoryIds },
            },
          },
          {
            category: {
              parent: {
                id: { in: parsedCategoryIds },
              },
            },
          },
        ],
      }),

      ...(category && {
        OR: [
          {
            category: {
              name: { contains: category, mode: 'insensitive' },
            },
          },
          {
            category: {
              parent: {
                name: { contains: category, mode: 'insensitive' },
              },
            },
          },
        ],
      }),

      ...(parsedBrandIds.length > 0 && { brandId: { in: parsedBrandIds } }),

      ...(parsedVariants.length > 0 && {
        OR: [
          {
            variants: {
              some: {
                stock: { gt: 0 },
                color: { id: { in: parsedVariants } },
              },
            },
          },
          {
            variants: {
              some: {
                stock: { gt: 0 },
                size: { id: { in: parsedVariants } },
              },
            },
          },
          {
            variants: {
              some: {
                stock: { gt: 0 },
                gender: { id: { in: parsedVariants } },
              },
            },
          },
        ],
      }),
    };
    const paginated = await paginatePrisma(
      this.product,
      {
        where,
        include: {
          ...(userId && { favoritedBy: true }),
          variants: {
            where: { isDeleted: false },
            include: { color: true, size: true, gender: true, images: true },
          },
          category: { include: { children: true } },
          brand: true,
        },
        orderBy: parseSortBy(orderBy),
      },
      pagination,
    );

    const { data, ...rest } = paginated;
    const dataParsed = await Promise.all(data.map(this.mapToParsedProduct));

    return { data: dataParsed, ...rest };
  }

  async getProductById(id: string): Promise<ParsedProduct> {
    const productId = await this.getRaw({
      where: { id },
      include: {
        favoritedBy: true,
        variants: {
          where: { isDeleted: false },
          include: { color: true, size: true, gender: true, images: true },
        },
        category: { include: { children: true } },
        brand: true,
      },
    });

    if (!productId) {
      throw new ForbiddenException(
        this.i18n.t('errors.notFound', { args: { model: 'Product' } }),
      );
    }

    return await this.mapToParsedProduct(productId);
  }

  async updateProduct(
    id: string,
    body: UpdateProductDto,
    files?: Express.Multer.File[],
  ) {
    const {
      variants,
      variantsToUpdate,
      variantsToDelete,
      imagesToDelete,
      categoryId,
      brandId,
      ...rest
    } = body;

    let parsedVariants: UpdateProductVariantDto[] = [];
    let parsedVariantsToUpdate: UpdateProductVariantDto[] = [];
    let parsedVariantsToDelete: string[] = [];
    let parsedImagesToDelete: string[] = [];

    try {
      parsedVariants = variants ? JSON.parse(variants) : [];
      parsedVariantsToUpdate = variantsToUpdate
        ? JSON.parse(variantsToUpdate)
        : [];
      parsedVariantsToDelete = variantsToDelete
        ? JSON.parse(variantsToDelete)
        : [];
      parsedImagesToDelete = imagesToDelete ? JSON.parse(imagesToDelete) : [];
    } catch (error) {
      throw new BadRequestException(
        this.i18n.t('errors.conflict', { args: { model: 'Product' } }),
      );
    }

    const imagesGroupedByVariant: Record<string, Prisma.ImageCreateInput[]> =
      {};

    for (const file of files || []) {
      const variantId = file.originalname.split('__')[0];
      const url = await this.uploadService.upload(file);
      const image = {
        url,
        order: 0,
        description: '',
        type: ImageType.VARIANT,
      };

      if (!imagesGroupedByVariant[variantId]) {
        imagesGroupedByVariant[variantId] = [];
      }

      imagesGroupedByVariant[variantId].push(image);
    }

    const product = await this.product.findUnique({
      where: { id },
      include: {
        variants: true,
      },
    });

    if (!product) {
      throw new ConflictException(
        this.i18n.t('errors.conflict', { args: { model: 'Product' } }),
      );
    }

    const updatedProduct = await this.product.update({
      where: { id },
      data: {
        ...rest,
        isService: toBoolean(rest.isService),
        isActive: toBoolean(rest.isActive),
        hasDelivery: toBoolean(rest.hasDelivery),
        ...(categoryId && { categoryId }),
        ...(brandId && { brandId }),
      },
      include: {
        variants: true,
        brand: true,
        category: { include: { parent: true } },
      },
    });

    for (const variant of parsedVariantsToUpdate) {
      const { id: variantId, stock, size, color, gender } = variant;

      await this.prisma.productVariant.update({
        where: { id: variantId },
        data: {
          stock,
          ...(size && {
            size: {
              connect: { id: typeof size === 'string' ? size : size.id },
            },
          }),
          ...(color && {
            color: {
              connect: { id: typeof color === 'string' ? color : color.id },
            },
          }),
          ...(gender && {
            gender: {
              connect: { id: typeof gender === 'string' ? gender : gender.id },
            },
          }),
        },
      });

      if (imagesGroupedByVariant[variantId]?.length) {
        await this.prisma.image.createMany({
          data: imagesGroupedByVariant[variantId].map((img) => ({
            ...img,
            variantId,
          })),
        });
      }
    }

    for (const variant of parsedVariants) {
      const { stock, size, color, gender, tempId } = variant as any;

      const createdVariant = await this.prisma.productVariant.create({
        data: {
          stock,
          ...(size && {
            size: {
              connect: { id: typeof size === 'string' ? size : size.id },
            },
          }),
          ...(color && {
            color: {
              connect: { id: typeof color === 'string' ? color : color.id },
            },
          }),
          ...(gender && {
            gender: {
              connect: { id: typeof gender === 'string' ? gender : gender.id },
            },
          }),
          product: { connect: { id } },
        },
      });

      if (imagesGroupedByVariant[tempId]?.length) {
        await this.prisma.image.createMany({
          data: imagesGroupedByVariant[tempId].map((img) => ({
            ...img,
            variantId: createdVariant.id,
          })),
        });
      }
    }

    if (parsedVariantsToDelete.length) {
      await this.prisma.productVariant.updateMany({
        where: {
          id: { in: parsedVariantsToDelete },
          productId: id,
        },
        data: {
          isDeleted: true,
        },
      });
    }

    if (parsedImagesToDelete.length) {
      await this.prisma.image.deleteMany({
        where: {
          id: { in: parsedImagesToDelete },
        },
      });
    }

    return this.mapToParsedProduct(updatedProduct);
  }

  async getUniqueSizes() {
    const sizes = await this.prisma.size.findMany();
    return sizes;
  }
  async getUniqueColors() {
    const colors = await this.prisma.color.findMany();
    return colors;
  }

  async getUniqueGenders() {
    const genders = await this.prisma.gender.findMany();
    return genders;
  }

  async getAllBrands() {
    return await this.prisma.brand.findMany();
  }

  async getAllFavorites(userId: string): Promise<ParsedProduct[]> {
    const productsFavorites = await this.prisma.product.findMany({
      take: 4,
      where: {
        favoritedBy: {
          some: { userId },
        },
      },
      include: {
        favoritedBy: true,
        variants: true,
        category: {
          include: {
            children: true,
          },
        },
        brand: true,
      },
    });

    return productsFavorites.map((p) => this.mapToParsedProduct(p));
  }

  async deleteProductById(id: string) {
    const product = await this.product.findUnique({
      where: { id },
      include: {
        variants: true,
      },
    });
    if (!product) {
      throw new ForbiddenException(
        this.i18n.t('errors.notFound', { args: { model: 'Product' } }),
      );
    }
    if (product.variants.length) {
      throw new BadRequestException(
        this.i18n.t('errors.conflict', { args: { model: 'Product' } }),
      );
    }

    await this.prisma.image.deleteMany({
      where: { productId: id },
    });
    await this.prisma.product.update({
      where: { id },
      data: { isDeleted: false },
    });
  }

  private mapToParsedProduct(
    product: Product & {
      favoritedBy?: FavoriteProduct[];
      category?: Category & {
        children?: Category[];
      };
      brand?: Brand | null;
      variants?: ProductVariant[];
      images?: Image[];
    },
  ): ParsedProduct {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      isService: product.isService,
      isActive: product.isActive,
      hasDelivery: product.hasDelivery,
      isFavorite: !!product.favoritedBy?.length,
      category: product.category
        ? {
            id: product.category.id,
            name: product.category.name,
            subcategories:
              product.category.children?.map((sub) => ({
                id: sub.id,
                name: sub.name,
              })) ?? [],
          }
        : null,
      brand: product.brand
        ? {
            id: product.brand.id,
            name: product.brand.name,
          }
        : null,
      variants: product.variants,
    };
  }
}
