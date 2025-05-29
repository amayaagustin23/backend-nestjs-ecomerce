import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'User email',
    example: 'admin@gmail.com',
  })
  @IsEmail({}, {})
  @IsNotEmpty({})
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'Pass1234',
  })
  @IsNotEmpty({})
  @IsString({})
  password: string;
}
