import { createHash } from 'node:crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException } from '../../common/errors/app-exception.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { fromApiName, toApiName } from '../../common/validation/api-names.js';
import type { ContactSubject, Prisma } from '../../generated/prisma/client.js';
import type { AdminProfile } from '../auth/admins/admins.service.js';
import { RateLimitService } from '../auth/services/rate-limit.service.js';
import { CONTACT_LIMITS, CONTACT_PAGE_SIZE, type ContactSubjectName } from './contact.policy.js';
import type { ContactMessageDto } from './dto/contact.dto.js';

export type ContactMessageView = {
  id: string;
  name: string;
  email: string;
  subject: ContactSubjectName;
  message: string;
  sentAt: string;
  handledAt: string | null;
  handledBy: string | null;
};

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

const SELECT = {
  id: true,
  name: true,
  email: true,
  subject: true,
  message: true,
  createdAt: true,
  handledAt: true,
  handledBy: { select: { fullName: true } },
} as const satisfies Prisma.ContactMessageSelect;

function toView(message: Prisma.ContactMessageGetPayload<{ select: typeof SELECT }>): ContactMessageView {
  return {
    id: message.id,
    name: message.name,
    email: message.email,
    subject: toApiName(message.subject),
    message: message.message,
    sentAt: message.createdAt.toISOString(),
    handledAt: message.handledAt?.toISOString() ?? null,
    handledBy: message.handledAt ? (message.handledBy?.fullName ?? 'Former team member') : null,
  };
}

// Messages from the central site's contact form, read by the platform team.
// Rate-limited per IP and per email; nothing else is stored about the sender.
@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly limits: RateLimitService,
  ) {}

  async send(input: ContactMessageDto, ip: string): Promise<void> {
    await this.limits.consume(`contact:ip:${ip}`, CONTACT_LIMITS.perIp);
    await this.limits.consume(`contact:email:${sha256(input.email)}`, CONTACT_LIMITS.perEmail);
    await this.prisma.contactMessage.create({
      data: { name: input.name, email: input.email, subject: fromApiName<ContactSubject>(input.subject), message: input.message },
    });
  }

  // Newest first; open (not handled) by default.
  async list(status: 'open' | 'handled' | 'all', page: number) {
    const where: Prisma.ContactMessageWhereInput = status === 'open' ? { handledAt: null } : status === 'handled' ? { handledAt: { not: null } } : {};
    const [rows, total, open] = await Promise.all([
      this.prisma.contactMessage.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * CONTACT_PAGE_SIZE,
        take: CONTACT_PAGE_SIZE,
        select: SELECT,
      }),
      this.prisma.contactMessage.count({ where }),
      this.prisma.contactMessage.count({ where: { handledAt: null } }),
    ]);
    return { items: rows.map(toView), total, page, pageSize: CONTACT_PAGE_SIZE, open };
  }

  async markHandled(admin: AdminProfile, id: string, handled: boolean): Promise<ContactMessageView> {
    const { count } = await this.prisma.contactMessage.updateMany({
      where: { id },
      data: handled ? { handledAt: new Date(), handledById: admin.id } : { handledAt: null, handledById: null },
    });
    if (count === 0) throw new AppException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'That message no longer exists.');
    return toView(await this.prisma.contactMessage.findUniqueOrThrow({ where: { id }, select: SELECT }));
  }
}
