/**
 * ShippingConfig Service — server-only
 *
 * Singleton config (id="default") per costo/soglia/abilitazione spedizione.
 * Cache in-memory con TTL 30s per ridurre query DB su traffico carrello/checkout.
 * Cache invalidata su update.
 */

import { prisma } from "~/lib/db.server";
import { createLogger } from "~/lib/logger.server";
import {
  updateShippingConfigSchema,
  type UpdateShippingConfigInput,
} from "~/lib/validators/admin";

// Re-export pure helper così i consumer server possono importare un solo modulo.
export { computeShippingCost } from "~/lib/utils/shipping";
export type { ShippingConfigShape } from "~/lib/utils/shipping";

const log = createLogger("shipping-config");

const SINGLETON_ID = "default";
const CACHE_TTL_MS = 30_000;

export interface ShippingConfigData {
  cost: number;
  freeThreshold: number;
  enabled: boolean;
  updatedAt: Date;
}

let cache: { data: ShippingConfigData; expiresAt: number } | null = null;

export function invalidateShippingConfigCache(): void {
  cache = null;
}

/**
 * Restituisce la config corrente. Se la riga non esiste (primo deploy),
 * la crea con i default schema (cost=7.90, freeThreshold=99.00, enabled=true)
 * preservando il comportamento attuale del sito.
 */
export async function getShippingConfig(): Promise<ShippingConfigData> {
  if (cache && cache.expiresAt > Date.now()) return cache.data;

  const row = await prisma.shippingConfig.upsert({
    where: { id: SINGLETON_ID },
    update: {},
    create: { id: SINGLETON_ID }, // i default sono nello schema
  });

  const data: ShippingConfigData = {
    cost: Number(row.cost),
    freeThreshold: Number(row.freeThreshold),
    enabled: row.enabled,
    updatedAt: row.updatedAt,
  };
  cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
  return data;
}

/**
 * Aggiorna la config. Valida via zod, upsert sul singleton, invalida cache.
 */
export async function updateShippingConfig(
  input: UpdateShippingConfigInput,
  userId: string,
): Promise<ShippingConfigData> {
  const parsed = updateShippingConfigSchema.parse(input);

  const row = await prisma.shippingConfig.upsert({
    where: { id: SINGLETON_ID },
    update: {
      cost: parsed.cost,
      freeThreshold: parsed.freeThreshold,
      enabled: parsed.enabled,
      updatedById: userId,
    },
    create: {
      id: SINGLETON_ID,
      cost: parsed.cost,
      freeThreshold: parsed.freeThreshold,
      enabled: parsed.enabled,
      updatedById: userId,
    },
  });

  invalidateShippingConfigCache();
  log.info("shipping_config.updated", { userId, ...parsed });

  return {
    cost: Number(row.cost),
    freeThreshold: Number(row.freeThreshold),
    enabled: row.enabled,
    updatedAt: row.updatedAt,
  };
}
