import { Module } from '@nestjs/common';
import { MercadopagoModule } from 'src/services/mercadopago/mercadopago.module';
import { MessagingModule } from 'src/services/messaging/messaging.module';
import { PrismaModule } from 'src/services/prisma/prisma.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [PrismaModule, MercadopagoModule, MessagingModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
