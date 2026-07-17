---
phase: quick-260717-rev
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/email-templates.server.ts
  - src/lib/order-emails.server.ts
autonomous: true
requirements: [EMAIL-ORDER-VARIANT-01]
must_haves:
  truths:
    - "L'email di conferma cliente mostra, sotto ogni articolo, la variante selezionata (variantName) quando presente"
    - "L'email di conferma cliente mostra ogni opzione personalizzazione (label: value) quando presente"
    - "L'email di notifica titolare mostra le stesse informazioni di variante e opzioni sotto ogni articolo"
    - "Quando un'opzione ha un colore valido, viene reso un piccolo swatch inline accanto al valore"
    - "Un colore non valido/non-hex NON viene iniettato nello style (nessuna injection), lo swatch viene semplicemente omesso"
  artifacts:
    - path: "src/lib/email-templates.server.ts"
      provides: "Interfacce item estese + rendering variante/opzioni con swatch sanitizzato in entrambi i template"
      contains: "variantName"
    - path: "src/lib/order-emails.server.ts"
      provides: "Mapping di variantName e selectedOptions da OrderItem verso i template"
      contains: "selectedOptions"
  key_links:
    - from: "src/lib/order-emails.server.ts"
      to: "src/lib/email-templates.server.ts"
      via: "items[] passato a orderConfirmationTemplate e orderNotificationTemplate con variantName + selectedOptions"
      pattern: "variantName"
---

<objective>
Le mail d'ordine (conferma cliente + notifica titolare) attualmente scartano la variante e le opzioni di personalizzazione selezionate dal cliente. I dati esistono già su `OrderItem.variantName` (String?) e `OrderItem.selectedOptions` (Json?, shape `Array<{ label: string; value: string; color?: string }>`) e sono visibili in admin, ma vengono persi nel layer email.

Questo piano ripristina quelle informazioni in entrambe le mail, includendo un piccolo swatch di colore inline quando l'opzione ne definisce uno.

Purpose: il cliente e il titolare devono vedere COSA è stato ordinato davvero (es. tacco, tipo/colore pelle, gioiello) nelle mail, non solo il nome prodotto.
Output: 2 file modificati (template email + servizio email), zero modifiche DB/schema/migration.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@CLAUDE.md
@.planning/STATE.md

<interfaces>
<!-- Contratti chiave già presenti nel codebase. L'executor li usa direttamente, niente esplorazione. -->

Shape di selectedOptions su OrderItem (Json), pattern canonico di narrowing già usato altrove:
```ts
// src/lib/admin/admin-orders.server.ts:156
selectedOptions: item.selectedOptions as Array<{ label: string; value: string; color?: string }> | null,
```

Helper e token GIÀ disponibili in src/lib/email-templates.server.ts (NON reimplementare):
```ts
function escapeHtml(str: string): string   // riga 12 — usare su OGNI testo dinamico
// emailBrand tokens usati nel file: b.mutedColor, b.borderColor, b.textColor, b.surfaceColor, b.primaryColor
```

Interfacce item ATTUALI da estendere:
```ts
// OrderEmailData.items (riga 222) e OrderNotificationData.items (riga 293) — identiche:
items: Array<{ name: string; quantity: number; priceCents: number }>;
```

