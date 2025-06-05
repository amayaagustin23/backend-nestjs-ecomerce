import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CouponStatus, CouponType } from '@prisma/client';
import { IsDate, IsEnum, IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateCouponDto {
  @ApiProperty({
    example: 'Descuento del 20% en compras mayores a $10.000',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: 20,
    description: 'Valor del cupón (porcentaje o monto, según tu lógica)',
  })
  @IsInt()
  value: number;

  @ApiProperty({
    example: 150,
    description: 'Costo en puntos para canjear el cupón',
  })
  @IsInt()
  price: number;

  @ApiProperty({
    enum: CouponType,
    example: CouponType.EXCHANGE_POINT,
    description: 'Tipo de cupón',
  })
  @IsEnum(CouponType)
  type: CouponType;

  @ApiProperty({
    example: 'PRIMAVERA2025',
    description: 'Código único del cupón',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    enum: CouponStatus,
    example: CouponStatus.ACTIVE,
    description: 'Estado del cupón',
  })
  @IsEnum(CouponStatus)
  status: CouponStatus;

  @ApiProperty({
    example: '2025-12-31T23:59:59.000Z',
    description: 'Fecha de expiración del cupón',
  })
  @IsDate()
  expiresAt: Date;
}

export class UpdateCouponDto extends PartialType(CreateCouponDto) {}
