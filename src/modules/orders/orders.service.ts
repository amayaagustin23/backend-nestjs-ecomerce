import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CartStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  ShippingStatus,
  ShippingType,
} from '@prisma/client';
import * as moment from 'moment';
import { I18nService } from 'nestjs-i18n';
import { MercadopagoService } from 'src/services/mercadopago/mercadopago.service';
import { MessagingService } from 'src/services/messaging/messaging.service';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CreateOrderDto } from './dto/order.dto';

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
    private readonly configService: ConfigService,
  ) {
    this.cart = prisma.cart;
    this.order = prisma.order;
    this.payment = prisma.payment;
  }

  async createOrderFromCart(
    body: CreateOrderDto,
    cartId: string,
    userId: string,
  ) {
    const { address, shippingCost, estimatedDeliveryDate } = body;
    const cart = await this.cart.findUnique({
      where: {
        id: cartId,
        OR: [
          { status: CartStatus.ACTIVE },
          { status: CartStatus.PENDING_PAYMENT },
          { status: CartStatus.PAYMENT_FAILED },
          { status: CartStatus.ABANDONED },
        ],
      },
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
      throw new NotFoundException(this.i18n.t('errors.carts.cartOrdered'));
    }
    await this.cart.update({
      where: { id: cartId },
      data: { status: CartStatus.PENDING_PAYMENT },
    });

    if (cart.items.length === 0) {
      throw new BadRequestException(
        this.i18n.t('errors.validations.cartEmpty') as string,
      );
    }

    const validItems = cart.items.filter((item) => {
      return item.variant.stock > 0 && item.variant.stock >= item.quantity;
    });

    if (validItems.length === 0) {
      throw new BadRequestException(
        (this.i18n.t('errors.stockUnavailable') as string).replace(
          '{{items}}',
          cart.items.map((item) => item.product.name).join(', '),
        ),
      );
    }

    const couponPercentage = cart.coupon?.value ?? 0;

    const orderItems = validItems.map((item) => {
      const unitPrice = item.product.price;
      const discount = +(unitPrice * (couponPercentage / 100)).toFixed(2);
      const finalPrice = +(unitPrice - discount).toFixed(2);

      return {
        quantity: item.quantity,
        unitPrice,
        discount,
        finalPrice,
        product: { connect: { id: item.productId } },
        variant: { connect: { id: item.variantId } },
      };
    });

    const subtotal = orderItems.reduce(
      (acc, item) => acc + item.finalPrice * item.quantity,
      0,
    );

    const total = subtotal + shippingCost;
    const { trackingNumber, trackingUrl } = this.generateTrackingData(cartId);
    const order = await this.order.create({
      data: {
        ...(cart.couponId
          ? { coupon: { connect: { id: cart.couponId } } }
          : undefined),
        user: { connect: { id: userId } },
        items: { create: orderItems },
        subtotal,
        shippingCost,
        total,
        shippingInfo: {
          create: {
            estimatedDeliveryDate,
            trackingUrl,
            trackingNumber,
            address: { connect: { id: address } },
            type: ShippingType.CORREO,
            status: ShippingStatus.PREPARANDO,
          },
        },
      },
      include: {
        user: { include: { person: true } },
        items: {
          include: {
            product: true,
            variant: {
              include: {
                color: true,
                size: true,
              },
            },
          },
        },
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
        cartId,
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

    await this.messagingService.sendPaymentStatusEmail({
      status: 'pending',
      from: this.configService.get<string>('EMAIL_SENDER'),
      to: order.user.email,
      user: order.user,
      order,
    });

    return {
      order,
      preferenceUrl: preference.init_point,
    };
  }

  async findAll(id: string) {
    return await this.order.findMany({
      where: { user: { id } },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
                brand: true,
              },
            },
            variant: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return await this.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
                brand: true,
              },
            },
            variant: true,
          },
        },
      },
    });
  }

  async calculateShipping(destinationZip: string) {
    let shippingCost = 0;
    let deliveryDays = 0;

    const ecommerceConfigwithAddress =
      await this.prisma.ecommerceConfig.findFirst({
        include: { address: true },
      });

    console.log(ecommerceConfigwithAddress.address);

    if (
      ecommerceConfigwithAddress &&
      ecommerceConfigwithAddress.address &&
      ecommerceConfigwithAddress.address.postalCode.slice(0, 1) ===
        destinationZip.slice(0, 1)
    ) {
      shippingCost = 1000;
      deliveryDays = 2;
    } else if (
      ecommerceConfigwithAddress &&
      ecommerceConfigwithAddress.address &&
      Math.abs(
        Number(ecommerceConfigwithAddress.address.postalCode) -
          Number(destinationZip),
      ) < 1000
    ) {
      shippingCost = 1500;
      deliveryDays = 4;
    } else {
      shippingCost = 2000;
      deliveryDays = 7;
    }

    const estimatedDeliveryDate = moment().add(deliveryDays, 'days').toDate();

    return { shippingCost, estimatedDeliveryDate };
  }

  generateTrackingData(cartId: string) {
    const now = new Date();

    const datePart = `${now.getFullYear()}${(now.getMonth() + 1)
      .toString()
      .padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;

    const cartPart = cartId.slice(0, 6).toUpperCase();

    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();

    const trackingNumber = `TRK-${datePart}-${cartPart}-${randomPart}`;
    const trackingUrl = `https://seguimiento.fake/envio/${trackingNumber}`;

    return { trackingNumber, trackingUrl };
  }
}