Mapping ATTUALE che scarta i dati (src/lib/order-emails.server.ts:43-47):
```ts
const items = order.items.map((i) => ({
  name: i.name,
  quantity: i.quantity,
  priceCents: Math.round(Number(i.price) * 100),
}));
```
Nota: `variantName` e `selectedOptions` sono colonne scalari su OrderItem — già presenti nel risultato di `prisma.order.findUnique({ include: { items: ... } })`, nessun `include` aggiuntivo necessario.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Estendi le interfacce e il rendering dei template email (variante + opzioni + swatch sanitizzato)</name>
  <files>src/lib/email-templates.server.ts</files>
  <action>
    In `src/lib/email-templates.server.ts`:

    1. Estendi il tipo `items` in ENTRAMBE le interfacce `OrderEmailData` (riga ~222) e `OrderNotificationData` (riga ~293) da:
       `Array<{ name: string; quantity: number; priceCents: number }>`
       a:
       `Array<{ name: string; quantity: number; priceCents: number; variantName?: string | null; selectedOptions?: Array<{ label: string; value: string; color?: string }> | null }>`
       (stessa identica shape in entrambe le interfacce).

    2. Aggiungi un helper module-private (accanto agli altri helper come `dataRow`, NON esportato) per sanitizzare un colore in modo email-safe. Zero `any`:
       ```ts
       // Consente SOLO hex #RGB/#RRGGBB/#RRGGBBAA; altrimenti null (niente injection nello style)
       function safeHexColor(color: string | undefined): string | null {
         if (!color) return null;
         return /^#[0-9a-fA-F]{3,8}$/.test(color) ? color : null;
       }
       ```

    3. Aggiungi un helper module-private che renderizza le sotto-righe (variante + opzioni) di UN item, riutilizzato da entrambi i template per non duplicare logica. Usa SEMPRE `escapeHtml` sul testo, i token `b.mutedColor`/`b.borderColor`, e inline styles email-safe coerenti col file:
       ```ts
       function itemDetailLines(item: {
         variantName?: string | null;
         selectedOptions?: Array<{ label: string; value: string; color?: string }> | null;
       }): string {
         const b = emailBrand;
         const lines: string[] = [];
         if (item.variantName) {
           lines.push(
             `<div style="color:${b.mutedColor}; font-size:12px; margin-top:2px;">${escapeHtml(item.variantName)}</div>`,
           );
         }
         for (const opt of item.selectedOptions ?? []) {
           const hex = safeHexColor(opt.color);
           const swatch = hex
             ? `<span style="display:inline-block; width:10px; height:10px; border-radius:2px; background:${hex}; border:1px solid ${b.borderColor}; vertical-align:middle; margin-right:4px;"></span>`
             : "";
           lines.push(
             `<div style="color:${b.mutedColor}; font-size:12px; margin-top:2px;">${swatch}${escapeHtml(opt.label)}: ${escapeHtml(opt.value)}</div>`,
           );
         }
         return lines.join("");
       }
       ```
       NOTA sicurezza: `hex` entra nello `style` SOLO dopo essere passato per `safeHexColor` (regex `^#[0-9a-fA-F]{3,8}$`), quindi non può contenere `;`, `<`, `"` o altre sequenze di injection. Label/value/variantName passano sempre da `escapeHtml`.

    4. Inserisci la chiamata a `itemDetailLines(item)` SUBITO SOTTO la riga del nome prodotto, dentro la stessa `<td>` dell'articolo, in ENTRAMBI gli `itemRows`:
       - `orderConfirmationTemplate` (righe ~229-242): dopo lo `<span> &times; quantity</span>`, aggiungi `${itemDetailLines(item)}` prima della chiusura `</td>`.
       - `orderNotificationTemplate` (righe ~304-317): stessa modifica speculare.
       La struttura tabellare `<tr>/<td>` e la colonna prezzo restano invariate.

    Commenti in italiano (convenzione CLAUDE.md). Zero `any`, zero hex hardcoded (i colori swatch vengono dai dati, sanitizzati; gli stili usano i token `b.*`).
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | grep "email-templates.server.ts" || echo "OK: zero errori tsc su email-templates.server.ts"</automated>
  </verify>
  <done>
    Entrambe le interfacce `items` includono `variantName?` e `selectedOptions?`; esistono gli helper `safeHexColor` e `itemDetailLines`; entrambi i template chiamano `itemDetailLines(item)` sotto il nome prodotto; `npx tsc --noEmit` non produce NUOVI errori sul file (baseline pre-esistente invariata).
  </done>
</task>

<task type="auto">
  <name>Task 2: Popola variantName e selectedOptions nel mapping del servizio email</name>
  <files>src/lib/order-emails.server.ts</files>
  <action>
    In `src/lib/order-emails.server.ts`, modifica il `.map` che costruisce `items` (righe 43-47). Aggiungi `variantName` e `selectedOptions` all'oggetto mappato, usando il pattern di narrowing canonico (identico a `admin-orders.server.ts:156`), zero `any`:
    ```ts
    const items = order.items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      priceCents: Math.round(Number(i.price) * 100),
      variantName: i.variantName,
      selectedOptions: i.selectedOptions as
        | Array<{ label: string; value: string; color?: string }>
        | null,
    }));
    ```
    Nessun altro cambiamento: lo stesso array `items` è già passato SIA a `orderConfirmationTemplate` SIA a `orderNotificationTemplate`, quindi questa singola modifica alimenta entrambe le mail. NON toccare `customerNote`/"Note personalizzazione" (fuori scope). NON aggiungere include Prisma (le colonne sono già nel risultato). Nessuna modifica a schema/migration/DB.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | grep "order-emails.server.ts" || echo "OK: zero errori tsc su order-emails.server.ts"</automated>
  </verify>
  <done>
    L'oggetto mappato include `variantName` e `selectedOptions` (narrowing tipizzato, no `any`); l'array `items` continua ad essere passato a entrambi i template; `npx tsc --noEmit` non produce NUOVI errori sul file.
  </done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` non introduce NUOVI errori sui 2 file toccati (baseline pre-esistente ~25-26 errori out-of-scope resta invariata; NON affidarsi a `pnpm build`/`pnpm lint` locali — rotti per problemi d'ambiente noti, validazione reale sul CI Railway).
- Grep di coerenza: `grep -n "variantName" src/lib/email-templates.server.ts src/lib/order-emails.server.ts` mostra le nuove occorrenze in entrambe le interfacce, negli helper e nel mapping.
- Il colore entra nello `style` solo via `safeHexColor` (regex hex); label/value/variantName passano da `escapeHtml`.
</verification>

<success_criteria>
- Le interfacce item di `OrderEmailData` e `OrderNotificationData` includono `variantName?` e `selectedOptions?`.
- `orderConfirmationTemplate` e `orderNotificationTemplate` rendono variante e opzioni sotto ogni articolo, con swatch inline quando il colore è un hex valido.
- Il mapping in `order-emails.server.ts` popola `variantName` e `selectedOptions` per entrambe le mail.
- Zero `any`, zero hex hardcoded negli stili, commenti in italiano, nessuna modifica DB/schema/migration, `customerNote` non toccato.
- `npx tsc --noEmit` senza nuovi errori sui 2 file.
</success_criteria>

<output>
After completion, create `.planning/quick/260717-rev-fix-email-ordine-mostra-variante-e-opzio/260717-rev-SUMMARY.md`
</output>
