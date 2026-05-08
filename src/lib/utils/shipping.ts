/**
 * Shipping helpers — puro, shared client/server.
 *
 * NON importa nulla da `.server.ts` per essere usabile sia da carrello/checkout
 * (client) sia da orders.server.ts (server).
 */

export interface ShippingConfigShape {
  cost: number;
  freeThreshold: number;
  enabled: boolean;
}

/**
 * Calcolo centralizzato del costo di spedizione.
 *
 * Regole (in ordine):
 *  1. enabled=false        → 0
 *  2. subtotal ≥ soglia    → 0 (spedizione gratuita)
 *  3. altrimenti           → cost arrotondato a 2 decimali
 */
export function computeShippingCost(
  subtotal: number,
  config: ShippingConfigShape,
): number {
  if (!config.enabled) return 0;
  if (subtotal >= config.freeThreshold) return 0;
  return Math.round(config.cost * 100) / 100;
}
