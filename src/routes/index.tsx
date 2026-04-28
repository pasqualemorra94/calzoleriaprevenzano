import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  HeroSection,
  MobileQuickShop,
  CategoriesSection,
  PersonalizationSection,
  FeaturedProductsSection,
  LaBottegaSection,
  TrustStripSection,
  TestimonialsSection,
  NewsletterSection,
} from "~/components/sections";

// ─── Route ──────────────────────────────────────────────────────────

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage(): ReactNode {
  return (
    <>
      <HeroSection />
      <CategoriesSection />
      <MobileQuickShop />
      <PersonalizationSection />
      <FeaturedProductsSection />
      <LaBottegaSection />
      <TrustStripSection />
      <TestimonialsSection />
      <NewsletterSection />
    </>
  );
}
