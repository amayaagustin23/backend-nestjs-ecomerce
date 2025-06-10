import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CartStatus, Prisma } from '@prisma/client';
import * as moment from 'moment';
import { I18nService } from 'nestjs-i18n';
import { MessagingService } from 'src/services/messaging/messaging.service';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CreateCartDto, UpdateCartDto } from './dto/carts.dto';

@Injectable()
export class CartsService {
  private cart: Prisma.CartDelegate;
  private variant: Prisma.ProductVariantDelegate;
  private cartItem: Prisma.CartItemDelegate;
  constructor(
    private prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly messagingService: MessagingService,
  ) {
    this.cart = prisma.cart;
    this.cartItem = prisma.cartItem;
    this.variant = prisma.productVariant;
  }

  async getRaw<T extends Prisma.CartFindUniqueArgs>(
    input: Prisma.SelectSubset<T, Prisma.CartFindUniqueArgs>,
  ) {
    input.where = {
      ...input.where,
    };
    input.include = {
      coupon: true,
      items: { include: { product: true, variant: true } },
    };

    return await this.cart.findUnique(input);
  }

  async get(input: { where: Prisma.CartWhereInput }) {
    const { where } = input;
    const cart = await this.cart.findFirst({
      where: { ...where },
      include: {
        coupon: true,
        items: { include: { product: true, variant: true } },
      },
    });
    if (!cart) return undefined;
    return cart;
  }

  async create(body: CreateCartDto, userId: string) {
    if (body.couponCode) {
      const coupon = await this.prisma.coupon.findUnique({
        where: { code: body.couponCode },
      });

      if (!coupon) {
        throw new NotFoundException(
          this.i18n.t('errors.notFound').replace('{{model}}', 'Cupón'),
        );
      }

      if (coupon.expiresAt < new Date()) {
        throw new ConflictException(this.i18n.t('errors.CouponExpired'));
      }

      const userCoupon = await this.prisma.userCoupon.findFirst({
        where: {
          userId,
          couponId: coupon.id,
          enabled: true,
        },
      });

      if (!userCoupon) {
        throw new ConflictException(this.i18n.t('errors.couponAlreadyClaimed'));
      }
    }

    const existCartActiveByUser = await this.get({
      where: { user: { id: userId }, status: CartStatus.ACTIVE },
    });

    if (existCartActiveByUser) {
      throw new ConflictException(
        this.i18n.t('errors.conflict').replace('{{model}}', 'Cart'),
      );
    }

    const notAdded: string[] = [];

    const variants = await this.variant.findMany({
      where: {
        id: { in: body.items.map((item) => item.variantId) },
      },
      select: {
        id: true,
        stock: true,
        product: {
          select: {
            id: true,
            price: true,
            name: true,
          },
        },
      },
    });

    const validItems = body.items.filter((item) => {
      const variant = variants.find((v) => v.id === item.variantId);
      const isValid =
        variant && variant.stock > 0 && variant.stock >= item.quantity;
      if (!isValid) {
        notAdded.push(variant?.product?.name || `variant:${item.variantId}`);
      }
      return isValid;
    });

    if (validItems.length === 0) {
      return {
        cart: null,
        error: this.i18n
          .t('errors.stockUnavailable')
          .replace('{{items}}', notAdded.join(', ')),
      };
    }

    const couponPercentage = 0;

    const data: Prisma.CartCreateInput = {
      user: { connect: { id: userId } },
      ...(body.couponCode && {
        coupon: { connect: { code: body.couponCode } },
      }),
      items: {
        create: validItems.map((item) => {
          const variant = variants.find((v) => v.id === item.variantId);
          const product = variant!.product;
          const unitPrice = product.price;
          const discount = +(unitPrice * (couponPercentage / 100)).toFixed(2);
          const finalPrice = +(unitPrice - discount).toFixed(2);

          return {
            unitPrice,
            discount,
            finalPrice,
            quantity: item.quantity,
            product: { connect: { id: product.id } },
            variant: { connect: { id: item.variantId } },
          };
        }),
      },
    };

    try {
      const cart = await this.cart.create({ data });

      return {
        cart,
        error: notAdded.length
          ? this.i18n
              .t('errors.stockUnavailable')
              .replace('{{items}}', notAdded.join(', '))
          : '',
      };
    } catch (e) {
      if (e.code === 'P2002') {
        throw new ConflictException(
          this.i18n.t('errors.conflict').replace('{{model}}', 'Cart'),
        );
      }
      throw e;
    }
  }

