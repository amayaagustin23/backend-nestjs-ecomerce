import { Logger } from '@nestjs/common';
import { Client } from 'node-mailjet';
import { Email, EmailService } from '../messaging.types';

export class MailjetService implements EmailService {
  private logger = new Logger(MailjetService.name);
  private client: Client;
  constructor() {
    this.client = new Client({
      apiKey: process.env.MAILJET_API_KEY,
      apiSecret: process.env.MAILJET_SECRET_KEY,
      config: {
        version: 'v3.1',
      },
    });
  }

  async send(input: Email) {
    const { from, to, subject, body } = input;
    await this.client
      .post('send')
      .request({
        Messages: [
          {
            From: {
              Email: from,
            },
            To: [
              {
                Email: to,
              },
            ],
            Subject: subject,
            HTMLPart: body,
          },
        ],
      })
      .then(() => {
        this.logger.debug(`Email sent to ${to}`);
      })
      .catch((err) => {
        this.logger.error('Error sending email', err.stack);
      });
  }
}
