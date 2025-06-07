import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

class CreateProductImageDto {
  @ApiProperty({ example: '1', description: 'Orden de aparición de la imagen' })
  @IsNumber()
  order: number;

  @ApiProperty({ example: 'Vista frontal del producto', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateProductDto {
  @ApiProperty({
    example: 'Remera Oversize',
    description: 'Nombre del producto',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Remera oversize de algodón 100%',
    description: 'Descripción del producto',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 5999.99, description: 'Precio del producto' })
  @IsNumber()
  price: number;

  @ApiProperty({
    example: 5999.99,
    description: 'Precio de lista del producto',
  })
  @IsNumber()
  priceList: number;

  @ApiProperty({ example: false, description: 'Si es un servicio o no' })
  @IsString()
  isService: string;

  @ApiProperty({
    example: true,
    description: 'Estado del producto',
    required: false,
  })
  @IsOptional()
  @IsString()
  isActive?: string;

  @ApiProperty({
    example: true,
    description: 'Si tiene entrega o no',
    required: false,
  })
  @IsOptional()
  @IsString()
  hasDelivery?: string;

  @ApiProperty({
    example: 'b2c48b32-32c9-4e91-b6b6-4fdaef47f954',
    description: 'ID de la categoría',
  })
  @IsUUID()
  categoryId: string;

  @ApiProperty({
    example: 'b2c48b32-32c9-4e91-b6b6-4fdaef47f954',
    description: 'ID de la marca',
  })
  @IsUUID()
  brandId: string;

  @IsOptional()
  @IsString()
  variants?: string;

  @ApiProperty({
    type: [CreateProductImageDto],
    description: 'Información adicional de las imágenes',
    required: false,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateProductImageDto)
  images?: CreateProductImageDto[];
}

export class UpdateProductVariantDto {
  @ApiProperty({ example: 'uuid', description: 'ID del variant (si existe)' })
  @IsUUID()
  @IsOptional()
  id?: string;

  @ApiProperty({ example: 'M' })
  @IsString()
  size: string;

  @ApiProperty({ example: 'Negro' })
  @IsString()
  color: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  stock: number;

  @ApiProperty({
    example: true,
    required: false,
    description: 'Si se debe eliminar esta variante',
  })
  @IsOptional()
  @IsBoolean()
  delete?: boolean;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  isService?: string;

  @IsOptional()
  isActive?: string;

  @IsOptional()
  hasDelivery?: string;

  @IsOptional()
  @IsString()
  variants?: string;

  @IsOptional()
  @IsString()
  variantsToUpdate?: string;

  @IsOptional()
  @IsString()
  variantsToDelete?: string;

  @IsOptional()
  @IsString()
  imagesToDelete?: string;
}
