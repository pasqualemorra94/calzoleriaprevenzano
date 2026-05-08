/**
 * Shipping public server functions
 *
 * `$getPublicShippingConfig` espone la configurazione spedizione corrente
 * a client pubblico (carrello, checkout) — NESSUN auth guard, è solo
 * costo/soglia/abilitazione (informazione mostrata in UI prima del checkout).
 *
 * Per accesso/modifica admin usa `$getShippingConfig` / `$updateShippingConfig`
 * in `~/lib/admin-functions.ts` (con `requireAdmin()` guard).
 */

import { createServerFn } from "@tanstack/react-start";
import { getShippingConfig } from "~/lib/admin/shipping-config.server";

export const $getPublicShippingConfig = createServerFn({ method: "GET" }).handler(async () => {
  return getShippingConfig();
});
