import { Inject, Injectable } from '@nestjs/common';
import { Person, User } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import {
  BasicUserInfo,
  OrderWithItems,
} from 'src/common/interfaces/index.interface';
import { capitalize, formatARS } from 'src/utils/parsers';
import { EMAIL_PROVIDER, EmailService } from './messaging.types';

@Injectable()
export class MessagingService {
  constructor(
    @Inject(EMAIL_PROVIDER) private emailService: EmailService,
    private readonly i18n: I18nService,
  ) {}

  async sendRegisterUserEmail(input: {
    from: string;
    to: string;
    user: Partial<BasicUserInfo>;
  }) {
    const { from, to, user } = input;

    const subject = await this.i18n.t('emails.registerEmail.subject');
    const body = await this.i18n
      .t('emails.registerEmail.body')
      .replace('{{name}}', user.name);

    await this.emailService.send({
      from,
      to,
      subject,
      body,
    });
  }

  async sendResetPasswordEmail(input: { from: string; to: string }) {
    const { from, to } = input;
    const subject = this.i18n.t('emails.resetPassword.subject');
    const body = this.i18n.t('emails.resetPassword.body');

    await this.emailService.send({
      from,
      to,
      subject,
      body,
    });
  }

  async sendRecoverPasswordEmail(input: {
    from: string;
    to: string;
    redirectUrl: string;
  }) {
    const { from, to, redirectUrl } = input;

    const subject = this.i18n.t('emails.recoverPassword.subject');
    const body = this.i18n
      .t('emails.recoverPassword.body')
      .replace('{{redirectUrl}}', redirectUrl);

    await this.emailService.send({
      from,
      to,
      subject,
      body,
    });
  }

  async sendNotificationCartActive(input: {
    from: string;
    to: string;
    user: User & { person: Person };
  }) {
    const { from, to, user } = input;

    const subject = await this.i18n
      .t('emails.notificationCartActive.subject')
      .replace('{{name}}', user.person.name);

    const body = await this.i18n
      .t('emails.notificationCartActive.body')
      .replace('{{name}}', user.person.name)
      .replace('{{email}}', user.email);

    await this.emailService.send({
      from,
      to,
      subject,
      body,
    });
  }

  async sendPaymentStatusEmail(input: {
    status: string;
    from: string;
    to: string;
    user: User & { person: Person };
    order?: OrderWithItems;
  }) {
    const { status, from, to, user, order } = input;
    const name = user.person?.name;
    const email = user.email;

    const subject = await this.i18n
      .t(`emails.payment${capitalize(status)}.subject`)
      .replace('{{name}}', user.person.name);

    const itemsList = order?.items
      .map((item) => {
        const hasDiscount = item.discount > 0;
        const discountPercent = hasDiscount
          ? Math.round((item.discount / (item.unitPrice + item.discount)) * 100)
          : 0;

        return `
          <div>
            <strong>${item.product.name}</strong> - Talle: ${item.variant.size}, Color: ${item.variant.color}<br/>
            Cantidad: ${item.quantity} x 
            ${
              hasDiscount
                ? `<span style="text-decoration: line-through; color: #999;">${formatARS(
                    item.unitPrice,
                  )}</span> 
                   <strong>${formatARS(item.finalPrice)}</strong> 
                   <span style="color: green;">(-${discountPercent}%)</span>`
                : `<strong>${formatARS(item.finalPrice)}</strong>`
            }
          </div><br/>
        `;
      })
      .join('');

    const body = (await this.i18n.t(`emails.payment${capitalize(status)}.body`))
      .replace(/{{name}}/g, name)
      .replace(/{{email}}/g, email)
      .replace(/{{orderId}}/g, order?.id ?? '')
      .replace(/{{subtotal}}/g, formatARS(order?.subtotal ?? 0))
      .replace(/{{shippingCost}}/g, formatARS(order?.shippingCost ?? 0))
      .replace(/{{total}}/g, formatARS(order?.total ?? 0))
      .replace(/{{itemsList}}/g, itemsList ?? '');

    await this.emailService.send({ from, to, subject, body });
  }
}
