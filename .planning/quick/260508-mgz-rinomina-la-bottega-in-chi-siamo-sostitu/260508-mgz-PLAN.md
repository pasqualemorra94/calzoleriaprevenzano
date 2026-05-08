---
quick_id: 260508-mgz
type: quick
wave: 1
depends_on: []
files_modified:
  - src/components/shared/MegaMenu.tsx
  - src/components/shared/Footer.tsx
  - public/locales/it/common.json
  - src/routes/la-bottega.tsx
  - src/components/sections/LaBottegaSection.tsx
  - src/routes/resi-e-recesso.tsx
  - src/routes/contatti.tsx
  - src/routes/api/site/media.ts
autonomous: false
requirements:
  - QUICK-MGZ-01  # Rinomina menu "La Bottega" → "Chi Siamo"
  - QUICK-MGZ-02  # Sostituzione globale "bottega" → "calzoleria" nelle copy display
  - QUICK-MGZ-03  # Restructure pagina Chi Siamo: storia+foto subito dopo hero
must_haves:
  truths:
    - "Nel header desktop e nel pannello mobile compare la voce di menu 'Chi Siamo' (non più 'La Bottega'), con link che porta a /la-bottega"
    - "Nessuna copy visibile all'utente nelle pagine Home, Chi Siamo, Contatti, Resi e Recesso contiene la parola 'bottega'/'Bottega' (sostituita da 'calzoleria'/'Calzoleria' con concordanza grammaticale corretta)"
    - "Sulla pagina /la-bottega, immediatamente dopo l'hero 'Dal 1984, l'arte del sandalo nel cuore di Napoli', è visibile un blocco a 2 colonne (responsive: stacked su mobile) con la foto a sinistra e il testo della storia a destra"
    - "L'URL /la-bottega continua a funzionare (slug invariato per non rompere SEO/link esterni)"
    - "Build TypeScript passa senza errori (pnpm typecheck) e il sito compila (pnpm build)"
  artifacts:
    - path: "src/components/shared/MegaMenu.tsx"
      provides: "Voce menu desktop + mobile rinominata in 'Chi Siamo'"
    - path: "src/routes/la-bottega.tsx"
      provides: "Pagina Chi Siamo con storia+foto affiancate subito dopo hero"
    - path: "public/locales/it/common.json"
      provides: "Valore i18n nav.laBottega aggiornato a 'Chi Siamo'"
  key_links:
    - from: "src/components/shared/MegaMenu.tsx"
      to: "/la-bottega"
      via: "Link to=\"/la-bottega\""
      pattern: "to=\"/la-bottega\""
    - from: "src/routes/la-bottega.tsx hero section"
      to: "blocco storia+foto (BottegaInfoBlock o equivalente riposizionato)"
      via: "ordine JSX: hero → storia+foto → ..."
      pattern: "BottegaInfoBlock|grid.*lg:grid-cols-2"
---

<objective>
Rinominare la voce di menu "La Bottega" in "Chi Siamo", sostituire le occorrenze display di "bottega" con "calzoleria" mantenendo concordanza grammaticale italiana, e ristrutturare la pagina Chi Siamo (`/la-bottega`) in modo che il blocco storia + foto sia posizionato subito dopo l'hero (attualmente è a fondo pagina).

Purpose: Allineare la nomenclatura del sito al brand "Calzoleria Prevenzano" (la parola "bottega" è genericamente artigianale e non valorizza il marchio specifico) e migliorare l'information architecture della pagina Chi Siamo dando enfasi visiva alla storia 1984 immediatamente dopo l'hero.

Output:
- 8 file modificati (menu, footer, route Chi Siamo + 3 altre route con copy, 1 sezione homepage, 1 file locale, 1 commento route API)
- URL `/la-bottega` invariato (preserva SEO)
- Layout 2-col storia+foto responsive subito dopo hero
- Build verde (typecheck + build)
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md

