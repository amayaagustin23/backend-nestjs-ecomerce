import {
  ClassSerializerInterceptor,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestApplication, NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import { I18nValidationPipe } from 'nestjs-i18n';
import { LoggerInterceptor } from './common/interceptors/logger.interceptor';
import { ValidationErrorExceptionFilter } from './common/middlewares';
import { CORS } from './constants';
import { AppModule } from './modules/app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(CORS);
  app.use(cookieParser());
  app.useGlobalInterceptors(new LoggerInterceptor());
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new I18nValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      // ⬇️ ¡Este `validationError` es CLAVE para mostrar los mensajes como esperás!
      validationError: {
        target: false,
        value: false,
      },
    }),
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalPipes(
    new I18nValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      validationError: {
        target: false,
        value: false,
      },
    }),
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new ValidationErrorExceptionFilter());
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector), {
      excludePrefixes: ['password', 'createdAt', 'updatedAt', 'isDeleted'],
      ignoreDecorators: true,
    }),
  );
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  const config = new DocumentBuilder()
    .setTitle('API')
    .setDescription('Ecomerce Portfolio API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const configService = app.get(ConfigService);
  const PORT = configService.get<number>('PORT');
  const NODE_ENV = configService.get<string>('NODE_ENV');

  await app.listen(PORT).then(() => {
    Logger.log(`Running on port: ${PORT}`, NestApplication.name);
    Logger.log(`Current environment: ${NODE_ENV}`, NestApplication.name);
  });
}

bootstrap();
