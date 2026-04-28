import { expect, type Page } from "@playwright/test";

/**
 * Picks the first available option in each visible variant group on a product page,
 * respecting `dependsOn` ordering. Optimized for the "Isabella" smoke flow but
 * defensive enough to be reused by future per-product specs.
 *
 * Strategy:
 *  1. Deterministic fast path (works for Isabella):
 *       - "Tipo di Pelle" → click button with text "Laminato" (rende visibile il gruppo Colore).
 *       - "Colore" → click prima swatch (button[aria-label]) ancora non selezionata.
 *  2. Generic fallback (per altri prodotti): scansiona ogni gruppo visibile, individua
 *     il control type (button row / color-swatch grid / select) e seleziona la prima
 *     opzione abilitata non ancora scelta. Itera fino a 6 volte per gestire i dependsOn.
 */
export async function selectFirstAvailableInEachGroup(page: Page): Promise<void> {
  // ── Fast path: Isabella-specific deterministic picks ────────────────────────
  const laminato = page.getByRole("button", { name: "Laminato", exact: true }).first();
  if (await laminato.isVisible().catch(() => false)) {
    await laminato.click();
    // Attendi che il gruppo Colore (color-swatch grid) compaia: la prima swatch è "Verde acqua"
    const verdeAcqua = page.getByRole("button", { name: "Verde acqua" }).first();
    await verdeAcqua.waitFor({ state: "visible", timeout: 5_000 }).catch(() => undefined);
    if (await verdeAcqua.isVisible().catch(() => false)) {
      await verdeAcqua.click();
    }
  }

  // ── Generic fallback: ensure ALL visible groups have a selection ────────────
  // Each group renders a toggle button (chevron + label) followed by either a
  // <select>, a swatch grid (button[aria-label][aria-pressed]), or a flex row of
  // <button> with text-only labels. We loop until either nothing changes or we've
  // covered every visible group.
  for (let pass = 0; pass < 6; pass++) {
    const beforeUrl = page.url();
    let madeProgress = false;

    // Try color-swatch buttons that are not yet pressed.
    const swatches = page.locator('button[aria-pressed="false"][aria-label]');
    const swatchCount = await swatches.count();
    if (swatchCount > 0) {
      // Click only ONE per pass — successive passes pick the next group's first option.
      const first = swatches.first();
      if (await first.isVisible().catch(() => false) && (await first.isEnabled().catch(() => false))) {
        await first.click();
        madeProgress = true;
      }
    }

    if (!madeProgress) {
      // Try button-type groups: text-only buttons inside variant area that are not yet selected.
      // We don't have a robust "selected" signal for button-type groups other than the visible
      // border state, so we rely on the deterministic fast path having already handled them.
      // If still nothing happened, exit early.
      break;
    }

    // Safety: stop if URL changed (we don't want to navigate away mid-pick).
    if (page.url() !== beforeUrl) break;
  }
}

/**
 * Asserts that the "Aggiungi al carrello" CTA is enabled.
 * Useful as a sanity check after picking variants.
 */
export async function expectAddToCartEnabled(page: Page): Promise<void> {
  const addBtn = page.getByRole("button", { name: /Aggiungi al carrello/i });
  await expect(addBtn).toBeEnabled({ timeout: 10_000 });
}
