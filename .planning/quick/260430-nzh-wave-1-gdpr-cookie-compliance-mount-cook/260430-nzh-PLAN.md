---
quick_id: 260430-nzh
type: execute
wave: 1
depends_on: []
files_modified:
  - src/routes/__root.tsx
  - src/routes/api/cookie-consent.ts
  - src/components/shared/Footer.tsx
autonomous: true
requirements:
  - WAVE1-MOUNT-BANNER
  - WAVE1-CONSENT-ENDPOINT
  - WAVE1-FOOTER-RESET
must_haves:
  truths:
    - "Un visitatore in incognito vede il CookieBanner entro ~1s sulla home"
    - "Cliccare 'Accetta tutti' o 'Rifiuta tutto' fa POST a /api/cookie-consent e il banner sparisce"
    - "POST /api/cookie-consent inserisce una row ConsentLog per ogni categoria opt-in (preferences/analytics/marketing) e setta cookie consent_preferences"
    - "Cliccare 'Gestisci preferenze cookie' nel footer pulisce localStorage + reload, e il banner riappare"
    - "Endpoint applica rate limit FORM (3/min per IP) e error mapping 422/429/500"
    - "Tipo TypeScript: zero `any`, baseline typecheck preservata"
  artifacts:
    - path: "src/routes/__root.tsx"
      provides: "Mount <CookieBanner /> dopo <Footer /> nel root layout"
      contains: "<CookieBanner"
    - path: "src/routes/api/cookie-consent.ts"
      provides: "POST endpoint persistenza consenso (Set-Cookie + ConsentLog)"
      exports: ["Route"]
    - path: "src/components/shared/Footer.tsx"
      provides: "Link 'Gestisci preferenze cookie' in sezione legal (button con onClick reset)"
      contains: "Gestisci preferenze cookie"
  key_links:
    - from: "src/components/shared/CookieBanner.tsx"
      to: "/api/cookie-consent"
      via: "fetch POST in persistAndClose (riga 45-49)"
      pattern: "fetch.*api/cookie-consent"
    - from: "src/routes/api/cookie-consent.ts"
      to: "prisma.consentLog"
      via: "insert per categoria opt-in"
      pattern: "prisma\\.consentLog\\.create"
    - from: "src/routes/api/cookie-consent.ts"
      to: "setConsentCookie"
      via: "Set-Cookie header su risposta apiSuccess"
      pattern: "setConsentCookie"
    - from: "src/components/shared/Footer.tsx"
      to: "localStorage"
      via: "onClick rimuove consent_preferences e ricarica pagina"
      pattern: "localStorage\\.removeItem\\(\"consent_preferences\"\\)"
---

<objective>
Wave 1 della GDPR/Cookie compliance: rendere il banner cookie effettivamente vivo end-to-end.

Purpose: Oggi `CookieBanner` è implementato ma mai montato; il client POSTa a `/api/cookie-consent` ma l'endpoint non esiste; il footer non ha link per gestire le preferenze post-accettazione. Wave 1 chiude il loop: montare il banner, creare l'endpoint che persiste su `ConsentLog` + setta cookie HTTP, aggiungere link footer per riaprire il banner.

Output: 3 commit atomici italiani (uno per task) — banner visibile in incognito, ConsentLog popolato lato server, footer con "Gestisci preferenze cookie" funzionante. Nessuna modifica al component `CookieBanner` (già implementato), nessuna migration Prisma (`ConsentLog` già esistente in `prisma/schema.prisma:131`).

Source of truth: `docs/superpowers/specs/2026-04-30-gdpr-cookie-compliance-design.md` § "Wave 1 — Banner vivo".
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@CLAUDE.md
@docs/superpowers/specs/2026-04-30-gdpr-cookie-compliance-design.md
@src/routes/__root.tsx
@src/components/shared/CookieBanner.tsx
@src/components/shared/Footer.tsx
@src/lib/cookieConsent.ts
@src/lib/api-response.ts
@src/lib/rate-limit.server.ts
@src/routes/api/newsletter.ts

<interfaces>
<!-- Contratti chiave estratti dal codebase. NON esplorare: usa direttamente queste signature. -->

