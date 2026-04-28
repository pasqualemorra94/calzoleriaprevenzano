import { test, expect } from "@playwright/test";
import { selectFirstAvailableInEachGroup, expectAddToCartEnabled } from "./helpers/variants";

const PRODUCT_SLUG = "isabella" as const;
const TEST_EMAIL = `e2e+${PRODUCT_SLUG}@test.calzoleriaprevenzano.it`;

const FORM = {
  firstName: "E2E",
  lastName: "Test",
  address1: "Via Roma 1",
  city: "Roma",
  province: "RM",
  postalCode: "00100",
  phone: "+39 333 1234567",
} as const;

const CARD = {
  number: "4242 4242 4242 4242",
  exp: "12 / 34",
  cvc: "123",
  name: "E2E Test",
  zip: "00100",
} as const;

test("smoke: buy one Isabella sandalo end-to-end on live Railway", async ({ page }) => {
  // ── 1. Open product page ─────────────────────────────────────────────
  await page.goto(`/prodotti/${PRODUCT_SLUG}`);
  await expect(page.getByRole("heading", { name: /Isabella/i }).first()).toBeVisible();

  // ── 2. Pick variants (Tipo di Pelle = Laminato, then Colore = Verde acqua) ──
  await selectFirstAvailableInEachGroup(page);
  await expectAddToCartEnabled(page);

  // ── 3. Add to cart ──────────────────────────────────────────────────
  await page.getByRole("button", { name: /Aggiungi al carrello/i }).click();
  // Button text briefly becomes "Aggiunto!" — confirm we got past the click
  await expect(page.getByRole("button", { name: /Aggiunto|Aggiungi al carrello/i })).toBeVisible();

  // ── 4. Go to cart ───────────────────────────────────────────────────
  await page.goto("/carrello");
  await expect(page.getByText(/Isabella/i).first()).toBeVisible();

  // ── 5. Proceed to checkout ──────────────────────────────────────────
  await page.getByRole("link", { name: /Procedi al checkout/i }).click();
  await expect(page).toHaveURL(/\/checkout$/);

  // ── 6. Fill checkout form ───────────────────────────────────────────
  await page.getByLabel("Email").fill(TEST_EMAIL);
  await page.getByLabel("Nome", { exact: true }).fill(FORM.firstName);
  await page.getByLabel("Cognome", { exact: true }).fill(FORM.lastName);
  await page.getByLabel("Indirizzo", { exact: true }).fill(FORM.address1);
  await page.getByLabel("Città", { exact: true }).fill(FORM.city);
  await page.getByLabel("Provincia", { exact: true }).fill(FORM.province);
  await page.getByLabel("CAP", { exact: true }).fill(FORM.postalCode);
  // Phone is optional but harmless to fill
  const phone = page.getByLabel("Telefono", { exact: true });
  if (await phone.isVisible().catch(() => false)) {
    await phone.fill(FORM.phone);
  }

  // ── 7. Submit → wait for Stripe redirect ────────────────────────────
  // The submit button lives inside <OrderSummary> and reads "Conferma e paga".
  // After click, POST /api/checkout fires and a 2 s setTimeout sets
  // window.location.href to the Stripe URL.
  await Promise.all([
    page.waitForURL(/checkout\.stripe\.com/, { timeout: 60_000 }),
    page.getByRole("button", { name: /Conferma e paga|Paga|Vai al pagamento|Procedi/i }).click(),
  ]);

  // ── 8. Fill Stripe Hosted Checkout (top-level page, NOT iframe) ─────
  // Locale is forced to en-US in playwright.config.ts so labels are stable.
  // Stripe's hosted page exposes inputs by name="..."; use those as primary
  // selectors (label fallback if the name attribute changes).
  const cardNumber = page.locator('input[name="cardNumber"]').or(page.getByLabel("Card number"));
  await cardNumber.fill(CARD.number);

  const cardExpiry = page.locator('input[name="cardExpiry"]').or(page.getByLabel(/Expiration|MM \/ YY/));
  await cardExpiry.fill(CARD.exp);

  const cardCvc = page.locator('input[name="cardCvc"]').or(page.getByLabel("CVC"));
  await cardCvc.fill(CARD.cvc);

  const billingName = page.locator('input[name="billingName"]').or(page.getByLabel(/Cardholder name|Name on card/));
  if (await billingName.first().isVisible().catch(() => false)) {
    await billingName.first().fill(CARD.name);
  }

  const billingPostalCode = page
    .locator('input[name="billingPostalCode"]')
    .or(page.getByLabel(/ZIP|Postal code/));
  if (await billingPostalCode.first().isVisible().catch(() => false)) {
    await billingPostalCode.first().fill(CARD.zip);
  }

  // ── 9. Pay → wait for redirect back to /ordine-confermato ───────────
  const payButton = page
    .getByTestId("hosted-payment-submit-button")
    .or(page.getByRole("button", { name: /^Pay\b|Paga/i }));

  await Promise.all([
    page.waitForURL(/\/ordine-confermato\?session_id=cs_test_/, { timeout: 90_000 }),
    payButton.first().click(),
  ]);

  // ── 10. Assert confirmation page renders order info ────────────────
  // Tolerate BOTH "Ordine confermato" and "Pagamento in elaborazione" as success
  // states for the smoke (webhook may not have fired yet in time).
  const heading = page.getByRole("heading", {
    name: /Ordine confermato|Pagamento in elaborazione/i,
  });
  await expect(heading).toBeVisible({ timeout: 30_000 });

  const headingText = (await heading.textContent()) ?? "";
  if (/Ordine confermato/i.test(headingText)) {
    await expect(page.getByText(/Numero ordine:/i)).toBeVisible();
    const orderLine = await page.getByText(/Numero ordine:/i).innerText();
    expect(orderLine).toMatch(/Numero ordine:\s*[A-Z0-9-]{4,}/);

    const totalText = await page.getByText(/Totale/i).first().innerText();
    expect(totalText).toMatch(/€\s*\d+(\.\d{2})?/);
  }
});
