import { expect, type Page } from "@playwright/test";

/**
 * Picks the first available option in each visible variant group on a product page,
 * respecting `dependsOn` ordering. Optimized for the "Isabella" smoke flow but
 * defensive enough to work on every parametric slug in `all-products-purchase.spec.ts`.
 *
 * Strategy:
 *  1. Deterministic fast path (Isabella smoke):
 *       - "Tipo di Pelle" → click button "Laminato" (rende visibile il gruppo Colore).
 *       - "Colore"        → click swatch "Verde acqua".
 *     Mantenuto verbatim per back-compat con il test smoke esistente.
 *  2. Generic per-group scan (per tutti gli altri prodotti):
 *       - Trova il container `div.space-y-5` che racchiude tutti i gruppi varianti.
 *       - Itera ogni gruppo (figlio diretto, ordine DOM ⇒ parent prima, child dopo).
 *       - Per ogni gruppo prova nell'ordine: <select> → bottoni interni (swatch o plain).
 *       - Esclude esplicitamente il bottone-heading (chevron + label) e i bottoni di zoom
 *         degli swatch (`aria-label` che inizia con "Ingrandisci").
 *       - Salta gli swatch già pressati (`aria-pressed="true"`) — i plain button non
 *         hanno aria-pressed quindi un eventuale click ridondante è idempotente lato React.
 *       - Ri-conta i gruppi dopo ogni click: dependsOn può materializzare nuovi gruppi.
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

  // ── Generic per-group scan ──────────────────────────────────────────────────
  // VariantSelector renders all visible groups inside <div className="space-y-5">.
  // Each group is a direct child div (motion m.div) containing:
  //   [0] heading <button> (chevron + label, toggles collapse)
  //   [1] OptionGroupControl: <select> | swatch grid (buttons w/ aria-pressed) | plain button row
  const groupsRoot = page.locator("div.space-y-5").first();
  if (!(await groupsRoot.isVisible().catch(() => false))) {
    // Nessun gruppo varianti (es. borsello senza varianti) → niente da fare.
    return;
  }

  const groups = groupsRoot.locator("> div");
  let count = await groups.count();
  if (count === 0) return;

  for (let i = 0; i < count; i++) {
    const group = groups.nth(i);
    await group.waitFor({ state: "visible", timeout: 5_000 }).catch(() => undefined);
    if (!(await group.isVisible().catch(() => false))) continue;

    // 1) Try <select> control first (>8 options or explicitly typed in variantConfig).
    const sel = group.locator("select").first();
    if ((await sel.count()) > 0 && (await sel.isVisible().catch(() => false))) {
      const optionValues = await sel.locator("option:not([disabled])").evaluateAll((els) =>
        els
          .map((el) => (el as HTMLOptionElement).value)
          .filter((v) => v !== ""),
      );
      if (optionValues.length > 0) {
        await sel.selectOption(optionValues[0]);
        await page.waitForTimeout(150);
        // dependsOn può aver materializzato un nuovo gruppo: ricalcola count.
        const newCount = await groups.count();
        if (newCount > count) count = newCount;
        continue;
      }
    }

    // 2) Try buttons inside the group (swatch grid OR plain button row).
    // Skip index 0 (heading toggle) e gli zoom button degli swatch.
    const candidateButtons = group.locator("button:not([disabled])");
    const total = await candidateButtons.count();
    let clicked = false;
    for (let b = 1; b < total; b++) {
      const btn = candidateButtons.nth(b);
      const ariaLabel = await btn.getAttribute("aria-label");
      if (ariaLabel && ariaLabel.startsWith("Ingrandisci")) continue;

      // Swatch già selezionato → cerca il prossimo non selezionato.
      const ariaPressed = await btn.getAttribute("aria-pressed");
      if (ariaPressed === "true") continue;

      if (!(await btn.isVisible().catch(() => false))) continue;

      await btn.click();
      clicked = true;
      break;
    }

    if (clicked) {
      await page.waitForTimeout(150);
      // Ricalcola count nel caso un dependsOn child sia appena comparso.
      const newCount = await groups.count();
      if (newCount > count) count = newCount;
    }
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
