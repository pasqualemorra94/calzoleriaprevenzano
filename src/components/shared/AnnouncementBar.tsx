import { ANNOUNCEMENT_TEXT, isAnnouncementActive } from "~/lib/announcement";

/**
 * Striscia di annuncio in cima all'header (sopra microbar desktop e barra mobile).
 * Non chiudibile: sparisce da sola alla scadenza definita in ~/lib/announcement.
 */
export function AnnouncementBar() {
  if (!isAnnouncementActive()) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center bg-[var(--color-primary-dark)] px-4 text-center h-[var(--announcement-height)] md:h-[var(--announcement-height-md)]"
    >
      <p className="text-[10px] font-medium leading-tight tracking-[0.06em] text-[var(--color-primary-foreground)] md:text-[11px] md:tracking-[0.08em]">
        {ANNOUNCEMENT_TEXT}
      </p>
    </div>
  );
}
