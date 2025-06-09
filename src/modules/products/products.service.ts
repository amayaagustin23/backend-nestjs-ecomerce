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

  async create(body: CreateProductDto, files?: Express.Multer.File[]) {
    const { variants: variantsRaw, categoryId, brandId, ...rest } = body;
    let variants = [];

    if (variantsRaw) {
      try {
        variants = JSON.parse(variantsRaw as unknown as string);
      } catch (e) {
        throw new BadRequestException('Formato de variantes inválido');
      }
    }

    const imageInputs = files?.length
      ? await Promise.all(
          files.map(async (file, index) => ({
            url: await this.uploadService.upload(file),
            order: index,
          })),
        )
      : [];

    const product = await this.product
      .create({
        data: {
          ...rest,
          isService: toBoolean(rest.isService),
          isActive: toBoolean(rest.isActive),
          hasDelivery: toBoolean(rest.hasDelivery),
          category: {
            connect: { id: categoryId },
          },
          brand: {
            connect: { id: brandId },
          },
          variants: variants?.length
            ? {
                create: variants.map((variant) => ({
                  size: variant.size
                    ? { connect: { id: variant.size } }
                    : undefined,
                  color: variant.color
                    ? { connect: { id: variant.color } }
                    : undefined,
                  stock: variant.stock,
                  gender: variant.gender,
                  images: variant.image
                    ? {
                        create: [
                          {
                            url: variant.image,
                            order: 0,
                            type: 'PRODUCT',
                          },
                        ],
                      }
                    : imageInputs.length
                      ? {
                          create: imageInputs.map((img) => ({
                            ...img,
                            type: 'PRODUCT',
                          })),
                        }
                      : undefined,
                })),
              }
            : undefined,
          images: imageInputs.length
            ? {
                create: imageInputs.map((img) => ({
                  ...img,
                  type: 'PRODUCT',
                })),
              }
            : undefined,
        },
        include: {
          variants: {
            include: { images: true },
          },
          images: true,
          category: { include: { children: true } },
          brand: true,
        },
      })
      .catch((e) => {
        if (e.code === 'P2002') {
          throw new ConflictException(
            this.i18n.t('errors.conflict', { args: { model: 'Product' } }),
          );
        }
        throw e;
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
            include: { color: true, size: true, gender: true, images: true },
          },
          images: true,
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
          include: { color: true, size: true, gender: true, images: true },
        },
        images: true,
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
      variantsToDelete,
      imagesToDelete,
      variantsToUpdate,
      categoryId,
      brandId,
      ...rest
    } = body;

    let parsedVariants: UpdateProductVariantDto[] = [];
    let parsedVariantsToDelete: string[] = [];
    let parsedImagesToDelete: string[] = [];
    let parsedVariantsToUpdate: UpdateProductVariantDto[] = [];

    try {
      parsedVariants = variants ? JSON.parse(variants) : [];
      parsedVariantsToDelete = variantsToDelete
        ? JSON.parse(variantsToDelete)
        : [];
      parsedVariantsToUpdate = variantsToUpdate
        ? JSON.parse(variantsToUpdate)
        : [];
      parsedImagesToDelete = imagesToDelete ? JSON.parse(imagesToDelete) : [];
    } catch (error) {
      throw new BadRequestException(
        this.i18n.t('errors.conflict', { args: { model: 'Product' } }),
      );
    }

    const newImages =
      files && files.length
        ? await Promise.all(
            files.map(async (file, index) => ({
              url: await this.uploadService.upload(file),
              order: index,
              description: '',
              type: ImageType.VARIANT,
            })),
          )
        : [];

    const product = await this.product.findUnique({
      where: { id },
      include: {
        variants: true,
        images: true,
      },
    });

    if (!product) {
      throw new ConflictException(
        this.i18n.t('errors.conflict', { args: { model: 'Product' } }),
      );
    }

    const updatedProduct = await this.product
      .update({
        where: { id },
        data: {
          ...rest,
          isService: toBoolean(rest.isService),
          isActive: toBoolean(rest.isActive),
          hasDelivery: toBoolean(rest.hasDelivery),
          ...(categoryId && { categoryId }),
          ...(brandId && { brandId }),
          images: newImages.length
            ? {
                create: newImages,
              }
            : undefined,
        },
        include: {
          variants: true,
          images: true,
          brand: true,
          category: { include: { parent: true } },
        },
      })
      .catch((e) => {
        if (e.code === 'P2002') {
          throw new ConflictException(
            this.i18n.t('errors.conflict', { args: { model: 'Produ' } }),
          );
        }
        throw e;
      });
    if (parsedVariantsToUpdate.length) {
      for (const variant of parsedVariantsToUpdate) {
        const { id, size, color, gender, ...rest } = variant;
        await this.prisma.productVariant.update({
          where: { id },
          data: {
            ...rest,
            ...(size && {
              size: { connect: { id: size } },
            }),
            ...(color && {
              color: { connect: { id: color } },
            }),
            ...(gender && {
              gender: { connect: { id: gender } },
            }),
          },
        });
      }
    }
    if (parsedVariantsToDelete.length) {
      await this.prisma.productVariant.deleteMany({
        where: {
          id: {
            in: parsedVariantsToDelete,
          },
          productId: id,
        },
      });
    }

    for (const variant of parsedVariants) {
      if (variant.id) {
        await this.prisma.productVariant
          .update({
            where: { id: variant.id },
            data: {
              size: variant.size
                ? { connect: { id: variant.size } }
                : undefined,
              color: variant.color
                ? { connect: { id: variant.color } }
                : undefined,
              stock: variant.stock,
            },
          })
          .catch((e) => {
            if (e.code === 'P2002') {
              throw new ConflictException(
                this.i18n.t('errors.conflict', { args: { model: 'Variant' } }),
              );
            }
            throw e;
          });
      } else {
        await this.prisma.productVariant
          .create({
            data: {
              size: variant.size
                ? { connect: { id: variant.size } }
                : undefined,
              color: variant.color
                ? { connect: { id: variant.color } }
                : undefined,
              stock: variant.stock,
              gender: variant.gender
                ? { connect: { id: variant.gender } }
                : undefined,
              product: { connect: { id } },
            },
          })
          .catch((e) => {
            if (e.code === 'P2002') {
              throw new ConflictException(
                this.i18n.t('errors.conflict', { args: { model: 'Variante' } }),
              );
            }
            throw e;
          });
      }
    }

    if (parsedImagesToDelete.length) {
      await this.prisma.image.deleteMany({
        where: {
          id: {
            in: parsedImagesToDelete,
          },
          productId: id,
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
        images: true,
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
        images: true,
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
    if (product.images.length) {
      await this.prisma.image.deleteMany({
        where: { productId: id },
      });
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
