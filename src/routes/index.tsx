import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
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

// ─── Types ──────────────────────────────────────────────────────────

interface CategoryApiItem {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  children?: CategoryApiItem[];
}

// ─── Route ──────────────────────────────────────────────────────────

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage(): ReactNode {
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>({});

  useEffect(() => {
    // Fetch category images from existing categories API
    fetch("/api/categories")
      .then((res) => res.json())
      .then((json) => {
        if (!json.ok) return;
        const categories: CategoryApiItem[] = json.data ?? [];
        const images: Record<string, string> = {};
        for (const cat of categories) {
          if (cat.image) images[cat.name] = cat.image;
        }
        setCategoryImages(images);
      })
      .catch(() => {
        // Silent fail — CategoriesSection has hardcoded fallbacks
      });
  }, []);

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
