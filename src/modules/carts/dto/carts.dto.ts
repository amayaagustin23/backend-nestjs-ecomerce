import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateCartItemDto {
  @ApiProperty({ example: 'product-uuid' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 'product-variant-uuid' })
  @IsUUID()
  variantId: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateCartDto {
  @ApiProperty({
    type: [CreateCartItemDto],
    description: 'Listado de productos en el carrito',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCartItemDto)
  items: CreateCartItemDto[];

  @ApiProperty()
  @IsOptional()
  @IsString()
  couponCode: string;
}
export class UpdateCartItemQuantityDto {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  quantity: number;
}

export class NewCartItemDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty()
  @IsUUID()
  variantId: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  quantity: number;
}

export class UpdateCartDto {
  @ApiProperty({ type: [UpdateCartItemQuantityDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateCartItemQuantityDto)
  itemsToUpdate?: UpdateCartItemQuantityDto[];

  @ApiProperty({ type: [NewCartItemDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NewCartItemDto)
  itemsToAdd?: NewCartItemDto[];

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  itemsToDelete?: string[];
}
