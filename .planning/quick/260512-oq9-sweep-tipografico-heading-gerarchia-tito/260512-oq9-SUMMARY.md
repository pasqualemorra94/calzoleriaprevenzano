---
phase: quick-260512-oq9
plan: 01
subsystem: frontend / typography
tags: [typography, design-system, refactor, homepage, SectionHeader]
requires: []
provides:
  - "src/components/ui/SectionHeader.tsx — componente riusabile eyebrow+title+lead+decoration"
  - "ui barrel export: SectionHeader + SectionHeaderProps"
affects:
  - "Tutte le sezioni homepage con header (Categories/FeaturedProducts/Testimonials/Personalization/Newsletter/LaBottega)"
  - "TrustStripSection, MobileQuickShop, HeroSection (heading interni allineati)"
tech-stack:
  added: []
  patterns:
    - "Scala tipografica 'Sobrio' applicata via utility Tailwind v4 collegate ai design token (text-xs/3xl/xl/lg/base fluide via clamp)"
    - "Header di sezione = <SectionHeader eyebrow title lead decoration align />"
key-files:
  created:
    - src/components/ui/SectionHeader.tsx
  modified:
    - src/components/ui/index.ts
    - src/components/sections/CategoriesSection.tsx
    - src/components/sections/FeaturedProductsSection.tsx
    - src/components/sections/TestimonialsSection.tsx
    - src/components/sections/PersonalizationSection.tsx
    - src/components/sections/NewsletterSection.tsx
    - src/components/sections/LaBottegaSection.tsx
    - src/components/sections/TrustStripSection.tsx
    - src/components/sections/MobileQuickShop.tsx
    - src/components/sections/HeroSection.tsx
decisions:
  - "Eyebrow uniformi senza icone/lineette laterali — uniformità cross-sezione richiesta dall'utente; le decorazioni laterali (Quote, svg busta, svg stella, lineette h-px) non erano universali tra sezioni → rimosse dal kicker"
  - "H3 card unica taglia text-xl per featured e non-featured (CategoryCard) — gerarchia H2(3xl) > H3(xl) garantita"
  - "FeaturedProducts ProductCard h3 nome prodotto = text-sm font-medium (griglia 4 col densa) — trattato come 'testo card/meta', non come H3 di blocco"
  - "TrustStripSection NON usa SectionHeader (nessun eyebrow/titolo, solo trattini + griglia card su dark)"
  - "MobileQuickShop NON usa SectionHeader (mini-header mobile compatto) — h2 = text-2xl (più piccolo dell'H2 desktop, ok), eyebrow allineato a text-xs uppercase tracking-wide"
  - "HeroSection: <h1> con inline style clamp INVARIATO; normalizzati solo i 2 eyebrow (text-[10px] → text-xs font-semibold uppercase tracking-widest) e il CTA secondario (text-[13px] → text-sm); italic decorativi/maker mark/caption pill lasciati come DNA"
  - "LaBottega CTA: colore portato a text-[var(--color-accent)] per coerenza con la scala 'CTA link inline'"
metrics:
  duration: ~25min
  completed: 2026-05-12
---

# Quick 260512-oq9: Sweep tipografico heading + gerarchia titoli Summary

Introdotto `SectionHeader` riusabile e applicata la scala "Sobrio" agli heading del frontend homepage: i titoli di sezione (H2 `text-3xl`) sono ora visibilmente più grandi dei titoli di card/blocco (H3 `text-xl`), gli eyebrow sono uniformi (`text-xs font-semibold uppercase tracking-widest text-accent`), e le taglie ad-hoc disomogenee (`text-[1.3rem]`, `text-[13px]`, coppie `text-[var(--text-X)] md:text-[var(--text-Y)]`, ecc.) sono state sostituite con utility fluide collegate ai token.

## Cosa è stato fatto

### Task 1 — `SectionHeader` (commit `ca8e58b`)
- `src/components/ui/SectionHeader.tsx` (75 LOC): props `eyebrow?`, `title`, `lead?`, `align?: "center"|"left"`, `as?: "h1"|"h2"`, `decoration?: ReactNode`, `className?` (override del margine wrapper via `cn()`). Niente `any`, niente hex hardcoded.
- Barrel export in `src/components/ui/index.ts` (`SectionHeader` + `SectionHeaderProps`).

