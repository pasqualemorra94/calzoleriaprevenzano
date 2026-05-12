---
phase: quick
plan: 260512-nmc
subsystem: header / contatti
tags: [bugfix, contatti, header]
requires: []
provides:
  - "Header desktop top-bar + menu mobile con numero telefono canonico 081 0410442 / +390810410442"
affects:
  - src/components/shared/MegaMenu.tsx
tech-stack:
  added: []
  patterns: ["find-and-replace mirato, nessuna nuova astrazione"]
key-files:
  created: []
  modified:
    - src/components/shared/MegaMenu.tsx
decisions:
  - "Nessun file di costanti contatti condiviso introdotto — fuori scope per quick task"
metrics:
  duration: ~3 min
  completed: 2026-05-12
---

# Quick Task 260512-nmc: Allinea numero telefono header al numero canonico contatti — Summary

Sostituite le 6 occorrenze del numero telefono obsoleto `081 764 5183` / `+390817645183` in `src/components/shared/MegaMenu.tsx` con il numero canonico `081 0410442` / `+390810410442` (lo stesso usato da `src/routes/contatti.tsx` `phones.primary` e da `__root.tsx` JSON-LD Negozio + WhatsApp).

## What Was Done

**Task 1 — Allinea numero telefono header al numero canonico** (commit `02228c7`)

In `src/components/shared/MegaMenu.tsx`:
- Top-bar desktop: `href="https://wa.me/390817645183"` → `390810410442` (riga ~411), `href="tel:+390817645183"` → `+390810410442` (riga ~429), `<span>081 764 5183</span>` → `081 0410442` (riga ~433)
- Menu mobile: `href="https://wa.me/390817645183"` → `390810410442` (riga ~774), `href="tel:+390817645183"` → `+390810410442` (riga ~788), `<span className="tabular-nums">081 764 5183</span>` → `081 0410442` (riga ~792)

Markup, classi, icone e struttura invariati — modificati solo URL e testo. Nessuna costante condivisa creata, Footer.tsx / contatti.tsx / __root.tsx non toccati.

## Verification

- `grep -rn "0817645183\|764 5183" src/` → nessun risultato ✓
- `grep -c "390810410442" src/components/shared/MegaMenu.tsx` → 4 (2× wa.me, 2× tel:) ✓
- `grep -c "081 0410442" src/components/shared/MegaMenu.tsx` → 2 (testo visibile top-bar + mobile) ✓
- `pnpm typecheck` → 25 errori (baseline invariato, zero regressioni, nessun errore in MegaMenu.tsx) ✓

## Deviations from Plan

None - plan executed exactly as written.

## Notes

`pnpm lint` e build deferiti al CI Railway (autodeploy). Modifica puramente testuale, conforme Biome. Smoke browser deferito post-deploy: verificare header desktop top-bar + menu mobile mostrano `081 0410442` e i link `tel:`/`wa.me` puntano a `+390810410442`.

## Self-Check: PASSED

- FOUND: src/components/shared/MegaMenu.tsx (modified)
- FOUND commit: 02228c7
