import type { ReactNode } from "react";
import { ScrollAnimatedSection } from "~/components/ui/ScrollAnimatedSection";
import { fadeInUp } from "~/lib/animation-variants";

export function TutorialVideo(): ReactNode {
  return (
    <ScrollAnimatedSection
      className="bg-[var(--color-background)] py-[var(--section-padding-y)]"
      variants={fadeInUp}
    >
      <section className="mx-auto max-w-3xl px-[var(--page-padding-x)] text-center">
        <p className="text-xs font-medium tracking-[var(--tracking-widest)] text-[var(--color-text-muted)]">
          Video tutorial
        </p>
        <hr className="stitch-divider stitch-divider--left mx-auto my-4" />
        <h2 className="font-display text-[var(--text-lg)] font-semibold tracking-tight">
          Guarda il video tutorial
        </h2>
        <p className="mt-3 text-sm leading-[var(--leading-relaxed)] text-[var(--color-text-secondary)]">
          Un breve video per vedere il metodo di misurazione spiegato passo passo.
        </p>
        <video
          controls
          preload="metadata"
          playsInline
          poster="/images/foto-piede-misurazione.png"
          className="mt-6 aspect-video w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-muted)]"
        >
          <source src="/videos/tutorial-misurazione.mp4" type="video/mp4" />
          Il tuo browser non supporta il tag video.
        </video>
      </section>
    </ScrollAnimatedSection>
  );
}
