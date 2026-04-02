# Roadmap: Calzoleria Prevenzano

## Overview

Costruire un e-commerce artigianale per Calzoleria Prevenzano che sostituisca il sito WordPress/WooCommerce esistente. Il percorso va dalla fondazione (schema database con option groups anti-esplosione varianti) attraverso il core differenziante (configuratore sandali multi-zona), fino al checkout Stripe, pagine contenuto, admin dashboard, e compliance GDPR — tutto pronto per la migrazione dei 118 prodotti esistenti.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Data Model** - Schema database con option groups, project scaffold, design system, seed data
- [ ] **Phase 2: Authentication** - Registrazione, login, logout, password reset, role guards admin
- [ ] **Phase 3: Product Catalog** - Catalogo con filtri, ricerca, pagine categoria, dettaglio prodotto, quick view
- [ ] **Phase 4: Sandal Configurator** - Configuratore sandali multi-zona con prezzo dinamico per 3 collezioni + varianti Shop
- [ ] **Phase 5: Shopping Cart** - Carrello server-side con personalizzazioni, guest cart, merge login
- [ ] **Phase 6: Checkout & Payments** - Checkout Stripe con spedizione internazionale, webhook, conferma ordine
- [ ] **Phase 7: Content Pages** - Homepage, Chi Siamo, Guida Taglie, Contatti, footer completo
- [ ] **Phase 8: Account Features** - Storico ordini, indirizzi salvati, wishlist (Preferiti)
- [ ] **Phase 9: Admin Dashboard** - CRUD prodotti/categorie/ordini, configurazione personalizzazione, statistiche
- [ ] **Phase 10: Legal, SEO & Launch** - GDPR compliance, cookie consent, SEO tecnico, responsive, redirect 301

## Phase Details

### Phase 1: Foundation & Data Model
**Goal**: Il progetto ha una base solida con schema database anti-esplosione varianti, design system artigianale, e dati di esempio pronti per lo sviluppo
**Depends on**: Nothing (first phase)
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, DATA-05
**Success Criteria** (what must be TRUE):
  1. Prisma schema definisce prodotti con option groups indipendenti (ProductOptionGroup → ProductOption → price modifier), categorie gerarchiche a 3 livelli, e prezzi in centesimi interi IVA-inclusa
  2. Applicazione gira localmente con Docker PostgreSQL, routing base, e layout con navbar e footer placeholder
  3. Database seed contiene utente admin, tutte le categorie (Sandali/Classica/Gioiello/Bambini, Shop/Pelletteria/Accessori/Articoli per calzature), e prodotti di esempio per ogni tipo
  4. shadcn/ui configurato con design tokens e Tailwind CSS v4 che riflettono l'identità artigianale del brand
**Plans**: TBD

