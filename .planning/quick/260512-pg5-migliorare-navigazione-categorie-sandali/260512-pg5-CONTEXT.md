# Quick Task 260512-pg5: Migliorare navigazione sotto-categorie Sandali nell'overlay di ricerca - Context

**Gathered:** 2026-05-12
**Status:** Ready for planning

<domain>
## Task Boundary

Nell'**overlay di ricerca** del sito (la finestra "CERCA — Cosa stai cercando?" che si apre dalla barra di ricerca / icona lente, con le sezioni "SFOGLIA PER CATEGORIA" — card Sandali / Pelletteria / Accessori — e "PIÙ CERCATI" — chip), oggi tappando la card "Sandali" si va direttamente a `/catalogo?category=sandali` e le sotto-categorie dei sandali (Classica, Gioiello, Bambini, Strass, ecc.) non sono raggiungibili da lì. L'utente vuole poter scegliere comodamente le sotto-categorie dei sandali direttamente dall'overlay, e che sia ben usabile da cellulare (è la lamentela principale: "da cellulare è difficile navigare").

Componente da identificare: probabilmente `src/components/shared/QuickSearch.tsx` (l'overlay è importato/usato da `MegaMenu.tsx` via `import { QuickSearch } from "~/components/shared/QuickSearch"`) e/o un eventuale `MobileSearchOverlay.tsx`. La sezione interessata è "SFOGLIA PER CATEGORIA". I dati categoria vengono da `/api/categories` (gerarchici: TopCategory.children: ChildCategory[].children: GrandchildCategory[]).

NON in scope: il mega-menu desktop "SHOP" (3 colonne), il pannello mobile "Shop" di MegaMenu, e le pagine `/admin/*` e `/auth/*`. Eventuali chip sotto-categoria sulla pagina `/catalogo` da mobile = possibile follow-up, non parte di questo task.
</domain>

<decisions>
## Implementation Decisions

### Pattern di interazione — "Espandi al tap"
- Tappando la card **"Sandali"** in "Sfoglia per categoria", la card si espande **sul posto** mostrando sotto le sue sotto-categorie come pillole/voci cliccabili (es. Classica, Gioiello, Bambini, Strass, …) + un link/voce "**Vedi tutti i sandali**" (→ `/catalogo?category=sandali`). Le altre card della lista restano in posizione (non vengono nascoste).
- La card ha un indicatore di stato espandibile (es. chevron che ruota da `›` a `▾`).
- Touch target generosi e chip che vanno a capo (`flex-wrap`) — deve essere comodo su schermo ~375px (è il punto della richiesta).
- Tappare una sotto-categoria → naviga a `/catalogo?category=<slug-sotto-categoria>` e chiude l'overlay (stesso comportamento attuale delle card categoria).

### Ambito — solo "Sandali"
- Il comportamento "espandi → sotto-categorie" si applica **solo alla card Sandali** (gateare per `slug === "sandali"` o costante equivalente). Le card "Pelletteria" e "Accessori" restano link diretti come ora, anche se nel DB hanno figli. (Se l'implementazione più pulita è data-driven su `children.length > 0`, va comunque limitata alla sola categoria Sandali per slug — l'utente ha scelto esplicitamente "solo Sandali".)

### Sotto-categorie da mostrare
- Mostrare i `children` diretti della categoria Sandali. Se ci sono grandchild, valutare se mostrarle annidate o solo i children diretti — preferenza: solo i children diretti per non complicare l'overlay (i grandchild restano raggiungibili dalla listing). A discrezione del planner se i dati suggeriscono diversamente.
- Se utile, includere il conteggio prodotti (`productCount`) accanto a ogni sotto-categoria (è già nei dati `/api/categories`).

### Claude's Discretion
- Scelta esatta del file/componente da modificare (QuickSearch.tsx vs MobileSearchOverlay.tsx vs entrambi se l'overlay è duplicato desktop/mobile).
- Aspetto preciso delle pillole (con/senza conteggio, con/senza immagine — probabilmente senza immagine, sono chip testuali; le immagini categoria non sono garantite per tutte).
- Animazione dell'espansione (semplice height/opacity transition, niente librerie nuove).
- Eventuale piccolo refactor/estrazione se il componente supera i 200 LOC del CLAUDE.md.
</decisions>

<specifics>
## Specific Ideas

Mockup di riferimento approvato dall'utente (variante "Espandi al tap"):

```
CERCA — Cosa stai cercando?

SFOGLIA PER CATEGORIA
┌─────────────────────────────────┐
│ Sandali                       ▾ │  ← tap
│ Personalizzabili — dal classico...│
│ ┌────────┐ ┌────────┐ ┌──────┐  │
│ │Classica│ │Gioiello│ │Bambini│  │
│ └────────┘ └────────┘ └──────┘  │
│ ┌──────┐   → Vedi tutti i sandali│
│ │Strass │                        │
│ └──────┘                        │
├─────────────────────────────────┤
│ Pelletteria                   › │
│ Borselli, cinture e accessori...  │
├─────────────────────────────────┤
│ Accessori                     › │
└─────────────────────────────────┘
```
</specifics>

<canonical_refs>
## Canonical References

- `CLAUDE.md` — max 200 LOC/componente; design token via CSS custom properties / utility Tailwind; niente hex hardcoded; niente raw HTML form (non rilevante qui).
- `/api/categories` — fonte dei dati categoria gerarchici (nessun cambio DB/API necessario).
</canonical_refs>
