import { Injectable, Logger } from '@nestjs/common';
import { AppConfig } from '../../../common/config/app-config.service.js';
import { MailSender, type PasswordResetMail, type StaffInviteMail } from './mail-sender.js';

// Writes mail to the log instead of sending it; used in development and tests
// only (see MessagingModule). Outside development a link (a live token) is
// never logged.
@Injectable()
export class DevMailSender extends MailSender {
  private readonly logger = new Logger('Mail');

  constructor(private readonly config: AppConfig) {
    super();
  }

  sendPasswordReset({ to, resetUrl }: PasswordResetMail): Promise<void> {
    if (this.config.nodeEnv === 'development') {
      this.logger.log(`Password reset for ${to}: ${resetUrl}`);
    } else {
      this.logger.warn('No mail transport configured; password reset email not sent.');
    }
    return Promise.resolve();
  }

  sendStaffInvite({ to, companyName, roleLabel, inviteUrl }: StaffInviteMail): Promise<void> {
    if (this.config.nodeEnv === 'development') {
      this.logger.log(`Staff invite for ${to} (${roleLabel}, ${companyName}): ${inviteUrl}`);
    } else {
      this.logger.warn('No mail transport configured; staff invite email not sent.');
    }
    return Promise.resolve();
  }
}
