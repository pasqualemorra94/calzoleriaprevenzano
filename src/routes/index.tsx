import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  HeroSection,
  MobileHeroSection,
  CategoriesSection,
  PersonalizationSection,
  FeaturedProductsSection,
  TrustStripSection,
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
      <MobileHeroSection />
      <FeaturedProductsSection />
      <CategoriesSection />
      <PersonalizationSection />
      <TrustStripSection />
      <NewsletterSection />
    </>
  );
}
