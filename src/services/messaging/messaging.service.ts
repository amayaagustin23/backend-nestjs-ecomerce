import { Inject, Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
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
    redirectUrl: string;
  }) {
    const { from, to, redirectUrl } = input;
    const subject = this.i18n.t('emails.newPassword.subject');
    const body = this.i18n.t('emails.newPassword.body', {
      args: { redirectUrl },
    });

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
    const body = this.i18n.t('emails.recoverPassword.body', {
      args: { redirectUrl },
    });

    await this.emailService.send({
      from,
      to,
      subject,
      body,
    });
  }
}
