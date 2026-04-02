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

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage(): ReactNode {
  return (
    <>
      <HeroSection />
      <CategoriesSection />
      <PersonalizationSection />
      <FeaturedProductsSection />
      <LaBottegaSection />
      <TrustStripSection />
      <TestimonialsSection />
      <NewsletterSection />
    </>
  );
}
