# Calzoleria Prevenzano

## What This Is

E-commerce artigianale per Calzoleria Prevenzano, storica calzoleria napoletana fondata nel 1984. Il sito vende sandali personalizzabili fatti a mano, prodotti in pelletteria (borselli, cinture, agende, accessori), articoli per calzature (solette), e verrà espanso con nuovi prodotti in pelle e accessori. I clienti possono personalizzare i sandali scegliendo tacco, tipo e colore di pelle, e gioielli/elementi decorativi.

Il sito è rivolto a clienti che apprezzano l'artigianato italiano di qualità, con spedizione in tutta Italia e all'estero.

## Core Value

I clienti possono sfogliare, personalizzare e acquistare sandali artigianali italiani e prodotti in pelletteria di qualità, con un'esperienza di acquisto fluida che rispecchia l'eccellenza artigianale del brand.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Catalogo prodotti con categorie gerarchiche (Sandali → Classica/Gioiello/Bambini, Shop → Pelletteria/Accessori)
- [ ] Personalizzazione sandali (tacco, pelle, colore, gioiello)
- [ ] Carrello e checkout con pagamenti (Stripe)
- [ ] Account utente con ordini, indirizzi, wishlist
- [ ] Admin dashboard per gestione prodotti, ordini, categorie
- [ ] Pagina Chi Siamo con storia e team
- [ ] Guida alle taglie con PDF download e tutorial video
- [ ] Pagina contatti con due negozi e form
- [ ] Ricerca e filtri prodotti (categoria, prezzo)
- [ ] Gestione inventario e varianti prodotto
- [ ] Notifiche email per ordini
- [ ] GDPR compliance (privacy, cookie, termini)
- [ ] SEO optimization
- [ ] Espansione catalogo con nuovi prodotti in pelle e accessori

### Out of Scope

- Blog/contenuti editoriali — non richiesto nella v1
- Multi-lingua — il sito è in italiano, possibile v2
- App mobile — web-first
- Sistema di recensioni prodotto — differito a v2
- Programma fedeltà — differito a v2
- Booking/appuntamenti in negozio — non pertinente all'e-commerce

## Context

**Business background:**
- Calzoleria Prevenzano, fondata 1984 dal maestro Vincenzo Prevenzano a Napoli
- Ora gestita da Vincenzo, figlio Nunzio (sandal maker, formatosi all'Accademia Moda Napoli), e figlia Francesca
- Due negozi fisici: Via Chiaia 104 (80121) e Via Michelangelo Schipa 111 (80122), Napoli
- P.Iva: 04590921211
- Contatti: 0810410442 / 08119526465, nunzio.prevenzano@gmail.com
- Social: Facebook, WhatsApp, Instagram
- Esportano in tutto il mondo
- Materiali certificati italiani: pellami pregiati, cuoio toscano certificato, cristalli Swarovski e pietre preziose certificate

**Sito esistente (WordPress/WooCommerce con tema Kapee):**
- 82 sandali + 36 prodotti shop = ~118 prodotti totali
- Catalogo gerarchico con 3 livelli di sottocategorie
- Carrello WooCommerce, account utente, wishlist
- Filtri per categoria e range prezzo
- Slider hero, card categorie, carousel prodotti in evidenza/novità
- Guida taglie con PDF per taglie 33-42 e video tutorial misurazione
- Pagina contatti con due sedi e form contatto

**Categoria prodotti esistenti (da migrare):**
- Sandali/Classici/Con infradito (28 prodotti, €60-75)
- Sandali/Classici/Schiava (7 prodotti, €90-100)
- Sandali/Gioiello/Con infradito (29 prodotti, €110-170)
- Sandali/Gioiello/Aggiunta ciondolo (5 prodotti, €170)
- Sandali/Gioiello/Cavigliera (4 prodotti)
- Sandali/Gioiello/Fasce (4 prodotti)
- Sandali/Gioiello/Strass (4 prodotti)
- Sandali/Bambini/Infradito (2 prodotti)
- Sandali/Bambini/No infradito (4 prodotti)
- Shop/Pelletteria/Borselli (6 prodotti, €45-49.90)
- Shop/Pelletteria/Cinture (14 prodotti, €25)
- Shop/Pelletteria/Agende (4 prodotti)
- Shop/Pelletteria/Accessori (2 prodotti, €20)
- Shop/Articoli per calzature/Solette (10 prodotti)

**Progetti di espansione:**
- Nuovi prodotti in pelle e accessori da aggiungere al catalogo

## Constraints

- **Tech Stack**: TypeScript + React (TanStack Start), Prisma 7 ORM, shadcn/ui, Better Auth — definito dal progetto monorepo
- **Lingua**: Italiano come lingua primaria
- **Brand**: Mantenere l'identità visiva artigianale di Calzoleria Prevenzano
- **Contenuti**: Tutti i contenuti e prodotti del sito esistente devono essere presenti nel nuovo sito
- **Dominio**: calzoleriaprevenzano.it
- **GDPR**: Compliance con normativa italiana/europea
- **Pagamenti**: Stripe per pagamenti online

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| TanStack Start come framework | Moderno SSR React con file-based routing, type-safe server functions | — Pending |
| Prisma 7 per ORM | Type-safe database access, migrations automatiche | — Pending |
| shadcn/ui per componenti | Componenti accessibili, personalizzabili, Tailwind-based | — Pending |
| Better Auth per autenticazione | Auth leggero e type-safe per TypeScript | — Pending |
| Stripe per pagamenti | Standard di settore, supporto EUR, webhook robusti | — Pending |
| Sviluppo con site-generator-agents | Pipeline multi-agente (dispatcher → research → design → schema → codegen → compliance → audit) | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-02 after initialization*
