---
phase: 260519-eoa
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/email-templates.server.ts
  - src/lib/order-emails.server.ts
  - src/lib/webhook-stripe.server.ts
  - src/routes/api/checkout.ts
  - .env
  - .env.example
autonomous: true
requirements: [EOA-01, EOA-02, EOA-03, EOA-04]

must_haves:
  truths:
    - "Il cliente NON riceve più l'email di conferma alla creazione dell'ordine (pre-pagamento)"
    - "A pagamento confermato (checkout.session.completed) il cliente riceve la conferma d'ordine"
    - "A pagamento confermato il titolare riceve una notifica del nuovo ordine all'indirizzo EMAIL_ORDERS"
    - "Un fallimento di invio email NON fa fallire il webhook: handleCheckoutComplete restituisce sempre 200"
    - "Se EMAIL_ORDERS non è configurata, la conferma al cliente parte comunque e solo la notifica titolare viene saltata con log strutturato"
  artifacts:
    - path: "src/lib/email-templates.server.ts"
      provides: "Nuovo orderNotificationTemplate per il titolare"
      contains: "export function orderNotificationTemplate"
    - path: "src/lib/order-emails.server.ts"
      provides: "Service best-effort che invia conferma cliente + notifica titolare a pagamento confermato"
      exports: ["sendOrderConfirmedEmails"]
    - path: "src/lib/webhook-stripe.server.ts"
      provides: "handleCheckoutComplete che invoca sendOrderConfirmedEmails dopo confirmed + Payment"
      contains: "sendOrderConfirmedEmails"
    - path: "src/routes/api/checkout.ts"
      provides: "checkout senza invii email pre-pagamento"
    - path: ".env.example"
      provides: "Documentazione della nuova env EMAIL_ORDERS"
      contains: "EMAIL_ORDERS"
  key_links:
    - from: "src/lib/webhook-stripe.server.ts"
      to: "src/lib/order-emails.server.ts"
      via: "import + await sendOrderConfirmedEmails(orderId)"
      pattern: "sendOrderConfirmedEmails"
    - from: "src/lib/order-emails.server.ts"
      to: "src/lib/email.server.ts"
      via: "sendEmail per cliente e titolare"
      pattern: "sendEmail\\("
    - from: "src/lib/order-emails.server.ts"
      to: "prisma.order"
      via: "findUnique con include items + items.address"
      pattern: "prisma\\.order\\.findUnique"
---

<objective>
Spostare l'invio delle email d'ordine dal momento di creazione dell'ordine (pre-pagamento, dentro `/api/checkout`) al momento di conferma del pagamento (`checkout.session.completed` nel webhook Stripe). A pagamento confermato vengono inviate DUE email: la conferma al cliente (template esistente) e una nuova notifica al titolare (nuovo template), con destinatario dalla nuova env `EMAIL_ORDERS`.

Purpose: oggi il cliente riceve la conferma anche se poi non paga. La conferma deve arrivare solo dopo un pagamento effettivo, e il titolare deve essere avvisato di ogni nuovo ordine pagato.
Output: nuovo template `orderNotificationTemplate`, nuovo service `order-emails.server.ts`, `webhook-stripe.server.ts` che invia le email, `checkout.ts` ripulito dagli invii pre-pagamento, env `EMAIL_ORDERS` documentata.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@prisma/schema.prisma

<interfaces>
<!-- Contratti reali estratti dal codebase. L'executor li usa direttamente, niente esplorazione. -->

email.server.ts — sendEmail (transport SMTP/Resend, già configurato):
```typescript
interface SendEmailOptions { to: string; subject: string; html: string; replyTo?: string; }
interface SendEmailResult { ok: boolean; id?: string; }
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult>;
```

email-templates.server.ts — template esistenti (NON modificare la firma di orderConfirmationTemplate):
```typescript
interface OrderEmailData {
  customerName: string;
  orderNumber: string;
  items: Array<{ name: string; quantity: number; priceCents: number }>;
  totalCents: number;
}
export function orderConfirmationTemplate(data: OrderEmailData): string;
// Helper file-locali disponibili per il nuovo template: premiumEmailLayout, dataRow,
// escapeHtml, formatCurrency, formatDate, emailBrand. Riusarli, non reinventarli.
```

