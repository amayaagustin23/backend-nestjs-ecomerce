import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Category 1' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Description category 1' })
  @IsString()
  description: string;

  @ApiProperty({
    type: [CreateCategoryDto],
    description: 'Lista de subcategorías',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCategoryDto)
  subcategories?: CreateCategoryDto[];
}

class SubcategoryDto {
  @ApiPropertyOptional({ example: 'Subcategoría actualizada' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ example: 'Remeras' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Ropa de torso' })
  @IsString()
  description: string;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Ropa' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Categoría de ropa y accesorios' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    type: [SubcategoryDto],
    description: 'Subcategorías nuevas o actualizadas',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubcategoryDto)
  subcategories?: SubcategoryDto[];

  @ApiPropertyOptional({
    type: [String],
    description: 'IDs de subcategorías a eliminar',
    example: ['f9c8b5e4-67b2-4b9c-84b2-xxxxxxxxxxxx'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  subcategoriesToDelete?: string[];
}
