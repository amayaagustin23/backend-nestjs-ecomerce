import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

class CreatePersonDto {
  @ApiProperty({ description: 'Nombre del usuario', example: 'Juan' })
  @IsNotEmpty({
    message: i18nValidationMessage('errors.validations.isNotEmpty'),
  })
  @IsString({ message: i18nValidationMessage('errors.validations.isString') })
  name: string;

  @ApiProperty({ description: 'Teléfono', example: '+5493811234567' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('errors.validations.isString') })
  phone?: string;

  @ApiProperty({ description: 'CUIT o DNI', example: '20304050607' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('errors.validations.isString') })
  cuitOrDni?: string;
}

export class AddressDto {
  @ApiPropertyOptional({
    description: 'Calle del domicilio',
    example: 'Ecuador',
  })
  @IsOptional()
  @IsString({
    message: i18nValidationMessage('errors.validations.isString'),
  })
  street?: string;

  @ApiPropertyOptional({
    description: 'Ciudad',
    example: 'San Miguel de Tucumán',
  })
  @IsOptional()
  @IsString({
    message: i18nValidationMessage('errors.validations.isString'),
  })
  city?: string;

  @ApiPropertyOptional({
    description: 'Provincia',
    example: 'Tucumán',
  })
  @IsOptional()
  @IsString({
    message: i18nValidationMessage('errors.validations.isString'),
  })
  province?: string;

  @ApiPropertyOptional({
    description: 'Código postal',
    example: 'T4001',
  })
  @IsOptional()
  @IsString({
    message: i18nValidationMessage('errors.validations.isString'),
  })
  postalCode?: string;

  @ApiPropertyOptional({
    description: 'Latitud geográfica',
    example: -26.7991021,
  })
  @IsOptional()
  @IsNumber(
    {},
    {
      message: i18nValidationMessage('errors.validations.isNumber'),
    },
  )
  lat?: number;

  @ApiPropertyOptional({
    description: 'Longitud geográfica',
    example: -65.2436467,
  })
  @IsOptional()
  @IsNumber(
    {},
    {
      message: i18nValidationMessage('errors.validations.isNumber'),
    },
  )
  lng?: number;
}

export class RegisterUserDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'juan.perez@gmail.com',
  })
  @IsNotEmpty({
    message: i18nValidationMessage('errors.validations.isNotEmpty'),
  })
  @IsEmail({}, { message: i18nValidationMessage('errors.validations.isEmail') })
  email: string;

  @ApiProperty({ description: 'Contraseña', example: 'Password123' })
  @IsNotEmpty({
    message: i18nValidationMessage('errors.validations.isNotEmpty'),
  })
  @IsString({ message: i18nValidationMessage('errors.validations.isString') })
  @MinLength(8, {
    message: i18nValidationMessage('errors.validations.minLength'),
  })
  @Matches(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$/, {
    message: i18nValidationMessage('errors.validations.isPassword'),
  })
  password: string;

  @ApiProperty({ type: () => CreatePersonDto })
  @ValidateNested()
  @Type(() => CreatePersonDto)
  person: CreatePersonDto;

  @ApiProperty({ type: () => AddressDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;
}

class UpdatePersonDto {
  @ApiProperty({ example: 'Juan', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: '3811234567', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: '20304050607', required: false })
  @IsOptional()
  @IsString()
  cuitOrDni?: string;
}

export class UpdateUserDto {
  @ApiProperty({ example: 'juan.perez@gmail.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ type: () => UpdatePersonDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePersonDto)
  person?: UpdatePersonDto;
}

export class RecoverPasswordDto {
  @ApiProperty({
    description: 'User email',
    example: 'joe@gmail.com',
  })
  @IsNotEmpty({
    message: i18nValidationMessage('errors.validations.isNotEmpty'),
  })
  @IsEmail(
    {},
    {
      message: i18nValidationMessage('errors.validations.isEmail'),
    },
  )
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    description: 'User password',
    example: 'Pass1234',
  })
  @IsString({
    message: i18nValidationMessage('errors.validations.isString'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('errors.validations.isNotEmpty'),
  })
  @MinLength(8)
  @Matches(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$/, {
    message: i18nValidationMessage('errors.validations.isPassword'),
  })
  password: string;

  @ApiProperty({
    description: 'User password confirmation',
    example: 'Pass1234',
  })
  @IsString({
    message: i18nValidationMessage('errors.validations.isString'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('errors.validations.isNotEmpty'),
  })
  @MinLength(8)
  @Matches(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$/, {
    message: i18nValidationMessage('errors.validations.isPassword'),
  })
  confirmPassword: string;
}