Prisma — shape REALE rilevante (da prisma/schema.prisma):
```
Order:      id, orderNumber, status, total (Decimal), guestEmail?, userId?
            relations: user? (user.name, user.email), items (OrderItem[])
OrderItem:  name (snapshot), quantity, price (Decimal), addressId?
            relation: address (Address?)
Address:    firstName, lastName, address1, address2?, city, province, postalCode, country, phone?
```
NOTE chiave sulla shape:
- NON esiste `Order.addressId`. L'indirizzo di spedizione è su `OrderItem.addressId` →
  tutti gli OrderItem dello stesso ordine puntano allo stesso Address. Prendere
  l'indirizzo dal PRIMO item: `order.items[0]?.address`.
- Email cliente = `order.guestEmail ?? order.user?.email`.
- Nome cliente = `order.user?.name` se utente loggato, altrimenti
  `${address.firstName} ${address.lastName}` dall'indirizzo.
- Telefono cliente = `address?.phone` (può essere null → mostrare "—").
- `total` e `price` sono `Decimal` Prisma: convertire con `Number(...)` prima di
  `Math.round(x * 100)` per ottenere i centesimi attesi dai template.

logger.server.ts — `createLogger("nome")` restituisce un logger con `.info/.warn/.error`.

webhook-stripe.server.ts — handleCheckoutComplete attuale (da modificare):
```typescript
async function handleCheckoutComplete(session: Stripe.Checkout.Session): Promise<WebhookResult> {
  if (session.mode === "payment") {
    const orderId = session.metadata?.orderId;
    if (orderId) {
      await prisma.order.update({ where: { id: orderId }, data: { status: "confirmed" } });
      await prisma.payment.create({ /* ... */ });
    }
  }
  return { ok: true, message: "Checkout completed", status: 200 };
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Aggiungere orderNotificationTemplate (notifica titolare)</name>
  <files>src/lib/email-templates.server.ts</files>
  <action>
    Aggiungere in fondo al file un nuovo template esportato `orderNotificationTemplate`
    per la notifica al TITOLARE (EOA-02). NON modificare i template esistenti.

    Definire una nuova interfaccia (sopra la funzione):
    ```typescript
    interface OrderNotificationData {
      orderNumber: string;
      customerName: string;
      customerEmail: string;
      customerPhone: string; // chi chiama passa "—" se assente
      shippingAddress: {
        address1: string;
        address2?: string;
        city: string;
        province: string;
        postalCode: string;
        country: string;
      };
      items: Array<{ name: string; quantity: number; priceCents: number }>;
      totalCents: number;
    }
    export function orderNotificationTemplate(data: OrderNotificationData): string;
    ```

    Il body HTML deve contenere, riusando i helper file-locali esistenti
    (`premiumEmailLayout`, `dataRow`, `escapeHtml`, `formatCurrency`, `formatDate`,
    `emailBrand`):
    - Titolo: "Nuovo ordine ricevuto" + sottotitolo con `#${orderNumber}` e `formatDate(new Date())`
      (stesso pattern di `orderConfirmationTemplate`).
    - Una tabella dati cliente con `dataRow`: Nome, Email, Telefono.
    - Una tabella indirizzo di spedizione con `dataRow`: Indirizzo (address1 + eventuale
      address2 su seconda riga / o concatenato con virgola), CAP + Città, Provincia, Paese.
    - Una tabella articoli con header "Articolo" / "Prezzo" e le righe item, identica
      per struttura a quella di `orderConfirmationTemplate` (riga item con
      `formatCurrency(priceCents * quantity)` e riga "Totale" finale con
      `formatCurrency(totalCents)`).
    - NESSUN CTA "Vai al negozio" (è una mail interna), NESSUN testo "Riceverai un'email".
    - `preheader`: `Nuovo ordine #${orderNumber} — ${formatCurrency(totalCents)}`.

    Tutti i valori dinamici di testo passano da `escapeHtml`. Tipi: zero `any`,
    rispettare lo stile del file.
  </action>
  <verify>
    <automated>pnpm typecheck</automated>
  </verify>
  <done>`orderNotificationTemplate` esportato, restituisce HTML con dati cliente, indirizzo, tabella articoli e totale; nessun CTA negozio; typecheck verde.</done>
</task>

