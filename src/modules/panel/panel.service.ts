import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { paginatePrisma } from 'src/common/pagination';
import { PaginationArgs } from 'src/common/pagination/pagination.interface';
import { ExcelService } from 'src/services/excel/excel.service';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { formatDate } from 'src/utils/parsers';

@Injectable()
export class PanelService {
  constructor(
    private prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly excelService: ExcelService,
  ) {}

  async dashboard() {
    const [orderItems, ordersCountPaid, usersCount, productsCount] =
      await Promise.all([
        this.prisma.orderItem.findMany({
          where: { order: { status: OrderStatus.PAID } },
          include: { product: true },
        }),
        this.prisma.order.count({ where: { status: OrderStatus.PAID } }),
        this.prisma.user.count({ where: { isDeleted: false } }),
        this.prisma.product.count(),
      ]);

    // --- Ganancias e ingresos ---
    let totalProfit = 0;
    let totalRevenue = 0;
    const profitsByProduct: Record<string, number> = {};

    orderItems.forEach((item) => {
      const revenue = item.unitPrice * item.quantity;
      const cost = item.product.priceList * item.quantity;
      const profit = revenue - cost;

      totalProfit += profit;
      totalRevenue += revenue;

      profitsByProduct[item.productId] =
        (profitsByProduct[item.productId] || 0) + profit;
    });

    const averageOrderValue =
      ordersCountPaid > 0 ? totalRevenue / ordersCountPaid : 0;

    // --- Recompradores ---
    const repeatBuyers = await this.prisma.order.groupBy({
      by: ['userId'],
      where: { status: OrderStatus.PAID },
      _count: { userId: true },
      having: { userId: { _count: { gt: 1 } } },
    });
    const repeatPurchaseRate =
      usersCount > 0 ? repeatBuyers.length / usersCount : 0;
    const customerLifetimeValue = averageOrderValue * repeatPurchaseRate;

    // --- Productos más vendidos ---
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

    // --- Productos más rentables ---
    const topProfitableProducts = Object.entries(profitsByProduct)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([productId, profit]) => {
        const product = products.find((p) => p.id === productId);
        return {
          id: product?.id,
          name: product?.name,
          profit,
        };
      });

    // --- Cupones más usados ---
    const couponsMostUsed = await this.prisma.userCoupon.groupBy({
      by: ['parentCouponId'],
      _count: { parentCouponId: true },
      orderBy: { _count: { parentCouponId: 'desc' } },
      take: 5,
      where: { parentCouponId: { not: null } },
    });

    const parentCouponIds = couponsMostUsed.map((c) => c.parentCouponId);
    const coupons = await this.prisma.coupon.findMany({
      where: { id: { in: parentCouponIds } },
      select: { id: true, description: true, code: true },
    });

    const couponsUsedReport = couponsMostUsed.map((c) => {
      const coupon = coupons.find((cp) => cp.id === c.parentCouponId);
      return {
        id: coupon?.id,
        description: coupon?.description,
        code: coupon?.code,
        total: c._count.parentCouponId,
      };
    });

    // --- Órdenes por día ---
    const orderListForDaysRaw = await this.prisma.order.findMany({
      where: { status: OrderStatus.PAID },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const orderCountByDate: Record<string, number> = {};
    orderListForDaysRaw.forEach((item) => {
      const date = formatDate(item.createdAt);
      orderCountByDate[date] = (orderCountByDate[date] || 0) + 1;
    });

    const orderListForDays = Object.entries(orderCountByDate).map(
      ([date, count]) => ({
        date,
        count,
      }),
    );

    // --- Estado de carritos y pagos ---
    const [cartsByStatus, paymentsByStatus] = await Promise.all([
      this.prisma.cart.groupBy({ by: ['status'], _count: { status: true } }),
      this.prisma.payment.groupBy({ by: ['status'], _count: { status: true } }),
    ]);

    const cartStatusReport = cartsByStatus.map((item) => ({
      status: item.status,
      count: item._count.status,
    }));

    const paymentStatusReport = paymentsByStatus.map((item) => ({
      status: item.status,
      count: item._count.status,
    }));

    return {
      kpis: {
        totalProfit,
        totalRevenue,
        ordersCountPaid,
        usersCount,
        productsCount,
        averageOrderValue,
        repeatPurchaseRate,
        customerLifetimeValue,
      },
      reports: {
        orderListForDays,
        cartStatusReport,
        paymentStatusReport,
      },
      highlights: {
        productsMostSoldWithDetails,
        topProfitableProducts,
        couponsMostUsed: couponsUsedReport,
      },
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

  async findOrderByUserId(userId: string) {
    return await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        person: true,
        addresses: true,
        orders: {
          include: {
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
                  },
                },
              },
            },
            payment: true,
            shippingInfo: true,
          },
        },
      },
    });
  }

  async createProductsWithExcel(buffer: Buffer) {
    const products = await this.excelService.readExcel(buffer);
    console.log(products);
  }
}
