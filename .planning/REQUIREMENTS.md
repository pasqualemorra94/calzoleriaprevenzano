# Requirements: Calzoleria Prevenzano

**Defined:** 2026-04-02
**Core Value:** I clienti possono sfogliare, personalizzare e acquistare sandali artigianali italiani e prodotti in pelletteria di qualità, con un'esperienza di acquisto fluida che rispecchia l'eccellenza artigianale del brand.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Data Model & Foundation

- [ ] **DATA-01**: Schema database con sistema di opzioni flessibili (ProductOptionGroup → ProductOption → price modifier) per evitare esplosione di varianti combinatorie
- [ ] **DATA-02**: Categorie prodotto gerarchiche a 3 livelli (Sandali → Classica → Infradito; Shop → Pelletteria → Borselli)
- [ ] **DATA-03**: Modelli prodotto con supporto per prodotti personalizzabili (sandali) e prodotti semplici (pelletteria)
- [ ] **DATA-04**: Prezzi memorizzati come centesimi interi IVA-inclusa nel database
- [ ] **DATA-05**: Seed data con utente admin, categorie complete, e prodotti di esempio per ogni tipo

### Product Catalog

- [ ] **CATL-01**: Utente può sfogliare il catalogo prodotti con vista griglia e paginazione (12 per pagina)
- [ ] **CATL-02**: Utente può filtrare prodotti per categoria, sottocategoria, e range di prezzo
- [ ] **CATL-03**: Utente può ordinare prodotti per popolarità, data, prezzo crescente/decrescente
- [ ] **CATL-04**: Utente può cercare prodotti per nome tramite barra ricerca con autocomplete
- [ ] **CATL-05**: Utente può visualizzare pagina prodotto con galleria immagini zoomabile, descrizione, prezzo, e opzioni
- [ ] **CATL-06**: Utente può navigare pagine categoria dedicate con breadcrumb
- [ ] **CATL-07**: Utente vede prodotti "In evidenza" e "Novità" con badge visibili
- [ ] **CATL-08**: Utente può vedere prodotti correlati nella pagina prodotto (stessa categoria, 4-8 prodotti)
- [ ] **CATL-09**: Utente può usare "Guarda velocemente" (quick view modal) per anteprima prodotto senza lasciare la lista

### Product Customization

- [ ] **CONF-01**: Utente può personalizzare sandali Collezione Classica: tipo pelle per zona treccia (3 zone), colore per zona, tacco, taglia, note
- [ ] **CONF-02**: Utente può personalizzare sandali Collezione Gioiello: gioiello, tipo pelle, colore, tacco, taglia, note
- [ ] **CONF-03**: Utente può personalizzare sandali Collezione Bambini: colore, taglia, tacco opzionale
- [ ] **CONF-04**: Utente può selezionare varianti semplici per prodotti Shop (colore per borselli, taglia per cinture)
- [ ] **CONF-05**: Utente vede prezzo aggiornato in tempo reale man mano che seleziona opzioni con price modifier
- [ ] **CONF-06**: Utente vede riepilogo personalizzazione completo prima di aggiungere al carrello
- [ ] **CONF-07**: Le opzioni di personalizzazione variano dinamicamente per tipo prodotto (schema configurabile senza codice)
- [ ] **CONF-08**: Utente può aggiungere note personalizzate (testo libero) al prodotto personalizzato
- [ ] **CONF-09**: Utente può accedere alla guida taglie dalla pagina prodotto (link nel selettore taglia)

### Shopping Cart

- [ ] **CART-01**: Utente può aggiungere prodotti personalizzati al carrello con tutte le opzioni selezionate
- [ ] **CART-02**: Utente può aggiungere prodotti semplici al carrello
- [ ] **CART-03**: Utente vede carrello slide-out dal header con riepilogo articoli e totale
- [ ] **CART-04**: Utente può visualizzare pagina carrello completa con dettagli personalizzazione per articolo
- [ ] **CART-05**: Utente può modificare quantità o rimuovere articoli dal carrello
- [ ] **CART-06**: Utente ospite ha carrello persistente (sessione/cookie)
- [ ] **CART-07**: Carrello ospite viene unito a carrello utente al login (guest→auth merge)
- [ ] **CART-08**: Prezzo viene ricalcolato server-side al checkout (mai fidarsi del prezzo client-side)

### Checkout & Payments

- [ ] **PAYM-01**: Utente può completare checkout come ospite (senza registrazione obbligatoria)
- [ ] **PAYM-02**: Utente può inserire indirizzo di spedizione con formato indirizzo italiano e internazionale
- [ ] **PAYM-03**: Utente può selezionare zona di spedizione con calcolo costi (Italia, UE, resto del mondo)
- [ ] **PAYM-04**: Utente può pagare con Stripe (carte di credito, Apple Pay, Google Pay)
- [ ] **PAYM-05**: Sistema calcola prezzi con Stripe `price_data` inline (mai oggetti Price pre-creati)
- [ ] **PAYM-06**: Sistema usa `tax_behavior: "inclusive"` per IVA italiana (22%, prezzi IVA inclusa)
- [ ] **PAYM-07**: Sistema gestisce webhook Stripe con verifica firma e idempotenza
- [ ] **PAYM-08**: Utente riceve pagina conferma ordine con riepilogo dopo pagamento riuscito
- [ ] **PAYM-09**: Utente riceve email di conferma ordine con dettagli prodotti e personalizzazione
- [ ] **PAYM-10**: Sistema gestisce eventi webhook charge.refunded per rimborsi
- [ ] **PAYM-11**: Utente può creare account dopo l'acquisto (post-checkout registration)

