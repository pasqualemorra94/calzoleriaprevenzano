import { m, AnimatePresence } from "motion/react";
import { ArrowRight } from "lucide-react";
import { ScrollCounter } from "~/components/ui/ScrollCounter";
import { useState, useCallback, useEffect } from "react";

// ─── Data ────────────────────────────────────────────────────

interface HeroSlide {
  image: string;
  alt: string;
  tag: string;
  headline: string[];
  subtitle: string;
  primaryCta: string;
  primaryCtaHref: string;
  secondaryCta: string;
  secondaryCtaHref: string;
}

const SLIDES: HeroSlide[] = [
  {
    image: "/images/slide-gioiello-2024.jpeg",
    alt: "Collezione Gioiello 2024 — sandali artigianali con cristalli Swarovski",
    tag: "Nuova Collezione",
    headline: ["Collezione", "Gioiello"],
    subtitle:
      "Cristalli Swarovski e pietre preziose applicate a mano su pellami italiani certificati. Ogni sandalo, un'opera d'arte da indossare.",
    primaryCta: "Scopri la Collezione",
    primaryCtaHref: "/catalogo?categoria=gioiello",
    secondaryCta: "La nostra storia",
    secondaryCtaHref: "/la-bottega",
  },
  {
    image: "/images/slide-classica.jpg",
    alt: "Collezione Classica — sandali artigianali in pelle pregiata napoletana",
    tag: "Artigianato Napoletano",
    headline: ["Sandali", "Classici"],
    subtitle:
      "Personalizza ogni dettaglio — tipo di pelle, colore, tacco e gioiello. Creati a mano nel nostro laboratorio di Napoli.",
    primaryCta: "Scopri i Sandali",
    primaryCtaHref: "/sandali",
    secondaryCta: "Come funziona",
    secondaryCtaHref: "/la-bottega#personalizzazione",
  },
];

const SLIDE_INTERVAL_MS = 7000;

// ─── Content variants ────────────────────────────────────────

const contentVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as number[] },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: 0.35, ease: "easeIn" as const },
  },
};

const imageVariants = {
  enter: { opacity: 0, scale: 1.04 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 1.0, ease: [0.22, 1, 0.36, 1] as number[] },
  },
  exit: {
    opacity: 0,
    scale: 1.02,
    transition: { duration: 0.5, ease: "easeIn" as const },
  },
};

// ─── Component ───────────────────────────────────────────────

