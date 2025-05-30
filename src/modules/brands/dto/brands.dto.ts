import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateBrandDto {
  @ApiProperty({ example: 'Adidas' })
  @IsString()
  name: string;

  @ApiProperty({ example: '6-' })
  @IsString()
  code: string;
}

export class UpdateBrandDto extends PartialType(CreateBrandDto) {}
