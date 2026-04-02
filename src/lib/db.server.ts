/**
 * Prisma Client Singleton — server-only
 *
 * Ensures a single Prisma client instance is used across the server
 * to avoid connection pool exhaustion in development (HMR).
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
