import { ConfigService } from '@nestjs/config';
import { log } from 'console';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { PreferenceRequest } from 'mercadopago/dist/clients/preference/commonTypes';

export class MercadopagoService {
  private client: MercadoPagoConfig;
  private get mercadopagoConfig() {
    return {
      accessToken: this.configService.get<string>('MERCADOPAGO_ACCESS_TOKEN'),
      webhookUrl: this.configService.get<string>('MERCADOPAGO_WEBHOOK_URL'),
    };
  }
  constructor(private readonly configService: ConfigService) {
    this.client = new MercadoPagoConfig({
      accessToken: this.mercadopagoConfig.accessToken,
    });
  }

  async createPayment(purchaseId: string, amount: number) {
    const preferenceData: PreferenceRequest = {
      items: [
        {
          id: purchaseId,
          title: `Purchase ${purchaseId}`,
          unit_price: amount,
          quantity: 1,
          currency_id: 'ARS',
        },
      ],
      notification_url: this.mercadopagoConfig.webhookUrl,
      metadata: {
        purchaseId,
      },
    };

    try {
      const preference = new Preference(this.client);
      const result = await preference.create({ body: preferenceData });
      log(result);
      return result;
    } catch (error) {
      console.error('Error al crear el pago:', error);
      throw new Error('Falló la creación del pago');
    }
  }

  async getPayment(id: string) {
    try {
      const paymentClient = new Payment(this.client);
      const result = await paymentClient.get({ id });
      return result;
    } catch (error) {
      console.error('Error al obtener el pago:', error);
      throw new Error('Falló la obtención del pago');
    }
  }
}
