// Shared slide configuration consumed by HeroSection (desktop) and
// MobileHeroSection (mobile). Single source of truth so testi/foto/colori
// di una slide si modificano una volta sola.

export type HeroSlide = {
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
  bgGradient: string;
  haloGradient: string;
  textColor: string;
  textSecondaryColor: string;
  accentColor: string;
  ctaBg: string;
  ctaText: string;
  ctaHover: string;
  grainOpacity: number;
};

export const HERO_SLIDES: HeroSlide[] = [
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
  {
    id: "classici",
    edition: "Mediterraneo · Estate 2026",
    tagline: "Sul Mare di Napoli",
    headlineLine1: "Sandali",
    headlineLine2: "Classici",
    subtitle:
      "Pelle italiana lavorata a mano nella tradizione napoletana. Eleganza senza tempo, fatta per le estati al mare.",
    ctaHref: "/catalogo?category=classici",
    ctaLabel: "Scopri i Classici",
    image: {
      src: "/images/hero-classici-vesuvio.webp",
      alt: "Donna seduta su un gozzo napoletano con sandali classici bianchi, Vesuvio e mare di Napoli sullo sfondo",
      width: 1045,
      height: 1749,
    },
    caption: "Modello Capri · Pelle Bianca",
    bgGradient: "radial-gradient(at 50% 20%, #E8F4F8 0%, #C5DDE6 55%, #97B7C8 100%)",
    haloGradient:
      "radial-gradient(circle at center, rgba(201,169,97,0.18), rgba(220,235,245,0.10) 55%, transparent 75%)",
    textColor: "var(--color-foreground)",
    textSecondaryColor: "var(--color-text-secondary)",
    accentColor: "#C9A961",
    ctaBg: "var(--color-foreground)",
    ctaText: "#FFFFFF",
    ctaHover: "var(--color-primary)",
    grainOpacity: 0.05,
  },
];
