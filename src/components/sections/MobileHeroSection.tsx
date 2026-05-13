import { useEffect, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { ArrowRight } from "lucide-react";
import { HERO_SLIDES } from "./hero-slides";

// ─── Animation tokens ──────────────────────────────────────

type Easing = [number, number, number, number];
const EASE_OUT: Easing = [0.22, 1, 0.36, 1];
const SLIDE_DURATION_MS = 7500;
const TEXT_CHAR_STAGGER = 0.022;

const SLIDES = HERO_SLIDES;

// Mobile uses a unified light palette — dark scrim is the constant base.
const MOBILE_TEXT = "#F5EFE3";
const MOBILE_TEXT_DIM = "rgba(245, 239, 227, 0.82)";

// ─── Helpers ───────────────────────────────────────────────

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
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{
            duration: 0.4,
            ease: EASE_OUT,
            delay: baseDelay + i * TEXT_CHAR_STAGGER,
          }}
          className={className}
          style={{ display: "inline-block", ...style }}
        >
          {char === " " ? " " : char}
        </m.span>
      ))}
    </>
  );
}

// ─── Component ─────────────────────────────────────────────

export function MobileHeroSection() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % SLIDES.length);
    }, SLIDE_DURATION_MS);
    return () => window.clearInterval(id);
  }, [paused, index]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setPaused(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const slide = SLIDES[index];

  // Lift specifico per slide su mobile: foto con sandali al bottom del source
  // vengono shiftate verso l'alto per non essere coperte dalla pillola CTA.
  const mobileYOffset =
    slide.id === "strass" ? "-7%" : slide.id === "classici" ? "-4%" : "0%";

  return (
    <section
      className="relative overflow-hidden bg-black md:hidden"
      style={{ height: "calc(100svh - var(--navbar-height-base, 64px))" }}
      aria-roledescription="carousel"
      aria-label="Collezioni Calzoleria Prevenzano"
    >
      {/* ═════════ FULL-BLEED PHOTO LAYER ═════════
          Per la slide Strass alziamo la foto del 7% così il sandalo
          (che vive nel bottom 16% del source) sale sopra alla pillola CTA
          invece di esserne coperto. La gioiello non ne ha bisogno (i bracelets
          sono già nettamente sopra). */}
      <div className="absolute inset-0">
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
            style={{ objectPosition: "center" }}
            initial={{
              opacity: 0,
              clipPath: "inset(100% 0% 0% 0%)",
              scale: 1.1,
              y: mobileYOffset,
            }}
            animate={{
              opacity: 1,
              clipPath: "inset(0% 0% 0% 0%)",
              scale: 1.0,
              y: mobileYOffset,
            }}
            exit={{
              opacity: 0,
              clipPath: "inset(0% 0% 100% 0%)",
              scale: 1.03,
              y: mobileYOffset,
            }}
            transition={{
              opacity: { duration: 0.55, ease: EASE_OUT },
              clipPath: { duration: 1.0, ease: EASE_OUT },
              scale: { duration: SLIDE_DURATION_MS / 1000, ease: "linear" },
            }}
          />
        </AnimatePresence>
      </div>

      {/* ═════════ TOP SCRIM + TEXT OVERLAY ═════════
          Gradient va dall'alto (95% scuro) al trasparente (~58% del viewport).
          I sandali, che vivono nella metà bassa di entrambe le foto, restano
          intatti. Il cielo/Vesuvio/contesto in alto viene oscurato per leggibilità. */}
      <div
        className="absolute inset-x-0 top-0 z-10 px-[var(--page-padding-x)] pb-12 pt-7"
        style={{
          background:
            "linear-gradient(to bottom, rgba(8,12,20,0.92) 0%, rgba(8,12,20,0.78) 35%, rgba(8,12,20,0.42) 75%, rgba(8,12,20,0) 100%)",
        }}
      >
        {/* Edition meta */}
        <m.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.35 }}
          className="mb-5 flex items-center gap-2.5"
          style={{ color: MOBILE_TEXT_DIM }}
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">Edizione</span>
          <span className="h-[1px] w-8" style={{ background: slide.accentColor }} />
          <AnimatePresence mode="wait" initial={false}>
            <m.span
              key={`ed-${slide.id}`}
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.45, ease: EASE_OUT }}
              className="font-display text-[10px] italic"
              style={{ color: slide.accentColor }}
            >
              {slide.edition}
            </m.span>
          </AnimatePresence>
        </m.div>

        <AnimatePresence mode="wait" initial={false}>
          <div key={`text-${slide.id}`}>
            {/* Tagline */}
            <m.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.08 }}
              className="mb-3 inline-flex items-center gap-1.5"
            >
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M8 1L9.5 6.5L15 8L9.5 9.5L8 15L6.5 9.5L1 8L6.5 6.5L8 1Z"
                  fill={slide.accentColor}
                />
              </svg>
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: slide.accentColor }}
              >
                {slide.tagline}
              </span>
            </m.div>

            {/* Headline */}
            <h1
              className="font-display font-semibold leading-[0.95] tracking-[-0.02em]"
              style={{
                fontSize: "clamp(2.4rem, 12vw, 3.8rem)",
                color: MOBILE_TEXT,
                textShadow: "0 2px 14px rgba(0,0,0,0.55)",
              }}
            >
              <span className="block">
                <SplitText text={slide.headlineLine1} baseDelay={0.18} />
              </span>
              <span className="block italic font-medium" style={{ color: slide.accentColor }}>
                <SplitText
                  text={slide.headlineLine2}
                  baseDelay={0.18 + slide.headlineLine1.length * TEXT_CHAR_STAGGER + 0.06}
                />
              </span>
            </h1>

            {/* Stitch ornament */}
            <m.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              exit={{ opacity: 0, scaleX: 0 }}
              transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.5 }}
              style={{ transformOrigin: "left center" }}
              className="mt-5 flex items-center gap-1.5"
              aria-hidden="true"
            >
              <span className="h-[2px] w-12" style={{ background: slide.accentColor }} />
              <span
                className="h-[2px] w-1.5"
                style={{ background: slide.accentColor, opacity: 0.55 }}
              />
              <span
                className="h-[2px] w-1"
                style={{ background: slide.accentColor, opacity: 0.25 }}
              />
            </m.div>

            {/* Subtitle */}
            <m.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.55, ease: EASE_OUT, delay: 0.58 }}
              className="mt-4 max-w-[34ch] text-[13.5px] leading-[1.55]"
              style={{ color: MOBILE_TEXT_DIM, textShadow: "0 1px 8px rgba(0,0,0,0.55)" }}
            >
              {slide.subtitle}
            </m.p>
          </div>
        </AnimatePresence>
      </div>

      {/* ═════════ DECORATIVE SPARKLES (over scrim, accent) ═════════ */}
      <m.svg
        animate={{ opacity: 0.95, scale: 1, rotate: 0 }}
        initial={{ opacity: 0, scale: 0, rotate: -15 }}
        transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.95 }}
        width="30"
        height="30"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        className="absolute right-5 top-[7%] z-20"
      >
        <path
          d="M8 1L9.5 6.5L15 8L9.5 9.5L8 15L6.5 9.5L1 8L6.5 6.5L8 1Z"
          fill={slide.accentColor}
        />
      </m.svg>

      {/* ═════════ BOTTOM ZONE — CTA + dots (compact, low-impact) ═════════
          Riduciamo al massimo l'altezza per non coprire i sandali:
          - CTA pillola più sottile (py-3 invece di py-4) + leggera trasparenza + backdrop blur
          - Gradient sottostante minimal (60px, opacità max 0.45) — solo per leggibilità dots
          - Padding compresso (pt-4 pb-3) */}
      <div className="absolute inset-x-0 bottom-0 z-20 px-[var(--page-padding-x)] pb-3 pt-4"
        style={{
          background:
            "linear-gradient(to top, rgba(8,12,20,0.55) 0%, rgba(8,12,20,0.25) 60%, rgba(8,12,20,0) 100%)",
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <m.a
            key={`cta-${slide.id}`}
            href={slide.ctaHref}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.15 }}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold tracking-wide shadow-[0_8px_24px_-6px_rgba(0,0,0,0.45)] backdrop-blur-md transition-colors"
            style={{ background: `${slide.accentColor}F2`, color: "#0E1828" }}
          >
            {slide.ctaLabel}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-active:translate-x-1" />
          </m.a>
        </AnimatePresence>

        {/* Pagination dots — compact */}
        <div className="mt-2.5 flex items-center justify-center gap-3">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Vai alla slide: ${s.headlineLine1} ${s.headlineLine2}`}
              aria-current={i === index}
              className="flex h-6 items-center justify-center px-1"
            >
              <m.span
                animate={{
                  width: i === index ? 22 : 5,
                  background: i === index ? slide.accentColor : `${MOBILE_TEXT}66`,
                }}
                transition={{ duration: 0.4, ease: EASE_OUT }}
                className="block h-[3px] rounded-full"
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
