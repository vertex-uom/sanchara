import { Module } from '@nestjs/common';
import { DevMailSender } from './mail/dev-mail-sender.js';
import { MailSender } from './mail/mail-sender.js';

@Module({
  providers: [{ provide: MailSender, useClass: DevMailSender }],
  exports: [MailSender],
})
export class MessagingModule {}
