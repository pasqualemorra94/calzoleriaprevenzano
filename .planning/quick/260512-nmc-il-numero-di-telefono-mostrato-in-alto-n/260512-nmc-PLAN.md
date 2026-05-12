---
phase: quick
plan: 260512-nmc
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/shared/MegaMenu.tsx
autonomous: true
requirements: [QUICK-260512-nmc]
must_haves:
  truths:
    - "Il numero di telefono nell'header (top bar desktop) è 081 0410442 — lo stesso della pagina /contatti"
    - "Il numero di telefono nel menu mobile è 081 0410442 — lo stesso della pagina /contatti"
    - "Il link tel: e il link wa.me nell'header puntano a +390810410442"
    - "Nessun riferimento residuo a 0817645183 / 081 764 5183 nel codebase"
  artifacts:
    - path: "src/components/shared/MegaMenu.tsx"
      provides: "Header desktop top-bar + menu mobile con numero telefono canonico"
      contains: "390810410442"
  key_links:
    - from: "src/components/shared/MegaMenu.tsx"
      to: "src/routes/contatti.tsx"
      via: "stesso numero primario 081 0410442 / +390810410442"
      pattern: "390810410442"
---

<objective>
Il numero di telefono mostrato nell'header del sito (top bar desktop + menu mobile in MegaMenu.tsx) è obsoleto: mostra `081 764 5183` (`+390817645183`), mentre la pagina contatti — che è la fonte di verità — usa come numero primario `081 0410442` (`+390810410442`, anche WhatsApp). Allineare l'header al numero canonico.

Purpose: Coerenza dei contatti su tutto il sito; evitare che i clienti chiamino un numero non più valido.
Output: `src/components/shared/MegaMenu.tsx` aggiornato in tutte le 6 occorrenze del vecchio numero.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

# Fonte di verità — pagina contatti
@src/routes/contatti.tsx

<interfaces>
<!-- Numero canonico, già usato da contatti.tsx e __root.tsx (JSON-LD Negozio + WhatsApp): -->
<!--   display: "081 0410442"  -->
<!--   tel:    "+390810410442" -->
<!--   wa.me:  "390810410442"  -->
<!-- Da contatti.tsx:
       phones.primary = { display: "081 0410442", tel: "+390810410442", note: "anche WhatsApp" }
       phones.secondary = { display: "081 1952 6465", tel: "+390819526465" }   ← NON usato nell'header
       WHATSAPP_URL = "https://wa.me/390810410442?text=Ciao,%20vorrei%20informazioni%20sui%20vostri%20sandali"
-->

<!-- Occorrenze da correggere in src/components/shared/MegaMenu.tsx (numeri di riga indicativi):
  Desktop top-bar:
    ~411: href="https://wa.me/390817645183"        → href="https://wa.me/390810410442"
    ~429: href="tel:+390817645183"                  → href="tel:+390810410442"
    ~433: <span>081 764 5183</span>                 → <span>081 0410442</span>
  Menu mobile:
    ~774: href="https://wa.me/390817645183"         → href="https://wa.me/390810410442"
    ~788: href="tel:+390817645183"                  → href="tel:+390810410442"
    ~792: <span className="tabular-nums">081 764 5183</span> → <span className="tabular-nums">081 0410442</span>
-->
</interfaces>

Nota contesto: nel progetto NON esiste un file di costanti contatti condiviso (`src/lib/constants/app.ts` non contiene i telefoni). Questo fix è un semplice find-and-replace mirato in MegaMenu.tsx — NON introdurre una nuova astrazione/refactor (fuori scope per un quick task). Il `Footer.tsx` non contiene numeri di telefono, non va toccato.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Allineare il numero di telefono dell'header al numero canonico dei contatti</name>
  <files>src/components/shared/MegaMenu.tsx</files>
  <action>
In `src/components/shared/MegaMenu.tsx` sostituire tutte le 6 occorrenze del numero obsoleto con il numero canonico usato da `src/routes/contatti.tsx` (phones.primary) e da `src/routes/__root.tsx` (JSON-LD Negozio):

1. `href="https://wa.me/390817645183"` → `href="https://wa.me/390810410442"` (2 occorrenze: top-bar desktop ~riga 411, menu mobile ~riga 774)
2. `href="tel:+390817645183"` → `href="tel:+390810410442"` (2 occorrenze: ~riga 429 e ~riga 788)
3. Testo visibile `081 764 5183` → `081 0410442` (2 occorrenze: `<span>081 764 5183</span>` ~riga 433 e `<span className="tabular-nums">081 764 5183</span>` ~riga 792 — mantenere identiche le classi/markup, cambiare solo il testo)

Non modificare altro markup, classi, icone o struttura. Non creare costanti condivise. Non toccare Footer.tsx, contatti.tsx, __root.tsx (già corretti).

Numero canonico di riferimento (dalla pagina contatti, fonte di verità):
- display: `081 0410442`
- tel: `+390810410442`
- wa.me: `390810410442`
  </action>
  <verify>
    <automated>! grep -rn "0817645183\|764 5183" src/ && grep -c "390810410442" src/components/shared/MegaMenu.tsx | grep -qx 4 && grep -c "081 0410442" src/components/shared/MegaMenu.tsx | grep -qx 2 && echo OK</automated>
  </verify>
  <done>Zero occorrenze di `0817645183` o `081 764 5183` in `src/`; `MegaMenu.tsx` contiene 4 riferimenti a `390810410442` (2 wa.me + 2 tel:) e 2 testi visibili `081 0410442`. `pnpm typecheck` baseline invariato (25 errori pre-esistenti, zero regressioni).</done>
</task>

</tasks>

<verification>
- `grep -rn "0817645183\|764 5183" src/` → nessun risultato
- `grep -n "390810410442" src/components/shared/MegaMenu.tsx` → 4 righe (2× wa.me, 2× tel:)
- `grep -n "081 0410442" src/components/shared/MegaMenu.tsx` → 2 righe (testo visibile top-bar + mobile)
- Il numero nell'header coincide con `phones.primary.display` / `phones.primary.tel` in `src/routes/contatti.tsx`
- `pnpm typecheck` — nessuna nuova regressione rispetto alla baseline (25 errori pre-esistenti fuori scope)
</verification>

<success_criteria>
- L'header (desktop top-bar e menu mobile) mostra `081 0410442` e i link `tel:`/`wa.me` puntano a `+390810410442` / `390810410442`
- Nessun riferimento residuo al vecchio numero `081 764 5183` / `0817645183` in `src/`
- Nessun refactor o nuova astrazione introdotta; solo `MegaMenu.tsx` modificato
- Build/typecheck senza regressioni
</success_criteria>

<output>
After completion, create `.planning/quick/260512-nmc-il-numero-di-telefono-mostrato-in-alto-n/260512-nmc-SUMMARY.md`
</output>
