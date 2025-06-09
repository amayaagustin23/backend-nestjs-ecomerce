import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { HasRoles } from 'src/common/decorators/has-roles.decorator';
import { PaginationArgs } from 'src/common/pagination/pagination.interface';
import { Role } from 'src/constants';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PanelService } from './panel.service';

@ApiTags('Panel')
@Controller('panel')
export class PanelController {
  constructor(private readonly panelService: PanelService) {}

  @HasRoles(Role.ADMIN)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Get('dashboard')
  findDashboard() {
    return this.panelService.dashboard();
  }

  @HasRoles(Role.ADMIN)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Get('orders')
  findAllOrders(@Query() pagination: PaginationArgs) {
    return this.panelService.findAllOrders(pagination);
  }

  @HasRoles(Role.ADMIN)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Get('users-order/:id')
  findUserById(@Param('id') id: string) {
    return this.panelService.findOrderByUserId(id);
  }

  @HasRoles(Role.ADMIN)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Post('upload/products')
  @UseInterceptors(FileInterceptor('file'))
  async createProductsWithExcel(@UploadedFile() file: Express.Multer.File) {
    const data = await this.panelService.createProductsWithExcel(file.buffer);
    return data;
  }
}
