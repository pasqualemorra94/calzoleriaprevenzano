import { useEffect, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { ArrowRight, ArrowUpRight } from "lucide-react";

// ─── Animation tokens ───────────────────────────────────────

type Easing = [number, number, number, number];
const EASE_OUT: Easing = [0.22, 1, 0.36, 1];
const SLIDE_DURATION_MS = 8500;
const BG_TRANSITION_S = 1.4;
const TEXT_CHAR_STAGGER = 0.025;

// ─── Slide configuration ────────────────────────────────────

type HeroSlide = {
  id: string;
  edition: string;
  tagline: string;
  headlineLine1: string;
  headlineLine2: string;
  subtitle: string;
  ctaHref: string;
  ctaLabel: string;
  image: { src: string; alt: string; width: number; height: number; objectPosition?: string };
  caption: string;
  // Theme
  bgGradient: string;
  haloGradient: string;
  textColor: string;            // CSS color for primary text
  textSecondaryColor: string;   // CSS color for muted text
  accentColor: string;          // gold or moonlight
  ctaBg: string;                // CTA primary background
  ctaText: string;              // CTA primary text color
  ctaHover: string;             // CTA hover background
  grainOpacity: number;         // adjust noise overlay strength per scene
};

const SLIDES: HeroSlide[] = [
  {
    id: "gioiello",
    edition: "Primavera · 2026",
    tagline: "Nuova Collezione",
    headlineLine1: "Collezione",
    headlineLine2: "Gioiello",
    subtitle:
      "Cristalli Swarovski e pietre preziose applicate a mano su pellami italiani certificati. Ogni sandalo, un'opera d'arte da indossare.",
    ctaHref: "/catalogo?category=gioiello",
    ctaLabel: "Scopri la Collezione",
    image: {
      src: "/images/hero-gioiello-mare.jpg",
      alt: "Sandali gioiello indossati su una spiaggia al tramonto, vista ravvicinata",
      width: 896,
      height: 1200,
    },
    caption: "Modello Sandra · Cristalli Champagne",
    bgGradient: "radial-gradient(at 15% 30%, #FBF6EC 0%, #F4EAD6 55%, #ECE0C5 100%)",
    haloGradient:
      "radial-gradient(circle at center, rgba(201,169,97,0.22), rgba(201,169,97,0.04) 55%, transparent 75%)",
    textColor: "var(--color-foreground)",
    textSecondaryColor: "var(--color-text-secondary)",
    accentColor: "#C9A961",
    ctaBg: "var(--color-foreground)",
    ctaText: "#FFFFFF",
    ctaHover: "var(--color-primary)",
    grainOpacity: 0.06,
  },
  {
    id: "strass",
    edition: "Notte · Estate 2026",
    tagline: "Sotto il Vesuvio",
    headlineLine1: "Sandali",
    headlineLine2: "Strass",
    subtitle:
      "Cristalli applicati uno ad uno sotto il cielo di Napoli. Eleganza che brilla nella notte mediterranea, fatta a mano dal 1984.",
    ctaHref: "/catalogo?category=strass",
    ctaLabel: "Scopri gli Strass",
    image: {
      src: "/images/hero-strass-napoli.webp",
      alt: "Donna in abito blu notte con sandali strass su lastricato napoletano, Vesuvio e golfo sullo sfondo",
      width: 1045,
      height: 1727,
      objectPosition: "center 72%",
    },
    caption: "Modello Elisa · Cristallo Argento",
    bgGradient: "radial-gradient(at 80% 20%, #1F2D4A 0%, #0E1828 55%, #060B17 100%)",
    haloGradient:
      "radial-gradient(circle at center, rgba(220,210,255,0.16), rgba(201,169,97,0.06) 55%, transparent 75%)",
    textColor: "#F5EFE3",
    textSecondaryColor: "rgba(245,239,227,0.72)",
    accentColor: "#E8D27F",
    ctaBg: "#F5EFE3",
    ctaText: "#0E1828",
    ctaHover: "#E8D27F",
    grainOpacity: 0.04,
  },
];

// ─── Helpers ────────────────────────────────────────────────

/** Split a string into per-character animated spans with stagger. */
function SplitText({
  text,
  className,
  style,
  baseDelay = 0,
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  baseDelay?: number;
}) {
  return (
    <>
      {Array.from(text).map((char, i) => (
        <m.span
          key={`${i}-${char}`}
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -22 }}
          transition={{
            duration: 0.45,
            ease: EASE_OUT,
            delay: baseDelay + i * TEXT_CHAR_STAGGER,
          }}
          className={className}
          style={{ display: "inline-block", ...style }}
        >
          {char === " " ? " " : char}
        </m.span>
      ))}
    </>
  );
}

