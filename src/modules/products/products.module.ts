import { Module } from '@nestjs/common';
import JwtModuleConfig from 'src/config/jwt/jwt.config';
import { UploadModule } from 'src/services/aws/aws.module';
import { PrismaModule } from 'src/services/prisma/prisma.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [PrismaModule, UploadModule, JwtModuleConfig()],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
