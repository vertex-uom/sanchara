import type { Prisma } from '../../generated/prisma/client.js';
import type { PrismaService } from './prisma.service.js';

// What a repository writes with: the shared client, or an open transaction
// passed down by the service that started it, so writes made by several
// modules commit or roll back together.
export type Db = PrismaService | Prisma.TransactionClient;

// Prisma's unique-constraint error, matched by code so no runtime import is needed.
export function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'P2002';
}
