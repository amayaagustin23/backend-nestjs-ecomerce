import { Module } from '@nestjs/common';
import { UploadModule } from 'src/services/aws/aws.module';
import { PrismaModule } from 'src/services/prisma/prisma.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [PrismaModule, UploadModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
