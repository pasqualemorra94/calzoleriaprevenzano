import { m } from "motion/react";
import { ArrowRight, ArrowUpRight } from "lucide-react";

// ─── Easing ──────────────────────────────────────────────────

type Easing = [number, number, number, number];
const EASE_OUT: Easing = [0.22, 1, 0.36, 1];

// ─── Component ───────────────────────────────────────────────

export function HeroSection() {
  return (
    <section
      className="relative hidden overflow-hidden md:block md:min-h-[calc(100svh-var(--navbar-height-md))]"
      style={{
        background:
          "radial-gradient(at 15% 30%, #FBF6EC 0%, #F4EAD6 55%, #ECE0C5 100%)",
      }}
      aria-label="Collezione Gioiello — Calzoleria Prevenzano"
    >
      {/* Decorative gold halo behind text column */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[15%] top-[10%] h-[60vh] w-[60vh] rounded-full opacity-50"
        style={{
          background:
            "radial-gradient(circle at center, rgba(201,169,97,0.22), rgba(201,169,97,0.04) 55%, transparent 75%)",
          filter: "blur(8px)",
        }}
      />

      {/* Subtle paper grain — anti-AI editorial texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.55 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
          backgroundSize: "240px 240px",
        }}
      />

      <div className="relative mx-auto grid max-w-[var(--page-max-width)] grid-cols-1 items-center gap-7 px-[var(--page-padding-x)] pb-7 pt-7 md:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] md:gap-12 md:pb-20 md:pt-16 lg:gap-20 lg:py-20">
        {/* ══════════════════════════════════════════════════════
            COLUMN 1 — Editorial copy (Apple-style staggered fade)
            ══════════════════════════════════════════════════════ */}
        <div className="relative z-10 order-2 flex flex-col md:order-1">
          {/* Edition meta */}
          <m.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.05 }}
            className="mb-6 flex items-center gap-3 text-[var(--color-text-muted)]"
          >
            <span className="font-display text-[10px] tracking-[0.32em] uppercase">
              Edizione
            </span>
            <span className="h-[1px] w-12 bg-[var(--color-accent)]" />
            <span className="font-display text-[11px] italic text-[var(--color-accent)]">
              Primavera · 2026
            </span>
          </m.div>

          {/* Tag */}
          <m.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.18 }}
            className="mb-5 inline-flex w-fit items-center gap-2"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 1L9.5 6.5L15 8L9.5 9.5L8 15L6.5 9.5L1 8L6.5 6.5L8 1Z" fill="#C9A961" />
            </svg>
            <span className="text-[10px] font-semibold tracking-[0.28em] uppercase text-[var(--color-accent)]">
              Nuova Collezione
            </span>
          </m.div>

          {/* Massive headline — Apple-style, staggered per word */}
          <h1
            className="font-display font-semibold leading-[0.95] tracking-[-0.025em] text-[var(--color-foreground)]"
            style={{ fontSize: "clamp(2.2rem, 0.4rem + 5vw, 6.5rem)" }}
          >
            <m.span
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, ease: EASE_OUT, delay: 0.32 }}
              className="block"
            >
              Collezione
            </m.span>
            <m.span
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, ease: EASE_OUT, delay: 0.45 }}
              className="block italic font-medium text-[var(--color-primary)]"
            >
              Gioiello
            </m.span>
          </h1>

          {/* Stitch ornament */}
          <m.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.62 }}
            style={{ transformOrigin: "left center" }}
            className="mt-7 flex items-center gap-2"
            aria-hidden="true"
          >
            <span className="h-[2px] w-16 bg-[var(--color-accent)]" />
            <span className="h-[2px] w-2 bg-[var(--color-accent)]/55" />
            <span className="h-[2px] w-1 bg-[var(--color-accent)]/25" />
          </m.div>

          {/* Subtitle */}
          <m.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: EASE_OUT, delay: 0.72 }}
            className="mt-6 max-w-[30rem] text-[15px] leading-[1.7] text-[var(--color-text-secondary)] md:text-[16px]"
          >
            Cristalli Swarovski e pietre preziose applicate a mano su pellami italiani certificati. Ogni sandalo, un'opera d'arte da indossare.
          </m.p>

          {/* CTAs */}
          <m.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: EASE_OUT, delay: 0.86 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5"
          >
            <a
              href="/catalogo?categoria=gioiello"
              className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-[var(--color-foreground)] px-7 py-3.5 text-sm font-semibold tracking-wide text-white transition-all duration-300 hover:bg-[var(--color-primary)] hover:shadow-[0_14px_36px_rgba(45,45,45,0.25)]"
            >
              Scopri la Collezione
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
            <a
              href="/la-bottega"
              className="group inline-flex items-center gap-2 text-[13px] font-medium tracking-wide text-[var(--color-foreground)] transition-colors hover:text-[var(--color-primary)]"
            >
              <span className="border-b border-[var(--color-foreground)]/30 pb-0.5 transition-colors group-hover:border-[var(--color-primary)]">
                La nostra storia
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </m.div>

          {/* Maker mark — subtle, bottom-anchored */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            transition={{ duration: 0.8, delay: 1.15 }}
            className="mt-6 hidden items-center gap-2 md:mt-14 md:flex"
            aria-hidden="true"
          >
            <div className="flex gap-[3px]">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className="h-[2px] w-[5px] rounded-full bg-[var(--color-foreground)]"
                  style={{ marginTop: i % 2 === 0 ? "0" : "3px" }}
                />
              ))}
            </div>
            <span className="text-[9px] tracking-[0.32em] uppercase text-[var(--color-foreground)]">
              Fatto a mano · Napoli · Dal 1984
            </span>
          </m.div>
        </div>

        {/* ══════════════════════════════════════════════════════
            COLUMN 2 — Lifestyle photograph
            ══════════════════════════════════════════════════════ */}
        <div className="relative order-1 flex items-center justify-center md:order-2 md:justify-end">
          {/* Soft pedestal shadow under photo */}
          <m.div
            aria-hidden="true"
            initial={{ opacity: 0, scaleX: 0.5 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 1.1, ease: EASE_OUT, delay: 0.7 }}
            className="absolute bottom-[2%] left-1/2 h-8 w-[80%] -translate-x-1/2 rounded-[50%] blur-3xl"
            style={{ background: "rgba(45,45,45,0.28)" }}
          />

          {/* Photo card with editorial frame */}
          <m.div
            initial={{ opacity: 0, y: 50, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.15, ease: EASE_OUT, delay: 0.5 }}
            className="relative w-full max-w-[280px] sm:max-w-[340px] md:max-w-[480px] lg:max-w-[560px]"
          >
            {/* Subtle gold border ring */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-[3px] rounded-[var(--radius-xl)]"
              style={{
                background:
                  "linear-gradient(135deg, rgba(201,169,97,0.55) 0%, rgba(201,169,97,0) 50%, rgba(201,169,97,0.35) 100%)",
              }}
            />
            <div
              className="relative overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-muted)]"
              style={{
                boxShadow:
                  "0 30px 80px -20px rgba(45,45,45,0.35), 0 8px 24px -8px rgba(45,45,45,0.18)",
              }}
            >
              <img
                src="/images/hero-gioiello-mare.jpg"
                alt="Sandali gioiello indossati su una spiaggia al tramonto, vista ravvicinata"
                width={896}
                height={1200}
                className="block h-auto w-full"
                loading="eager"
                fetchPriority="high"
              />
            </div>

            {/* Floating caption pill */}
            <m.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE_OUT, delay: 1.05 }}
              className="absolute -bottom-5 left-5 z-10 flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 shadow-[var(--shadow-md)]"
            >
              <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
              <span className="font-display text-[11px] italic tracking-tight text-[var(--color-foreground)]">
                Modello Sandra · Cristalli Champagne
              </span>
            </m.div>

            {/* Floating gold sparkles */}
            <m.svg
              initial={{ opacity: 0, scale: 0, rotate: -15 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: EASE_OUT, delay: 1.25 }}
              width="36"
              height="36"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              className="absolute -right-4 top-[15%] z-10"
            >
              <path d="M8 1L9.5 6.5L15 8L9.5 9.5L8 15L6.5 9.5L1 8L6.5 6.5L8 1Z" fill="#C9A961" />
            </m.svg>
            <m.svg
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: EASE_OUT, delay: 1.4 }}
              width="20"
              height="20"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              className="absolute -left-3 top-[42%] z-10"
            >
              <path d="M8 1L9.5 6.5L15 8L9.5 9.5L8 15L6.5 9.5L1 8L6.5 6.5L8 1Z" fill="#C9A961" opacity="0.7" />
            </m.svg>
          </m.div>
        </div>
      </div>
    </section>
  );
}
