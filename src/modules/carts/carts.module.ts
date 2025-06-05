import { Module } from '@nestjs/common';
import { MessagingModule } from 'src/services/messaging/messaging.module';
import { PrismaModule } from 'src/services/prisma/prisma.module';
import { CartsController } from './carts.controller';
import { CartsService } from './carts.service';

@Module({
  imports: [PrismaModule, MessagingModule],
  controllers: [CartsController],
  providers: [CartsService],
  exports: [CartsService],
})
export class CartsModule {}