<!-- File correnti rilevanti — letti durante planning -->
@src/components/shared/MegaMenu.tsx
@src/components/shared/Footer.tsx
@src/components/shared/MobileBottomNav.tsx
@src/components/sections/LaBottegaSection.tsx
@src/routes/la-bottega.tsx
@src/routes/index.tsx
@src/routes/contatti.tsx
@src/routes/resi-e-recesso.tsx
@src/routes/api/site/media.ts
@public/locales/it/common.json
@public/locales/it/home.json

<inventory>
<!-- Inventario esatto delle occorrenze "bottega" / "Bottega" rilevate durante la fase di planning. L'esecutore deve trattare ogni voce qui sotto come autoritativa. -->

DISPLAY COPY (DA SOSTITUIRE):

1. src/components/shared/MegaMenu.tsx
   - L537: testo menu desktop `La Bottega` → `Chi Siamo`
   - L704: testo menu mobile `La Bottega` → `Chi Siamo`
   - NB: NON toccare gli `to="/la-bottega"` (L536, L700) — slug URL invariato.

2. src/components/shared/Footer.tsx
   - L18: già `{ label: "Chi siamo", href: "/la-bottega" }` — NORMALIZZARE label a "Chi Siamo" (capitalizzazione coerente col menu, opzionale ma consigliato). href invariato.

3. public/locales/it/common.json
   - L6: `"laBottega": "La Bottega"` → `"laBottega": "Chi Siamo"` (mantenere il KEY `laBottega` per non rompere eventuali consumer; aggiornare solo il VALUE).

4. src/routes/la-bottega.tsx
   - L20 (paragrafo storia): `"...frequenta la bottega rimanendo..."` → `"...frequenta la calzoleria rimanendo..."`
   - L20 (paragrafo storia): `"...entrare anch'egli nella bottega..."` → `"...entrare anch'egli nella calzoleria..."`
   - L113 (eyebrow team): `"La famiglia in bottega"` → `"La famiglia in calzoleria"`
   - L119 (paragrafo team): `"...la stessa bottega, le stesse mani..."` → `"...la stessa calzoleria, le stesse mani..."`
   - L187 (alt foto): `"Nunzio Prevenzano al lavoro nella bottega di Via Chiaia, Napoli"` → `"Nunzio Prevenzano al lavoro nella calzoleria di Via Chiaia, Napoli"`
   - L202 (heading sezione info): `"La nostra bottega"` → `"La nostra calzoleria"`
   - L206 (paragrafo info): `"...la nostra bottega è il luogo dove..."` → `"...la nostra calzoleria è il luogo dove..."`
   - NON toccare: route slug `"/la-bottega"` (L10), nome funzione `LaBottegaPage` (L11, L59), nome funzione `BottegaInfoBlock` (L133, L178), commento sezione `// ─── Bottega Info Block ───` (L176) — sono identifier interni, rinominarli causerebbe diff inutili e potenziali rotture.

5. src/components/sections/LaBottegaSection.tsx
   - L8: `headline: "La Bottega Prevenzano"` → `headline: "La Calzoleria Prevenzano"`
   - L12: `"Quando entri in bottega — o quando ordini online — scegli..."` → `"Quando entri in calzoleria — o quando ordini online — scegli..."`
   - NON toccare: nome file `LaBottegaSection.tsx`, export `LaBottegaSection`, costanti `BOTTEGA_COPY` / `BOTTEGA_IMAGE`, prop `LaBottegaSectionProps`, import in `src/routes/index.tsx` — identifier interni.

6. src/routes/resi-e-recesso.tsx
   - L35–36 (paragrafo): `"...cucito a mano nella nostra\n              bottega di Via Chiaia..."` → `"...cucito a mano nella nostra\n              calzoleria di Via Chiaia..."`

7. src/routes/contatti.tsx
   - L39 (body): `"...vieni a trovarci in bottega o in laboratorio."` → `"...vieni a trovarci in calzoleria o in laboratorio."`

8. src/routes/api/site/media.ts
   - L4 (commento): `"...(hero, bottega, etc.)."` → `"...(hero, calzoleria, etc.)."` (commento — rifinitura, non strettamente necessaria ma coerente).