From src/components/shared/index.ts (barrel):
```typescript
export { CookieBanner } from "./CookieBanner";
// quindi import: import { CookieBanner } from "~/components/shared";
```

From src/components/shared/CookieBanner.tsx (già implementato, NON modificare):
```typescript
export function CookieBanner({ className }: { className?: string }): ReactNode;
// Self-contained: gestisce localStorage, SSR-safe (return null finché useEffect non gira),
// auto-nasconde se getConsent() ritorna valore non-null.
// Internamente POSTa a /api/cookie-consent il payload Omit<CookieConsent, "version">:
// { necessary: boolean, preferences: boolean, analytics: boolean, marketing: boolean, timestamp: number }
```

From src/lib/cookieConsent.ts:
```typescript
export interface CookieConsent {
  necessary: boolean;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
  version: number;
}
// Costruisce stringa Set-Cookie pronta (Path=/; Max-Age=1y; SameSite=Lax; Secure in prod):
export function setConsentCookie(consent: Omit<CookieConsent, "version">): string;
```

From src/lib/api-response.ts:
```typescript
export function apiSuccess<T>(data: T, status?: number, headers?: Record<string, string>): Response;
export function apiError(
  code: string,
  message: string,
  status: number,
  details?: Array<{ field: string; message: string }>,
  headers?: Record<string, string>,
): Response;
```

From src/lib/rate-limit.server.ts:
```typescript
export function checkRateLimit(
  identifier: string,
  preset: "AUTH" | "FORM" | "API" | "WEBHOOK",
): { success: boolean; retryAfterMs: number };
export function getClientIp(request: Request): string;
// FORM preset = 3 req/60s
```

From src/lib/db.server.ts (verified import in altre route /api/):
```typescript
import { prisma } from "~/lib/db.server";
// prisma.consentLog.create(...) disponibile
```

From src/lib/sdk-auth.server.ts (per recuperare userId opzionale):
```typescript
import { getUser } from "~/lib/sdk-auth.server";
// optional auth: ritorna AuthUser | null senza throw
const user = await getUser(request); // user?.id se loggato
```

From prisma/schema.prisma:131 (modello già esistente, no migration):
```prisma
model ConsentLog {
  id        String   @id @default(cuid())
  userId    String?
  type      String   // "cookie" | "privacy" | "marketing"
  granted   Boolean
  ip        String?
  userAgent String?
  createdAt DateTime @default(now())
  @@index([userId])
  @@index([type])
}
```

