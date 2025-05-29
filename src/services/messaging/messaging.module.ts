import { Module, Provider } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { EMAIL_PROVIDER } from './messaging.types';
import { MailjetService } from './providers/mailjet.service';

const mailServiceProvider: Provider = {
  provide: EMAIL_PROVIDER,
  useClass: MailjetService,
};

@Module({
  providers: [mailServiceProvider, MessagingService],
  exports: [MessagingService],
})
export class MessagingModule {}