NON TOCCARE (esclusioni esplicite):
- public/locales/it/home.json L31-36 — `"bottega": { ... }` è una CHIAVE JSON i18n con valori vuoti (non consumata visibilmente). Modificare la chiave richiederebbe ricerche di consumer e refactor non in scope.
- Route slug `/la-bottega` ovunque appaia (`to="/la-bottega"`, `href="/la-bottega"`, `createFileRoute("/la-bottega")`).
- Nomi di file (`la-bottega.tsx`, `LaBottegaSection.tsx`).
- Nomi di componenti React (`LaBottegaPage`, `LaBottegaSection`, `BottegaInfoBlock`).
- Costanti UPPER_SNAKE (`BOTTEGA_COPY`, `BOTTEGA_IMAGE`).
- Chiave i18n `nav.laBottega` (solo valore aggiornato).
- File in `.planning/`, `node_modules/`, `prisma/migrations/`, `public/uploads/`, `.tanstack/`, `routeTree.gen.ts`.
</inventory>

<grammar_rules>
Regole di concordanza italiana per la sostituzione bottega → calzoleria (entrambe femminili singolari, concordanza preservata 1:1):

| Pattern | Sostituzione |
|---------|--------------|
| la bottega | la calzoleria |
| La Bottega | La Calzoleria |
| della bottega | della calzoleria |
| nella bottega | nella calzoleria |
| alla bottega | alla calzoleria |
| una bottega | una calzoleria |
| in bottega | in calzoleria |
| nostra bottega | nostra calzoleria |
| stessa bottega | stessa calzoleria |
| LA BOTTEGA / BOTTEGA | LA CALZOLERIA / CALZOLERIA |

Bottega → Calzoleria stand-alone (es. heading "Bottega" diventa "Calzoleria").

NON applicare se "bottega" appare in espressioni idiomatiche tipo "lavoro di bottega" / "sapere di bottega" (concetto artigiano-tradizione). Ispezionando l'inventario: NESSUNA delle occorrenze rilevate è un'espressione idiomatica — sono tutte usi diretti del termine "negozio/laboratorio". Procedere con sostituzione su tutte.
</grammar_rules>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Rinomina menu "La Bottega" → "Chi Siamo" + normalizza i18n e Footer</name>
  <files>
    src/components/shared/MegaMenu.tsx,
    src/components/shared/Footer.tsx,
    public/locales/it/common.json
  </files>
  <action>
    Implementa rename voce di menu (per QUICK-MGZ-01).

    1. **src/components/shared/MegaMenu.tsx**
       - L537: sostituisci il testo `La Bottega` (testo del Link desktop) con `Chi Siamo`. Mantieni invariato `to="/la-bottega"` alla L536.
       - L704: sostituisci il testo `La Bottega` (testo del Link mobile) con `Chi Siamo`. Mantieni invariato `to="/la-bottega"` alla L700.
       - NON modificare nient'altro nel file.

    2. **src/components/shared/Footer.tsx**
       - L18: cambia `{ label: "Chi siamo", href: "/la-bottega" }` in `{ label: "Chi Siamo", href: "/la-bottega" }` (capitalizzazione coerente con la nuova voce di menu — "Chi" e "Siamo" entrambi capitalizzati).
       - NON modificare altre voci.

    3. **public/locales/it/common.json**
       - L6: cambia `"laBottega": "La Bottega"` in `"laBottega": "Chi Siamo"`.
       - Mantieni invariata la chiave `laBottega` (per evitare di rompere eventuali consumer non ancora individuati).
       - NON modificare altre chiavi.

    Note esecutore:
    - MobileBottomNav.tsx NON ha link a /la-bottega (verificato in planning) — non toccarlo.
    - Verifica con `grep -n "La Bottega" src/` post-edit: deve restituire 0 match nei tre file modificati.
  </action>
  <verify>
    <automated>
      grep -rn "La Bottega" /Users/pasqualemorra/Projects/calzoleriaprevenzano/src/components/shared/MegaMenu.tsx /Users/pasqualemorra/Projects/calzoleriaprevenzano/src/components/shared/Footer.tsx /Users/pasqualemorra/Projects/calzoleriaprevenzano/public/locales/it/common.json | wc -l | tr -d ' '
    </automated>
    Atteso: `0` (nessuna occorrenza "La Bottega" rimasta nei 3 file).
    Verifica anche manualmente: `grep -n "Chi Siamo" src/components/shared/MegaMenu.tsx` deve mostrare 2 match (desktop + mobile).
  </verify>
  <done>
    - MegaMenu desktop e mobile mostrano "Chi Siamo" come label, link sempre a /la-bottega
    - Footer info link normalizzato a "Chi Siamo"
    - Locale it/common.json `nav.laBottega` aggiornato a "Chi Siamo"
    - Nessuna stringa "La Bottega" residua nei 3 file
  </done>
