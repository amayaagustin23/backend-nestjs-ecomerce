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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HasRoles } from 'src/common/decorators/has-roles.decorator';
import { PaginationAndProductArgs } from 'src/common/pagination/pagination.interface';
import { Role } from 'src/constants';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { ProductsService } from './products.service';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create one product' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Product creation payload with images',
    type: CreateProductDto,
  })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'files', maxCount: 10 }]))
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files: { files?: Express.Multer.File[] },
  ) {
    return this.productsService.create(createProductDto, files?.files ?? []);
  }

  @Get()
  @ApiOperation({
    summary: 'Gets a paginated list of all products',
  })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  getAllProducts(@Query() pagination: PaginationAndProductArgs) {
    return this.productsService.getAllProducts(pagination);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a product',
  })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  getProductById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productsService.getProductById(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @HasRoles(Role.SUPERADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files'))
  async updateProduct(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.productsService.updateProduct(id, body, files);
  }

  @Get('all/brands')
  @ApiOperation({
    summary: 'Gets all brands',
  })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  getAllBrands() {
    return this.productsService.getAllBrands();
  }

  @Get('variants/colors')
  @ApiOperation({
    summary: 'Gets all variants',
  })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  getUniqueColors() {
    return this.productsService.getUniqueColors();
  }

  @Get('variants/sizes')
  @ApiOperation({
    summary: 'Gets all variants',
  })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  getUniqueSizes() {
    return this.productsService.getUniqueSizes();
  }

  @Get('variants/genders')
  @ApiOperation({
    summary: 'Gets all variants',
  })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  getUniqueGenders() {
    return this.productsService.getUniqueGenders();
  }
}