Reference shape per route (vedi src/routes/api/newsletter.ts):
```typescript
export const Route = createFileRoute("/api/cookie-consent")({
  server: {
    handlers: {
      POST: async ({ request }) => { /* ... */ },
    },
  },
});
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Mount CookieBanner nel root layout</name>
  <files>src/routes/__root.tsx</files>
  <action>
  Montare `<CookieBanner />` nel `RootComponent` di `src/routes/__root.tsx`.

  Modifiche puntuali:
  1. Aggiungere import `CookieBanner` dal barrel shared. Sostituire la linea
     `import { Footer } from "~/components/shared/Footer";` con il barrel:
     ```ts
     import { Footer, CookieBanner } from "~/components/shared";
     ```
     (Verifica `src/components/shared/index.ts` — esporta entrambi.)
  2. Renderizzare `<CookieBanner />` **dopo** `<Footer />` e **prima** di `<Toaster />` dentro il `MotionProvider` di `RootComponent`.
     Riga di riferimento: oggi a `src/routes/__root.tsx:157` c'è `{!isAdmin && <Footer />}`. Aggiungere subito sotto `{!isAdmin && <MobileBottomNav />}` e prima di `{!isAdmin && <MobileSearchOverlay />}` la riga:
     ```tsx
     {!isAdmin && <CookieBanner />}
     ```
     Posizione consigliata: subito **dopo** `{!isAdmin && <Footer />}` (riga 157) e **prima** di `{!isAdmin && !isAccount && <MobileBottomNav />}` (riga 158). Mantieni la condizione `!isAdmin` per coerenza con Footer/MegaMenu (admin layout NON mostra il banner: in admin l'utente è autenticato e gestisce dati propri, non è il flusso e-commerce pubblico).

  Nessuna logica aggiuntiva: `CookieBanner` è SSR-safe (riga 26-34 del componente) e auto-nasconde se trova consenso pregresso in `localStorage`.

  Vincoli:
  - Zero `any`, zero modifiche a `CookieBanner.tsx`
  - Mantenere lo stile import esistente (path alias `~/`)
  - Non spostare/rimuovere altri componenti del root

  Commit message: `feat(legal): mount CookieBanner in root layout`
  </action>
  <verify>
    <automated>pnpm typecheck 2>&1 | tail -20 && grep -n "CookieBanner" src/routes/__root.tsx</automated>
  </verify>
  <done>
  - `pnpm typecheck` baseline preservata (errori totali ≤ 25, zero nuovi su `__root.tsx`)
  - `grep -c "CookieBanner" src/routes/__root.tsx` ritorna ≥ 2 (import + render)
  - In dev (`pnpm dev`) + browser incognito su `/`: il banner appare entro ~1s in basso
  - Click "Rifiuta tutto" → banner sparisce → reload → resta sparito (consenso in localStorage)
  - Commit atomico creato con messaggio `feat(legal): mount CookieBanner in root layout`
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Endpoint POST /api/cookie-consent con persistenza ConsentLog</name>
  <files>src/routes/api/cookie-consent.ts</files>
  <behavior>
    - Body valido (necessary=true + bool flags + timestamp num) → 200 con `{ ok: true, data: { saved: true } }` + header `Set-Cookie: consent_preferences=...`
    - Body invalido (necessary=false oppure campo mancante/tipo errato) → 422 `VALIDATION_ERROR` con messaggio dal primo issue zod
    - 4° richiesta dallo stesso IP entro 60s → 429 `RATE_LIMITED` con header `Retry-After`
    - Errore Prisma sull'insert ConsentLog → 500 `INTERNAL_ERROR` (no stack leak), risposta comunque con `Set-Cookie` se possibile? NO: in caso di throw nella transazione, ritorna 500 senza Set-Cookie (semplicità + atomicità: o tutto o niente)
    - Categorie opt-in (preferences/analytics/marketing dove `true`) → 1 row `ConsentLog` per categoria con `type` corrispondente, `granted: true`, `ip`, `userAgent`, `userId` (se sessione presente via `getUser(request)`, altrimenti `null`)
    - Categorie rifiutate → nessuna row (l'assenza è l'audit, come da spec § Wave 1)
    - `necessary` non genera mai una row (è obbligatorio per legge, non un consenso revocabile)
  </behavior>
  <action>
  Creare nuovo file `src/routes/api/cookie-consent.ts` seguendo **esattamente** la shape di `src/routes/api/newsletter.ts` (rate limit, error mapping, helpers).

  Struttura:
  ```ts
  import { createFileRoute } from "@tanstack/react-router";
  import { z } from "zod";
  import { apiSuccess, apiError } from "~/lib/api-response";
  import { checkRateLimit, getClientIp } from "~/lib/rate-limit.server";
  import { setConsentCookie } from "~/lib/cookieConsent";
  import { prisma } from "~/lib/db.server";
  import { getUser } from "~/lib/sdk-auth.server";
  import { createLogger } from "~/lib/logger.server";

  const log = createLogger("cookie-consent");

  const cookieConsentSchema = z.object({
    necessary: z.literal(true),
    preferences: z.boolean(),
    analytics: z.boolean(),
    marketing: z.boolean(),
    timestamp: z.number().int().positive(),
  });

  export const Route = createFileRoute("/api/cookie-consent")({
    server: {
      handlers: {
        POST: async ({ request }) => {
          // Rate limit (FORM bucket = 3/min)
          const ip = getClientIp(request);
          const limit = checkRateLimit(ip, "FORM");
          if (!limit.success) {
            return apiError("RATE_LIMITED", "Troppe richieste. Riprova tra qualche minuto.", 429, undefined, {
              "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)),
            });
          }

          // Parse body
          const body = await request.json() as unknown;
          const parsed = cookieConsentSchema.safeParse(body);
          if (!parsed.success) {
            return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Payload non valido", 422);
          }
          const consent = parsed.data;

          // Optional auth: userId se utente loggato
          const user = await getUser(request).catch(() => null);
          const userId = user?.id ?? null;
          const userAgent = request.headers.get("user-agent") ?? null;

          // Persistenza ConsentLog (1 row per categoria opt-in)
          // type literal: "preferences" | "analytics" | "marketing"
          // (necessary NON loggata: è obbligatoria, non un consenso revocabile)
          const optIns: Array<"preferences" | "analytics" | "marketing"> = [];
          if (consent.preferences) optIns.push("preferences");
          if (consent.analytics) optIns.push("analytics");
          if (consent.marketing) optIns.push("marketing");

          try {
            if (optIns.length > 0) {
              await prisma.consentLog.createMany({
                data: optIns.map((type) => ({
                  userId,
                  type,
                  granted: true,
                  ip,
                  userAgent,
                })),
              });
            }
          } catch (e: unknown) {
            log.error("ConsentLog insert failed", {
              error: e instanceof Error ? e.message : "unknown",
              ip: ip.slice(0, 20),
            });
            return apiError("INTERNAL_ERROR", "Errore durante il salvataggio del consenso", 500);
          }

          // Set-Cookie + success
          return apiSuccess(
            { saved: true },
            200,
            { "Set-Cookie": setConsentCookie(consent) },
          );
        },
      },
    },
  });
  ```

  Vincoli:
  - Zero `any` (catch usa `e: unknown` + `instanceof Error` narrowing)
  - **NON** importare niente da `~/components/*` (boundary `routes/api/` → solo `*.server.ts`/`validators/`/`types/`/`constants/`)
  - Validatore inline in route: ok perché usato solo da questo endpoint (no shared client/server). Se in futuro Wave 3 lo riusa, estrarre in `src/lib/validators/`.
  - `userId` deve essere `null` (non `undefined`) per matchare `String?` Prisma: già garantito da `user?.id ?? null`
  - Non leakare stack: `log.error` ha message + ip troncato, response generica
  - **Note `type` ConsentLog**: il commento in schema dice `"cookie" | "privacy" | "marketing"`, ma per Wave 1 usiamo `"preferences" | "analytics" | "marketing"` per granularità (Wave 3 userà anche "privacy"). Il campo è `String`, non enum: nessun vincolo DB. Accettato per matching diretto con CookieConsent categories.

  Commit message: `feat(api): POST /api/cookie-consent with ConsentLog persistence`
  </action>
  <verify>
    <automated>pnpm typecheck 2>&1 | tail -20 && test -f src/routes/api/cookie-consent.ts && grep -c "consentLog\|setConsentCookie\|checkRateLimit" src/routes/api/cookie-consent.ts</automated>
  </verify>
  <done>
  - `src/routes/api/cookie-consent.ts` esiste, ~70 LOC
  - `pnpm typecheck` baseline preservata (zero nuovi errori sul nuovo file)
  - `grep` conferma uso di `consentLog`, `setConsentCookie`, `checkRateLimit` (≥3 match)
  - Smoke `curl -X POST http://localhost:3000/api/cookie-consent -H 'Content-Type: application/json' -d '{"necessary":true,"preferences":true,"analytics":false,"marketing":false,"timestamp":1735689600000}'` → HTTP 200, response `{"ok":true,"data":{"saved":true}}`, header `Set-Cookie: consent_preferences=...`
  - Smoke negativo: payload con `"necessary":false` → HTTP 422
  - Query DB: `SELECT type, granted, ip FROM "ConsentLog" ORDER BY "createdAt" DESC LIMIT 3` mostra row `preferences/granted=true` dopo lo smoke positivo (analytics/marketing assenti perché false)
  - Commit atomico creato con messaggio `feat(api): POST /api/cookie-consent with ConsentLog persistence`
  </done>
</task>

<task type="auto">
  <name>Task 3: Footer link "Gestisci preferenze cookie" che resetta consenso</name>
  <files>src/components/shared/Footer.tsx</files>
  <action>
  Aggiungere voce "Gestisci preferenze cookie" alla sezione `legal` del footer come **bottone** (non anchor, perché esegue side-effect JS, non navigation).

  Strategia minimal-refactor:
  Il `FOOTER_LINKS.legal.items` attuale è `Array<{ label: string; href: string }>` con `as const`. Per supportare entrambi (link e azione) senza rompere shape esistente, **rendere la voce reset un caso speciale renderizzato fuori dal map** (più semplice di un union type su tutti i FOOTER_LINKS).

  Modifiche puntuali a `src/components/shared/Footer.tsx`:

  1. **NON** modificare `FOOTER_LINKS.legal.items` constant (resta strict `{label, href}[]`).

  2. Nel JSX della sezione `legal` (block che mappa `FOOTER_LINKS.legal.items`, oggi righe ~133-149), **dopo** la chiusura di `{FOOTER_LINKS.legal.items.map(...)}` ma **dentro** lo stesso `<ul>`, aggiungere un `<li>` extra:
     ```tsx
     <li>
       <button
         type="button"
         onClick={() => {
           if (typeof window === "undefined") return;
           localStorage.removeItem("consent_preferences");
           window.location.reload();
         }}
         className="text-sm text-[var(--color-text-secondary)] transition-colors duration-[var(--transition-base)] hover:text-[var(--color-background)] text-left"
       >
         Gestisci preferenze cookie
       </button>
     </li>
     ```

     `className` deve essere **identica** ai link esistenti per parità visiva (parità con `<a>` className alla riga ~141), con aggiunta `text-left` perché `<button>` di default ha `text-align: center` in alcuni reset (e larghezza piena del `<li>`).

  3. Verifica: il link "Cookie policy" (`/cookie`) resta presente e separato — questo nuovo bottone è AGGIUNTIVO, non sostitutivo.

  Vincoli:
  - Zero modifiche a `FOOTER_LINKS.legal.items` const (preserva `as const` shape)
  - Zero `any`
  - `<button type="button">` esplicito (evita submit accidentale se mai annidato in form)
  - SSR-safe: guard `typeof window === "undefined"` prima di toccare `localStorage`
  - Match testuale esatto: `"Gestisci preferenze cookie"` (no varianti, lingua italiana coerente con resto del sito)
  - **NON** usare `localStorage.clear()` (cancellerebbe carrello, sessione UI, ecc.) — solo `removeItem("consent_preferences")` (chiave costante in `src/lib/cookieConsent.ts:19`)
  - Reload con `window.location.reload()` (no router navigate: serve hard reload per re-eseguire `useEffect` di CookieBanner da zero)

  Commit message: `feat(footer): "Gestisci preferenze cookie" link to reset consent`
  </action>
  <verify>
    <automated>pnpm typecheck 2>&1 | tail -20 && grep -n "Gestisci preferenze cookie\|consent_preferences" src/components/shared/Footer.tsx</automated>
  </verify>
  <done>
  - `pnpm typecheck` baseline preservata (errori totali ≤ 25)
  - `grep` trova "Gestisci preferenze cookie" e "consent_preferences" in `Footer.tsx`
  - In dev + browser: footer sezione "Termini e condizioni" mostra 4 voci (Privacy / Cookie / Termini + Gestisci preferenze cookie) con styling identico
  - Click "Gestisci preferenze cookie" dopo aver accettato: pagina si ricarica → banner riappare in basso entro ~1s
  - DevTools `Application > Local Storage`: chiave `consent_preferences` viene rimossa al click, altre chiavi restano intatte
  - Commit atomico creato con messaggio `feat(footer): "Gestisci preferenze cookie" link to reset consent`
  </done>
</task>

</tasks>

<verification>
End-to-end smoke test (post Task 3, browser incognito su localhost:3000):

1. **Banner-first-paint**: home in incognito → dopo ~1s appare il banner cookie in basso. ✓
2. **Accept-all flow**:
   - Click "Accetta tutti" → banner sparisce immediatamente.
   - DevTools > Network: vedi `POST /api/cookie-consent` con status 200 e payload `{necessary:true, preferences:true, analytics:true, marketing:true, timestamp:...}`.
   - DevTools > Application > Cookies: presente `consent_preferences=...` (Path=/, SameSite=Lax, ~365d).
   - DevTools > Application > Local Storage: presente `consent_preferences`.
   - Reload pagina → banner NON riappare. ✓
3. **DB persistence**: query `SELECT type, granted, "userId" FROM "ConsentLog" WHERE "createdAt" > NOW() - INTERVAL '5 minutes' ORDER BY "createdAt" DESC` ritorna 3 righe (preferences/analytics/marketing tutte `granted=true`, `userId=null` se guest). ✓
4. **Reject-all flow**: nuovo incognito → "Rifiuta tutto" → POST passa con tutti `false` → in DB **nessuna nuova row** (assenza = audit). ✓
5. **Footer reset**: in pagina con consenso accettato, scroll a footer → click "Gestisci preferenze cookie" → reload automatico → banner riappare. ✓
6. **Rate limit**: `for i in 1 2 3 4; do curl -sX POST http://localhost:3000/api/cookie-consent -H 'Content-Type: application/json' -d '{"necessary":true,"preferences":false,"analytics":false,"marketing":false,"timestamp":1735689600000}'; done` → 4ª risposta ha `{"ok":false,"error":{"code":"RATE_LIMITED",...}}` con HTTP 429 + header `Retry-After`. ✓
7. **Validation**: `curl -sX POST http://localhost:3000/api/cookie-consent -H 'Content-Type: application/json' -d '{"necessary":false,"preferences":false,"analytics":false,"marketing":false,"timestamp":1}'` → HTTP 422 `VALIDATION_ERROR`. ✓
8. **Typecheck**: `pnpm typecheck` baseline preservata (target ≤ 25 errori totali, zero nuovi sui 3 file toccati).
9. **Admin non-impatto**: navigare `/admin/ordini` → banner NON appare (gated da `!isAdmin` come Footer/MegaMenu). ✓

Out-of-scope (Wave 2/3, NON verificare qui):
- Wiring GA4 (richiede `VITE_GA4_MEASUREMENT_ID` + componente `GoogleAnalytics` non ancora creato)
- Allineamento testi `/cookie` e `/privacy` (Wave 2)
- Pagina `/account/privacy`, endpoint export/delete, double opt-in newsletter (Wave 3)
- Smoke E2E purchase Playwright (pre-esistente APP_URL deferred, vedi STATE.md)
</verification>

<success_criteria>
- 3 commit atomici creati in sequenza (uno per task), tutti in italiano per coerenza con storico (ultimi 5 commit `feat(admin): ...`)
- `pnpm typecheck` baseline preservata: errori totali ≤ 25 (oggi 25 da quick/260429-gbo)
- 1 file modificato (`__root.tsx`), 1 file modificato (`Footer.tsx`), 1 file nuovo (`api/cookie-consent.ts`) — totale 3 file impattati come da spec
- Banner cookie funzionante end-to-end in incognito (verifica step 1-5 sopra)
- ConsentLog popolato lato server (verifica step 3 sopra) con `userId=null` per guest e `userId=<cuid>` se sessione presente
- Rate limit attivo (verifica step 6) ed error mapping 422/429/500 corretto
- Zero `any`, zero modifiche a `CookieBanner.tsx` o `cookieConsent.ts`
- Zero migration Prisma (modello `ConsentLog` già esistente)
- Push + Railway deploy SUCCESS (verificare commitHash in latestDeployment)
- STATE.md aggiornato a fine task (orchestratore quick gestisce summary)
</success_criteria>

<output>
After completion, create `.planning/quick/260430-nzh-wave-1-gdpr-cookie-compliance-mount-cook/260430-nzh-SUMMARY.md` con:
- 3 commit hash atomici + railway deploy status
- File impattati (3 totali) e LOC delta
- Risultati smoke browser (banner-first-paint, accept/reject, footer reset, rate-limit, validation)
- Risultati `SELECT * FROM ConsentLog` post-test
- Typecheck baseline preserved (X → Y errors)
- Note out-of-scope deferred a Wave 2 (GA4, allineamento testi cookie/privacy) e Wave 3 (account/privacy, export/delete, newsletter double opt-in)
</output>
