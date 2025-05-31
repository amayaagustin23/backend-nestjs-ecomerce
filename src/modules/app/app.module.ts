import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from 'src/config/envs/env-validation';
import I18nModuleConfig from 'src/config/i18n/i18n.config';
import { UploadModule } from 'src/services/aws/aws.module';
import { GooglePlacesModule } from 'src/services/google-places/google-places.module';
import { PrismaModule } from '../../services/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { BrandsModule } from '../brands/brands.module';
import { CartsModule } from '../carts/carts.module';
import { CategoriesModule } from '../categories/categories.module';
import { OrdersModule } from '../orders/orders.module';
import { PaymentsModule } from '../payments/payments.module';
import { ProductsModule } from '../products/products.module';
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
    PrismaModule,
    UploadModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    BrandsModule,
    CartsModule,
    OrdersModule,
    PaymentsModule,
    GooglePlacesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