export function HeroSection() {
  const [current, setCurrent] = useState(0);

  const goTo = useCallback((index: number) => {
    setCurrent(index);
  }, []);

  const goNext = useCallback(() => {
    setCurrent((prev) => (prev + 1) % SLIDES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(goNext, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [goNext]);

  const slide = SLIDES[current];

  return (
    <section className="relative flex overflow-hidden" style={{ minHeight: "calc(100svh - var(--navbar-height-md))" }}>

      {/* ══ LEFT — Editorial Content Panel ══════════════════════ */}
      <div className="relative z-10 flex w-full flex-col justify-between px-8 py-12 md:bg-[var(--color-muted)] md:w-[37%] md:px-12 lg:px-14 xl:px-16">

        {/* Top brand stamp */}
        <div className="flex items-center gap-3">
          <div className="h-[1px] w-8 bg-[var(--color-accent)]" />
          <span className="text-[10px] font-medium tracking-[0.25em] text-white/80 md:text-[var(--color-text-muted)] uppercase">
            Napoli · Dal 1984
          </span>
        </div>

        {/* Center — main editorial content */}
        <div className="flex-1 flex flex-col justify-center py-10">
          <AnimatePresence mode="wait">
            <m.div
              key={current}
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Collection tag */}
              <div className="mb-6 inline-flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M8 1L9.5 6.5L15 8L9.5 9.5L8 15L6.5 9.5L1 8L6.5 6.5L8 1Z" fill="#C9A961" />
                </svg>
                <span className="text-xs font-semibold tracking-[0.18em] text-[var(--color-accent)] uppercase">
                  {slide.tag}
                </span>
              </div>

              {/* Large editorial headline */}
              <h1 className="font-display font-bold leading-none tracking-[-0.02em] text-white md:text-[var(--color-text)]" style={{ fontSize: "clamp(3rem, 2rem + 5vw, 5.5rem)" }}>
                {slide.headline.map((line, i) => (
                  <span key={i} className={i === 1 ? "block italic text-[var(--color-accent)] md:text-[var(--color-primary)]" : "block"}>
                    {line}
                  </span>
                ))}
              </h1>

              {/* Gold stitch under headline */}
              <div className="my-7 flex items-center gap-4">
                <div className="h-[2px] w-12 bg-[var(--color-accent)]" />
                <div className="h-[2px] w-3 bg-[var(--color-accent)]/30" />
              </div>

              {/* Description */}
              <p className="max-w-sm leading-[1.75] text-white/80 md:text-[var(--color-text-secondary)]" style={{ fontSize: "clamp(0.9rem, 0.85rem + 0.25vw, 1rem)" }}>
                {slide.subtitle}
              </p>

              {/* CTAs */}
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
                <a
                  href={slide.primaryCtaHref}
                  className="group inline-flex items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-[var(--color-primary)] px-7 py-3.5 text-sm font-semibold tracking-wide text-white transition-all duration-300 hover:bg-[var(--color-primary-dark)] hover:shadow-[0_8px_30px_rgba(139,94,60,0.25)]"
                >
                  {slide.primaryCta}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </a>
                <a
                  href={slide.secondaryCtaHref}
                  className="inline-flex items-center justify-center rounded-[var(--radius-lg)] border border-white/30 px-7 py-3.5 text-sm font-medium tracking-wide text-white transition-all duration-300 hover:border-[var(--color-primary)] md:border-[var(--color-border)] md:text-[var(--color-text-secondary)]"
                >
                  {slide.secondaryCta}
                </a>
              </div>
            </m.div>
          </AnimatePresence>
        </div>

        {/* Bottom — stats + slide indicators */}
        <div className="flex items-end justify-between">
          {/* Brand stats */}
          <div className="flex items-center gap-8">
            <div>
              <ScrollCounter
                target={1984}
                suffix=""
                className="font-display text-2xl font-bold text-white md:text-[var(--color-text)]"
              />
              <p className="mt-0.5 text-[10px] tracking-[0.18em] text-white/70 md:text-[var(--color-text-muted)] uppercase">
                Fondazione
              </p>
            </div>
            <div className="h-8 w-[1px] bg-white/20 md:bg-[var(--color-border)]" />
            <div>
              <ScrollCounter
                target={118}
                suffix="+"
                className="font-display text-2xl font-bold text-[var(--color-accent)] md:text-[var(--color-primary)]"
              />
              <p className="mt-0.5 text-[10px] tracking-[0.18em] text-white/70 md:text-[var(--color-text-muted)] uppercase">
                Modelli unici
              </p>
            </div>
          </div>

          {/* Slide dots */}
          <div className="flex items-center gap-2" role="tablist" aria-label="Selezione collezione">
            {SLIDES.map((_, index) => (
              <button
                key={index}
                type="button"
                role="tab"
                aria-selected={index === current}
                aria-label={`Collezione ${index + 1}`}
                onClick={() => goTo(index)}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  index === current
                    ? "w-8 bg-[var(--color-accent)]"
                    : "w-1.5 bg-[var(--color-border)] hover:bg-[var(--color-accent)]/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ══ RIGHT — Image Panel ══════════════════════════════════ */}
      <div className="hidden md:block md:w-[63%] relative overflow-hidden bg-[var(--color-muted)]">
        <AnimatePresence mode="wait">
          <m.div
            key={current}
            variants={imageVariants}
            initial="enter"
            animate="visible"
            exit="exit"
            className="absolute inset-0"
          >
            <div
              className="h-full w-full bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url('${slide.image}')` }}
              role="img"
              aria-label={slide.alt}
            />
          </m.div>
        </AnimatePresence>

        {/* Subtle left edge gradient for blending with content panel */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[var(--color-background)]/20 to-transparent" />

        {/* Collection label floating badge */}
        <AnimatePresence mode="wait">
          <m.div
            key={`badge-${current}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.5, duration: 0.5 } }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.3 } }}
            className="absolute right-6 top-6 rounded-[var(--radius-lg)] border border-white/20 bg-black/25 px-4 py-2.5 backdrop-blur-sm"
          >
            <p className="text-[10px] tracking-[0.2em] text-white/70 uppercase">Collezione</p>
            <p className="mt-0.5 font-display text-sm font-semibold italic text-white">
              {slide.headline.join(" ")}
            </p>
          </m.div>
        </AnimatePresence>

        {/* Bottom overlay for scroll hint */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/20 to-transparent" />

        {/* Artigianato stamp — bottom right */}
        <div className="absolute bottom-6 left-6 flex items-center gap-2 opacity-60">
          <div className="flex gap-[3px]">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className="h-[2px] w-[5px] rounded-full bg-white"
                style={{ marginTop: i % 2 === 0 ? "0" : "3px" }}
              />
            ))}
          </div>
          <span className="text-[9px] tracking-[0.22em] text-white uppercase">Fatto a mano</span>
        </div>
      </div>

      {/* ══ Mobile — Image as full-width background strip ════════ */}
      <div
        className="absolute inset-0 -z-10 md:hidden"
        aria-hidden="true"
      >
        <AnimatePresence mode="wait">
          <m.div
            key={`mobile-${current}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.8 } }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
            className="absolute inset-0"
          >
            <div
              className="h-full w-full bg-cover bg-center"
              style={{ backgroundImage: `url('${slide.image}')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
          </m.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
