import { m } from "motion/react";
import { heroStagger, heroStaggerItem } from "~/lib/animation-variants";
import { APP_CONFIG } from "~/lib/constants/app";
import { ArrowRight } from "lucide-react";
import { ScrollCounter } from "~/components/ui/ScrollCounter";

const HERO_COPY = {
  headline: "Sandali artigianali, fatti a mano per te",
  subtitle:
    "Personalizza ogni dettaglio — tipo di pelle, colore, tacco e gioiello. Sandali unici, creati a mano nel nostro laboratorio di Napoli.",
  primaryCta: "Scopri la Collezione",
  primaryCtaHref: "/catalogo",
  secondaryCta: "La nostra storia",
  secondaryCtaHref: "/la-bottega",
} as const;

export function HeroSection() {
  return (
    <section className="relative flex min-h-[92vh] items-end overflow-hidden md:min-h-[85vh] md:items-center">
      {/* Full-bleed background image with layered overlays */}
      <div className="absolute inset-0 z-0">
        <div
          className="h-full w-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/hero-bottega.svg')",
          }}
        />
        {/* Multi-layer gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0503]/80 via-[#1a0f0a]/30 to-[#1a0f0a]/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0503]/40 via-transparent to-transparent md:from-[#0a0503]/50" />
        {/* Subtle noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, #C9A961 1px, transparent 1px)", backgroundSize: "4px 4px" }} />
      </div>

      {/* Floating counter badges — visible on lg+ */}
      <div className="absolute right-[var(--page-padding-x)] top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-6 lg:flex">
        <div className="rounded-[var(--radius-lg)] border border-white/10 bg-white/5 px-5 py-4 text-center backdrop-blur-sm">
          <ScrollCounter
            target={1965}
            suffix=""
            className="font-display text-xl font-bold text-white"
          />
          <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/50">Anno di fondazione</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-white/10 bg-white/5 px-5 py-4 text-center backdrop-blur-sm">
          <ScrollCounter
            target={118}
            suffix=""
            className="font-display text-xl font-bold text-[var(--color-accent)]"
          />
          <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/50">Modelli unici</p>
        </div>
      </div>

      {/* Content */}
      <m.div
        className="relative z-10 mx-auto w-full max-w-[var(--page-max-width)] px-[var(--page-padding-x)] pb-20 pt-40 text-center md:pb-28 md:pt-0 md:text-left md:max-w-[60%]"
        variants={heroStagger}
        initial="hidden"
        animate="visible"
      >
        {/* Eyebrow — Napoli themed with star motif */}
        <m.div variants={heroStaggerItem} className="mb-5 inline-flex items-center gap-3">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-[var(--color-accent)]" aria-hidden="true">
            <path d="M8 1L9.5 6.5L15 8L9.5 9.5L8 15L6.5 9.5L1 8L6.5 6.5L8 1Z" fill="currentColor" />
          </svg>
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-accent)]">
            {APP_CONFIG.site.tagline}
          </span>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-[var(--color-accent)]" aria-hidden="true">
            <path d="M8 1L9.5 6.5L15 8L9.5 9.5L8 15L6.5 9.5L1 8L6.5 6.5L8 1Z" fill="currentColor" />
          </svg>
        </m.div>

        {/* Headline */}
        <m.h1
          variants={heroStaggerItem}
          className="font-display text-[var(--text-xl)] font-bold leading-[1.08] tracking-tight text-white md:text-[var(--text-3xl)]"
        >
          {HERO_COPY.headline}
        </m.h1>

        {/* Subtitle */}
        <m.p
          variants={heroStaggerItem}
          className="mx-auto mt-7 max-w-lg text-[var(--text-base)] leading-[var(--leading-relaxed)] text-white/70 md:mx-0 md:mt-8 md:text-[var(--text-lg)]"
        >
          {HERO_COPY.subtitle}
        </m.p>

        {/* CTAs */}
        <m.div
          variants={heroStaggerItem}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row md:justify-start"
        >
          <a
            href={HERO_COPY.primaryCtaHref}
            className="group inline-flex h-13 items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-[var(--color-primary)] px-8 text-sm font-semibold tracking-wide text-white transition-all duration-300 hover:bg-[var(--color-primary-dark)] hover:shadow-[0_8px_30px_rgba(139,94,60,0.3)]"
          >
            {HERO_COPY.primaryCta}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
          <a
            href={HERO_COPY.secondaryCtaHref}
            className="inline-flex h-13 items-center justify-center rounded-[var(--radius-lg)] border border-white/25 bg-white/5 px-8 text-sm font-medium tracking-wide text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-white/40"
          >
            {HERO_COPY.secondaryCta}
          </a>
        </m.div>
      </m.div>

      {/* 🧬 DNA: Golden stitch line at bottom — hand-stitched X pattern */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-end justify-between">
        <div className="flex items-center gap-3 px-[var(--page-padding-x)]">
          {/* Staggered stitch marks */}
          <div className="flex gap-1">
            {[...Array(4)].map((_, i) => (
              <span key={i} className="h-[3px] w-1 bg-[var(--color-accent)]/40 rounded-full" style={{ marginTop: i % 2 === 0 ? "0" : "3px" }} />
            ))}
          </div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-accent)]/50">Artigianato dal 1965</span>
        </div>
        <div className="h-[var(--stitch-width)] hidden flex-1 max-w-[120px] bg-[var(--color-accent)]/30 md:block" />
      </div>
    </section>
  );
}
