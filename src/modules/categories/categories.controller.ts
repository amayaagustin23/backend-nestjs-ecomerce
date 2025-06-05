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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @HasRoles(Role.SUPERADMIN, Role.ADMIN, Role.CLIENT)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Post()
  @ApiOperation({ summary: 'Create one category' })
  @ApiBody({
    description: 'Category with subCategories',
    type: CreateCategoryDto,
  })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Gets a paginated list of all categories',
  })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  getAllCategories(@Query() pagination: PaginationArgs) {
    return this.categoriesService.getAllCategories(pagination);
  }

  @Get('all/out-paginated')
  @ApiOperation({
    summary: 'Gets a paginated list of all categories',
  })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  getAllCategoriesOutPaginated() {
    return this.categoriesService.getAllCategoriesOutPaginated();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a category',
  })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  getCategoryId(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.categoriesService.getCategoryId(id);
  }

  @HasRoles(Role.SUPERADMIN, Role.ADMIN)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Update one category and its subcategories' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({
    description: 'Category with subcategories to update/create/delete',
    type: UpdateCategoryDto,
  })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }
}
