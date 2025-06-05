import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetCurrentUser } from 'src/common/decorators/get-current-user.decorator';
import { HasRoles } from 'src/common/decorators/has-roles.decorator';
import { Role } from 'src/constants';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CartsService } from './carts.service';
import { CreateCartDto, UpdateCartDto } from './dto/carts.dto';

@ApiTags('Carts')
@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @HasRoles(Role.CLIENT)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Post()
  @ApiOperation({ summary: 'Create one cart' })
  @ApiBody({
    description: 'Brand',
    type: CreateCartDto,
  })
  @ApiResponse({ status: 201, description: 'Cart created successfully' })
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createCartDto: CreateCartDto,
    @GetCurrentUser('userId') userId: string,
  ) {
    return this.cartsService.create(createCartDto, userId);
  }

  @HasRoles(Role.CLIENT)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get one cart by id' })
  @ApiResponse({
    status: 201,
    description: 'Get one cart by id successfully',
  })
  @HttpCode(HttpStatus.OK)
  getOneById(@Param('id') id: string) {
    return this.cartsService.getRaw({ where: { id } });
  }

  @HasRoles(Role.CLIENT)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Get()
  @ApiOperation({ summary: 'Get all cart by user' })
  @ApiResponse({
    status: 201,
    description: 'Get one cart by id successfully',
  })
  @HttpCode(HttpStatus.OK)
  getCartByUser(@GetCurrentUser('userId') userId: string) {
    return this.cartsService.getCartByUser(userId);
  }

  @HasRoles(Role.CLIENT)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Get('verify/:id')
  @ApiOperation({ summary: 'Get verify stock by cart' })
  @ApiResponse({
    status: 200,
    description: 'Get verify stock by cart',
  })
  @HttpCode(HttpStatus.OK)
  getVerifyStockCart(@Param('id') id: string) {
    return this.cartsService.getVerifyStockCart(id);
  }

  @HasRoles(Role.CLIENT)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Update cart items' })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  updateCart(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCartDto: UpdateCartDto,
    @GetCurrentUser('userId') userId: string,
  ) {
    return this.cartsService.update(id, updateCartDto, userId);
  }
}
