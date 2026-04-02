import { m } from "motion/react";
import { heroStagger, heroStaggerItem } from "~/lib/animation-variants";
import { APP_CONFIG } from "~/lib/constants/app";

const HERO_COPY = {
  headline: "Sandali artigianali, fatti a mano per te",
  subtitle:
    "Personalizza ogni dettaglio — tipo di pelle, colore, tacco e gioiello. Sandali unici, creati a mano nel nostro laboratorio di Napoli.",
  primaryCta: "Scopri la Collezione",
  primaryCtaHref: "/sandali",
  secondaryCta: "Personalizza il tuo sandalo",
  secondaryCtaHref: "/personalizzazione",
} as const;

export function HeroSection() {
  return (
    <section className="relative flex min-h-[85vh] items-end overflow-hidden md:items-center">
      {/* Full-bleed background image with dark gradient overlay */}
      <div className="absolute inset-0 z-0">
        <div
          className="h-full w-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/hero-bottega.webp')",
          }}
        />
        {/* Dark gradient: bottom-up for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent md:bg-gradient-to-r md:from-black/50 md:via-black/20 md:to-transparent" />
      </div>

      {/* Content — bottom-left on desktop, centered on mobile */}
      <m.div
        className="relative z-10 mx-auto w-full max-w-[var(--page-max-width)] px-[var(--page-padding-x)] pb-16 pt-32 text-center md:pb-24 md:pt-0 md:text-left"
        variants={heroStagger}
        initial="hidden"
        animate="visible"
      >
        {/* Eyebrow */}
        <m.span
          variants={heroStaggerItem}
          className="mb-4 inline-block text-xs font-medium uppercase tracking-[var(--tracking-widest)] text-[var(--color-accent)]"
        >
          {APP_CONFIG.site.tagline}
        </m.span>

        {/* Headline — Cormorant Garamond, bottom-left */}
        <m.h1
          variants={heroStaggerItem}
          className="font-display text-[var(--text-5xl)] font-semibold leading-[var(--leading-tight)] tracking-tight text-white md:text-[var(--text-7xl)]"
        >
          {HERO_COPY.headline}
        </m.h1>

        {/* Subtitle */}
        <m.p
          variants={heroStaggerItem}
          className="mx-auto mt-6 max-w-xl text-[var(--text-base)] leading-[var(--leading-relaxed)] text-white/80 md:mx-0 md:text-[var(--text-lg)]"
        >
          {HERO_COPY.subtitle}
        </m.p>

        {/* CTAs */}
        <m.div
          variants={heroStaggerItem}
          className="mt-8 flex flex-col items-center gap-4 sm:flex-row md:justify-start"
        >
          <a
            href={HERO_COPY.primaryCtaHref}
            className="inline-flex h-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-8 text-sm font-medium text-white transition-colors duration-[var(--transition-base)] hover:bg-[var(--color-primary-dark)]"
          >
            {HERO_COPY.primaryCta}
          </a>
          <a
            href={HERO_COPY.secondaryCtaHref}
            className="inline-flex h-12 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-accent)] px-8 text-sm font-medium text-[var(--color-accent)] transition-colors duration-[var(--transition-base)] hover:bg-[var(--color-accent)]/10"
          >
            {HERO_COPY.secondaryCta}
          </a>
        </m.div>
      </m.div>

      {/* 🧬 DNA: Golden stitch line at bottom of hero */}
      <div className="absolute bottom-0 left-1/2 z-10 h-[var(--stitch-width)] w-[var(--stitch-length)] -translate-x-1/2 bg-[var(--color-accent)] md:left-0 md:translate-x-0 md:ml-[var(--page-padding-x)]" />
    </section>
  );
}
