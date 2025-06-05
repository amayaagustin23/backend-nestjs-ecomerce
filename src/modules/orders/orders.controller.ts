import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetCurrentUser } from 'src/common/decorators/get-current-user.decorator';
import { HasRoles } from 'src/common/decorators/has-roles.decorator';
import { Role } from 'src/constants';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @HasRoles(Role.CLIENT)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Post('cart/:id')
  @ApiOperation({ summary: 'Create one order by cart' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @HttpCode(HttpStatus.CREATED)
  create(@Param('id') id: string, @GetCurrentUser('userId') userId: string) {
    return this.ordersService.createOrderFromCart(id, userId);
  }

  @HasRoles(Role.CLIENT)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Get()
  @ApiOperation({ summary: 'Get orders' })
  @ApiResponse({ status: 200, description: 'Get orders' })
  @HttpCode(HttpStatus.OK)
  findAll(@GetCurrentUser('userId') userId: string) {
    return this.ordersService.findAll(userId);
  }

  @HasRoles(Role.CLIENT)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get orders' })
  @ApiResponse({ status: 200, description: 'Get orders' })
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }
}
