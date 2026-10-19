export type PasswordResetMail = { to: string; name: string; resetUrl: string };

// Mail port used by other modules. The abstract class doubles as the DI token;
// the real email system provides its own implementation later.
export abstract class MailSender {
  abstract sendPasswordReset(mail: PasswordResetMail): Promise<void>;
}
