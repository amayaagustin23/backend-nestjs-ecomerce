import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CouponType } from '@prisma/client';
import { GetCurrentUser } from 'src/common/decorators/get-current-user.decorator';
import { HasRoles } from 'src/common/decorators/has-roles.decorator';
import { Role } from 'src/constants';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CouponsService } from './coupons.service';

@ApiTags('Coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todos los cupones del sistema' })
  @HttpCode(HttpStatus.OK)
  findAll() {
    return this.couponsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene un cupón por ID' })
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.couponsService.findOne(id);
  }

  @Get('general/exchange')
  @ApiOperation({ summary: 'Lista cupones generales de tipo EXCHANGE' })
  @HttpCode(HttpStatus.OK)
  getGeneralExchangeCoupons() {
    return this.couponsService.findGeneralByType(CouponType.EXCHANGE_POINT);
  }

  @Get('general/promotion')
  @ApiOperation({ summary: 'Lista cupones generales de tipo PROMOTION' })
  @HttpCode(HttpStatus.OK)
  getGeneralPromotionCoupons() {
    return this.couponsService.findGeneralByType(CouponType.PROMOTION);
  }

  @HasRoles(Role.CLIENT)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Get('my/coupons')
  @ApiOperation({ summary: 'Lista los cupones del usuario autenticado' })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  getUserCoupons(@GetCurrentUser('userId') userId: string) {
    return this.couponsService.findUserCoupons(userId);
  }
}
