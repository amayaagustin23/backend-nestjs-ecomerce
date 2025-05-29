import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from 'src/config/envs/env-validation';
import I18nModuleConfig from 'src/config/i18n/i18n.config';
import { AwsModule } from '../../services/aws/aws.module';
import { PrismaModule } from '../../services/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      validationSchema: envValidationSchema,
    }),
    I18nModuleConfig(),
    AuthModule,
    UsersModule,
    PrismaModule,
    AwsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