<task type="auto">
  <name>Task 2: Creare order-emails.server.ts (service invio a pagamento confermato)</name>
  <files>src/lib/order-emails.server.ts</files>
  <action>
    Creare un nuovo service server-only `src/lib/order-emails.server.ts` che incapsula
    tutta la logica di invio email d'ordine post-pagamento (EOA-02, EOA-03). Estrarre
    qui la logica per NON far superare a `webhook-stripe.server.ts` il limite di 150 LOC
    di CLAUDE.md.

    Esportare un'unica funzione:
    ```typescript
    export async function sendOrderConfirmedEmails(orderId: string): Promise<void>;
    ```

    Comportamento:
    1. `const log = createLogger("order-emails")` (da `~/lib/logger.server`).
    2. Caricare l'ordine completo:
       ```typescript
       const order = await prisma.order.findUnique({
         where: { id: orderId },
         include: {
           user: { select: { name: true, email: true } },
           items: { include: { address: true } },
         },
       });
       ```
       Se `!order` → `log.error("Order not found for confirmation emails", { orderId })`
       e `return` (non lanciare).
    3. Derivare i dati REALI (vedi <interfaces>):
       - `address = order.items[0]?.address ?? null`
       - `customerEmail = order.guestEmail ?? order.user?.email ?? null`
       - `customerName = order.user?.name ?? (address ? `${address.firstName} ${address.lastName}` : "Cliente")`
       - `customerPhone = address?.phone ?? "—"`
       - `items = order.items.map(i => ({ name: i.name, quantity: i.quantity, priceCents: Math.round(Number(i.price) * 100) }))`
       - `totalCents = Math.round(Number(order.total) * 100)`
    4. CONFERMA CLIENTE — in un try/catch dedicato (`catch (e: unknown)`):
       - Se `customerEmail` è null → `log.warn("No customer email on order, skipping confirmation", { orderId })` e saltare solo questo invio.
       - Altrimenti `await sendEmail({ to: customerEmail, subject: `Conferma ordine ${order.orderNumber} — Calzoleria Prevenzano`, html: orderConfirmationTemplate({ customerName, orderNumber: order.orderNumber, items, totalCents }) })`.
       - Nel catch: `log.error("Failed to send customer confirmation email", { orderId, message: e instanceof Error ? e.message : String(e) })`. NON rilanciare.
    5. NOTIFICA TITOLARE — in un try/catch SEPARATO (`catch (e: unknown)`):
       - `const ordersEmail = process.env.EMAIL_ORDERS`.
       - Se non configurata (falsy) → `log.warn("EMAIL_ORDERS not configured, skipping owner notification", { orderId })` e `return` da questo blocco (la conferma cliente è già partita).
       - Se `!address` → `log.warn("No shipping address on order, skipping owner notification", { orderId })` e saltare.
       - Altrimenti `await sendEmail({ to: ordersEmail, subject: `Nuovo ordine ${order.orderNumber} — Calzoleria Prevenzano`, html: orderNotificationTemplate({ orderNumber: order.orderNumber, customerName, customerEmail: customerEmail ?? "—", customerPhone, shippingAddress: { address1: address.address1, address2: address.address2 ?? undefined, city: address.city, province: address.province, postalCode: address.postalCode, country: address.country }, items, totalCents }) })`.
       - Nel catch: `log.error("Failed to send owner notification email", { orderId, message: e instanceof Error ? e.message : String(e) })`. NON rilanciare.

    La funzione non lancia MAI: tutti i percorsi terminano normalmente. Import:
    `prisma` da `~/lib/db.server`, `createLogger` da `~/lib/logger.server`,
    `sendEmail` da `~/lib/email.server`, `orderConfirmationTemplate` +
    `orderNotificationTemplate` da `~/lib/email-templates.server`. Zero `any`.
  </action>
  <verify>
    <automated>pnpm typecheck</automated>
  </verify>
  <done>`sendOrderConfirmedEmails` esportato; carica l'ordine con include items+address+user; invia conferma cliente e notifica titolare in try/catch separati; salta solo la notifica titolare se EMAIL_ORDERS manca; non lancia mai; typecheck verde.</done>
</task>

