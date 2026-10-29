import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException } from '../../common/errors/app-exception.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import type { Property } from '../../generated/prisma/client.js';
import { AuditService } from '../audit/audit.service.js';
import type { SignedInStaff } from '../staff/staff.service.js';
import type {
  AdvancedSettingsDto,
  AmenitiesSettingsDto,
  BasicSettingsDto,
  ContactSettingsDto,
  IntegrationsSettingsDto,
  PoliciesSettingsDto,
} from './dto/property-settings.dto.js';
import { PropertiesRepository, type PropertySettingsChanges, type PropertyWithLookups } from './properties.repository.js';
import {
  fromApiName,
  PROPERTY_COUNTRY,
  toApiName,
  type CancellationPolicyName,
  type PropertyCategoryName,
  type PropertyStatusName,
  type SmokingPolicyName,
} from './properties.policy.js';

export type PropertySummaryView = { id: string; name: string; town: string; country: string; status: PropertyStatusName };

// Everything Property Settings shows, grouped by tab.
export type PropertySettingsView = PropertySummaryView & {
  version: number;
  basic: {
    name: string;
    type: string;
    description: string;
    starRating: number | null;
    establishedYear: number | null;
    category: PropertyCategoryName | null;
  };
  contact: {
    phone: string;
    email: string;
    whatsapp: string | null;
    website: string | null;
    addressLine1: string;
    addressLine2: string | null;
    town: string;
    district: string;
    postalCode: string | null;
    country: string;
    mapUrl: string | null;
  };
  policies: {
    checkInFrom: string;
    checkInUntil: string | null;
    checkOutBy: string;
    cancellation: CancellationPolicyName;
    childrenAllowed: boolean;
    petsAllowed: boolean;
    smoking: SmokingPolicyName;
    houseRules: string;
  };
  amenities: string[];
  integrations: {
    googleAnalyticsId: string | null;
    metaPixelId: string | null;
    googleBusinessUrl: string | null;
    tripAdvisorUrl: string | null;
    bookingComIcalUrl: string | null;
    airbnbIcalUrl: string | null;
  };
  advanced: {
    sltdaNumber: string | null;
    vatNumber: string | null;
    invoicePrefix: string;
    bookingWindowDays: number;
    minNoticeHours: number;
  };
};

export type SettingsSection = 'basic' | 'contact' | 'policies' | 'amenities' | 'integrations' | 'advanced';

type SectionInput = {
  basic: BasicSettingsDto;
  contact: ContactSettingsDto;
  policies: PoliciesSettingsDto;
  amenities: AmenitiesSettingsDto;
  integrations: IntegrationsSettingsDto;
  advanced: AdvancedSettingsDto;
};

const COLOMBO_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const notFound = () => new AppException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'That property no longer exists.');
const stale = () =>
  new AppException(HttpStatus.CONFLICT, 'STALE', 'These settings were changed somewhere else. Reload the page to see the latest version.');
const fieldError = (field: string, message: string) =>
  new AppException(HttpStatus.BAD_REQUEST, 'VALIDATION_FAILED', 'Some fields are invalid.', { [field]: [message] });

function toSummaryView(property: Property): PropertySummaryView {
  return { id: property.id, name: property.name, town: property.city, country: PROPERTY_COUNTRY, status: toApiName(property.status) };
}

