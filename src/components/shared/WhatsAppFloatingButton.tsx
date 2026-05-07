import type { ReactNode } from "react";
import { MessageCircle } from "lucide-react";

/**
 * Pulsante WhatsApp flottante globale.
 *
 * Mounted in __root.tsx con gate !isAdmin. È un anchor statico (no JS,
 * no cookie, no fingerprint) → nessun gate di consenso GDPR necessario.
 *
 * Posizione:
 *  - Mobile: bottom = MobileBottomNav height (~60px) + 1rem gap, right-4
 *  - Desktop: bottom-6 right-6 standard
 *
 * Z-index: var(--z-sticky) (40) — sotto cookie banner (z-toast 80) e
 * modali (z-modal 70), sopra contenuto base.
 *
 * Brand color #25D366 — eccezione documentata in CONTEXT.md:
 * NON è un design token del sito ma il colore brand ufficiale del logo
 * WhatsApp. Hover #1DA851 coerente con CTA esistente in /contatti.
 */
const WHATSAPP_URL =
  "https://wa.me/390810410442?text=Ciao,%20vorrei%20informazioni%20sui%20vostri%20sandali";

export function WhatsAppFloatingButton(): ReactNode {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contattaci su WhatsApp"
      className="fixed right-4 bottom-[calc(60px+1rem)] z-[var(--z-sticky)] flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[var(--shadow-md)] transition-[transform,background-color] duration-[var(--transition-base)] ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[#1DA851] motion-safe:hover:scale-[1.05] motion-safe:active:scale-[0.95] md:right-6 md:bottom-6 md:h-14 md:w-14"
    >
      <MessageCircle className="h-6 w-6 md:h-7 md:w-7" aria-hidden="true" />
    </a>
  );
}