### User Accounts

- [ ] **AUTH-01**: Utente può registrarsi con email e password
- [ ] **AUTH-02**: Utente può effettuare login e rimanere loggato tra sessioni
- [ ] **AUTH-03**: Utente può effettuare logout da qualsiasi pagina
- [ ] **AUTH-04**: Utente può reimpostare password via email
- [ ] **AUTH-05**: Utente può visualizzare storico ordini con stato e dettagli
- [ ] **AUTH-06**: Utente può salvare e gestire indirizzi di spedizione
- [ ] **AUTH-07**: Utente può aggiungere/rimuovere prodotti dalla wishlist (Preferiti)
- [ ] **AUTH-08**: Utente può visualizzare pagina wishlist dedicata
- [ ] **AUTH-09**: Admin può accedere a route protette con ruolo admin (requireAdmin guard)

### Content Pages

- [ ] **CONT-01**: Homepage con hero slider, card collezioni (Classica, Gioiello, Bambini), prodotti in evidenza, novità, sezione personalizzazione
- [ ] **CONT-02**: Pagina Chi Siamo con storia (fondata 1984), team (Vincenzo, Nunzio, Francesca), certificazioni materiali
- [ ] **CONT-03**: Pagina Guida alle Taglie con tabella taglie 33-42, PDF scaricabili per taglia, video tutorial misurazione
- [ ] **CONT-04**: Pagina Contatti con due negozi (Via Chiaia 104, Via Schipa 111), mappe, telefono, email, form contatto
- [ ] **CONT-05**: Footer con info contatto, link informativi, link legali, social (Facebook, WhatsApp, Instagram), P.Iva

### Admin Dashboard

- [ ] **ADMN-01**: Admin può gestire prodotti (CRUD) con upload immagini e configurazione opzioni personalizzazione
- [ ] **ADMN-02**: Admin può gestire categorie gerarchiche (CRUD con parent/child)
- [ ] **ADMN-03**: Admin può visualizzare e gestire ordini (lista, dettaglio, aggiornamento stato)
- [ ] **ADMN-04**: Admin può caricare e gestire immagini prodotti (galleria + swatch colori)
- [ ] **ADMN-05**: Admin può configurare opzioni personalizzazione per tipo prodotto (zone treccia, tipi pelle, colori, tacchi, gioielli)
- [ ] **ADMN-06**: Admin può impostare prodotti come "In evidenza" o "Novità"
- [ ] **ADMN-07**: Admin vede dashboard con statistiche base e ordini recenti

### Legal & Compliance

- [ ] **COMP-01**: Sistema mostra cookie consent banner con accettazione esplicita
- [ ] **COMP-02**: Sistema mostra pagina Privacy Policy con contenuto GDPR
- [ ] **COMP-03**: Sistema mostra pagina Termini e Condizioni d'uso
- [ ] **COMP-04**: Sistema mostra pagina Cookie Policy
- [ ] **COMP-05**: P.Iva (04590921211) visibile nel footer di ogni pagina
- [ ] **COMP-06**: Sistema gestisce richieste GDPR (export dati utente, cancellazione account)
- [ ] **COMP-07**: Funzionalità essenziali (auth, carrello, checkout) funzionano anche con tutti i cookie disabilitati

### SEO & Performance

- [ ] **SEOP-01**: Sistema genera meta tag dinamici e Open Graph per ogni pagina e prodotto
- [ ] **SEOP-02**: Sistema genera sitemap.xml dinamico
- [ ] **SEOP-03**: Sistema genera robots.txt
- [ ] **SEOP-04**: Sistema genera dati strutturati JSON-LD (Product, LocalBusiness, Organization) per SEO
- [ ] **SEOP-05**: Design responsive mobile-first per traffico mobile (60%+ e-commerce italiano)
- [ ] **SEOP-06**: Sistema genera 301 redirect dalla vecchia struttura URL WooCommerce alla nuova

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### User Experience

- **UX-01**: Recensioni e valutazioni prodotti
- **UX-02**: Confronto prodotti side-by-side
- **UX-02**: Visual configurator con preview live del sandalo (color-block)
- **UX-03**: Wizard step-by-step guidato per personalizzazione

### Multi-Language

- **LANG-01**: Supporto multilingua (inglese come seconda lingua)
- **LANG-02**: i18n-ready con stringhe traducibili

### Advanced Features

