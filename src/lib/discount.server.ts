/**
 * Discount Service — server-only
 *
 * Helper puro condiviso per la validazione/calcolo dei codici sconto.
 * Single source of truth usata sia da `createOrder` (orders.server.ts) sia
 * dalla server function pubblica `$validateDiscount` (checkout-functions.ts).
 *
 * IMPORTANTE: questo helper NON incrementa `usedCount` e NON crea ordini —
 * è una funzione di sola lettura. L'increment di `usedCount` resta in
 * `createOrder`, una sola volta, solo a creazione ordine effettiva.
 */

import { prisma } from "~/lib/db.server";

export interface DiscountResult {
  valid: boolean;
  discountAmount: number;
  error?: string;
}

/**
 * Valida un codice sconto e calcola l'importo di sconto sul subtotale.
 * Logica identica a quella storica di `createOrder` (single source of truth),
 * SENZA mutazioni (nessun increment di usedCount).
 *
 * - Codice non trovato/scaduto → { valid: false, error: "Codice non valido o scaduto" }
 * - minOrder non soddisfatto → { valid: false, error: "Ordine minimo: €X" }
 * - maxUses esaurito → { valid: false, error: "Codice sconto esaurito" }
 * - valido → { valid: true, discountAmount }
 */
export async function validateDiscountCode(code: string, subtotal: number): Promise<DiscountResult> {
  const row = await prisma.discountCode.findFirst({
    where: {
      code: code.toUpperCase(),
      isActive: true,
      startsAt: { lte: new Date() },
      expiresAt: { gte: new Date() },
    },
  });

  if (!row) {
    return { valid: false, discountAmount: 0, error: "Codice non valido o scaduto" };
  }
  if (row.minOrder && subtotal < Number(row.minOrder)) {
    return { valid: false, discountAmount: 0, error: `Ordine minimo: €${Number(row.minOrder)}` };
  }
  if (row.maxUses && row.usedCount >= row.maxUses) {
    return { valid: false, discountAmount: 0, error: "Codice sconto esaurito" };
  }

  const discountAmount =
    row.type === "percentage"
      ? Math.round((Number(row.value) * subtotal) / 100 * 100) / 100
      : Math.min(Number(row.value), subtotal);

  return { valid: true, discountAmount };
}
