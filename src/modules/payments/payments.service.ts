import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CartStatus,
  CouponType,
  OrderStatus,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { MercadopagoService } from 'src/services/mercadopago/mercadopago.service';
import { MessagingService } from 'src/services/messaging/messaging.service';
import { PrismaService } from 'src/services/prisma/prisma.service';

@Injectable()
export class PaymentsService {
  private cart: Prisma.CartDelegate;
  private order: Prisma.OrderDelegate;
  private payment: Prisma.PaymentDelegate;
  private variant: Prisma.ProductVariantDelegate;
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
    this.variant = prisma.productVariant;
  }

  async mercadopagoWebhook(event: any) {
    if (event.type !== 'payment') return;

    const paymentId = event.data.id;

    try {
      const payment = await this.mercadopagoService.getPayment(paymentId);
      const orderId = payment.metadata?.order_id;
      if (!orderId) {
        throw new Error(this.i18n.t('errors.errorsMercadopago.missingOrderId'));
      }

      const order = await this.order.findUnique({
        where: { id: orderId },
        include: {
          payment: true,
          user: { include: { person: true } },
          items: { include: { product: true, variant: true } },
        },
      });

      if (!order) {
        throw new Error(
          this.i18n.t('errors.errorsMercadopago.paymentCompleted'),
        );
      }

      const cart = await this.cart.findFirst({
        where: { userId: order.userId, status: CartStatus.ACTIVE },
        include: { coupon: true, user: true },
      });
      await this.messagingService.sendPaymentStatusEmail({
        status: payment.status,
        from: this.configService.get<string>('EMAIL_SENDER'),
        to: order.user.email,
        user: order.user,
        order,
      });

      switch (payment.status) {
        case 'approved': {
          if (cart) {
            if (cart.coupon) {
              const userCouponFound = await this.prisma.userCoupon.findFirst({
                where: { couponId: cart.couponId, userId: cart.userId },
              });
              if (userCouponFound) {
                await this.prisma.userCoupon.updateMany({
                  where: { couponId: cart.couponId, userId: cart.userId },
                  data: { enabled: false },
                });
              } else {
                if (cart.coupon && cart.coupon.type === CouponType.PROMOTION) {
                  await this.prisma.userCoupon.create({
                    data: {
                      user: { connect: { id: cart.userId } },
                      coupon: { connect: { id: cart.couponId } },
                      enabled: false,
                    },
                  });
                }
              }
            }
            await this.cart.update({
              where: { id: cart.id },
              data: { status: CartStatus.ORDERED },
            });
          }

          await this.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.PAID },
          });

          await this.payment.updateMany({
            where: { orderId },
            data: {
              status: PaymentStatus.APPROVED,
              mpStatus: payment.status,
              mpStatusDetail: payment.status_detail,
              mpPaymentId: payment.id.toString(),
            },
          });

          for (const { variant, quantity, product } of order.items) {
            const current = await this.variant.findUnique({
              where: { id: variant.id },
              select: { stock: true },
            });

            if (!current || current.stock < quantity) {
              console.warn(
                `Stock insuficiente para variante ${variant.id} del producto "${product.name}"`,
              );
              continue;
            }

            await this.variant.update({
              where: { id: variant.id },
              data: { stock: { decrement: quantity } },
            });
          }
          const points = cart.user.points + order.total * 0.05;
          await this.prisma.user.update({
            where: { id: order.userId },
            data: { points },
          });
          return {
            message: this.i18n.t('errors.payments.successfullyProcessed'),
          };
        }

        case 'cancelled': {
          await this.cart.update({
            where: { id: cart.id },
            data: { status: CartStatus.CANCELLED },
          });
          await this.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.CANCELLED },
          });

          await this.payment.updateMany({
            where: { orderId },
            data: {
              status: PaymentStatus.REJECTED,
              mpStatus: payment.status,
              mpStatusDetail: payment.status_detail,
              mpPaymentId: payment.id.toString(),
            },
          });

          return {
            message: this.i18n.t('errors.payments.cancelled'),
          };
        }

        default:
          return {
            message: this.i18n.t('errors.payments.ignoredStatus', {
              args: {
                status: payment.status,
              },
            }),
          };
      }
    } catch (error) {
      return {
        message: this.i18n.t('errors.payments.processingError'),
        error: error.message || error,
      };
    }
  }
}