- **ADV-01**: Codici sconto e promozioni
- **ADV-02**: Programma fedeltà/loyalty
- **ADV-03**: Social login (Google, Facebook)
- **ADV-04**: Newsletter con double opt-in
- **ADV-05**: Feed Instagram / galleria clienti
- **ADV-06**: Integrazione WhatsApp Business per ordini personalizzati avanzata
- **ADV-07**: Tracking inventario avanzato in tempo reale
- **ADV-08**: Blog/editoriale contenuti

## Out of Scope

| Feature | Reason |
|---------|--------|
| 3D product configurator | Richiede modelli 3D di ogni prodotto, investimento massivo in asset creation |
| Mobile app | Web-first, PWA sufficiente per v1 |
| Marketplace multi-vendor | Singolo negozio artigianale, non una piattaforma |
| Prodotti in abbonamento | Sandali e pelletteria sono acquisti una-tantum |
| Live chat widget | Il team produce sandali, non gestisce chat. WhatsApp sufficiente |
| AI recommendations | 118 prodotti, l'utente naviga naturalmente il catalogo |
| AR try-on | Tecnologia non matura per sandali, investimento asset massivo |
| Booking appuntamenti negozio | Non pertinente all'e-commerce online |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 1 | Pending |
| DATA-02 | Phase 1 | Pending |
| DATA-03 | Phase 1 | Pending |
| DATA-04 | Phase 1 | Pending |
| DATA-05 | Phase 1 | Pending |
| AUTH-01 | Phase 2 | Pending |
| AUTH-02 | Phase 2 | Pending |
| AUTH-03 | Phase 2 | Pending |
| AUTH-04 | Phase 2 | Pending |
| AUTH-09 | Phase 2 | Pending |
| CATL-01 | Phase 3 | Pending |
| CATL-02 | Phase 3 | Pending |
| CATL-03 | Phase 3 | Pending |
| CATL-04 | Phase 3 | Pending |
| CATL-05 | Phase 3 | Pending |
| CATL-06 | Phase 3 | Pending |
| CATL-07 | Phase 3 | Pending |
| CATL-08 | Phase 3 | Pending |
| CATL-09 | Phase 3 | Pending |
| CONF-01 | Phase 4 | Pending |
| CONF-02 | Phase 4 | Pending |
| CONF-03 | Phase 4 | Pending |
| CONF-04 | Phase 4 | Pending |
| CONF-05 | Phase 4 | Pending |
| CONF-06 | Phase 4 | Pending |
| CONF-07 | Phase 4 | Pending |
| CONF-08 | Phase 4 | Pending |
| CONF-09 | Phase 4 | Pending |
| CART-01 | Phase 5 | Pending |
| CART-02 | Phase 5 | Pending |
| CART-03 | Phase 5 | Pending |
| CART-04 | Phase 5 | Pending |
| CART-05 | Phase 5 | Pending |
| CART-06 | Phase 5 | Pending |
| CART-07 | Phase 5 | Pending |
| CART-08 | Phase 5 | Pending |
| PAYM-01 | Phase 6 | Pending |
| PAYM-02 | Phase 6 | Pending |
| PAYM-03 | Phase 6 | Pending |
| PAYM-04 | Phase 6 | Pending |
| PAYM-05 | Phase 6 | Pending |
| PAYM-06 | Phase 6 | Pending |
| PAYM-07 | Phase 6 | Pending |
| PAYM-08 | Phase 6 | Pending |
| PAYM-09 | Phase 6 | Pending |
| PAYM-10 | Phase 6 | Pending |
| PAYM-11 | Phase 6 | Pending |
| CONT-01 | Phase 7 | Pending |
| CONT-02 | Phase 7 | Pending |
| CONT-03 | Phase 7 | Pending |
| CONT-04 | Phase 7 | Pending |
| CONT-05 | Phase 7 | Pending |
| AUTH-05 | Phase 8 | Pending |
| AUTH-06 | Phase 8 | Pending |
| AUTH-07 | Phase 8 | Pending |
| AUTH-08 | Phase 8 | Pending |
| ADMN-01 | Phase 9 | Pending |
| ADMN-02 | Phase 9 | Pending |
| ADMN-03 | Phase 9 | Pending |
| ADMN-04 | Phase 9 | Pending |
| ADMN-05 | Phase 9 | Pending |
| ADMN-06 | Phase 9 | Pending |
| ADMN-07 | Phase 9 | Pending |
| COMP-01 | Phase 10 | Pending |
| COMP-02 | Phase 10 | Pending |
| COMP-03 | Phase 10 | Pending |
| COMP-04 | Phase 10 | Pending |
| COMP-05 | Phase 10 | Pending |
| COMP-06 | Phase 10 | Pending |
| COMP-07 | Phase 10 | Pending |
| SEOP-01 | Phase 10 | Pending |
| SEOP-02 | Phase 10 | Pending |
| SEOP-03 | Phase 10 | Pending |
| SEOP-04 | Phase 10 | Pending |
| SEOP-05 | Phase 10 | Pending |
| SEOP-06 | Phase 10 | Pending |

**Coverage:**
- v1 requirements: 76 total
- Mapped to phases: 76
- Unmapped: 0

---
*Requirements defined: 2026-04-02*
*Last updated: 2026-04-02 after roadmap creation*
