# Mobile UX — Cookie Banner + Product Gallery + Sticky CTA Design Spec

**Data**: 2026-04-30
**Stato**: Approvato (in attesa review utente)
**Owner**: Pasquale
**Tipo**: Frontend UX / Mobile-first redesign

## Contesto

Tre problemi mobile segnalati dall'utente sul sito live:

1. **Cookie banner** copre il 50-60% dell'above-the-fold della home su iPhone (4 bottoni in colonna + testo lungo + padding generoso)
2. **Galleria foto pagina prodotto**: cliccando una thumbnail su mobile, l'utente è già scrollato sulle thumbnail e non vede la foto principale che cambia fuori viewport. Inoltre il long-press magnifier delle thumbnail apre un popup `top: -136px` che fluttua sopra causando confusione.
3. **Pulsante "Aggiungi al carrello"** mobile: layout `flex-col` impilato (quantità centrata sopra, pulsante full-width sotto) percepito come "veramente brutto"; il pulsante scrolla via mentre l'utente esplora le varianti del configuratore (lungo).

Le pagine prodotto sono il cuore della conversion (sono l'unico modo di acquistare). L'utente chiede di "renderle un vero portento mobile".

## Decisioni chiave

| Decisione | Scelta | Motivazione |
|-----------|--------|-------------|
| Cookie banner mobile target altezza | ~180-220px (vs 400-500px attuali) | <30% viewport invece di 50-60% |
| Bottoni banner mobile | 2 primari side-by-side (Rifiuta + Accetta), Personalizza come link inline | Decisione binaria immediata, granularità per chi vuole |
| Pannello preferenze mobile | Modal full-screen (vs accordion inline) | Su schermo piccolo l'accordion espande il banner sopra il viewport |
| Galleria mobile paradigma | Carousel swipe full-width + dots indicator + tap-to-zoom modal | Pattern Instagram/Asos/Zalando, gesto naturale, niente thumbnails impilate |
| Implementazione swipe | CSS `scroll-snap-type` nativo (no librerie) | Zero overhead JS, performance native iOS/Android, ~30 LOC |
| Long-press magnifier su mobile | **Rimosso** | Era confondente, popup fluttuante fuori posizione |
| Pinch-to-zoom modal | CSS `touch-action: pinch-zoom` nativo | Gesto noto agli utenti mobile, niente librerie |
| Add-to-cart mobile | Sticky bottom bar fixed (pattern Zalando/Asos/Nike) | CTA sempre raggiungibile durante esplorazione varianti |
| Sticky bar visibility | Sempre visibile su mobile (no auto-hide) | Su mobile il CTA inline è già nascosto via `md:flex hidden`, quindi nessuna duplicazione possibile. Auto-hide complica senza beneficio. |
| Body padding compensativo | `padding-bottom: 76px` su mobile quando sticky bar visibile | Evita coperture contenuto |

## Strategia di consegna

Singolo quick task GSD con 3 sub-feature indipendenti tra loro ma raggruppate sul tema "mobile UX". Tutto in unico bundle perché:
- Affinity tematica forte (mobile-only)
- Possibili interazioni (sticky bar Z-index vs cookie banner Z-index — meglio risolverli insieme)
- Una singola sessione di smoke testing mobile (DevTools + telefono reale)

---

## Modifiche dettagliate

### 1. Cookie banner mobile compact

**File**: `src/components/shared/CookieBanner.tsx` (164 LOC esistenti)

#### 1.1 Padding più stretto su mobile
- Esterno: `p-4 md:p-6` → `p-3 md:p-6`
- Interno (card wrapper): `p-6` → `p-4 md:p-6`

#### 1.2 Testo accorciato su mobile
- Mobile (`<md`): rimuovere `<h3>` "Rispettiamo la tua privacy" + accorciare paragrafo:
  > *Usiamo cookie tecnici e, con il tuo consenso, analitici. [Cookie Policy](/cookie)*
- Desktop (`md:` in su): testo attuale completo invariato (header + 3 righe paragrafo)
- Implementazione: due blocchi con `md:hidden` / `hidden md:block`

#### 1.3 Bottoni riorganizzazione
- Mobile (`<md`): `flex-row gap-2` con 2 bottoni grandi al 50% width:
  - "Rifiuta" (outline `border-[var(--color-border)]`)
  - "Accetta" (filled `bg-[var(--color-primary)]`)
- Sotto i 2 bottoni, riga separata con link `text-xs underline text-[var(--color-text-muted)]`:
  > *Personalizza preferenze*
- Click su "Personalizza preferenze" → apre modal full-screen (vedi 1.5)
- Desktop (`md:` in su): layout attuale con 3 bottoni in fila + Personalizza inline (invariato)

#### 1.4 Bottone X chiudi (riga 84-90)
- Mobile: `hidden md:block` (rimuovo). Il bottone "Rifiuta" assolve la stessa funzione semantica.
- Desktop: invariato

#### 1.5 Pannello preferenze mobile come modal full-screen
Quando `showPreferences === true` E viewport `<md`:
- Renderizza modal `fixed inset-0 z-[var(--z-modal)] bg-black/50` con card centered `bg-[var(--color-surface)] rounded-lg p-6 max-w-md w-[90vw] max-h-[80vh] overflow-y-auto`
- Header card: titolo "Preferenze cookie" + close X
- Contenuto: `<CookiePreferencesPanel />` esistente + bottoni "Salva preferenze" / "Annulla"
- Body scroll lock mentre modal aperta (set `overflow:hidden` su body, restore on close)
- Su desktop il pannello resta inline come attualmente

#### Risultato altezza mobile (post-fix)
- Card padding: 16px*2 = 32px
- Testo 1 riga: ~24px
- Bottoni height (h-10): 40px
- Link "Personalizza" + spacing: ~28px
- Padding outer: 12px*2 = 24px
- **Totale: ~150-180px** (sotto 25% viewport iPhone)

---

### 2. Gallery mobile carousel swipe

**File**: `src/components/product/ProductGallery.tsx` (376 LOC esistenti)

#### 2.1 Split desktop/mobile
- Wrapper `ProductGallery` rileva viewport via classi Tailwind condizionali (no JS detection):
  - `<DesktopGallery className="hidden md:block" />` — codice attuale invariato (ZoomableImage + thumbnails + ZoomLensPanel)
  - `<MobileImageCarousel className="block md:hidden" />` — nuovo componente
- Entrambi ricevono stesse props `images`, `selectedIndex`, `onSelect`, `productName`

#### 2.2 Nuovo componente: `MobileImageCarousel`

Layout:
```
.relative
  .scroll-container (overflow-x-auto, scroll-snap-type: x mandatory, scroll-snap-stop: always)
    img.slide (w-full, aspect-square, scroll-snap-align: center, flex-shrink-0)
    img.slide
    img.slide
    ...
  .zoom-icon (absolute bottom-3 right-3, tap = open zoom modal)
  .dots-bar (sotto: pallini cliccabili + counter "1 / 5")
```

CSS chiave:
```css
.scroll-container {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-snap-stop: always;
  scrollbar-width: none; /* Firefox */
}
.scroll-container::-webkit-scrollbar { display: none; }
.scroll-container > img {
  width: 100%;
  flex-shrink: 0;
  scroll-snap-align: center;
  aspect-ratio: 1 / 1;
  object-fit: cover;
}
```

Sync `selectedIndex` parent state via `IntersectionObserver`:
```typescript
useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.find(e => e.intersectionRatio > 0.6);
      if (visible) {
        const index = Number(visible.target.getAttribute('data-index'));
        if (index !== selectedIndex) onSelect(index);
      }
    },
    { root: containerRef.current, threshold: 0.6 }
  );
  slidesRef.current.forEach(el => observer.observe(el));
  return () => observer.disconnect();
}, [selectedIndex, onSelect]);
```

Click su un dot = `slidesRef.current[i]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })`.

Counter testuale "X / N" sotto i dots, font `text-xs text-[var(--color-text-muted)]`.

#### 2.3 Tap-to-zoom: `MobileImageZoomModal`

Tap sulla foto principale (o su icon zoom in basso a destra) → apre modal:
```jsx
<div className="fixed inset-0 z-[var(--z-modal)] bg-black/95 flex items-center justify-center">
  <button className="absolute top-4 right-4 text-white" onClick={onClose}>
    <X className="h-6 w-6" />
  </button>
  <img
    src={currentImage.url}
    alt={currentImage.alt}
    className="max-w-full max-h-full object-contain touch-pinch-zoom"
    style={{ touchAction: 'pinch-zoom' }}
  />
</div>
```

- Body scroll lock mentre aperto
- Tap fuori dall'immagine = chiude
- Tasto ESC = chiude (desktop fallback)
- Swipe left/right NON cambia immagine (pinch è priorità; per cambiare chiude e ri-tappa nel carousel)

#### 2.4 Cleanup vecchio codice
- `MagnifiableThumbnail` (riga 247-374): mantengo ma uso solo da `DesktopGallery`. Su mobile non viene mai renderizzato.
- `ZoomLensPanel` (riga 185-243): idem, solo desktop.
- `MobileImageCarousel` non condivide nulla con `MagnifiableThumbnail` (logica swipe nativa, no long-press, no popup magnifier).

#### 2.5 Edge-to-edge mobile
- Su mobile la foto deve occupare l'intera larghezza dello schermo (ignora `--page-padding-x`):
- Container parent in `prodotti.$slug.tsx`: `mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]`
- Soluzione: il `MobileImageCarousel` si applica `-mx-[var(--page-padding-x)] md:mx-0` per "negative margin" e occupare full width solo mobile
- Alternativa: mai un wrap con padding su mobile (ristrutturare grid)

---

### 3. Sticky add-to-cart bar mobile

**File nuovo**: `src/components/product/MobileStickyAddToCart.tsx` (~120 LOC)
**File modificati**: `src/components/product/VariantSelector.tsx`, `src/routes/prodotti.$slug.tsx`

#### 3.1 Componente `MobileStickyAddToCart`

Props:
```typescript
interface Props {
  price: number;
  quantity: number;
  onSetQuantity: (q: number) => void;
  cartStatus: "idle" | "loading" | "success";
  canAddToCart: boolean;
  onAddToCart: () => void;
  effectiveStock: number;
  allOptionsSelected: boolean;
}
```

Layout:
```jsx
<div className="md:hidden fixed bottom-0 left-0 right-0 z-[var(--z-sticky)]
                bg-white/95 backdrop-blur border-t border-[var(--color-border)]
                shadow-[0_-4px_12px_rgba(0,0,0,0.06)] px-4 py-3">
  <div className="flex items-center gap-3">
    <div className="flex-shrink-0">
      <p className="text-base font-semibold text-[var(--color-primary)]">
        EUR {price.toFixed(2)}
      </p>
    </div>
    <div className="flex items-center rounded-md border border-[var(--color-border)]">
      <button onClick={() => onSetQuantity(Math.max(1, quantity-1))} className="h-10 w-10">
        <Minus className="h-3 w-3" />
      </button>
      <span className="h-10 w-8 flex items-center justify-center text-sm font-semibold">
        {quantity}
      </span>
      <button onClick={() => onSetQuantity(Math.min(10, quantity+1))} className="h-10 w-10">
        <Plus className="h-3 w-3" />
      </button>
    </div>
    <button
      onClick={onAddToCart}
      disabled={!canAddToCart || cartStatus === "loading" || effectiveStock === 0}
      className="flex-1 h-11 bg-[var(--color-primary)] text-white rounded-md
                 font-medium disabled:opacity-60"
    >
      {/* CTA dinamico per stato */}
    </button>
  </div>
</div>
```

#### 3.2 Stati CTA dinamici

| Condizione | Label bottone | Icon | Stile |
|-----------|---------------|------|-------|
| `effectiveStock === 0` | "Esaurito" | — | disabled |
| `!allOptionsSelected` | "Seleziona opzioni" | — | disabled |
| `cartStatus === "loading"` | "Aggiungo..." | Loader2 spin | disabled |
| `cartStatus === "success"` | "Aggiunto!" | Check | bg-green-600 (2 sec) |
| Default (idle, ok) | "Aggiungi al carrello" | ShoppingBag | bg-primary |

#### 3.3 Visibilità sticky bar

Su mobile la sticky bar è **sempre visibile** (non c'è alcun CTA inline da non duplicare, perché in 3.4 lo nascondiamo). Niente IntersectionObserver, niente auto-hide. Implementazione più semplice e robusta.

Su desktop il componente non viene proprio renderizzato (`md:hidden`).

#### 3.4 Modifica `VariantSelector.tsx`

Riga 142-164 (blocco quantità + CTA): cambiare wrapper da `<div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">` a `<div className="mt-8 hidden md:flex flex-col gap-4 sm:flex-row sm:items-center">`. Su mobile il blocco è completamente nascosto, su desktop invariato.

Nessun sentinel, nessun ref, nessun props drilling aggiuntivo.

#### 3.5 Mount in `prodotti.$slug.tsx`

Sotto il `<RelatedProducts />`:
```jsx
<MobileStickyAddToCart
  price={priceBreakdown.total}
  quantity={quantity}
  onSetQuantity={(q) => setQuantity(q)}
  cartStatus={cartStatus}
  canAddToCart={!!canAddToCart}
  onAddToCart={handleAddToCart}
  effectiveStock={effectiveStock}
  allOptionsSelected={allVisibleGroupsSelected}
/>
```

#### 3.6 Body padding compensativo

Nel layout pagina prodotto: aggiungere `pb-24 md:pb-0` al wrapper più esterno (76px sticky bar + 20px buffer). Solo mobile, desktop invariato.

---

## Z-index gerarchia (verificare in implementazione)

| Elemento | z-index |
|----------|---------|
| Cookie banner (bottom mobile) | `var(--z-toast)` (più alto) |
| Cookie preferences modal mobile | `var(--z-modal)` |
| Mobile zoom modal foto | `var(--z-modal)` |
| Sticky add-to-cart bar | `var(--z-sticky)` (sotto banner ma sopra contenuto) |
| Mega menu mobile drawer | `var(--z-overlay)` |

Quando il banner cookie è ancora visibile (utente non ha scelto), la sticky bar deve essere sotto al banner. Quando il banner è chiuso, la sticky bar emerge in fondo.

## Atomic commits previsti

1. `feat(banner): cookie banner compact mobile (testo, padding, layout bottoni)`
2. `feat(banner): cookie preferences modal full-screen su mobile`
3. `feat(product): MobileImageCarousel con scroll-snap nativo + dots`
4. `feat(product): MobileImageZoomModal con pinch-zoom`
5. `refactor(product): split ProductGallery desktop/mobile, cleanup magnifier su mobile`
6. `feat(product): MobileStickyAddToCart sticky bottom bar`
7. `feat(product): body padding compensativo per sticky bar mobile`

7 commit atomici, ~6 file impattati di cui 2 nuovi.

## Verification

- **Smoke browser DevTools**: viewport iPhone 12 (390x844)
  - Banner cookie: misurare altezza ≤ 220px
  - Bottoni "Rifiuta" + "Accetta" side-by-side, "Personalizza preferenze" come link sotto
  - Click "Personalizza preferenze" → modal full-screen apre
- **Smoke browser viewport iPad (768x1024)**: verificare layout desktop si attiva (`md:` breakpoint)
- **Smoke gallery mobile**:
  - Swipe left/right sulla foto → cambia immagine smooth
  - Dots indicator si aggiorna (pallino attivo)
  - Counter "X / N" corretto
  - Tap zoom icon → apre modal nera
  - Pinch-zoom nativo funziona nella modal
  - Swipe down o tap close → chiude modal
- **Smoke add-to-cart mobile**:
  - Sticky bar sempre visibile in basso (su mobile, `md:hidden` per nasconderla su desktop)
  - Nessun CTA inline visibile su mobile (`hidden md:flex` su VariantSelector)
  - Click bottone: stati loading → success funzionano
  - Footer pagina non coperto dalla sticky bar (padding-bottom 96px su mobile)
- **Z-index conflict**: verificare che cookie banner (se presente) non venga coperto dalla sticky bar
- **`pnpm typecheck`**: baseline 25 → 25 preservata
- **Real device test (telefono utente)**: confermare swipe nativo si "sente" fluido

## Scope esplicitamente escluso

- ~~Libreria carousel esterna (Embla, Swiper, Keen)~~ — overkill, scroll-snap CSS basta
- ~~Lazy loading immagini gallery mobile~~ — già `loading="lazy"` sulle thumbnail desktop, foto principali sono critiche
- ~~Pinch-zoom custom JS-based~~ — usiamo `touch-action: pinch-zoom` nativo
- ~~Bottom sheet drag handle per cookie banner~~ — overengineering, basta layout compatto
- ~~Sticky CTA su desktop~~ — utente non l'ha chiesto, e desktop ha già il pulsante inline visibile in colonna destra
- ~~Animazioni complesse swipe (parallax, paging dots animati)~~ — premature optimization
- ~~Mobile gallery come fullscreen-by-default (immagine prende tutto schermo verticale)~~ — manteniamo aspect-square per coerenza con le proporzioni dei sandali
- ~~Refactor `prodotti.$slug.tsx` per ridurre LOC~~ — fuori scope, il file è già grosso ma funzionale

## File toccati (riepilogo)

| File | Azione | Sub-feature |
|------|--------|-------------|
| `src/components/shared/CookieBanner.tsx` | EDIT (testo, padding, layout bottoni) | 1 |
| `src/components/shared/CookieBanner.tsx` | EDIT (modal preferences mobile) | 1 |
| `src/components/product/ProductGallery.tsx` | REFACTOR (split desktop/mobile) | 2 |
| `src/components/product/MobileImageCarousel.tsx` | NEW | 2 |
| `src/components/product/MobileImageZoomModal.tsx` | NEW | 2 |
| `src/components/product/MobileStickyAddToCart.tsx` | NEW | 3 |
| `src/components/product/VariantSelector.tsx` | EDIT (hide block on mobile + sentinel) | 3 |
| `src/routes/prodotti.$slug.tsx` | EDIT (mount sticky + sentinel ref + padding) | 3 |
| `src/components/product/index.ts` | EDIT (barrel exports) | 2, 3 |

7 file totali, 3 nuovi.

## Domande residue (decise)

- **Devicedetection** — usiamo classi Tailwind `md:hidden` / `hidden md:block` (zero JS, niente SSR mismatch). Decisione presa.
- **Aspect ratio gallery mobile** — `aspect-square` (1:1), coerente con desktop. Decisione presa.
- **Pinch zoom out o solo in?** — solo browser-native (`touch-action: pinch-zoom`), no logica custom. Decisione presa.