### Task 2 — Migrazione sezioni + heading interni (commit `1bcc85e`)
- **CategoriesSection**: header → `<SectionHeader>` con `decoration` = pattern di trattini decorativi (preservato). `CategoryCard`: badge "Collezione" → `text-xs font-medium uppercase tracking-wide`; `<h3>` → `text-xl` (uguale per featured/non-featured); paragrafo → `text-base`; CTA → `text-sm font-medium text-accent`. Lineette `h-px` laterali dell'eyebrow rimosse (uniformità).
- **FeaturedProductsSection**: header → `<SectionHeader eyebrow="Catalogo" title="Novità e bestseller">`. Descrizione tab → `text-lg leading-relaxed`. `ProductCard`: categoria → `text-xs ... uppercase tracking-wide`; nome → `text-sm font-medium`; prezzi → `text-sm`. Tab buttons → `text-sm`.
- **TestimonialsSection**: header → `<SectionHeader eyebrow="Clienti" ...>` (icona Quote del kicker rimossa; Quote resta in `TestimonialCard`). Testo testimonial → `text-base leading-relaxed italic`. Stitch corner accents preservati.
- **PersonalizationSection**: header → `<SectionHeader eyebrow="Su misura" ...>`. `StepCard` h3 → `text-xl`; description → `text-base`. `stitch-divider` preservato. Lineette laterali del kicker rimosse.
- **NewsletterSection**: header → `<SectionHeader>` con `className="mb-0"` (il form segue con `mt-8`). Svg busta del kicker rimosse. Blocco trattini decorativi in fondo preservato.
- **LaBottegaSection**: header → `<SectionHeader align="left" eyebrow="La nostra storia" title={headline}>`. Svg stella del kicker rimossa. Paragrafi story → `text-base leading-relaxed`. CTA → `text-accent`. Stitch divider/frame + badge floating preservati.
- **TrustStripSection** (no SectionHeader): `TrustCard` h3 → `text-base font-semibold text-white`; counter → `text-xl font-bold`; description → `text-sm`. Due blocchi di trattini preservati.
- **MobileQuickShop** (no SectionHeader): eyebrow → `text-xs font-medium uppercase tracking-wide`; h2 → `text-2xl ... text-balance`; CTA "Vedi tutto" → `text-sm`; nomi/prezzi/categoria prodotto → `text-sm` / `text-xs uppercase tracking-wide`; trailing card label → `text-sm italic` / `text-xs uppercase tracking-wide`.
- **HeroSection**: `<h1>` con `style={{ fontSize: "clamp(...) }}` INVARIATO. Eyebrow "Edizione" → `text-xs font-semibold uppercase tracking-widest`; eyebrow "Nuova Collezione" → `text-xs font-semibold uppercase tracking-widest text-accent`.

### Task 3 — Verifica statica (commit `5941a12`)
- Grep heading ad-hoc: residui rimasti documentati come intenzionali (sotto).
- Normalizzato l'ultimo: hero CTA secondario "La nostra storia" `text-[13px]` → `text-sm`.
- `npx tsc --noEmit` = **25 errori** (baseline invariata; zero errori dai file modificati).
- `pnpm build` fallisce sui 25 errori tsc pre-esistenti out-of-scope (scripts/*, validators/auth, api/admin/products, api/products, api/admin/media.$id) — baseline nota, non regressione di questo lavoro; build verificato al deploy Railway.

## Heading ad-hoc lasciati intenzionalmente (giustificati)
- `HeroSection` — `text-[11px] italic` × 2 (caption pill "Modello Sandra", eyebrow "Primavera · 2026") e `text-[9px] tracking-[0.32em] uppercase` (maker mark "Fatto a mano · Napoli · Dal 1984"): elementi decorativi editoriali = DNA dell'hero, fuori scope per il plan ("hero delicato — bassa priorità").
- `PersonalizationSection` — `text-[10px] font-bold` sul numero floating (01/02/03 dentro il cerchio 7×7): micro-badge numerico, `text-xs` lo renderebbe sproporzionato.
- `FeaturedProductsSection` / `MobileQuickShop` — `text-[10px] font-semibold tracking-wider` sul badge "Sconto": micro-badge pill su immagine, dimensione coerente con gli altri badge prodotto del sito.

## Pagine non-homepage (follow-up, non in scope)
Catalogo, pagina prodotto, la-bottega, contatti, ecc. NON toccate — restano come follow-up. `/admin/*` e `/auth/*` fuori scope (Parte 3 separata, già nota).

## Note
- `FeaturedProductsSection.tsx` (279 LOC) e `HeroSection.tsx` (267 LOC) superano la soglia CLAUDE.md di 200 LOC, ma erano già over PRIMA di questo lavoro (FeaturedProducts: 281 → 279, Hero: 268 → 267 — il refactor li ha ridotti, non aumentati). Split non eseguito qui (out of scope dello sweep tipografico).

## Deviations from Plan
None — plan eseguito come scritto. Adattamento minore (non deviazione): in `FeaturedProductsSection` ho normalizzato anche i tab buttons (`text-[13px] md:text-sm` → `text-sm`) — non esplicitamente elencato nel plan ma rientra nella "regola generale: rimuovere le coppie `text-[Npx] md:text-...` ad-hoc".

## Self-Check: PASSED
- `src/components/ui/SectionHeader.tsx` — FOUND
- Commit `ca8e58b` (feat: SectionHeader) — FOUND
- Commit `1bcc85e` (feat: sweep sezioni) — FOUND
- Commit `5941a12` (fix: hero CTA) — FOUND
- `SectionHeader` importato/usato in 6 sezioni — VERIFIED
- typecheck = 25 errori (baseline) — VERIFIED
