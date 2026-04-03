import { m, AnimatePresence } from "motion/react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { ScrollCounter } from "~/components/ui/ScrollCounter";
import { useState, useCallback, useEffect } from "react";

// ─── Slider Data ────────────────────────────────────────────────────

interface HeroSlide {
  image: string;
  alt: string;
  eyebrow: string;
  headline: string;
  subtitle: string;
  primaryCta: string;
  primaryCtaHref: string;
  secondaryCta: string;
  secondaryCtaHref: string;
}

const SLIDES: HeroSlide[] = [
  {
    image: "/uploads/2026/04/slide-gioiello-2024.jpeg",
    alt: "Collezione Gioiello 2024 — sandali artigianali con dettagli preziosi",
    eyebrow: "Nuova Collezione",
    headline: "Collezione Gioiello",
    subtitle:
      "Cristalli Swarovski e pietre preziose applicati a mano su pellami italiani certificati. Ogni sandalo è un gioiello da indossare.",
    primaryCta: "Scopri la Collezione",
    primaryCtaHref: "/catalogo?categoria=gioiello",
    secondaryCta: "La nostra storia",
    secondaryCtaHref: "/la-bottega",
  },
  {
    image: "/uploads/2026/04/slide-classica.jpg",
    alt: "Collezione Classica — sandali artigianali in pelle pregiata",
    eyebrow: "Artigianato Napoletano",
    headline: "Sandali classici, fatti a mano per te",
    subtitle:
      "Personalizza ogni dettaglio — tipo di pelle, colore, tacco e gioiello. Sandali unici, creati a mano nel nostro laboratorio di Napoli.",
    primaryCta: "Scopri la Collezione",
    primaryCtaHref: "/catalogo?categoria=classici",
    secondaryCta: "La nostra storia",
    secondaryCtaHref: "/la-bottega",
  },
];

const SLIDE_INTERVAL_MS = 7000;

// ─── Component ──────────────────────────────────────────────────────

export function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const goTo = useCallback(
    (index: number) => {
      setDirection(index > current ? 1 : -1);
      setCurrent(index);
    },
    [current],
  );

  const goNext = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  // Auto-advance
  useEffect(() => {
    const timer = setInterval(goNext, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [goNext]);

  const slide = SLIDES[current];

  // Slide animation variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
      scale: 1.05,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.8, ease: "easeOut" as const },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? "-100%" : "100%",
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.6, ease: "easeOut" as const },
    }),
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: "easeOut" as const, delay: 0.3 },
    },
  };

  return (
    <section className="relative flex min-h-[92vh] items-end overflow-hidden md:min-h-[85vh] md:items-center">
      {/* Full-bleed background slides */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait" custom={direction}>
          <m.div
            key={current}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
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

        {/* Multi-layer gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0503]/80 via-[#1a0f0a]/30 to-[#1a0f0a]/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0503]/40 via-transparent to-transparent md:from-[#0a0503]/50" />
        {/* Subtle noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle at 50% 50%, #C9A961 1px, transparent 1px)",
            backgroundSize: "4px 4px",
          }}
        />
      </div>

      {/* Floating counter badges — visible on lg+ */}
      <div className="absolute right-[var(--page-padding-x)] top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-6 lg:flex">
        <div className="rounded-[var(--radius-lg)] border border-white/10 bg-white/5 px-5 py-4 text-center backdrop-blur-sm">
          <ScrollCounter
            target={1984}
            suffix=""
            className="font-display text-xl font-bold text-white"
          />
          <p className="mt-1 text-[10px] tracking-[0.2em] text-white/50">Anno di fondazione</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-white/10 bg-white/5 px-5 py-4 text-center backdrop-blur-sm">
          <ScrollCounter
            target={118}
            suffix=""
            className="font-display text-xl font-bold text-[var(--color-accent)]"
          />
          <p className="mt-1 text-[10px] tracking-[0.2em] text-white/50">Modelli unici</p>
        </div>
      </div>

      {/* Content */}
      <m.div
        key={`content-${current}`}
        variants={contentVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto w-full max-w-[var(--page-max-width)] px-[var(--page-padding-x)] pb-20 pt-40 text-center md:pb-28 md:pt-0 md:text-left md:max-w-[60%]"
      >
        {/* Eyebrow */}
        <div className="mb-5 inline-flex items-center gap-3">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-[var(--color-accent)]" aria-hidden="true">
            <path d="M8 1L9.5 6.5L15 8L9.5 9.5L8 15L6.5 9.5L1 8L6.5 6.5L8 1Z" fill="currentColor" />
          </svg>
          <span className="text-xs font-medium tracking-[0.2em] text-[var(--color-accent)]">
            {slide.eyebrow}
          </span>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-[var(--color-accent)]" aria-hidden="true">
            <path d="M8 1L9.5 6.5L15 8L9.5 9.5L8 15L6.5 9.5L1 8L6.5 6.5L8 1Z" fill="currentColor" />
          </svg>
        </div>

        {/* Headline */}
        <h1 className="font-display text-[var(--text-xl)] font-bold leading-[1.08] tracking-tight text-white md:text-[var(--text-3xl)]">
          {slide.headline}
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-7 max-w-lg text-[var(--text-base)] leading-[var(--leading-relaxed)] text-white/70 md:mx-0 md:mt-8 md:text-[var(--text-lg)]">
          {slide.subtitle}
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row md:justify-start">
          <a
            href={slide.primaryCtaHref}
            className="group inline-flex h-13 items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-[var(--color-primary)] px-8 text-sm font-semibold tracking-wide text-white transition-all duration-300 hover:bg-[var(--color-primary-dark)] hover:shadow-[0_8px_30px_rgba(139,94,60,0.3)]"
          >
            {slide.primaryCta}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
          <a
            href={slide.secondaryCtaHref}
            className="inline-flex h-13 items-center justify-center rounded-[var(--radius-lg)] border border-white/25 bg-white/5 px-8 text-sm font-medium tracking-wide text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-white/40"
          >
            {slide.secondaryCta}
          </a>
        </div>
      </m.div>

      {/* Slider Navigation Arrows */}
      <button
        type="button"
        onClick={goPrev}
        className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/15 md:left-8"
        aria-label="Slide precedente"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={goNext}
        className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/15 md:right-8"
        aria-label="Slide successiva"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Slide Indicator Dots */}
      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 md:bottom-10" role="tablist" aria-label="Seleziona slide">
        {SLIDES.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => goTo(index)}
            role="tab"
            aria-selected={index === current}
            aria-label={`Vai alla slide ${index + 1}`}
            className={`h-2 rounded-full transition-all duration-500 ${
              index === current
                ? "w-8 bg-[var(--color-accent)]"
                : "w-2 bg-white/30 hover:bg-white/50"
            }`}
          />
        ))}
      </div>

      {/* DNA: Golden stitch line at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-end justify-between">
        <div className="flex items-center gap-3 px-[var(--page-padding-x)]">
          <div className="flex gap-1">
            {[...Array(4)].map((_, i) => (
              <span key={i} className="h-[3px] w-1 bg-[var(--color-accent)]/40 rounded-full" style={{ marginTop: i % 2 === 0 ? "0" : "3px" }} />
            ))}
          </div>
          <span className="text-[10px] tracking-[0.25em] text-[var(--color-accent)]/50">Artigianato dal 1984</span>
        </div>
        <div className="h-[var(--stitch-width)] hidden flex-1 max-w-[120px] bg-[var(--color-accent)]/30 md:block" />
      </div>
    </section>
  );
}
