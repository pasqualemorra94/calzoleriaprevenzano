# Site Generator — Multi-Agent System

## Available Agents

This project uses a multi-agent system for site generation. Agents are defined in `.github/agents/` and are available in:

- **VS Code Copilot**: native via `.github/agents/*.agent.md` (mode picker)
- **OpenCode**: via `.opencode/modes/*.md` (Tab to switch)
- **Cursor**: via `.cursor/rules/*.mdc` (mention @rules in chat)

### Pipeline Principale

- **@dispatcher** — Orchestratore principale — analizza la richiesta, gestisce Discussion Mode e Competitor Snapshot, inferisce i dettagli, scrive il session-plan.json con Design Direction preview, e dice all'utente quale agente invocare dopo. PRIMO AGENTE da invocare sempre.
- **@pipeline** — Esegue l'intera pipeline site-generator in una singola chat. Carica dinamicamente le istruzioni di ogni agente fase per fase, scrive tutti gli artefatti su disco, e chiede "continua" tra un passo e l'altro. Alternativa al flusso multi-chat.
- **@research** — Agente di ricerca — legge il session plan, analizza 20-30 competitor reali via fetch, produce il Site Blueprint completo su disco con Section Frequency, Animation Frequency, Copy Formula, Visual Identity, e Anti-patterns. FASE BLOCCANTE — nessun altro agente può procedere senza il blueprint.
- **@design** — Agente di design — legge il blueprint, esegue l'Anti-AI Audit, produce Design Direction creativa con DNA Fingerprint (font pair, palette, hero layout, animation tier, Shape/Motion/Rhythm). Output bloccato in un file prima di qualsiasi codice.
- **@schema** — Agente database — genera schema Prisma con modelli SDK esatti, seed realistico italiano, docker-compose, .env, package.json scripts. Avvia il DB e verifica tutto prima di passare oltre.
- **@codegen-foundation** — Agente fondamenta frontend — genera design tokens CSS, root layout, bootstrap framework completo (router config, routing multilingual), server.ts Hono, shared components (Navbar, Footer, CookieBanner), setup animazioni, struttura i18n base. Esegue Pre-Generation Checklist e Anti-AI Audit. Primo dei 3 sub-agenti codegen.
- **@codegen-pages** — Agente pagine e sezioni frontend — genera section components con DNA Fingerprint, homepage, pagine principali e secondarie, popola i18n con copy reale dalla Copy Bank. Applica variety check e responsive verification. Secondo dei 3 sub-agenti codegen.
- **@codegen-api** — Agente API routes business — genera tutte le API routes server-side (CRUD, ricerca, filtri), integra auth guards da sdk-auth.server.ts (creato da compliance), validazione Zod, email transazionali, risposte standardizzate. Esegue verifica finale TypeScript. Terzo e ultimo dei 3 sub-agenti codegen.
- **@compliance** — Agente compliance — implementa autenticazione via secure-auth-sdk (MAI JWT/bcrypt manuali), GDPR (cookie banner + pagine legali reali), pagamenti Stripe con verifica firma webhook, security headers, rate limiting. Carica SOLO i moduli necessari.
- **@audit** — Agente di validazione finale — verifica il progetto, corregge i problemi trovati e certifica il risultato finale usando checklist e protocolli canonici. ULTIMO STEP obbligatorio prima di dichiarare il sito pronto.

### Post-Pipeline

- **@features-deepscan** — Agente post-pipeline di deep scan non-refactoring — mappa in profondità TUTTO il codebase (routes, componenti, API, modelli, flussi grafici e funzionali) e produce un Implementation Map completo come baseline anti-regressione. Ogni agente che modifica codice deve consultare questo file per evitare regressioni, modifiche accidentali a funzionalità esistenti, o aggiunte non previste dal piano. Pair agent di features-coding.
- **@features-coding** — Agente post-pipeline di coding enterprise-grade — implementa nuove feature o modifica feature esistenti leggendo SEMPRE l'Implementation Map (prodotto da features-deepscan) come source of truth anti-regressione. Aggiorna l'Implementation Map dopo ogni implementazione. Pair agent di features-deepscan.
- **@features-redesign** — Redesign visuale route-by-route di pagine esistenti — decompone monoliti, applica pattern premium, integra reference esterni, mantiene anti-regressione via Implementation Map
- **@refactoring-deepsearch** — Agente di analisi per refactoring — esegue deep scan dell'intero codebase per trovare TUTTE le occorrenze di feature/sezioni da rimuovere o modificare. Produce un report dettagliato con piano operativo prima di qualsiasi modifica al codice. PRIMO AGENTE del flusso refactoring: invocalo sempre prima di refactoring-code.
- **@refactoring-code** — Agente di esecuzione refactoring — legge il deepsearch-report.md e applica chirurgicamente tutte le modifiche: rimuove routes, components, navigation items, dashboard widgets, modelli Prisma, seed e barrel exports. Rispetta l'execution order sicuro e verifica TypeScript dopo ogni fase. SECONDO AGENTE del flusso refactoring: invocalo dopo refactoring-deepsearch.
- **@deep-debug** — Agente enterprise-grade di deep debugging — analizza chirurgicamente TUTTI i flussi logici del codebase (auth, pagamenti, state machines, data flow, error propagation) per scovare bug latenti, race condition, flussi interrotti, edge case non coperti dai test. Produce un report strutturato con criticità, trace dei flussi e fix suggeriti. Invocabile in qualsiasi momento post-codegen.
- **@quality-check** — Agente opzionale di quality assurance Enterprise — esegue deep analysis del codice generato, produce checklist prioritizzata con criticità, suggerisce quale agente è responsabile dei fix. Invocabile post-audit o in qualsiasi momento per validazione indipendente.
- **@test-writer** — Agente opzionale di test writing — analizza in profondità il progetto generato, pianifica la strategia di test, e scrive TUTTI i test: unit, integration, e2e, security, performance, accessibility, regression, smoke. Produce test reali eseguibili, non placeholder. Invocabile in qualsiasi momento post-codegen.
- **@test-runner** — Agente di test end-to-end — esegue l'intera pipeline su scenari predefiniti, valida ogni artefatto, verifica la conformità ai contratti canonici e genera un report strutturale con metriche di potenza, punti di forza e debolezze. Non produce un sito reale — produce validazione.

## Quick Start

1. **Dispatcher**: Start here. Describe your project -> get a plan.
2. **Research**: Deep competitive analysis -> Site Blueprint.
3. **Design**: Design Direction with DNA Fingerprint.
4. **Schema**: Prisma schema + seed + Docker setup.
5. **Codegen Foundation -> Pages -> API**: Full code generation.
6. **Compliance**: Auth, GDPR, payments, security.
7. **Audit**: Final validation + Anti-AI Smell Test.

Or use **Pipeline** to run all phases in a single chat.
