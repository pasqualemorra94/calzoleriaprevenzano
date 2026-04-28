import { test, expect, request as pwRequest } from "@playwright/test";
import { selectFirstAvailableInEachGroup, expectAddToCartEnabled } from "./helpers/variants";

const BASE_URL = "https://calzoleria-prevenzano-production.up.railway.app";

interface ProductListItem {
  slug: string;
  name: string;
}

interface ApiSuccess<T> {
  ok: true;
  data: T;
}

interface ProductsPage {
  items: ProductListItem[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Discover all product slugs from the live products API.
 * Pages through /api/products until totalPages is exhausted.
 * Runs ONCE before the test declarations are emitted (top-level await
 * is supported in Playwright spec files because they are ESM modules).
 */
async function discoverSlugs(): Promise<string[]> {
  const ctx = await pwRequest.newContext({ baseURL: BASE_URL });
  const slugs: string[] = [];
  let page = 1;
  const perPage = 50;
  // Hard cap to avoid runaway loops.
  while (page <= 20) {
    const res = await ctx.get(`/api/products?page=${page}&perPage=${perPage}`);
    if (!res.ok()) break;
    const json = (await res.json()) as ApiSuccess<ProductsPage>;
    if (!json.ok) break;
    for (const item of json.data.items) {
      if (item.slug) slugs.push(item.slug);
    }
    if (page >= json.data.totalPages) break;
    page++;
  }
  await ctx.dispose();
  return slugs;
}

const SLUGS = await discoverSlugs();

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

test.describe("compra tutti i prodotti (parametric)", () => {
  if (SLUGS.length === 0) {
    test("discovery returned zero slugs — bail", () => {
      throw new Error("No slugs discovered from /api/products — check the live API");
    });
    return;
  }

  for (const slug of SLUGS) {
    test(`compra ${slug}`, async ({ page }) => {
      const email = `e2e+${slug}@test.calzoleriaprevenzano.it`;

      await page.goto(`/prodotti/${slug}`);

      // Some products may not exist (404) — the route may render a not-found
      // state; if so, fail with a clear message.
      await expect(page.locator("h1, [role='heading']").first()).toBeVisible({ timeout: 15_000 });

      await selectFirstAvailableInEachGroup(page);
      await expectAddToCartEnabled(page);

      await Promise.all([
        page.waitForResponse(
          (res) => res.url().includes("/api/cart") && res.request().method() === "POST" && res.ok(),
          { timeout: 15_000 },
        ),
        page.getByRole("button", { name: /Aggiungi al carrello/i }).click(),
      ]);

      await page.goto("/carrello");
      await page.getByRole("link", { name: /Procedi al checkout/i }).click();
      await expect(page).toHaveURL(/\/checkout$/);

      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Nome", { exact: true }).fill(FORM.firstName);
      await page.getByLabel("Cognome", { exact: true }).fill(FORM.lastName);
      await page.getByLabel("Indirizzo", { exact: true }).fill(FORM.address1);
      await page.getByLabel("Città", { exact: true }).fill(FORM.city);
      await page.getByLabel("Provincia", { exact: true }).fill(FORM.province);
      await page.getByLabel("CAP", { exact: true }).fill(FORM.postalCode);
      const phone = page.getByLabel("Telefono", { exact: true });
      if (await phone.isVisible().catch(() => false)) {
        await phone.fill(FORM.phone);
      }

      await Promise.all([
        page.waitForURL(/checkout\.stripe\.com/, { timeout: 60_000 }),
        page.getByRole("button", { name: /Conferma e paga|Paga|Vai al pagamento|Procedi/i }).click(),
      ]);

      await page.locator('input[name="cardNumber"]').fill(CARD.number);
      await page.locator('input[name="cardExpiry"]').fill(CARD.exp);
      await page.locator('input[name="cardCvc"]').fill(CARD.cvc);
      const billingName = page.locator('input[name="billingName"]');
      if (await billingName.isVisible().catch(() => false)) await billingName.fill(CARD.name);
      const billingPostalCode = page.locator('input[name="billingPostalCode"]');
      if (await billingPostalCode.isVisible().catch(() => false)) await billingPostalCode.fill(CARD.zip);

      const payButton = page
        .getByTestId("hosted-payment-submit-button")
        .or(page.getByRole("button", { name: /^Pay\b|Paga/i }));

      await Promise.all([
        page.waitForURL(/\/ordine-confermato\?session_id=cs_test_/, { timeout: 90_000 }),
        payButton.first().click(),
      ]);

      // Tolerate webhook lag — both headings count as success.
      const heading = page.getByRole("heading", {
        name: /Ordine confermato|Pagamento in elaborazione/i,
      });
      await expect(heading).toBeVisible({ timeout: 30_000 });

      const headingText = (await heading.textContent()) ?? "";
      if (/Ordine confermato/i.test(headingText)) {
        await expect(page.getByText(/Numero ordine:/i)).toBeVisible();
        const totalText = await page.getByText(/Totale/i).first().innerText();
        expect(totalText).toMatch(/€\s*\d+(\.\d{2})?/);
        // Best-effort: extract numeric total and assert > 0.
        const match = totalText.match(/€\s*(\d+(?:\.\d{2})?)/);
        if (match) {
          const value = Number.parseFloat(match[1]);
          expect(value).toBeGreaterThan(0);
        }
      }
    });
  }
});
