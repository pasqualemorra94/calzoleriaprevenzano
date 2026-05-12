import type { ReactNode } from "react";
import { cn } from "~/lib/utils/cn";

export interface SectionHeaderProps {
  /** Kicker/eyebrow above the title (uppercase, small, accent). */
  eyebrow?: string;
  /** Section title — rendered as h2 by default. */
  title: string;
  /** Optional lead/intro paragraph below the title. */
  lead?: string;
  /** Text alignment of the whole block. Default "center". */
  align?: "center" | "left";
  /** Heading level for the title element. Default "h2". */
  as?: "h1" | "h2";
  /** Optional slot rendered after the lead (stitch lines, decorative patterns). */
  decoration?: ReactNode;
  /** Override the wrapper classes (e.g. bottom margin). */
  className?: string;
}

/**
 * Reusable section header — eyebrow + title + lead with the "Sobrio"
 * typographic scale (utilities are wired to the design tokens, fluid via clamp).
 * Keeps the H2 visibly larger than card/block H3 titles.
 */
export function SectionHeader({
  eyebrow,
  title,
  lead,
  align = "center",
  as = "h2",
  decoration,
  className,
}: SectionHeaderProps) {
  const isCenter = align === "center";
  const Title = as;

  return (
    <div
      className={cn(
        isCenter ? "text-center" : "text-left",
        "mb-10 md:mb-16",
        className,
      )}
    >
      {eyebrow ? (
        <span className="block text-xs font-semibold uppercase tracking-widest text-[var(--color-accent)]">
          {eyebrow}
        </span>
      ) : null}

      <Title
        className={cn(
          "font-display text-3xl font-semibold tracking-tight text-balance text-[var(--color-text)]",
          eyebrow ? "mt-3 md:mt-4" : undefined,
        )}
      >
        {title}
      </Title>

      {lead ? (
        <p
          className={cn(
            "mt-4 text-lg leading-relaxed text-[var(--color-text-secondary)]",
            isCenter ? "mx-auto max-w-xl" : "max-w-2xl",
          )}
        >
          {lead}
        </p>
      ) : null}

      {decoration}
    </div>
  );
}
