import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  HeroSection,
  CategoriesSection,
  PersonalizationSection,
  FeaturedProductsSection,
  LaBottegaSection,
  TrustStripSection,
  TestimonialsSection,
  NewsletterSection,
} from "~/components/sections";
import { $getCategoryImages } from "~/lib/product-functions";

// ─── Route ──────────────────────────────────────────────────────────

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const categoryImages = await $getCategoryImages();
    return { categoryImages };
  },
  component: HomePage,
});

function HomePage(): ReactNode {
  const { categoryImages } = Route.useRouteContext();

  return (
    <>
      <HeroSection />
      <CategoriesSection categoryImages={categoryImages} />
      <PersonalizationSection />
      <FeaturedProductsSection />
      <LaBottegaSection />
      <TrustStripSection />
      <TestimonialsSection />
      <NewsletterSection />
    </>
  );
}