</task>

<task type="auto">
  <name>Task 2: Sostituzione globale display copy "bottega" → "calzoleria" (5 file route + 1 sezione + 1 commento)</name>
  <files>
    src/routes/la-bottega.tsx,
    src/components/sections/LaBottegaSection.tsx,
    src/routes/resi-e-recesso.tsx,
    src/routes/contatti.tsx,
    src/routes/api/site/media.ts
  </files>
  <action>
    Sostituisci le occorrenze di "bottega" nelle copy display secondo l'inventario in `<context>` (per QUICK-MGZ-02). Applica le regole di concordanza in `<grammar_rules>`.

    Esegui le sostituzioni una per una, in questi file e SOLO per le stringhe specificate:

    1. **src/routes/la-bottega.tsx** — 7 sostituzioni:
       - L20: `"...frequenta la bottega rimanendo sempre più ammaliato..."` → `"...frequenta la calzoleria rimanendo sempre più ammaliato..."`
       - L20: `"...decide di entrare anch'egli nella bottega e intraprende..."` → `"...decide di entrare anch'egli nella calzoleria e intraprende..."`
       - L113: `<span ...>La famiglia in bottega</span>` → `<span ...>La famiglia in calzoleria</span>`
       - L119: `"...di padre in figlio, l&apos;arte calzolaia napoletana — la stessa bottega, le stesse mani, dal 1984."` → `"...di padre in figlio, l&apos;arte calzolaia napoletana — la stessa calzoleria, le stesse mani, dal 1984."`
       - L187: `alt="Nunzio Prevenzano al lavoro nella bottega di Via Chiaia, Napoli"` → `alt="Nunzio Prevenzano al lavoro nella calzoleria di Via Chiaia, Napoli"`
       - L202: `<h2 ...>La nostra bottega</h2>` → `<h2 ...>La nostra calzoleria</h2>`
       - L206: `"Nel cuore di Napoli, ... la nostra bottega è il luogo dove..."` → `"Nel cuore di Napoli, ... la nostra calzoleria è il luogo dove..."`
       - NON toccare: route slug `"/la-bottega"`, nome funzione `LaBottegaPage`, nome funzione `BottegaInfoBlock`, commento `// ─── Bottega Info Block ───`.

    2. **src/components/sections/LaBottegaSection.tsx** — 2 sostituzioni:
       - L8: `headline: "La Bottega Prevenzano"` → `headline: "La Calzoleria Prevenzano"`
       - L12: `"...Quando entri in bottega — o quando ordini online — scegli..."` → `"...Quando entri in calzoleria — o quando ordini online — scegli..."`
       - NON toccare: nome file, costanti `BOTTEGA_COPY`/`BOTTEGA_IMAGE`, prop `LaBottegaSectionProps`, ctaHref `/la-bottega`.

    3. **src/routes/resi-e-recesso.tsx** — 1 sostituzione:
       - L35-36: `"...cucito a mano nella nostra\n              bottega di Via Chiaia dopo che..."` → `"...cucito a mano nella nostra\n              calzoleria di Via Chiaia dopo che..."`

    4. **src/routes/contatti.tsx** — 1 sostituzione:
       - L39: `body: "...vieni a trovarci in bottega o in laboratorio."` → `body: "...vieni a trovarci in calzoleria o in laboratorio."`

    5. **src/routes/api/site/media.ts** — 1 sostituzione (commento):
       - L4: `* Returns decorative/media images used across public pages (hero, bottega, etc.).` → `* Returns decorative/media images used across public pages (hero, calzoleria, etc.).`

    NON toccare:
    - `public/locales/it/home.json` (chiave JSON `bottega` con valori vuoti — fuori scope).
    - Identifier interni in nessun file (vedi inventory).
    - Slug URL `/la-bottega` ovunque.

    Concordanza grammaticale verificata: tutte le occorrenze sono "la/nella/della/in bottega" + 1 stand-alone "Bottega" (heading) → "La Calzoleria Prevenzano". Femminile singolare preservato 1:1.

    Esegui poi un grep di verifica finale (vedi <verify>): le sole occorrenze residue di "bottega"/"Bottega" devono essere identifier interni e slug URL.
  </action>
  <verify>
    <automated>
      cd /Users/pasqualemorra/Projects/calzoleriaprevenzano && grep -rn "bottega\|Bottega\|BOTTEGA" src/ public/locales/ 2>/dev/null | grep -v routeTree.gen | grep -v "/la-bottega" | grep -vE "(LaBottegaPage|LaBottegaSection|BottegaInfoBlock|BOTTEGA_COPY|BOTTEGA_IMAGE|laBottega|LaBottegaSectionProps|Bottega Info Block|la-bottega.tsx|LaBottegaSection.tsx)" | grep -v 'home.json' && echo "FAIL: residui da sistemare" || echo "OK"
    </automated>
    Atteso: `OK` (nessuna occorrenza "bottega" residua oltre a identifier interni esclusi e slug URL).

    Verifica anche typecheck: `pnpm typecheck` deve passare (nessuna rottura di import/identifier).
  </verify>
  <done>
    - 12 sostituzioni applicate complessivamente nei 5 file
    - Concordanza grammaticale italiana mantenuta
    - Nessun identifier interno (nome funzione/costante/file/slug) modificato
    - Nessuna copy display residua con "bottega"/"Bottega" (escluso JSON locale home.json fuori scope)
    - `pnpm typecheck` passa
  </done>
