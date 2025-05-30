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
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HasRoles } from 'src/common/decorators/has-roles.decorator';
import { PaginationArgs } from 'src/common/pagination/pagination.interface';
import { Role } from 'src/constants';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BrandService } from './brand.service';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto';

@ApiTags('Brands')
@Controller('brands')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @HasRoles(Role.SUPERADMIN, Role.ADMIN, Role.CLIENT)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Post()
  @ApiOperation({ summary: 'Create one category' })
  @ApiBody({
    description: 'Brand',
    type: CreateBrandDto,
  })
  @ApiResponse({ status: 201, description: 'Brand created successfully' })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createBrandDto: CreateBrandDto) {
    return this.brandService.create(createBrandDto);
  }

  @HasRoles(Role.SUPERADMIN, Role.ADMIN, Role.CLIENT)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Get()
  @ApiOperation({
    summary: 'Gets a paginated list of all brand',
  })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  getBrandAll(@Query() pagination: PaginationArgs) {
    return this.brandService.getBrandAll(pagination);
  }

  @HasRoles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Get(':id')
  @ApiOperation({
    summary: 'Get a brand',
  })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  getBrandId(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.brandService.getBrandId(id);
  }

  @HasRoles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Update one brand' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({
    description: 'brand to update',
    type: UpdateBrandDto,
  })
  @ApiResponse({ status: 200, description: 'Brand updated successfully' })
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdateBrandDto,
  ) {
    return this.brandService.update(id, body);
  }

  @HasRoles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a brand',
  })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  deleteBrandId(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.brandService.deleteBrandId(id);
  }
}
