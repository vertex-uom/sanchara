import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { AppException, type FieldErrors } from '../../common/errors/app-exception.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { AdminProfile } from '../auth/admins/admins.service.js';
import { CompaniesService, toCompanyProfile } from '../companies/companies.service.js';
import { DomainsService, RESERVED_SUBDOMAINS } from '../domains/domains.service.js';
import { PropertiesService } from '../properties/properties.service.js';
import { StaffInvitesService } from '../staff/staff-invites.service.js';
import { StaffService } from '../staff/staff.service.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';
import type { CreateCompanyDto } from './dto/create-company.dto.js';
import { OnboardingRepository } from './onboarding.repository.js';

export const ONBOARDING_PAGE_SIZE = 10;

export type SubdomainAvailability = {
  subdomain: string;
  available: boolean;
  reason: 'invalid' | 'reserved' | 'taken' | null;
};

// Calendar months in Sri Lanka time (UTC+05:30, no daylight saving).
const COLOMBO_OFFSET_MS = 5.5 * 60 * 60 * 1000;
function colomboMonthStart(now: Date, monthsAgo: number) {
  const local = new Date(now.getTime() + COLOMBO_OFFSET_MS);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth() - monthsAgo, 1) - COLOMBO_OFFSET_MS);
}

const invalid = (fieldErrors: FieldErrors) =>
  new AppException(HttpStatus.BAD_REQUEST, 'VALIDATION_FAILED', 'Some fields are invalid.', fieldErrors);

const subdomainTaken = () =>
  new AppException(HttpStatus.CONFLICT, 'SUBDOMAIN_TAKEN', 'This subdomain is already in use.', {
    'company.subdomain': ['This subdomain is already in use.'],
  });

const emailTaken = () =>
  new AppException(HttpStatus.CONFLICT, 'EMAIL_TAKEN', 'A staff account with this email already exists.', {
    'owner.email': ['A staff account with this email already exists.'],
  });

// The services report their own field names; the request nests them.
function nested(error: unknown): unknown {
  if (!(error instanceof AppException)) return error;
  if (error.code === 'SUBDOMAIN_TAKEN') return subdomainTaken();
  if (error.code === 'EMAIL_TAKEN') return emailTaken();
  return error;
}

