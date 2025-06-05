import { Injectable, NotFoundException } from '@nestjs/common';
import { CouponStatus, CouponType } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CreateCouponDto, UpdateCouponDto } from './dto/coupon.dto';

@Injectable()
export class CouponsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async create(createCouponDto: CreateCouponDto) {
    return this.prisma.coupon.create({
      data: createCouponDto,
    });
  }

  async findAll() {
    return this.prisma.coupon.findMany();
  }

  async findOne(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });

    if (!coupon) {
      throw new NotFoundException(
        this.i18n.t('errors.notFound').replace('{{model}}', 'Cupón'),
      );
    }

    return coupon;
  }

  async update(id: string, updateCouponDto: UpdateCouponDto) {
    const existing = await this.prisma.coupon.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException(
        this.i18n.t('errors.notFound').replace('{{model}}', 'Cupón'),
      );
    }

    return this.prisma.coupon.update({
      where: { id },
      data: updateCouponDto,
    });
  }

  async remove(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });

    if (!coupon) {
      throw new NotFoundException(
        this.i18n.t('errors.notFound').replace('{{model}}', 'Cupón'),
      );
    }

    return this.prisma.coupon.delete({ where: { id } });
  }

  async findGeneralByType(type: CouponType) {
    return this.prisma.coupon.findMany({
      where: {
        type,
        status: CouponStatus.ACTIVE,
      },
    });
  }

  async findUserCoupons(userId: string) {
    const coupons = await this.prisma.userCoupon.findMany({
      where: { userId, coupon: { status: CouponStatus.REDEEMED } },
      include: { coupon: true },
    });
    return coupons.map(({ coupon }) => coupon);
  }
}
