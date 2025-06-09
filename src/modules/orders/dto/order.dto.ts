import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({
    description: 'ID de la dirección seleccionada por el usuario',
    example: 'e87f1d90-5a34-4b09-9e4f-c908f5c13ef2',
    required: true,
  })
  @IsUUID()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    description: 'Costo de envío en pesos argentinos',
    example: 1500,
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  shippingCost: number;

  @ApiProperty({
    description: 'Fecha estimada de entrega (formato ISO)',
    example: '2025-06-15T00:00:00.000Z',
    required: true,
  })
  @IsDateString()
  @IsNotEmpty()
  estimatedDeliveryDate: string;
}