<task type="auto">
  <name>Task 3: Wiring webhook + rimozione invii checkout + env EMAIL_ORDERS</name>
  <files>src/lib/webhook-stripe.server.ts, src/routes/api/checkout.ts, .env, .env.example</files>
  <action>
    Tre modifiche di wiring (EOA-01, EOA-03, EOA-04):

    A) `src/lib/webhook-stripe.server.ts` — in `handleCheckoutComplete`, DOPO
       `prisma.order.update({ status: "confirmed" })` e `prisma.payment.create(...)`,
       ancora dentro `if (orderId) { ... }`, aggiungere l'invio email best-effort:
       ```typescript
       try {
         await sendOrderConfirmedEmails(orderId);
       } catch (e: unknown) {
         log.error("Order confirmation emails threw", {
           orderId,
           message: e instanceof Error ? e.message : String(e),
         });
       }
       ```
       Aggiungere l'import: `import { sendOrderConfirmedEmails } from "~/lib/order-emails.server";`.
       `handleCheckoutComplete` DEVE comunque restituire
       `{ ok: true, message: "Checkout completed", status: 200 }` in tutti i casi —
       non aggiungere percorsi che ritornano status != 200 (altrimenti Stripe ritenta).
       Nota: `sendOrderConfirmedEmails` non lancia per design, ma il try/catch è una
       rete di sicurezza voluta.

    B) `src/routes/api/checkout.ts` — RIMUOVERE entrambi i blocchi di invio email
       pre-pagamento:
       - Ramo guest-shape: il blocco `// Order confirmation email (best-effort) — usa l'email dal form`
         con il `try { await sendEmail({...}) } catch {}` (circa righe 87-105).
       - Ramo auth-shape: il blocco `// Order confirmation email (best-effort)`
         con il `try { await sendEmail({...}) } catch {}` (circa righe 174-192).
       Rimuovere poi gli import diventati inutilizzati:
       `import { sendEmail } from "~/lib/email.server";` e
       `import { orderConfirmationTemplate } from "~/lib/email-templates.server";`.
       NON toccare nient'altro: la creazione ordine, la `createCheckoutSession` e le
       risposte `apiSuccess` restano identiche.

    C) Aggiungere la nuova env `EMAIL_ORDERS`:
       - In `.env.example`: dopo la riga `EMAIL_ADMIN=...` (riga ~25) aggiungere:
         ```
         # Destinatario notifiche nuovi ordini (titolare). Se vuoto, la notifica
         # titolare viene saltata ma la conferma cliente parte comunque.
         EMAIL_ORDERS="ordini@yourdomain.com"
         ```
       - In `.env`: dopo la riga `EMAIL_ADMIN=...` aggiungere:
         ```
         EMAIL_ORDERS="ordini@calzoleriaprevenzano.it"
         ```
       Mantenere lo stile delle righe vicine (virgolette doppie come EMAIL_FROM/EMAIL_ADMIN).
  </action>
  <verify>
    <automated>pnpm typecheck && pnpm lint && grep -q 'EMAIL_ORDERS' .env.example && grep -q 'sendOrderConfirmedEmails' src/lib/webhook-stripe.server.ts && ! grep -q 'orderConfirmationTemplate' src/routes/api/checkout.ts</automated>
  </verify>
  <done>webhook invoca `sendOrderConfirmedEmails` dentro `handleCheckoutComplete` con try/catch e ritorna sempre 200; `checkout.ts` non contiene più invii email né import `sendEmail`/`orderConfirmationTemplate`; `EMAIL_ORDERS` presente in `.env` e `.env.example`; typecheck e lint verdi.</done>
</task>

</tasks>

<verification>
- `pnpm typecheck` e `pnpm lint` passano.
- `src/routes/api/checkout.ts` non contiene più `sendEmail(` né `orderConfirmationTemplate` (import e chiamate rimossi).
- `handleCheckoutComplete` in `webhook-stripe.server.ts` chiama `sendOrderConfirmedEmails(orderId)` dopo aver creato il Payment e restituisce sempre `status: 200`.
- `src/lib/webhook-stripe.server.ts` resta entro 150 LOC (la logica email è nel service dedicato).
- `EMAIL_ORDERS` presente e commentata in `.env` e `.env.example`.
</verification>

<success_criteria>
- Alla creazione ordine in `/api/checkout` NON parte alcuna email (verificabile: nessun `sendEmail` nel file).
- A `checkout.session.completed` con `mode === "payment"` e `orderId` in metadata: l'ordine va a `confirmed`, il `Payment` è creato, e partono conferma cliente (`orderConfirmationTemplate`) + notifica titolare (`orderNotificationTemplate`) verso `EMAIL_ORDERS`.
- Un fallimento `sendEmail` (cliente o titolare) viene loggato con `createLogger` e NON fa fallire il webhook: `handleCheckoutComplete` restituisce 200.
- Se `EMAIL_ORDERS` non è configurata: la conferma cliente parte comunque, solo la notifica titolare è saltata con `log.warn`.
</success_criteria>

<output>
After completion, create `.planning/quick/260519-eoa-email-ordine-a-pagamento-confermato-conf/260519-eoa-SUMMARY.md`
</output>
