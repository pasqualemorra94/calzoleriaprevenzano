/**
 * Admin Consent Logs — server-only
 *
 * Read-only query del registro ConsentLog per pannello admin /admin/consensi.
 * Filtri: type (cookie/preferences/analytics/marketing/privacy) + range date.
 * Pagination: 12/page (mirror admin orders).
 *
 * Lookup batch emails per evitare N+1 (join inline su user via id IN [...]).
 * UA truncato a 80 char per UI compatta.
 */

import { prisma } from "~/lib/db.server";
import type { PaginatedData } from "~/lib/types/api";
import type { ListConsentLogsInput } from "~/lib/validators/admin";

export interface AdminConsentLogItem {
  id: string;
  userId: string | null;
  userEmail: string | null;
  type: string;
  granted: boolean;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

export async function listConsentLogs(
  input: ListConsentLogsInput,
): Promise<PaginatedData<AdminConsentLogItem>> {
  const { page, perPage, type, createdFrom, createdTo } = input;
  const skip = (page - 1) * perPage;

  const conditions: Array<Record<string, unknown>> = [];
  if (type) conditions.push({ type });
  if (createdFrom || createdTo) {
    const range: Record<string, Date> = {};
    if (createdFrom) range.gte = createdFrom;
    if (createdTo) range.lte = createdTo;
    conditions.push({ createdAt: range });
  }
  const where = conditions.length > 0 ? { AND: conditions } : {};

  const [items, total] = await Promise.all([
    prisma.consentLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: perPage,
    }),
    prisma.consentLog.count({ where }),
  ]);

  // Lookup batch emails (avoid N+1)
  const userIds = Array.from(
    new Set(items.map((i) => i.userId).filter((id): id is string => id !== null)),
  );
  const users = userIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true },
      })
    : [];
  const emailMap = new Map(users.map((u) => [u.id, u.email]));

  return {
    items: items.map((l): AdminConsentLogItem => ({
      id: l.id,
      userId: l.userId,
      userEmail: l.userId ? emailMap.get(l.userId) ?? null : null,
      type: l.type,
      granted: l.granted,
      ip: l.ip,
      userAgent: l.userAgent ? l.userAgent.slice(0, 80) : null,
      createdAt: l.createdAt.toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / perPage),
  };
}
