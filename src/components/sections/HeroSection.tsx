import { m, AnimatePresence } from "motion/react";
import { ArrowRight, ArrowLeft, ArrowUpRight } from "lucide-react";
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
      "Personalizza ogni dettaglio — tipo di pelle, colore, tacco e gioiello. Creati a mano nella bottega di famiglia, a Napoli.",
    primaryCta: "Scopri i Sandali",
    primaryCtaHref: "/catalogo?category=sandali",
    secondaryCta: "Come funziona",
    secondaryCtaHref: "/la-bottega#personalizzazione",
  },
];

const SLIDE_INTERVAL_MS = 8000;

// ─── Variants ────────────────────────────────────────────────

const imageVariants = {
  enter: { opacity: 0, scale: 1.06 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    scale: 1.02,
    transition: { duration: 0.7, ease: "easeIn" as const },
  },
};

const contentVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      staggerChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: 0.4, ease: "easeIn" as const },
  },
};

const lineVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

// ─── Component ───────────────────────────────────────────────

export function HeroSection() {
  const [current, setCurrent] = useState(0);

  const goTo = useCallback((index: number) => {
    setCurrent(((index % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, []);

  const goNext = useCallback(() => {
    setCurrent((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const goPrev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(goNext, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [goNext]);

  const slide = SLIDES[current];
  const total = SLIDES.length;

  return (
    <section
      className="relative overflow-hidden bg-[var(--color-foreground)] min-h-[calc(100svh-var(--navbar-height))] md:min-h-[calc(100svh-var(--navbar-height-md))]"
      aria-roledescription="carousel"
      aria-label="Collezioni Calzoleria Prevenzano"
    >

      {/* ══ Background — full-bleed cinematic image ═════════════ */}
      <AnimatePresence mode="wait">
        <m.div
          key={`img-${current}`}
          variants={imageVariants}
          initial="enter"
          animate="visible"
          exit="exit"
          className="absolute inset-0"
        >
          <div
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url('${slide.image}')` }}
            role="img"
            aria-label={slide.alt}
          />
        </m.div>
      </AnimatePresence>

      {/* Cinematic scrim — protects bottom-left content + title */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/85 via-black/35 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Right edge soft vignette (desktop only) */}
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-2/5 bg-gradient-to-l from-black/35 via-black/10 to-transparent md:block" />

      {/* Film grain — printed feel */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.55 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
          backgroundSize: "240px 240px",
        }}
      />

      {/* ══ TOP — Editorial meta ribbon ═════════════════════════ */}
      <div className="absolute inset-x-0 top-0 z-10 px-6 pt-7 md:px-12 md:pt-10 lg:px-16">
        <div className="flex items-center justify-between text-white/85">
          <div className="flex items-center gap-3">
            <span className="h-[1px] w-8 bg-[var(--color-accent)] md:w-12" />
            <span className="font-display text-[10px] tracking-[0.32em] uppercase">
              Edizione
            </span>
            <span className="font-display text-[11px] italic text-[var(--color-accent)]">
              N. 0{current + 1} / 0{total}
            </span>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <span className="font-display text-[10px] tracking-[0.32em] uppercase">
              Napoli · Dal 1984
            </span>
            <span className="h-[1px] w-12 bg-[var(--color-accent)]" />
          </div>
        </div>
      </div>

      {/* ══ MAIN — Bottom-left magazine cover content ═══════════ */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-12 md:px-12 md:pb-16 lg:px-16 lg:pb-20">
        <AnimatePresence mode="wait">
          <m.div
            key={`content-${current}`}
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="max-w-[820px]"
          >
            {/* Collection tag */}
            <m.div variants={lineVariants} className="mb-5 inline-flex items-center gap-2.5">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 1L9.5 6.5L15 8L9.5 9.5L8 15L6.5 9.5L1 8L6.5 6.5L8 1Z" fill="#C9A961" />
              </svg>
              <span className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[var(--color-accent)]">
                {slide.tag}
              </span>
              <span className="h-[1px] w-12 bg-[var(--color-accent)]/50" />
            </m.div>

            {/* Massive cover headline */}
            <m.h1
              variants={lineVariants}
              className="font-display font-semibold leading-[0.94] tracking-[-0.025em] text-white"
              style={{ fontSize: "clamp(3.4rem, 1.5rem + 9.5vw, 9.5rem)" }}
            >
              <span className="block">{slide.headline[0]}</span>
              <span className="block italic font-medium text-[var(--color-accent)]">
                {slide.headline[1]}
              </span>
            </m.h1>

            {/* Stitch underline ornament */}
            <m.div variants={lineVariants} className="mt-7 flex items-center gap-2">
              <span className="h-[2px] w-14 bg-[var(--color-accent)]" />
              <span className="h-[2px] w-2 bg-[var(--color-accent)]/60" />
              <span className="h-[2px] w-1 bg-[var(--color-accent)]/30" />
            </m.div>

            {/* Subtitle */}
            <m.p
              variants={lineVariants}
              className="mt-6 max-w-[34rem] text-[15px] leading-[1.65] text-white/85 md:text-[17px] md:leading-[1.7]"
            >
              {slide.subtitle}
            </m.p>

            {/* CTAs */}
            <m.div
              variants={lineVariants}
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5"
            >
              <a
                href={slide.primaryCtaHref}
                className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-[var(--color-accent)] px-7 py-3.5 text-sm font-semibold tracking-wide text-[var(--color-foreground)] transition-all duration-300 hover:bg-[var(--color-accent-light)] hover:shadow-[0_12px_32px_rgba(201,169,97,0.35)]"
              >
                {slide.primaryCta}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
              <a
                href={slide.secondaryCtaHref}
                className="group inline-flex items-center gap-2 text-sm font-medium tracking-wide text-white transition-colors hover:text-[var(--color-accent)]"
              >
                <span className="border-b border-white/40 pb-0.5 transition-colors group-hover:border-[var(--color-accent)]">
                  {slide.secondaryCta}
                </span>
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </m.div>
          </m.div>
        </AnimatePresence>
      </div>

      {/* ══ Bottom-right — Editorial pagination ═════════════════ */}
      <div className="absolute bottom-12 right-6 z-10 hidden items-end gap-4 md:bottom-16 md:right-12 md:flex lg:right-16">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Slide precedente"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white transition-all duration-300 hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)]"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="flex items-baseline gap-2 font-display tabular-nums">
          <span className="text-4xl font-semibold leading-none text-white">
            0{current + 1}
          </span>
          <span className="text-lg leading-none text-white/40">/</span>
          <span className="text-base leading-none text-white/60">0{total}</span>
        </div>

        <button
          type="button"
          onClick={goNext}
          aria-label="Slide successiva"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white transition-all duration-300 hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)]"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* ══ Mobile pagination ════════════════════════════════════ */}
      <div className="absolute bottom-5 right-6 z-10 flex items-center gap-3 md:hidden">
        <div className="flex items-baseline gap-1 font-display tabular-nums text-white">
          <span className="text-xl font-semibold leading-none">0{current + 1}</span>
          <span className="text-xs leading-none text-white/50">/</span>
          <span className="text-xs leading-none text-white/70">0{total}</span>
        </div>
        <div className="flex items-center gap-2" role="tablist" aria-label="Selezione collezione">
          {SLIDES.map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === current}
              aria-label={`Vai alla slide ${index + 1}`}
              onClick={() => goTo(index)}
              className={`h-[3px] rounded-full transition-all duration-500 ${
                index === current
                  ? "w-8 bg-[var(--color-accent)]"
                  : "w-3 bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ══ Bottom-left — Hand-stamped maker mark ═══════════════ */}
      <div className="absolute bottom-5 left-6 z-10 hidden items-center gap-2 opacity-70 md:left-12 md:flex lg:left-16">
        <div className="flex gap-[3px]" aria-hidden="true">
          {[...Array(5)].map((_, i) => (
            <span
              key={i}
              className="h-[2px] w-[5px] rounded-full bg-white"
              style={{ marginTop: i % 2 === 0 ? "0" : "3px" }}
            />
          ))}
        </div>
        <span className="text-[9px] tracking-[0.32em] uppercase text-white">
          Fatto a mano
        </span>
      </div>
    </section>
  );
}