</task>

<task type="auto">
  <name>Task 3: Restructure pagina Chi Siamo — sposta blocco storia+foto subito dopo hero</name>
  <files>src/routes/la-bottega.tsx</files>
  <action>
    Ristruttura `LaBottegaPage` in `src/routes/la-bottega.tsx` per posizionare il blocco "storia + foto affiancate" IMMEDIATAMENTE DOPO l'hero, riusando il contenuto già esistente (per QUICK-MGZ-03).

    **Stato attuale (ordine sezioni in LaBottegaPage, L60-136):**
    1. Hero ("Dal 1984, l'arte del sandalo nel cuore di Napoli")
    2. Story content — paragrafi della storia full-width centrati (testo solo, no foto)
    3. Team section (TeamCard grid)
    4. BottegaInfoBlock — foto Nunzio + heading "La nostra calzoleria" + paragrafi info + dl indirizzi (questo è il blocco 2-col foto+testo, attualmente in fondo)

    **Stato target (nuovo ordine):**
    1. Hero (invariato)
    2. **NUOVO blocco "Storia + Foto" 2-col responsive** — foto a sinistra, paragrafi storia (`ABOUT_COPY.paragraphs`) a destra (o viceversa, vedi sotto). CTA `ABOUT_COPY.cta` → `ABOUT_COPY.ctaHref` mantenuta sotto al testo.
    3. Team section (invariata, viene dopo)
    4. **BottegaInfoBlock invariato** — resta in fondo perché ha contenuto diverso (info logistiche/sedi/telefono), NON la storia. Mantenere così.

    **Implementazione:**

    a. **Sostituisci** la sezione attuale `{/* Story content */}` (L82-106 — `<ScrollAnimatedSection>` che contiene solo `max-w-3xl` con paragrafi e CTA) con un nuovo blocco a 2 colonne.

    b. **Nuovo blocco JSX** (sostituisce L82-106), seguendo il pattern già in uso in `BottegaInfoBlock` (L178-233) per coerenza visiva:

    ```tsx
    {/* Story content — storia + foto affiancate */}
    <ScrollAnimatedSection className="bg-[var(--color-background)] py-[var(--section-padding-y)]" variants={fadeInUp}>
      <section className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Foto storica/maestro Vincenzo o famiglia — riusa una foto esistente */}
          <m.img
            src="/images/nunzio-ritratto.jpg"
            alt="Calzoleria Prevenzano — la nostra storia, l'arte del sandalo dal 1984"
            className="aspect-[4/3] w-full rounded-[var(--radius-lg)] object-cover"
            loading="lazy"
            width={800}
            height={600}
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          />
          <m.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55, ease: "easeOut", delay: 0.15 }}
          >
            <hr className="stitch-divider stitch-divider--left mb-6" />
            <div className="space-y-5">
              {ABOUT_COPY.paragraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className="text-[var(--text-base)] leading-[var(--leading-relaxed)] text-[var(--color-text-secondary)] first-of-type:text-[var(--text-lg)]"
                >
                  {paragraph}
                </p>
              ))}
            </div>
            <a
              href={ABOUT_COPY.ctaHref}
              className="mt-8 inline-flex h-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-8 text-sm font-medium text-white transition-colors duration-[var(--transition-base)] hover:bg-[var(--color-primary-dark)]"
            >
              {ABOUT_COPY.cta}
            </a>
          </m.div>
        </div>
      </section>
    </ScrollAnimatedSection>
    ```

    c. **Considerazioni**:
    - **Foto**: riusa `/images/nunzio-ritratto.jpg` (la stessa già usata da `BottegaInfoBlock` in fondo) — è la migliore foto storica disponibile e così non bisogna fabbricare nuovi asset. Se in futuro arriverà una foto storica del maestro Vincenzo del 1984 si potrà sostituire facilmente.
    - **Animazioni**: usa `whileInView` + `viewport` invece di `useRef`+`useInView` per non aggiungere refs/state alla pagina; il pattern è già supportato da motion/react. Imports già presenti (`m`, `useInView` da motion/react sono importati a L5; aggiungi `slideInLeft`, `slideInRight` se non già usati o usa stili inline come sopra).
    - **Lunghezza testo**: `ABOUT_COPY.paragraphs` ha 4 paragrafi (~250 parole totali). In layout 2-col su desktop il testo affiancato alla foto sta comodo. Su mobile collassa stacked (foto sopra, testo sotto).
    - **Spacing rhythm**: usa `py-[var(--section-padding-y)]` (rhythm medio, coerente con il pattern esistente; hero usa `py-lg`, fondo usa `py-lg`).
    - **Design tokens**: nessun hex hardcoded, tutti i colori via CSS custom properties (`--color-background`, `--color-primary`, etc.).
    - **DNA stitch**: mantieni `stitch-divider stitch-divider--left` come elemento decorativo (allineato col linguaggio del sito).
    - **Component size**: il file `la-bottega.tsx` resta sotto 200 LOC (attualmente 234 — già sopra la soglia, ma il nuovo blocco non aggiunge LOC se rimpiazza pulito quello vecchio; verifica post-edit con `wc -l`).

    d. **NON toccare**:
    - Hero (L62-79).
    - Team section (L109-129).
    - `BottegaInfoBlock` (L178-233) — resta in fondo, contiene le info sedi/telefono.
    - Costanti `ABOUT_COPY`, `TEAM_MEMBERS`, `TeamCard`.

    e. **Cleanup imports** post-edit: rimuovi import non più usati se necessari (`slideInLeft`/`slideInRight` sono usati da TeamCard, `fadeInUp` è già usato; `useInView`/`useRef` sono usati da TeamCard e BottegaInfoBlock, quindi restano).
  </action>
  <verify>
    <automated>
      cd /Users/pasqualemorra/Projects/calzoleriaprevenzano && pnpm typecheck 2>&1 | tail -20
    </automated>
    Atteso: typecheck passa (no errors).

    Verifica anche struttura JSX:
    - `grep -c "ABOUT_COPY.paragraphs.map" src/routes/la-bottega.tsx` deve essere 1 (i paragrafi storia compaiono una sola volta — nel nuovo blocco, non più nella vecchia sezione full-width).
    - `grep -c "BottegaInfoBlock" src/routes/la-bottega.tsx` deve essere 2 (definizione + invocazione, invariato).
    - `grep -c "TeamCard" src/routes/la-bottega.tsx` deve essere ≥ 2 (invariato).
  </verify>
  <done>
    - Pagina /la-bottega: hero → blocco storia+foto 2-col → team → blocco info sedi (BottegaInfoBlock invariato)
    - Layout 2-col responsive (lg:grid-cols-2, stacked su mobile)
    - Tutti i paragrafi di `ABOUT_COPY` visibili affiancati alla foto
    - CTA "Scopri le nostre collezioni" presente sotto al testo
    - Nessun hex hardcoded, design tokens utilizzati
    - typecheck passa
    - Foto riutilizzata (`/images/nunzio-ritratto.jpg`) — nessun nuovo asset
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 4: Checkpoint visivo — verifica menu, copy e layout pagina Chi Siamo</name>
  <what-built>
    Tre cambi coordinati:
    (1) Voce di menu desktop+mobile rinominata in "Chi Siamo".
    (2) Sostituzione globale display copy "bottega" → "calzoleria" in 5 file route + 1 sezione homepage.
    (3) Pagina /la-bottega ristrutturata: blocco storia + foto affiancate posizionato subito dopo l'hero.
  </what-built>
  <how-to-verify>
    Avvia dev server (se non già attivo): `pnpm dev` (URL solitamente http://localhost:3000 o stampato in console).

    1. **Menu desktop** — apri la home `/`, ridimensiona browser >= 1024px wide. Nella navbar in alto deve comparire "Chi Siamo" (NON "La Bottega"). Cliccando porta a `/la-bottega` (URL invariato).

    2. **Menu mobile** — apri DevTools mobile view (≤ 767px). Tocca l'icona hamburger / menu mobile. Nella lista deve esserci "Chi Siamo" (NON "La Bottega"), link a `/la-bottega`.

    3. **Footer** — scorri fino al footer della home. Sezione "Informazioni" deve avere "Chi Siamo" (capitalizzazione coerente).

    4. **Pagina Chi Siamo** — naviga a `/la-bottega`:
       a. L'hero in cima dice ancora "Dal 1984, l'arte del sandalo nel cuore di Napoli" (invariato).
       b. SUBITO SOTTO l'hero deve esserci un blocco a 2 colonne (su desktop ≥ 1024px): foto a sinistra, paragrafi della storia a destra, con CTA "Scopri le nostre collezioni" sotto al testo. Su mobile (≤ 1023px) il blocco è stacked: foto sopra, testo sotto.
       c. Più sotto: sezione "La famiglia in calzoleria" (NON "in bottega") con team Nunzio + Francesca.
       d. In fondo: blocco "La nostra calzoleria" (NON "La nostra bottega") con foto + info sedi + telefono. Invariato come posizionamento.
       e. Ovunque sulla pagina nessuna parola "bottega"/"Bottega" deve essere visibile (eccetto eventualmente nella URL bar `/la-bottega` — questo è OK).

    5. **Homepage** — naviga a `/`. Sezione "La nostra storia" / "La Calzoleria Prevenzano" — il headline deve dire "La Calzoleria Prevenzano" (NON "La Bottega Prevenzano"). Il paragrafo deve dire "Quando entri in calzoleria" (NON "in bottega").

    6. **Pagina Resi e Recesso** (`/resi-e-recesso`) — primo paragrafo deve dire "...nella nostra calzoleria di Via Chiaia..." (NON "bottega").

    7. **Pagina Contatti** (`/contatti`) — testo intro deve dire "...vieni a trovarci in calzoleria o in laboratorio." (NON "in bottega").

    8. **Test funzionale link**: clicca "Chi Siamo" dal menu desktop e verifica che la pagina si carichi correttamente all'URL `/la-bottega` (slug URL invariato per SEO — questo è intenzionale).

    9. **Build production check** (opzionale ma consigliato): `pnpm build` deve completare senza errori.

    Risultato atteso: tutti i 8 punti verde, nessuna parola "bottega"/"Bottega" visibile fuori da URL/identifier interni.
  </how-to-verify>
  <resume-signal>
    Scrivi "approvato" se tutto è OK, oppure descrivi gli issue specifici (es: "punto 4b — su mobile il testo va sotto la foto ma manca padding", "punto 6 — paragrafo non aggiornato").
  </resume-signal>
</task>

</tasks>

<verification>
**Verifiche automatiche post-completamento:**

1. **Nessuna copy "La Bottega" residua nei file modificati:**
   ```bash
   grep -rn "La Bottega" src/components/shared/MegaMenu.tsx src/components/shared/Footer.tsx public/locales/it/common.json
   # atteso: 0 match
   ```

2. **Nessuna copy "bottega" display residua (escluso identifier/slug):**
   ```bash
   grep -rn "bottega\|Bottega" src/ public/locales/ \
     | grep -v routeTree.gen \
     | grep -v "/la-bottega" \
     | grep -vE "(LaBottegaPage|LaBottegaSection|BottegaInfoBlock|BOTTEGA_COPY|BOTTEGA_IMAGE|laBottega|LaBottegaSectionProps|Bottega Info Block|la-bottega.tsx|LaBottegaSection.tsx)" \
     | grep -v 'home.json'
   # atteso: 0 match
   ```

3. **TypeScript typecheck:**
   ```bash
   pnpm typecheck
   # atteso: pass, no errors
   ```

4. **Build production:**
   ```bash
   pnpm build
   # atteso: pass
   ```

5. **Lint:**
   ```bash
   pnpm lint
   # atteso: pass o warnings invariati rispetto a baseline
   ```

6. **Pagina /la-bottega — ordine sezioni JSX:**
   ```bash
   grep -nE "Page hero|Story content|Team section|Info block" src/routes/la-bottega.tsx
   # atteso: ordine Hero → Story content → Team section → Info block
   ```

**Verifica manuale (umana):** vedi Task 4 checkpoint.
</verification>

<success_criteria>
- [ ] Voce menu desktop "Chi Siamo" visibile e funzionante (link → /la-bottega)
- [ ] Voce menu mobile "Chi Siamo" visibile e funzionante
- [ ] Footer "Chi Siamo" normalizzato (capitalizzazione)
- [ ] i18n nav.laBottega = "Chi Siamo" in common.json
- [ ] Tutte le 12 occorrenze display di "bottega"/"Bottega" sostituite con "calzoleria"/"Calzoleria" (concordanza preservata)
- [ ] Pagina /la-bottega: blocco storia+foto 2-col responsive subito dopo hero
- [ ] BottegaInfoBlock (info sedi) invariato, resta in fondo
- [ ] URL /la-bottega invariato (SEO preservato)
- [ ] Nessun identifier interno modificato (nomi file, funzioni, costanti)
- [ ] `pnpm typecheck` passa
- [ ] `pnpm build` passa
- [ ] Checkpoint umano (Task 4) approvato
</success_criteria>

<output>
After completion, create `.planning/quick/260508-mgz-rinomina-la-bottega-in-chi-siamo-sostitu/260508-mgz-SUMMARY.md` con:
- Files modified (lista esatta)
- Number of replacements applied (atteso: 1 + 1 + 1 + 7 + 2 + 1 + 1 + 1 = 15 cambi atomici)
- New layout structure pagina /la-bottega (ordine sezioni)
- Build verification results (typecheck/build/lint output)
- Eventuali deviazioni dal piano (es: foto diversa scelta dall'esecutore)
</output>
