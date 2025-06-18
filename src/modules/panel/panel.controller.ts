import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
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
}
