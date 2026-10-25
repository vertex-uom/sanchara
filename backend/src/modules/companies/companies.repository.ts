import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';

// Prisma access for companies. Only CompaniesService uses it.
@Injectable()
export class CompaniesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.company.findUnique({ where: { id } });
  }

  findBySubdomain(subdomain: string) {
    return this.prisma.company.findUnique({ where: { subdomain } });
  }

  create(company: { name: string; subdomain: string }) {
    return this.prisma.company.create({ data: company });
  }
}
