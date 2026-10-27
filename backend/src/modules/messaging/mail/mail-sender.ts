export type PasswordResetMail = { to: string; name: string; resetUrl: string };
export type StaffInviteMail = { to: string; name: string; companyName: string; roleLabel: string; inviteUrl: string };

// Mail port used by other modules. The abstract class doubles as the DI token;
// the real email system provides its own implementation later.
export abstract class MailSender {
  abstract sendPasswordReset(mail: PasswordResetMail): Promise<void>;
  abstract sendStaffInvite(mail: StaffInviteMail): Promise<void>;
}
