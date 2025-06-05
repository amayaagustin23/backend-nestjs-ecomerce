import { Controller, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('mercadopago/webhook')
  async handleWebhook(@Req() req: Request) {
    const event = req.body;
    return this.paymentsService.mercadopagoWebhook(event);
  }
}
