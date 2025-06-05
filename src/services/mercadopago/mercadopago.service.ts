import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { PreferenceRequest } from 'mercadopago/dist/clients/preference/commonTypes';

@Injectable()
export class MercadopagoService {
  private client: MercadoPagoConfig;
  private webhookUrl: string;

  constructor(private readonly configService: ConfigService) {
    const accessToken = this.configService.get<string>(
      'MERCADOPAGO_ACCESS_TOKEN',
    );
    this.webhookUrl = this.configService.get<string>('MERCADOPAGO_WEBHOOK_URL');

    this.client = new MercadoPagoConfig({ accessToken });
  }

  async createPreference({
    orderId,
    amount,
    metadata,
  }: {
    orderId: string;
    amount: number;
    metadata: Record<string, any>;
  }) {
    const preferenceData: PreferenceRequest = {
      items: [
        {
          id: orderId,
          title: `Orden #${orderId}`,
          unit_price: amount,
          quantity: 1,
          currency_id: 'ARS',
        },
      ],
      notification_url: this.webhookUrl,
      metadata: {
        orderId,
        ...metadata,
      },
      external_reference: orderId,
    };

    const preference = new Preference(this.client);
    return await preference.create({ body: preferenceData });
  }

  async getPayment(id: string) {
    const paymentClient = new Payment(this.client);
    return await paymentClient.get({ id });
  }
}
