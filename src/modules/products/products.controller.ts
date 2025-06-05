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
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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
import { Request } from 'express';
import { GetCurrentUser } from 'src/common/decorators/get-current-user.decorator';
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
  constructor(
    private readonly productsService: ProductsService,
    private readonly jwtService: JwtService,
  ) {}

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
  @HttpCode(HttpStatus.OK)
  getAllProducts(
    @Query() pagination: PaginationAndProductArgs,
    @Req() req: Request,
  ) {
    const token = req.cookies?.access_token;

    let userId: string | undefined;

    if (token) {
      const payload = this.jwtService.decode(token) as { id: string };
      userId = payload?.id;
    }

    return this.productsService.getAllProducts(pagination, userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a product',
  })
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

  @Get('favortes/user')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @HasRoles(Role.CLIENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files'))
  async getAllFavorites(@GetCurrentUser('userId') userId: string) {
    return this.productsService.getAllFavorites(userId);
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

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @HasRoles(Role.SUPERADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a product' })
  async deleteProductById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productsService.deleteProductById(id);
  }
}
