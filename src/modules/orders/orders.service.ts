import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { MercadopagoService } from 'src/services/mercadopago/mercadopago.service';
import { MessagingService } from 'src/services/messaging/messaging.service';
import { PrismaService } from 'src/services/prisma/prisma.service';

@Injectable()
export class OrdersService {
  private cart: Prisma.CartDelegate;
  private order: Prisma.OrderDelegate;
  private payment: Prisma.PaymentDelegate;
  constructor(
    private prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly messagingService: MessagingService,
    private readonly mercadopagoService: MercadopagoService,
  ) {
    this.cart = prisma.cart;
    this.order = prisma.order;
    this.payment = prisma.payment;
  }
  async createOrderFromCart(cartId: string, userId: string) {
    const cart = await this.cart.findUnique({
      where: { id: cartId },
      include: {
        coupon: true,
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    if (!cart) {
      throw new NotFoundException(
        this.i18n.t('errors.notFound', { args: { model: 'Carrito' } }),
      );
    }

    if (cart.items.length === 0) {
      throw new BadRequestException(
        this.i18n.t('errors.validations.cartEmpty'),
      );
    }

    const validItems = cart.items.filter((item) => {
      return item.variant.stock > 0 && item.variant.stock >= item.quantity;
    });

    if (validItems.length === 0) {
      throw new BadRequestException(
        this.i18n
          .t('errors.stockUnavailable')
          .replace(
            '{{items}}',
            cart.items.map((item) => item.product.name).join(', '),
          ),
      );
    }

    const couponPercentage = cart.coupon?.value ?? 0;

    const orderItems = validItems.map((item) => {
      const unitPrice = item.product.price;
      const discount = unitPrice * (couponPercentage / 100);
      const finalPrice = +(unitPrice - discount).toFixed(2);

      return {
        quantity: item.quantity,
        unitPrice: finalPrice,
        product: { connect: { id: item.productId } },
        variant: { connect: { id: item.variantId } },
      };
    });

    const subtotal = orderItems.reduce(
      (acc, item) => acc + item.unitPrice * item.quantity,
      0,
    );

    const shippingCost = 1500;
    const total = subtotal + shippingCost;

    const order = await this.order.create({
      data: {
        user: { connect: { id: userId } },
        items: { create: orderItems },
        subtotal,
        shippingCost,
        total,
      },
      include: {
        items: { include: { product: true, variant: true } },
      },
    });

    const preference = await this.mercadopagoService.createPreference({
      orderId: order.id,
      amount: total,
      metadata: {
        orderId: order.id,
        userId,
        total,
        subtotal,
        shippingCost,
        couponValue: couponPercentage,
      },
    });

    await this.payment.create({
      data: {
        order: { connect: { id: order.id } },
        user: { connect: { id: userId } },
        method: PaymentMethod.MERCADOPAGO,
        status: PaymentStatus.PENDING,
        amount: total,
        mpPreferenceId: preference.id,
        mpExternalReference: preference.external_reference ?? order.id,
        mpPaymentId: null,
        mpStatus: null,
        mpStatusDetail: null,
      },
    });

    return {
      order,
      preferenceUrl: preference.init_point,
    };
  }

  findAll() {
    return `This action returns all orders`;
  }

  findOne(id: number) {
    return `This action returns a #${id} order`;
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }
}
