/**
 * Shipping helpers — puro, shared client/server.
 *
 * NON importa nulla da `.server.ts` per essere usabile sia da carrello/checkout
 * (client) sia da orders.server.ts (server).
 */

export interface ShippingConfigShape {
  cost: number;
  freeThreshold: number;
  costEstero: number;
  freeThresholdEstero: number;
  enabled: boolean;
}

/**
 * Calcolo centralizzato del costo di spedizione.
 *
 * Zona binaria: Italia (default) vs estero (`isEstero=true`).
 * Per l'estero si usano `costEstero`/`freeThresholdEstero`, altrimenti
 * `cost`/`freeThreshold`.
 *
 * Regole (in ordine):
 *  1. enabled=false        → 0
 *  2. subtotal ≥ soglia    → 0 (spedizione gratuita)
 *  3. altrimenti           → costo arrotondato a 2 decimali
 *
 * `isEstero` ha default `false` → i call site esistenti (carrello, preview
 * checkout) restano retrocompatibili e stimano la tariffa Italia.
 */
export function computeShippingCost(
  subtotal: number,
  config: ShippingConfigShape,
  isEstero = false,
): number {
  if (!config.enabled) return 0;
  const cost = isEstero ? config.costEstero : config.cost;
  const freeThreshold = isEstero
    ? config.freeThresholdEstero
    : config.freeThreshold;
  if (subtotal >= freeThreshold) return 0;
  return Math.round(cost * 100) / 100;
}
