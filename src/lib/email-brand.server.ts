/**
 * Email Brand Config — server-only
 *
 * Resolved design token values for email templates.
 * Email clients cannot parse CSS custom properties,
 * so we pass the actual hex values.
 */

export const emailBrand = {
  // Identity
  brandName: "Calzoleria Prevenzano",
  siteUrl: process.env.APP_URL ?? "https://calzoleriaprevenzano.it",
  logoUrl: "/images/logo.png",

  // Colors (resolved from design-tokens.css)
  primaryColor: "#8B5E3C",
  primaryDarkColor: "#6B4226",
  primaryLightColor: "#A67B56",
  accentColor: "#C9A961",
  backgroundColor: "#FFFFFF",
  surfaceColor: "#FAF6F1",
  textColor: "#2D2D2D",
  mutedColor: "#5A5A5A",
  borderColor: "#DDD5CA",

  // Typography (fallbacks for email clients)
  displayFont: "'Cormorant Garamond', Georgia, 'Times New Roman', serif",
  bodyFont: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",

  // Footer
  companyAddress: "Via Chiaia, 104 — 80121 Napoli (NA), Italia",
  unsubscribeUrl: "",
} as const;

export type EmailBrand = typeof emailBrand;
