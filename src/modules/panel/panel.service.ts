import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { paginatePrisma } from 'src/common/pagination';
import { PaginationArgs } from 'src/common/pagination/pagination.interface';
import { PrismaService } from 'src/services/prisma/prisma.service';

@Injectable()
export class PanelService {
  constructor(
    private prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}
  async dashboard() {
    const ordersCountPaid = await this.prisma.order.count({
      where: { status: OrderStatus.PAID },
    });
    const usersCount = await this.prisma.user.count({
      where: { isDeleted: false },
    });
    const productsCount = await this.prisma.product.count();

    const productsMostSold = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    const productIds = productsMostSold.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, price: true },
    });

    const productsMostSoldWithDetails = productsMostSold.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return {
        id: product?.id,
        name: product?.name,
        price: product?.price,
        totalSold: item._sum.quantity ?? 0,
      };
    });

    const couponsMostUsed = await this.prisma.userCoupon.groupBy({
      by: ['parentCouponId'],
      _count: {
        parentCouponId: true,
      },
      orderBy: {
        _count: {
          parentCouponId: 'desc',
        },
      },
      take: 5,
      where: {
        parentCouponId: {
          not: null,
        },
      },
    });
    const parentCouponIds = couponsMostUsed.map((c) => c.parentCouponId);

    const coupons = await this.prisma.coupon.findMany({
      where: {
        id: { in: parentCouponIds },
      },
      select: {
        id: true,
        description: true,
        code: true,
      },
    });
    const result = couponsMostUsed.map((c) => {
      const couponInfo = coupons.find((cp) => cp.id === c.parentCouponId);
      return {
        id: couponInfo?.id,
        description: couponInfo?.description,
        code: couponInfo?.code,
        total: c._count.parentCouponId,
      };
    });
    const orderListForDaysRaw = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PAID,
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const orderCountByDate: Record<string, number> = {};

    orderListForDaysRaw.forEach((item) => {
      const date = item.createdAt.toLocaleDateString('sv-SE', {
        timeZone: 'America/Argentina/Buenos_Aires',
      });
      orderCountByDate[date] = (orderCountByDate[date] || 0) + 1;
    });

    const orderListForDays = Object.entries(orderCountByDate).map(
      ([date, count]) => ({
        date,
        count,
      }),
    );

    const cartsByStatus = await this.prisma.cart.groupBy({
      by: ['status'],
      _count: { status: true },
    });
    const cartStatusReport = cartsByStatus.map((item) => ({
      status: item.status,
      count: item._count.status,
    }));

    const paymentsByStatus = await this.prisma.payment.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });
    const paymentStatusReport = paymentsByStatus.map((item) => ({
      status: item.status,
      count: item._count.status,
    }));

    return {
      ordersCountPaid,
      usersCount,
      productsCount,
      productsMostSoldWithDetails,
      couponsMostUsed: result,
      orderListForDays,
      cartStatusReport,
      paymentStatusReport,
    };
  }

  async findAllOrders(pagination: PaginationArgs) {
    return await paginatePrisma(
      this.prisma.order,
      {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              person: {
                select: {
                  name: true,
                },
              },
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  category: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
              variant: {
                select: {
                  id: true,
                  size: true,
                  color: true,
                  gender: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      pagination,
    );
  }
}
