import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';

type NewGuest = { fullName: string; email: string; mobile: string | null };
type GoogleIdentity = { subject: string; email: string };

// Prisma access for guests and their credentials. Only GuestsService uses it.
@Injectable()
export class GuestsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.guest.findUnique({ where: { id } });
  }

  // One query: the guest plus its password hash, if any.
  findByEmailWithPassword(email: string) {
    return this.prisma.guest.findUnique({ where: { email }, include: { passwordCredential: { select: { hash: true } } } });
  }

  findByEmail(email: string) {
    return this.prisma.guest.findUnique({ where: { email } });
  }

  async findByGoogleSubject(subject: string) {
    const identity = await this.prisma.externalIdentity.findUnique({
      where: { provider_subject: { provider: 'GOOGLE', subject } },
      select: { guest: true },
    });
    return identity?.guest ?? null;
  }

  createWithPassword(guest: NewGuest, hash: string) {
    return this.prisma.guest.create({ data: { ...guest, passwordCredential: { create: { hash } } } });
  }

  createFromGoogle(guest: NewGuest, identity: GoogleIdentity) {
    return this.prisma.guest.create({
      data: {
        ...guest,
        emailVerifiedAt: new Date(),
        externalIdentities: { create: { provider: 'GOOGLE', subject: identity.subject, email: identity.email } },
      },
    });
  }

  // Links Google to an existing guest. Google proved the email, so it becomes
  // verified; when it wasn't before, the unproven password is removed.
  linkGoogle(guestId: string, identity: GoogleIdentity, removePassword: boolean) {
    return this.prisma.$transaction(async (tx) => {
      await tx.externalIdentity.create({
        data: { guestId, provider: 'GOOGLE', subject: identity.subject, email: identity.email },
      });
      if (removePassword) await tx.passwordCredential.deleteMany({ where: { guestId } });
      return tx.guest.update({ where: { id: guestId }, data: { emailVerifiedAt: new Date() } });
    });
  }

  async setPasswordHash(guestId: string, hash: string) {
    const now = new Date();
    await this.prisma.passwordCredential.upsert({
      where: { guestId },
      create: { guestId, hash },
      update: { hash, changedAt: now },
    });
  }
}
