import { Module } from '@nestjs/common';
import { MercadopagoModule } from 'src/services/mercadopago/mercadopago.module';
import { MessagingModule } from 'src/services/messaging/messaging.module';
import { PrismaModule } from 'src/services/prisma/prisma.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [PrismaModule, MercadopagoModule, MessagingModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