function toSettingsView(property: PropertyWithLookups): PropertySettingsView {
  return {
    ...toSummaryView(property),
    version: property.settingsVersion,
    basic: {
      name: property.name,
      type: toApiName(property.propertyType.code),
      description: property.description,
      starRating: property.starRating,
      establishedYear: property.establishedYear,
      category: property.category ? toApiName(property.category) : null,
    },
    contact: {
      phone: property.phone ?? '',
      email: property.email ?? '',
      whatsapp: property.whatsapp,
      website: property.websiteUrl,
      addressLine1: property.addressLine1,
      addressLine2: property.addressLine2,
      town: property.city,
      district: property.district.name,
      postalCode: property.postalCode,
      country: PROPERTY_COUNTRY,
      mapUrl: property.mapUrl,
    },
    policies: {
      checkInFrom: property.checkInFrom,
      checkInUntil: property.checkInUntil,
      checkOutBy: property.checkOutBy,
      cancellation: toApiName(property.cancellationPolicy),
      childrenAllowed: property.childrenAllowed,
      petsAllowed: property.petsAllowed,
      smoking: toApiName(property.smokingPolicy),
      houseRules: property.houseRules,
    },
    amenities: property.amenities,
    integrations: {
      googleAnalyticsId: property.googleAnalyticsId,
      metaPixelId: property.metaPixelId,
      googleBusinessUrl: property.googleBusinessUrl,
      tripAdvisorUrl: property.tripAdvisorUrl,
      bookingComIcalUrl: property.bookingComIcalUrl,
      airbnbIcalUrl: property.airbnbIcalUrl,
    },
    advanced: {
      sltdaNumber: property.sltdaNumber,
      vatNumber: property.vatNumber,
      invoicePrefix: property.invoicePrefix,
      bookingWindowDays: property.bookingWindowDays,
      minNoticeHours: property.minNoticeHours,
    },
  };
}

// Names of the fields in a section whose value changed (for the audit trail).
// A list section (amenities) is one field.
function changedFields(section: SettingsSection, before: object, after: object): string[] {
  if (Array.isArray(after)) return JSON.stringify(before) === JSON.stringify(after) ? [] : [section];
  const previous = before as Record<string, unknown>;
  return Object.entries(after)
    .filter(([key, value]) => JSON.stringify(value) !== JSON.stringify(previous[key]))
    .map(([key]) => key);
}