### Phase 2: Authentication
**Goal**: Utenti possono creare account, effettuare login/logout, reimpostare password, e admin può accedere a route protette
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-09
**Success Criteria** (what must be TRUE):
  1. Utente può registrarsi con email e password
  2. Utente può effettuare login e rimanere loggato tra sessioni browser
  3. Utente può effettuare logout da qualsiasi pagina
  4. Utente può reimpostare password ricevendo un link via email
  5. Admin può accedere a route /admin/* mentre utenti normali vengono rediretti alla home
**Plans**: TBD
**UI hint**: yes

### Phase 3: Product Catalog
**Goal**: I clienti possono sfogliare, cercare, filtrare e esplorare il catalogo prodotti completo con tutte le categorie
**Depends on**: Phase 1, Phase 2 (for wishlist icons on cards)
**Requirements**: CATL-01, CATL-02, CATL-03, CATL-04, CATL-05, CATL-06, CATL-07, CATL-08, CATL-09
**Success Criteria** (what must be TRUE):
  1. Utente vede griglia prodotti con paginazione (12 per pagina) e può filtrare per categoria, sottocategoria, e range di prezzo
  2. Utente può cercare prodotti per nome tramite barra ricerca con autocomplete
  3. Utente può visualizzare pagina prodotto con galleria immagini zoomabile, descrizione, prezzo, opzioni disponibili, e prodotti correlati (stessa categoria)
  4. Utente può navigare pagine categoria con breadcrumb gerarchici (es. Sandali → Classica → Infradito)
  5. Utente può usare quick view modal per anteprima prodotto e vede badge "In evidenza" e "Novità" sui prodotti
**Plans**: TBD
**UI hint**: yes

### Phase 4: Sandal Configurator
**Goal**: I clienti possono personalizzare sandali con opzioni dinamiche (pelle, colore, tacco, gioiello) specifiche per tipo collezione, vedendo il prezzo aggiornato in tempo reale
**Depends on**: Phase 3
**Requirements**: CONF-01, CONF-02, CONF-03, CONF-04, CONF-05, CONF-06, CONF-07, CONF-08, CONF-09
**Success Criteria** (what must be TRUE):
  1. Cliente può personalizzare sandali Collezione Classica selezionando tipo pelle per 3 zone treccia, colore per zona, tacco, taglia, con note personalizzate
  2. Cliente può personalizzare sandali Collezione Gioiello selezionando gioiello, tipo pelle, colore, tacco, taglia
  3. Cliente può personalizzare sandali Collezione Bambini con colore, taglia, tacco opzionale; e selezionare varianti semplici per prodotti Shop
  4. Il prezzo si aggiorna in tempo reale man mano che il cliente seleziona opzioni (base + price modifiers)
  5. Cliente vede riepilogo personalizzazione completo prima di procedere e può accedere alla guida taglie dal selettore taglia
**Plans**: TBD
**UI hint**: yes

### Phase 5: Shopping Cart
**Goal**: I clienti possono gestire un carrello con prodotti personalizzati e semplici, persistente come ospite e unificabile al login
**Depends on**: Phase 4
**Requirements**: CART-01, CART-02, CART-03, CART-04, CART-05, CART-06, CART-07, CART-08
**Success Criteria** (what must be TRUE):
  1. Cliente può aggiungere prodotti personalizzati (con tutte le opzioni) e prodotti semplici al carrello
  2. Cliente vede carrello slide-out dal header con riepilogo articoli/totale e pagina carrello completa con dettagli personalizzazione per articolo
  3. Cliente può modificare quantità o rimuovere articoli dal carrello
  4. Carrello ospite è persistente via sessione/cookie e viene unito al carrello utente autenticato al login
  5. Il prezzo è sempre ricalcolato server-side al checkout — mai fidarsi del prezzo client-side
**Plans**: TBD
**UI hint**: yes

### Phase 6: Checkout & Payments
**Goal**: I clienti possono completare un acquisto con pagamenti Stripe (EUR, SCA-compliant), spedizione internazionale, e ricevere conferma ordine via email
**Depends on**: Phase 5
**Requirements**: PAYM-01, PAYM-02, PAYM-03, PAYM-04, PAYM-05, PAYM-06, PAYM-07, PAYM-08, PAYM-09, PAYM-10, PAYM-11
**Success Criteria** (what must be TRUE):
  1. Cliente può completare checkout come ospite senza registrazione obbligatoria
  2. Cliente può inserire indirizzo di spedizione e selezionare zona (Italia, UE, resto del mondo) con calcolo costi
  3. Cliente paga con Stripe (carte, Apple Pay, Google Pay) e vede pagina conferma ordine con riepilogo completo
  4. Sistema gestisce webhook Stripe con verifica firma e idempotenza per conferma ordine e rimborsi
  5. Cliente riceve email di conferma ordine con dettagli prodotti e personalizzazioni
  6. Cliente può creare account dopo aver completato l'acquisto (post-checkout registration)
**Plans**: TBD
**UI hint**: yes

### Phase 7: Content Pages
**Goal**: Il sito presenta la storia del brand, guide utili, punti di contatto, e una homepage che vetrina l'offerta completa
**Depends on**: Phase 3 (products for homepage)
**Requirements**: CONT-01, CONT-02, CONT-03, CONT-04, CONT-05
**Success Criteria** (what must be TRUE):
  1. Homepage con hero slider, card collezioni (Classica, Gioiello, Bambini), prodotti in evidenza, novità, sezione personalizzazione artigianale
  2. Pagina Chi Siamo con storia (fondata 1984), team (Vincenzo, Nunzio, Francesca), e certificazioni materiali italiani
  3. Pagina Guida alle Taglie con tabella taglie 33-42, PDF scaricabili per taglia, video tutorial misurazione
  4. Pagina Contatti con due negozi (Via Chiaia 104 e Via Schipa 111), mappe, telefono, email, form contatto
  5. Footer completo con info contatto, link informativi, link legali, social (Facebook, WhatsApp, Instagram), P.Iva
**Plans**: TBD
**UI hint**: yes

### Phase 8: Account Features
**Goal**: Utenti registrati hanno un'esperienza completa con storico ordini, indirizzi salvati, e wishlist funzionante
**Depends on**: Phase 2, Phase 6 (orders exist for history)
**Requirements**: AUTH-05, AUTH-06, AUTH-07, AUTH-08
**Success Criteria** (what must be TRUE):
  1. Utente può visualizzare storico ordini con stato e dettagli di ogni ordine
  2. Utente può salvare e gestire indirizzi di spedizione (aggiungere, modificare, eliminare)
  3. Utente può aggiungere/rimuovere prodotti dalla wishlist (Preferiti) da qualsiasi pagina prodotto o card
  4. Utente può visualizzare pagina wishlist dedicata con tutti i prodotti salvati
**Plans**: TBD
**UI hint**: yes

### Phase 9: Admin Dashboard
**Goal**: L'amministratore può gestire tutti gli aspetti del negozio — prodotti, categorie, ordini, configurazione personalizzazione — senza toccare il database
**Depends on**: Phase 6 (orders to manage), Phase 3 (products/categories exist)
**Requirements**: ADMN-01, ADMN-02, ADMN-03, ADMN-04, ADMN-05, ADMN-06, ADMN-07
**Success Criteria** (what must be TRUE):
  1. Admin può creare, modificare, eliminare prodotti con upload immagini e configurazione opzioni personalizzazione
  2. Admin può gestire categorie gerarchiche con parent/child (CRUD completo)
  3. Admin può visualizzare e gestire ordini (lista con filtri, dettaglio, aggiornamento stato)
  4. Admin può configurare opzioni personalizzazione per tipo prodotto (zone treccia, tipi pelle, colori, tacchi, gioielli)
  5. Admin vede dashboard con statistiche base (ordini, ricavi) e ordini recenti
**Plans**: TBD
**UI hint**: yes

### Phase 10: Legal, SEO & Launch
**Goal**: Il sito è compliant GDPR, ottimizzato per motori di ricerca, responsive su mobile, e pronto per il lancio con redirect dalla vecchia struttura URL
**Depends on**: Phase 9 (all features built)
**Requirements**: COMP-01, COMP-02, COMP-03, COMP-04, COMP-05, COMP-06, COMP-07, SEOP-01, SEOP-02, SEOP-03, SEOP-04, SEOP-05, SEOP-06
**Success Criteria** (what must be TRUE):
  1. Banner cookie consent appare alla prima visita e funzionalità essenziali (auth, carrello, checkout) funzionano anche con tutti i cookie disabilitati
  2. Pagine Privacy Policy, Cookie Policy, Termini e Condizioni sono accessibili; P.Iva visibile nel footer di ogni pagina
  3. Sistema gestisce richieste GDPR (export dati utente, cancellazione account)
  4. Ogni pagina e prodotto ha meta tag dinamici, Open Graph, e dati strutturati JSON-LD (Product, LocalBusiness, Organization)
  5. Sitemap.xml e robots.txt generati dinamicamente; design responsive mobile-first; redirect 301 mappati dalla vecchia struttura URL WooCommerce
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Data Model | 0/? | Not started | - |
| 2. Authentication | 0/? | Not started | - |
| 3. Product Catalog | 0/? | Not started | - |
| 4. Sandal Configurator | 0/? | Not started | - |
| 5. Shopping Cart | 0/? | Not started | - |
| 6. Checkout & Payments | 0/? | Not started | - |
| 7. Content Pages | 0/? | Not started | - |
| 8. Account Features | 0/? | Not started | - |
| 9. Admin Dashboard | 0/? | Not started | - |
| 10. Legal, SEO & Launch | 0/? | Not started | - |