// ─── Component ──────────────────────────────────────────────

export function HeroSection() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % SLIDES.length);
    }, SLIDE_DURATION_MS);
    return () => window.clearInterval(id);
  }, [paused, index]);

  const slide = SLIDES[index];

  return (
    <m.section
      animate={{ background: slide.bgGradient }}
      transition={{ duration: BG_TRANSITION_S, ease: EASE_OUT }}
      className="relative hidden overflow-hidden md:block md:min-h-[calc(100svh-var(--navbar-height-md))]"
      style={{ background: SLIDES[0].bgGradient, color: slide.textColor }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Collezioni Calzoleria Prevenzano"
    >
      {/* Decorative halo — morphs gradient per slide */}
      <m.div
        aria-hidden="true"
        animate={{ background: slide.haloGradient }}
        transition={{ duration: BG_TRANSITION_S, ease: EASE_OUT }}
        className="pointer-events-none absolute -left-[15%] top-[10%] h-[60vh] w-[60vh] rounded-full opacity-60"
        style={{ background: SLIDES[0].haloGradient, filter: "blur(8px)" }}
      />

      {/* Paper grain — subtle, anti-AI texture */}
      <m.div
        aria-hidden="true"
        animate={{ opacity: slide.grainOpacity }}
        transition={{ duration: BG_TRANSITION_S, ease: EASE_OUT }}
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: SLIDES[0].grainOpacity,
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.55 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
          backgroundSize: "240px 240px",
        }}
      />

      <div className="relative mx-auto grid max-w-[var(--page-max-width)] grid-cols-1 items-center gap-7 px-[var(--page-padding-x)] pb-7 pt-7 md:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] md:gap-12 md:pb-20 md:pt-16 lg:gap-20 lg:py-20">
        {/* ═════════ COLUMN 1 — Editorial copy ═════════ */}
        <div className="relative z-10 order-2 flex flex-col md:order-1">
          <AnimatePresence mode="wait" initial={false}>
            <div key={slide.id}>
              {/* Edition meta */}
              <m.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.05 }}
                className="mb-6 flex items-center gap-3"
                style={{ color: slide.textSecondaryColor }}
              >
                <span className="text-xs font-semibold uppercase tracking-widest">Edizione</span>
                <span className="h-[1px] w-12" style={{ background: slide.accentColor }} />
                <m.span
                  className="font-display text-[11px] italic"
                  animate={{ color: slide.accentColor }}
                  transition={{ duration: BG_TRANSITION_S, ease: EASE_OUT }}
                  style={{ color: slide.accentColor }}
                >
                  {slide.edition}
                </m.span>
              </m.div>

              {/* Tag */}
              <m.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.14 }}
                className="mb-5 inline-flex w-fit items-center gap-2"
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M8 1L9.5 6.5L15 8L9.5 9.5L8 15L6.5 9.5L1 8L6.5 6.5L8 1Z"
                    fill={slide.accentColor}
                  />
                </svg>
                <span
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: slide.accentColor }}
                >
                  {slide.tagline}
                </span>
              </m.div>

              {/* Massive headline — letter-by-letter decompose/recompose */}
              <h1
                className="font-display font-semibold leading-[0.95] tracking-[-0.025em]"
                style={{ fontSize: "clamp(2.2rem, 0.4rem + 5vw, 6.5rem)", color: slide.textColor }}
              >
                <span className="block">
                  <SplitText text={slide.headlineLine1} baseDelay={0.22} />
                </span>
                <span
                  className="block italic font-medium"
                  style={{ color: slide.accentColor }}
                >
                  <SplitText
                    text={slide.headlineLine2}
                    baseDelay={0.22 + slide.headlineLine1.length * TEXT_CHAR_STAGGER + 0.08}
                  />
                </span>
              </h1>

              {/* Stitch ornament */}
              <m.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                exit={{ opacity: 0, scaleX: 0 }}
                transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.55 }}
                style={{ transformOrigin: "left center" }}
                className="mt-7 flex items-center gap-2"
                aria-hidden="true"
              >
                <span className="h-[2px] w-16" style={{ background: slide.accentColor }} />
                <span className="h-[2px] w-2" style={{ background: slide.accentColor, opacity: 0.55 }} />
                <span className="h-[2px] w-1" style={{ background: slide.accentColor, opacity: 0.25 }} />
              </m.div>

              {/* Subtitle */}
              <m.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.65, ease: EASE_OUT, delay: 0.65 }}
                className="mt-6 max-w-[30rem] text-[15px] leading-[1.7] md:text-[16px]"
                style={{ color: slide.textSecondaryColor }}
              >
                {slide.subtitle}
              </m.p>

              {/* CTAs */}
              <m.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.65, ease: EASE_OUT, delay: 0.78 }}
                className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5"
              >
                <a
                  href={slide.ctaHref}
                  className="group inline-flex items-center justify-center gap-2.5 rounded-full px-7 py-3.5 text-sm font-semibold tracking-wide transition-all duration-300 hover:shadow-[0_14px_36px_rgba(0,0,0,0.28)]"
                  style={{ background: slide.ctaBg, color: slide.ctaText }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = slide.ctaHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = slide.ctaBg;
                  }}
                >
                  {slide.ctaLabel}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </a>
                <a
                  href="/la-bottega"
                  className="group inline-flex items-center gap-2 text-sm font-medium tracking-wide transition-colors"
                  style={{ color: slide.textColor }}
                >
                  <span
                    className="border-b pb-0.5"
                    style={{ borderColor: `${slide.textColor}55` }}
                  >
                    La nostra storia
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              </m.div>
            </div>
          </AnimatePresence>

          {/* Maker mark — stays put across slides */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55, color: slide.textColor }}
            transition={{ duration: BG_TRANSITION_S, ease: EASE_OUT }}
            className="mt-6 hidden items-center gap-2 md:mt-14 md:flex"
            aria-hidden="true"
          >
            <div className="flex gap-[3px]">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className="h-[2px] w-[5px] rounded-full"
                  style={{ background: slide.textColor, marginTop: i % 2 === 0 ? "0" : "3px" }}
                />
              ))}
            </div>
            <span className="text-[9px] tracking-[0.32em] uppercase">
              Fatto a mano · Napoli · Dal 1984
            </span>
          </m.div>
        </div>

        {/* ═════════ COLUMN 2 — Lifestyle photograph ═════════ */}
        <div className="relative order-1 flex items-center justify-center md:order-2 md:justify-end">
          {/* Pedestal shadow */}
          <m.div
            aria-hidden="true"
            initial={{ opacity: 0, scaleX: 0.5 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 1.1, ease: EASE_OUT, delay: 0.7 }}
            className="absolute bottom-[2%] left-1/2 h-8 w-[80%] -translate-x-1/2 rounded-[50%] blur-3xl"
            style={{ background: "rgba(0,0,0,0.32)" }}
          />

          {/* Photo card — cinematic mask reveal between slides */}
          <div className="relative w-full max-w-[280px] sm:max-w-[340px] md:max-w-[480px] lg:max-w-[560px]">
            {/* Gold border ring */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-[3px] rounded-[var(--radius-xl)] z-10"
              style={{
                background: `linear-gradient(135deg, ${slide.accentColor}88 0%, transparent 50%, ${slide.accentColor}55 100%)`,
                transition: "background 1.2s ease",
              }}
            />
            <div
              className="relative overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-muted)]"
              style={{
                boxShadow: "0 30px 80px -20px rgba(0,0,0,0.45), 0 8px 24px -8px rgba(0,0,0,0.25)",
                aspectRatio: "3 / 4",
              }}
            >
              <AnimatePresence mode="sync" initial={false}>
                <m.img
                  key={slide.id}
                  src={slide.image.src}
                  alt={slide.image.alt}
                  width={slide.image.width}
                  height={slide.image.height}
                  loading="eager"
                  fetchPriority="high"
                  className="absolute inset-0 block h-full w-full object-cover"
                  style={{ objectPosition: slide.image.objectPosition ?? "center" }}
                  initial={{ opacity: 0, clipPath: "inset(100% 0% 0% 0%)", scale: 1.08 }}
                  animate={{ opacity: 1, clipPath: "inset(0% 0% 0% 0%)", scale: 1.0 }}
                  exit={{ opacity: 0, clipPath: "inset(0% 0% 100% 0%)", scale: 1.02 }}
                  transition={{
                    opacity: { duration: 0.6, ease: EASE_OUT },
                    clipPath: { duration: 1.2, ease: EASE_OUT },
                    scale: { duration: SLIDE_DURATION_MS / 1000, ease: "linear" },
                  }}
                />
              </AnimatePresence>
            </div>

            {/* Caption pill — crossfades with slide */}
            <AnimatePresence mode="wait" initial={false}>
              <m.div
                key={`caption-${slide.id}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.7 }}
                className="absolute -bottom-5 left-5 z-20 flex items-center gap-2 rounded-full border px-4 py-2"
                style={{
                  background: slide.textColor === "var(--color-foreground)" ? "var(--color-surface)" : "rgba(14,24,40,0.92)",
                  borderColor: `${slide.accentColor}55`,
                  boxShadow: "var(--shadow-md)",
                }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: slide.accentColor }}
                />
                <span
                  className="font-display text-[11px] italic tracking-tight"
                  style={{ color: slide.textColor }}
                >
                  {slide.caption}
                </span>
              </m.div>
            </AnimatePresence>

            {/* Decorative sparkles — accent color morphs */}
            <m.svg
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              initial={{ opacity: 0, scale: 0, rotate: -15 }}
              transition={{ duration: 0.8, ease: EASE_OUT, delay: 1.15 }}
              width="36"
              height="36"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              className="absolute -right-4 top-[15%] z-20"
            >
              <path
                d="M8 1L9.5 6.5L15 8L9.5 9.5L8 15L6.5 9.5L1 8L6.5 6.5L8 1Z"
                fill={slide.accentColor}
              />
            </m.svg>
            <m.svg
              animate={{ opacity: 1, scale: 1 }}
              initial={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.8, ease: EASE_OUT, delay: 1.3 }}
              width="20"
              height="20"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              className="absolute -left-3 top-[42%] z-20"
            >
              <path
                d="M8 1L9.5 6.5L15 8L9.5 9.5L8 15L6.5 9.5L1 8L6.5 6.5L8 1Z"
                fill={slide.accentColor}
                opacity="0.7"
              />
            </m.svg>
          </div>
        </div>
      </div>

      {/* Slide indicators / pagination dots */}
      <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Vai alla slide: ${s.headlineLine1} ${s.headlineLine2}`}
            aria-current={i === index}
            className="group flex h-8 items-center justify-center px-1"
          >
            <m.span
              animate={{
                width: i === index ? 28 : 8,
                background: i === index ? slide.accentColor : `${slide.textColor}55`,
              }}
              transition={{ duration: 0.4, ease: EASE_OUT }}
              className="block h-[3px] rounded-full"
            />
          </button>
        ))}
      </div>
    </m.section>
  );
}
