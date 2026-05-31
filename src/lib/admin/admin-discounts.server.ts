/**
 * Discount Codes Service — server-only
 *
 * Gestione codici sconto in PERCENTUALE per il pannello admin.
 * Il modello Prisma `DiscountCode` esiste già; qui si espongono le sole
 * operazioni admin: list / create / toggle. Il campo `type` è fisso a
 * "percentage" (la UI offre solo sconti percentuali) e il `code` è sempre
 * salvato in UPPERCASE per compatibilità con la lookup di `orders.server.ts`.
 * Decimal serializzato in `number` e date in ISO string verso il client.
 */

import { prisma } from "~/lib/db.server";
import { createLogger } from "~/lib/logger.server";
import {
  createDiscountCodeSchema,
  toggleDiscountCodeSchema,
  type CreateDiscountCodeInput,
  type ToggleDiscountCodeInput,
} from "~/lib/validators/admin";

const log = createLogger("admin-discounts");

/** Shape serializzabile restituita al client (no Decimal/Date Prisma). */
export interface DiscountCodeListItem {
  id: string;
  code: string;
  value: number; // percentuale
  minOrder: number | null;
  maxUses: number | null;
  usedCount: number;
  startsAt: string; // ISO string
  expiresAt: string; // ISO string
  isActive: boolean;
  createdAt: string; // ISO string
}

/** Riga Prisma DiscountCode → DiscountCodeListItem serializzabile. */
function toListItem(row: {
  id: string;
  code: string;
  value: { toString(): string };
  minOrder: { toString(): string } | null;
  maxUses: number | null;
  usedCount: number;
  startsAt: Date;
  expiresAt: Date;
  isActive: boolean;
  createdAt: Date;
}): DiscountCodeListItem {
  return {
    id: row.id,
    code: row.code,
    value: Number(row.value),
    minOrder: row.minOrder === null ? null : Number(row.minOrder),
    maxUses: row.maxUses ?? null,
    usedCount: row.usedCount,
    startsAt: row.startsAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Elenco di tutti i codici sconto, più recenti prima. */
export async function listDiscountCodes(): Promise<DiscountCodeListItem[]> {
  const rows = await prisma.discountCode.findMany({
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toListItem);
}

/**
 * Crea un nuovo codice sconto percentuale.
 * Valida via zod (code già uppercased dal transform), verifica univocità,
 * persiste con type="percentage", usedCount=0 e isActive=true (default schema).
 */
export async function createDiscountCode(
  input: CreateDiscountCodeInput,
  userId: string,
): Promise<DiscountCodeListItem> {
  const parsed = createDiscountCodeSchema.parse(input);

  const existing = await prisma.discountCode.findUnique({
    where: { code: parsed.code },
  });
  if (existing) {
    throw new Error("Esiste già un codice con questo nome");
  }

  const row = await prisma.discountCode.create({
    data: {
      code: parsed.code,
      type: "percentage",
      value: parsed.value,
      minOrder: parsed.minOrder ?? null,
      maxUses: parsed.maxUses ?? null,
      startsAt: parsed.startsAt,
      expiresAt: parsed.expiresAt,
    },
  });

  log.info("discount_code.created", {
    userId,
    code: parsed.code,
    value: parsed.value,
  });

  return toListItem(row);
}

/** Attiva/disattiva un codice sconto esistente. */
export async function toggleDiscountCode(
  input: ToggleDiscountCodeInput,
  userId: string,
): Promise<DiscountCodeListItem> {
  const parsed = toggleDiscountCodeSchema.parse(input);

  const row = await prisma.discountCode.update({
    where: { id: parsed.id },
    data: { isActive: parsed.isActive },
  });

  log.info("discount_code.toggled", {
    userId,
    id: parsed.id,
    isActive: parsed.isActive,
  });

  return toListItem(row);
}