// Property Settings for the signed-in user's company. Callers make sure only
// the Owner reads or changes settings (OwnerOnly); every query is scoped to
// the actor's company, so another company's property reads as not found.
@Injectable()
export class PropertySettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: PropertiesRepository,
    private readonly audit: AuditService,
  ) {}

  async list(actor: SignedInStaff): Promise<PropertySummaryView[]> {
    return (await this.repository.listForCompany(actor.company.id)).map(toSummaryView);
  }

  async get(actor: SignedInStaff, propertyId: string): Promise<PropertySettingsView> {
    const property = await this.repository.findForCompany(propertyId, actor.company.id);
    if (!property) throw notFound();
    return toSettingsView(property);
  }

  // Saves one tab. Refused with STALE when someone saved since `version`.
  async update<S extends SettingsSection>(actor: SignedInStaff, propertyId: string, section: S, input: SectionInput[S]): Promise<PropertySettingsView> {
    const current = await this.repository.findForCompany(propertyId, actor.company.id);
    if (!current) throw notFound();
    if (current.settingsVersion !== input.version) throw stale();
    const changes = await this.changesFor(section, input, current);

    const updated = await this.prisma.$transaction(async (tx) => {
      if (!(await this.repository.updateSettings(propertyId, actor.company.id, input.version, changes, tx))) throw stale();
      const property = (await this.repository.findForCompany(propertyId, actor.company.id, tx))!;
      const fields = changedFields(section, toSettingsView(current)[section], toSettingsView(property)[section]);
      await this.audit.record(
        {
          actor: { type: 'STAFF', id: actor.id },
          action: 'property.settings_updated',
          entity: { type: 'property', id: propertyId },
          companyId: actor.company.id,
          details: { section, fields },
        },
        tx,
      );
      return property;
    });
    return toSettingsView(updated);
  }

  async setStatus(actor: SignedInStaff, propertyId: string, status: PropertyStatusName): Promise<PropertySettingsView> {
    const current = await this.repository.findForCompany(propertyId, actor.company.id);
    if (!current) throw notFound();
    const next = fromApiName<Property['status']>(status);
    if (current.status === next) return toSettingsView(current);

    const updated = await this.prisma.$transaction(async (tx) => {
      if (!(await this.repository.setStatus(propertyId, actor.company.id, next, tx))) throw notFound();
      await this.audit.record(
        {
          actor: { type: 'STAFF', id: actor.id },
          action: 'property.status_changed',
          entity: { type: 'property', id: propertyId },
          companyId: actor.company.id,
          details: { from: toApiName(current.status), to: status },
        },
        tx,
      );
      return (await this.repository.findForCompany(propertyId, actor.company.id, tx))!;
    });
    return toSettingsView(updated);
  }

  // The columns a section writes, after the checks that need the database.
  private async changesFor<S extends SettingsSection>(section: S, input: SectionInput[S], current: PropertyWithLookups): Promise<PropertySettingsChanges> {
    switch (section) {
      case 'basic': {
        const basic = input as BasicSettingsDto;
        const year = new Date(Date.now() + COLOMBO_OFFSET_MS).getUTCFullYear();
        if (basic.establishedYear != null && basic.establishedYear > year) throw fieldError('establishedYear', `Enter a year from 1800 to ${year}.`);
        return {
          name: basic.name,
          propertyTypeId: await this.propertyTypeId(basic.type, current),
          description: basic.description,
          starRating: basic.starRating ?? null,
          establishedYear: basic.establishedYear ?? null,
          category: basic.category ? fromApiName<NonNullable<Property['category']>>(basic.category) : null,
        };
      }
      case 'contact': {
        const contact = input as ContactSettingsDto;
        const district = await this.repository.findDistrictByName(contact.district);
        if (!district) throw fieldError('district', 'Choose a district.');
        return {
          phone: contact.phone,
          email: contact.email,
          whatsapp: contact.whatsapp ?? null,
          websiteUrl: contact.website ?? null,
          addressLine1: contact.addressLine1,
          addressLine2: contact.addressLine2 ?? null,
          city: contact.town,
          districtId: district.id,
          postalCode: contact.postalCode ?? null,
          mapUrl: contact.mapUrl ?? null,
        };
      }
      case 'policies': {
        const policies = input as PoliciesSettingsDto;
        return {
          checkInFrom: policies.checkInFrom,
          checkInUntil: policies.checkInUntil ?? null,
          checkOutBy: policies.checkOutBy,
          cancellationPolicy: fromApiName<Property['cancellationPolicy']>(policies.cancellation),
          childrenAllowed: policies.childrenAllowed,
          petsAllowed: policies.petsAllowed,
          smokingPolicy: fromApiName<Property['smokingPolicy']>(policies.smoking),
          houseRules: policies.houseRules,
        };
      }
      case 'amenities':
        return { amenities: (input as AmenitiesSettingsDto).amenities };
      case 'integrations': {
        const integrations = input as IntegrationsSettingsDto;
        return {
          googleAnalyticsId: integrations.googleAnalyticsId ?? null,
          metaPixelId: integrations.metaPixelId ?? null,
          googleBusinessUrl: integrations.googleBusinessUrl ?? null,
          tripAdvisorUrl: integrations.tripAdvisorUrl ?? null,
          bookingComIcalUrl: integrations.bookingComIcalUrl ?? null,
          airbnbIcalUrl: integrations.airbnbIcalUrl ?? null,
        };
      }
      case 'advanced': {
        const advanced = input as AdvancedSettingsDto;
        return {
          sltdaNumber: advanced.sltdaNumber ?? null,
          vatNumber: advanced.vatNumber ?? null,
          invoicePrefix: advanced.invoicePrefix,
          bookingWindowDays: advanced.bookingWindowDays,
          minNoticeHours: advanced.minNoticeHours,
        };
      }
      default:
        throw new Error(`Unknown settings section: ${String(section)}`);
    }
  }

  // A retired type may stay on a property that already has it, but can't be newly chosen.
  private async propertyTypeId(name: string, current: PropertyWithLookups): Promise<number> {
    const code = fromApiName<string>(name);
    if (code === current.propertyType.code) return current.propertyTypeId;
    const type = await this.repository.findPropertyTypeByCode(code);
    if (!type?.isActive) throw fieldError('type', 'Choose a property type.');
    return type.id;
  }
}
