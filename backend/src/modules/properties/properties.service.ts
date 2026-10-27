import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException } from '../../common/errors/app-exception.js';
import { isUniqueViolation, type Db } from '../../common/prisma/db.js';
import { PropertiesRepository } from './properties.repository.js';
import { nextFreeSlug, slugify } from './slug.js';

export type PropertyTypeOption = { code: string; name: string };
export type ProvinceOption = { id: number; name: string; districts: { id: number; name: string }[] };

export type NewPropertyInput = {
  companyId: string;
  propertyTypeId: number;
  name: string;
  address: { line1: string; line2: string | null; city: string; districtId: number; postalCode: string | null };
};

// Properties owned by a company, plus the reference data they use
// (property types, Sri Lankan provinces and districts).
@Injectable()
export class PropertiesService {
  constructor(private readonly repository: PropertiesRepository) {}

  async propertyTypes(): Promise<PropertyTypeOption[]> {
    const types = await this.repository.activePropertyTypes();
    return types.map(({ code, name }) => ({ code, name }));
  }

  async provinces(): Promise<ProvinceOption[]> {
    const provinces = await this.repository.provincesWithDistricts();
    return provinces.map(({ id, name, districts }) => ({ id, name, districts: districts.map((d) => ({ id: d.id, name: d.name })) }));
  }

  // Null when the code is unknown or the type is retired.
  async findSelectablePropertyType(code: string) {
    const type = await this.repository.findPropertyTypeByCode(code);
    return type?.isActive ? type : null;
  }

  findDistrict(id: number) {
    return this.repository.findDistrict(id);
  }

  // Pass `db` to create the property inside a caller's transaction. The slug
  // comes from the name; a parallel request taking the same slug is a 409.
  async create(input: NewPropertyInput, db?: Db) {
    const base = slugify(input.name);
    const slug = nextFreeSlug(base, await this.repository.slugsStartingWith(base, db));
    try {
      return await this.repository.create(
        {
          companyId: input.companyId,
          propertyTypeId: input.propertyTypeId,
          name: input.name,
          slug,
          addressLine1: input.address.line1,
          addressLine2: input.address.line2,
          city: input.address.city,
          districtId: input.address.districtId,
          postalCode: input.address.postalCode,
        },
        db,
      );
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      throw new AppException(HttpStatus.CONFLICT, 'CONFLICT', 'Another request changed the same data. Please try again.');
    }
  }
}