// Platform onboarding: the platform team opens a company with its first
// property, plan and Owner. The Owner gets a single-use invite link (72 h) to
// set a password; the company stays PENDING_SETUP until they accept it.
@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly companies: CompaniesService,
    private readonly properties: PropertiesService,
    private readonly subscriptions: SubscriptionsService,
    private readonly staff: StaffService,
    private readonly invites: StaffInvitesService,
    private readonly domains: DomainsService,
    private readonly audit: AuditService,
    private readonly repository: OnboardingRepository,
  ) {}

  // Everything the create-company form needs to offer.
  async options() {
    const [plans, propertyTypes, provinces] = await Promise.all([
      this.subscriptions.plans(),
      this.properties.propertyTypes(),
      this.properties.provinces(),
    ]);
    return {
      platformDomain: this.domains.platformDomain,
      reservedSubdomains: RESERVED_SUBDOMAINS,
      plans,
      propertyTypes,
      provinces,
    };
  }

  async subdomainAvailability(raw: string): Promise<SubdomainAvailability> {
    const subdomain = raw.trim().toLowerCase();
    const check = this.domains.checkSubdomain(subdomain);
    if (!check.valid) return { subdomain, available: false, reason: check.reason };
    const taken = (await this.companies.findBySubdomain(subdomain)) !== null;
    return { subdomain, available: !taken, reason: taken ? 'taken' : null };
  }

  async createCompany(admin: AdminProfile, input: CreateCompanyDto) {
    const { plan, propertyType, district } = await this.resolveChoices(input);
    if (await this.companies.findBySubdomain(input.company.subdomain)) throw subdomainTaken();
    if (await this.staff.findByEmail(input.owner.email)) throw emailTaken();

    // One transaction: no half-created company if any step fails. A parallel
    // request taking the same subdomain or email still fails cleanly (409).
    const created = await this.prisma
      .$transaction(async (tx) => {
        const company = await this.companies.create(
          {
            name: input.company.name,
            subdomain: input.company.subdomain,
            status: 'PENDING_SETUP',
            town: input.company.town,
            legalName: input.company.legalName ?? null,
            registrationNo: input.company.registrationNo ?? null,
            createdById: admin.id,
          },
          tx,
        );
        const property = await this.properties.create(
          {
            companyId: company.id,
            propertyTypeId: propertyType.id,
            name: input.property.name,
            address: {
              line1: input.property.address.line1,
              line2: input.property.address.line2 ?? null,
              city: input.property.address.city,
              districtId: district.id,
              postalCode: input.property.address.postalCode ?? null,
            },
          },
          tx,
        );
        const subscription = await this.subscriptions.start(company.id, plan.id, tx);
        const owner = await this.staff.createInvited(
          { companyId: company.id, fullName: input.owner.fullName, email: input.owner.email, phone: input.owner.phone, role: 'OWNER' },
          tx,
        );
        await this.audit.record(
          {
            actor: { type: 'PLATFORM_ADMIN', id: admin.id },
            action: 'company.created',
            entity: { type: 'company', id: company.id },
            companyId: company.id,
            details: { subdomain: company.subdomain, planCode: plan.code, propertyId: property.id, ownerStaffId: owner.id },
          },
          tx,
        );
        return { company, property, subscription, owner };
      })
      .catch((error: unknown) => {
        throw nested(error);
      });

    // After the commit: the link lives in Redis, not in the transaction. If it
    // can't be issued the company still exists; the admin re-issues the invite.
    const invite = await this.invites.sendWithLink(created.owner).catch((error: unknown) => {
      this.logger.error('Owner invite failed after company creation', error instanceof Error ? error.stack : undefined);
      return null;
    });

    const { company, property, subscription, owner } = created;
    return {
      company: {
        ...toCompanyProfile(company),
        siteHost: this.domains.siteHost(company.subdomain),
        town: company.town,
        legalName: company.legalName,
        registrationNo: company.registrationNo,
        plan: { code: subscription.plan.code, name: subscription.plan.name },
        createdAt: company.createdAt.toISOString(),
      },
      property: {
        id: property.id,
        name: property.name,
        slug: property.slug,
        type: { code: property.propertyType.code, name: property.propertyType.name },
        address: {
          line1: property.addressLine1,
          line2: property.addressLine2,
          city: property.city,
          district: { id: property.district.id, name: property.district.name },
          postalCode: property.postalCode,
        },
      },
      owner: { id: owner.id, fullName: owner.fullName, email: owner.email, phone: owner.phone, status: 'invited' as const },
      // Null only when issuing the link failed; re-issue it with owner-invite.
      invite,
    };
  }

  // Companies whose Owner hasn't accepted the invite yet, newest first. A link
  // that is gone from the token store has expired (expiresAt is then unknown).
  async awaitingOwners(page: number) {
    const total = (await this.repository.awaitingOwnerIds()).length;
    const pageCount = Math.max(Math.ceil(total / ONBOARDING_PAGE_SIZE), 1);
    const safePage = Math.min(Math.max(page, 1), pageCount);
    const companies = await this.repository.awaitingCompanies((safePage - 1) * ONBOARDING_PAGE_SIZE, ONBOARDING_PAGE_SIZE);
    const expiries = await this.invites.inviteExpiries(companies.flatMap((company) => company.staff.map((owner) => owner.id)));

    const items = companies.map((company) => {
      const owner = company.staff[0];
      const expiresAt = owner ? (expiries.get(owner.id) ?? null) : null;
      const plan = company.subscriptions[0]?.plan ?? null;
      return {
        companyId: company.id,
        name: company.name,
        subdomain: company.subdomain,
        siteHost: this.domains.siteHost(company.subdomain),
        town: company.town,
        district: company.properties[0]?.district.name ?? null,
        plan: plan ? { code: plan.code, name: plan.name } : null,
        owner: owner ? { id: owner.id, fullName: owner.fullName, email: owner.email } : null,
        createdBy: company.createdBy?.fullName ?? null,
        createdAt: company.createdAt.toISOString(),
        invite: { status: expiresAt ? ('valid' as const) : ('expired' as const), expiresAt: expiresAt?.toISOString() ?? null },
      };
    });
    return { items, total, page: safePage, pageSize: ONBOARDING_PAGE_SIZE };
  }

  // Counts for the Onboarding cards. Months are calendar months in Sri Lanka time.
  async summary(now = new Date()) {
    const owners = await this.repository.awaitingOwnerIds();
    const expiries = await this.invites.inviteExpiries(owners.map((owner) => owner.id));
    const [thisMonth, lastMonth, nextMonth] = [colomboMonthStart(now, 0), colomboMonthStart(now, 1), colomboMonthStart(now, -1)];
    const [createdThisMonth, createdLastMonth, setupCompletedThisMonth] = await Promise.all([
      this.repository.countCreated(thisMonth, nextMonth),
      this.repository.countCreated(lastMonth, thisMonth),
      this.repository.countSetupCompleted(thisMonth, nextMonth),
    ]);
    return {
      awaiting: owners.length,
      expired: [...expiries.values()].filter((expiresAt) => expiresAt === null).length,
      createdThisMonth,
      createdLastMonth,
      setupCompletedThisMonth,
    };
  }

  // A new Owner invite for a company whose Owner hasn't accepted yet, emailed to
  // the Owner only; the previous link stops working. The link is never returned:
  // whoever opens it sets the Owner's password and gets the company's bookings.
  async reissueOwnerInvite(admin: AdminProfile, companyId: string) {
    const company = await this.companies.findById(companyId);
    const owner = company ? await this.staff.findOwner(company.id) : null;
    if (!company || !owner) throw new AppException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'That company does not exist.');
    if (owner.status !== 'INVITED') {
      throw new AppException(HttpStatus.CONFLICT, 'OWNER_ALREADY_ACTIVE', 'The Owner has already accepted the invite.');
    }

    const invite = await this.invites.send(owner);
    await this.audit.record({
      actor: { type: 'PLATFORM_ADMIN', id: admin.id },
      action: 'company.owner_invite_reissued',
      entity: { type: 'company', id: company.id },
      companyId: company.id,
      details: { ownerStaffId: owner.id },
    });
    return { invite };
  }

  // Plan, property type and district must exist and be selectable; every bad
  // choice is reported at once, on its field.
  private async resolveChoices(input: CreateCompanyDto) {
    const [plan, propertyType, district] = await Promise.all([
      this.subscriptions.findSelectablePlan(input.company.planCode),
      this.properties.findSelectablePropertyType(input.property.typeCode),
      this.properties.findDistrict(input.property.address.districtId),
    ]);
    const errors: FieldErrors = {};
    if (!plan) errors['company.planCode'] = ['Choose one of the offered plans.'];
    if (!propertyType) errors['property.typeCode'] = ['Choose one of the offered property types.'];
    if (!district) errors['property.address.districtId'] = ['Choose a district.'];
    const check = this.domains.checkSubdomain(input.company.subdomain);
    if (!check.valid && check.reason === 'reserved') errors['company.subdomain'] = ['This subdomain is reserved by the platform.'];
    if (!plan || !propertyType || !district || Object.keys(errors).length > 0) throw invalid(errors);
    return { plan, propertyType, district };
  }
}
