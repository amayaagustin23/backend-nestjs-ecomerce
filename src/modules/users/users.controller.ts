import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetCurrentUser } from 'src/common/decorators/get-current-user.decorator';
import { HasRoles } from 'src/common/decorators/has-roles.decorator';
import { PaginationArgs } from 'src/common/pagination/pagination.interface';
import { Role } from 'src/constants';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AddressDto, UpdateUserDto } from './dto/user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @HasRoles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Get()
  @ApiOperation({
    summary: 'Gets a paginated list of all users',
  })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  getAllUsers(@Query() pagination: PaginationArgs) {
    return this.usersService.getAllUsers(pagination);
  }

  @HasRoles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Gets a user by its ID' })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  getUserById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.usersService.getUserById(id);
  }

  @HasRoles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Updates an existing user' })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  updateUser(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() data: UpdateUserDto,
  ) {
    return this.usersService.updateUser(id, data);
  }

  @HasRoles(Role.CLIENT)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Patch('address/default/:id')
  @ApiOperation({ summary: 'Updates an existing user' })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  addressDefaultUpdate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @GetCurrentUser('userId') userId: string,
  ) {
    return this.usersService.addressDefaultUpdate(id, userId);
  }

  @HasRoles(Role.CLIENT)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Patch('address/create')
  @ApiOperation({ summary: 'Updates an existing user' })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  addAddressByUser(
    @GetCurrentUser('userId') userId: string,
    @Body() data: AddressDto,
  ) {
    return this.usersService.addAddressByUser(userId, data);
  }

  @HasRoles(Role.CLIENT)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Patch('address/delete/:id')
  @ApiOperation({ summary: 'Updates an existing user' })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  deleteAddressByUser(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.usersService.deleteAddressByUser(id);
  }

  @HasRoles(Role.CLIENT)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Patch('address/update/:id')
  @ApiOperation({ summary: 'Updates an existing user' })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  updateAddressByUser(
    @Param('id', new ParseUUIDPipe()) id: string,
    @GetCurrentUser('userId') userId: string,
    @Body() data: AddressDto,
  ) {
    return this.usersService.updateAddressByUser(id, userId, data);
  }

  @HasRoles(Role.CLIENT)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Patch('exchange-coupon-points/:code')
  @ApiOperation({ summary: 'Updates an existing user' })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  exchangeCoupon(
    @Param('code') code: string,
    @GetCurrentUser('userId') userId: string,
  ) {
    return this.usersService.exchangeCoupon(code, userId);
  }

  @HasRoles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Deletes a user' })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  deleteUser(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.usersService.deleteUser(id);
  }

  @HasRoles(Role.CLIENT)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Patch('add/product')
  @ApiOperation({ summary: 'Updates an existing user' })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  addFavoriteProduct(
    @Body() data: { productId: string },
    @GetCurrentUser('userId') userId: string,
  ) {
    return this.usersService.addFavoriteProduct(data, userId);
  }

  @HasRoles(Role.CLIENT)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Patch('delete/product')
  @ApiOperation({ summary: 'Updates an existing user' })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  deleteFavoriteProduct(
    @Body() data: { productId: string },
    @GetCurrentUser('userId') userId: string,
  ) {
    return this.usersService.deleteFavoriteProduct(data, userId);
  }
}