  async getCartByUser(userId: string) {
    const where: Prisma.CartWhereInput = {
      userId,
      status: CartStatus.ACTIVE,
    };
    return await this.cart.findFirst({
      where,
      include: {
        coupon: true,
        items: {
          include: {
            product: {
              include: {
                category: true,
                brand: true,
              },
            },
            variant: { include: { images: true } },
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateCartDto, userId: string) {
    const existingCart = await this.cart.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, coupon: true },
    });

    if (!existingCart || existingCart.userId !== userId) {
      throw new NotFoundException(
        (this.i18n.t('notFound') as string).replace('{{model}}', 'Cart'),
      );
    }

    const { itemsToAdd, itemsToUpdate, itemsToDelete, couponCode } = dto;

    const notAdded: string[] = [];

    let newCoupon = existingCart.coupon;
    if (couponCode === 'null') {
      await this.cart.update({
        where: { id },
        data: { coupon: { disconnect: true } },
      });
    } else if (couponCode && couponCode !== 'null') {
      const coupon = await this.prisma.coupon.findUnique({
        where: { code: couponCode },
      });

      if (!coupon) {
        throw new NotFoundException(
          (this.i18n.t('errors.notFound') as string).replace(
            '{{model}}',
            'Cupón',
          ),
        );
      }

      if (coupon.expiresAt < new Date()) {
        throw new ConflictException(this.i18n.t('errors.CouponExpired'));
      }

      const userCoupon = await this.prisma.userCoupon.findFirst({
        where: {
          userId,
          couponId: coupon.id,
          enabled: true,
        },
      });

      if (!userCoupon) {
        throw new ConflictException(this.i18n.t('errors.couponAlreadyClaimed'));
      }

      await this.cart.update({
        where: { id },
        data: {
          coupon: { connect: { id: coupon.id } },
        },
      });

      newCoupon = coupon;
    }

    const couponValue = newCoupon?.value || 0;

    // Eliminar items
    if (itemsToDelete?.length) {
      await this.cartItem.deleteMany({
        where: { id: { in: itemsToDelete } },
      });
    }

    // Actualizar items existentes
    if (itemsToUpdate?.length) {
      const existingItems = await this.cartItem.findMany({
        where: { id: { in: itemsToUpdate.map((i) => i.id) } },
        include: { product: true },
      });

      await Promise.all(
        itemsToUpdate.map(async (item) => {
          const existing = existingItems.find((i) => i.id === item.id);
          if (!existing) return;

          const unitPrice = existing.product.price;
          const discount = +(unitPrice * (couponValue / 100)).toFixed(2);
          const finalPrice = +(unitPrice - discount).toFixed(2);

          await this.cartItem.update({
            where: { id: item.id },
            data: { quantity: item.quantity, unitPrice, discount, finalPrice },
          });
        }),
      );
    }

    // Agregar nuevos items
    if (itemsToAdd?.length) {
      const variants = await this.prisma.productVariant.findMany({
        where: {
          id: { in: itemsToAdd.map((item) => item.variantId) },
        },
        include: {
          product: true,
        },
      });

      for (const item of itemsToAdd) {
        const variant = variants.find((v) => v.id === item.variantId);

        if (!variant || variant.stock <= 0 || variant.stock < item.quantity) {
          notAdded.push(variant?.product?.name || `variant:${item.variantId}`);
          continue;
        }

        const unitPrice = variant.product.price;
        const discount = +(unitPrice * (couponValue / 100)).toFixed(2);
        const finalPrice = +(unitPrice - discount).toFixed(2);

        await this.cartItem.create({
          data: {
            quantity: item.quantity,
            unitPrice,
            discount,
            finalPrice,
            cart: { connect: { id } },
            product: { connect: { id: item.productId } },
            variant: { connect: { id: item.variantId } },
          },
        });
      }
    }

    // 💡 Si solo llegó couponCode, recalcular los items actuales
    if (
      couponCode &&
      !itemsToAdd?.length &&
      !itemsToUpdate?.length &&
      !itemsToDelete?.length
    ) {
      await Promise.all(
        existingCart.items.map(async (item) => {
          const unitPrice = item.product.price;
          const discount = +(unitPrice * (couponValue / 100)).toFixed(2);
          const finalPrice = +(unitPrice - discount).toFixed(2);

          await this.cartItem.update({
            where: { id: item.id },
            data: { unitPrice, discount, finalPrice },
          });
        }),
      );
    }

    return {
      cart: await this.cart.findUnique({
        where: { id },
        include: { items: true, coupon: true },
      }),
      error: notAdded.length
        ? (this.i18n.t('errors.stockUnavailable') as string).replace(
            '{{items}}',
            notAdded.join(', '),
          )
        : '',
    };
  }

  async getVerifyStockCart(id: string) {
    const cart = await this.cart.findUnique({
      where: { id },
      include: { items: { include: { product: true, variant: true } } },
    });

    const itemsCart = [];
    const recomendationMap = new Map<string, any>();

    for (const item of cart.items) {
      const { variant, quantity } = item;

      const recomendations = await this.prisma.product.findMany({
        where: {
          category: { id: item.product.categoryId },
          variants: {
            some: {
              OR: [{ sizeId: variant.sizeId }, { colorId: variant.colorId }],
            },
          },
        },
        include: { variants: true, category: true, brand: true },
      });

      if (variant.stock >= quantity) {
        itemsCart.push(item);
      } else {
        itemsCart.push({
          ...item,
          error: `El producto ${item.product.name} no cuenta con stock suficiente`,
        });
      }

      for (const rec of recomendations) {
        recomendationMap.set(rec.id, rec);
      }
    }

    return {
      ...cart,
      items: itemsCart,
      recomendations: Array.from(recomendationMap.values()),
    };
  }

  @Cron('*/30 * * * *')
  async sendNotificationsByCartActive() {
    const thirtyMinutesAgo = moment().subtract(30, 'minutes').toDate();

    const cartsByActive = await this.cart.findMany({
      where: {
        status: CartStatus.ACTIVE,
        createdAt: { lt: thirtyMinutesAgo },
      },
      include: {
        user: { include: { person: true } },
      },
    });

    for (const { user } of cartsByActive) {
      await this.messagingService.sendNotificationCartActive({
        from: 'no-reply@tusitio.com',
        to: user.email,
        user,
      });
    }
  }

  @Cron('0 3 * * *')
  async disabledCarts() {
    const oneDayAgo = moment().subtract(24, 'hours').toDate();
    const where: Prisma.CartWhereInput = {
      status: CartStatus.ACTIVE,
      createdAt: { lt: oneDayAgo },
    };
    const cartsByActive = await this.cart.findMany({
      where,
    });
    for (const cart of cartsByActive) {
      await this.cart.update({
        where: { id: cart.id },
        data: { status: CartStatus.ABANDONED },
      });
    }
  }
}
