import { Module } from '@nestjs/common';
import { AppConfig } from '../../common/config/app-config.service.js';
import { DevMailSender } from './mail/dev-mail-sender.js';
import { MailSender } from './mail/mail-sender.js';

// No real mail transport exists yet. Development and tests log mail instead;
// production refuses to start rather than silently drop invites and resets.
function mailSenderFor(config: AppConfig): MailSender {
  if (config.isProduction) {
    throw new Error('No mail transport is configured. Add one before running the API with NODE_ENV=production.');
  }
  return new DevMailSender(config);
}

@Module({
  providers: [{ provide: MailSender, useFactory: mailSenderFor, inject: [AppConfig] }],
  exports: [MailSender],
})
export class MessagingModule {}
