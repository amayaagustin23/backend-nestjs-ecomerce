import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateBrandDto {
  @ApiProperty({ example: 'Adidas' })
  @IsString()
  name: string;
}

export class UpdateBrandDto extends PartialType(CreateBrandDto) {}
