/**
 * Checkout public server functions
 *
 * `$validateDiscount` espone l'anteprima sconto live al checkout — NESSUN
 * auth guard (è pubblica, mostrata in UI prima della conferma ordine).
 *
 * Sola lettura: NESSUNA creazione ordine, NESSUN increment di `usedCount`
 * (l'helper condiviso `validateDiscountCode` non muta nulla). Il server resta
 * autorevole al submit: `createOrder` ri-valida e incrementa una sola volta.
 */

import { createServerFn } from "@tanstack/react-start";
import { validateDiscountCode } from "~/lib/discount.server";
import { validateDiscountSchema, type ValidateDiscountInput } from "~/lib/validators/products";

export const $validateDiscount = createServerFn({ method: "POST" })
  .inputValidator((data: ValidateDiscountInput) => validateDiscountSchema.parse(data))
  .handler(async ({ data }) => {
    return validateDiscountCode(data.code, data.subtotal);
  });
