import type { ReactNode } from "react";
import { MessageCircle } from "lucide-react";

/**
 * Pulsante WhatsApp flottante — solo desktop.
 *
 * Mounted in __root.tsx con gate !isAdmin. È un anchor statico (no JS,
 * no cookie, no fingerprint) → nessun gate di consenso GDPR necessario.
 *
 * Visibilità: `hidden md:flex` — su mobile il CTA WhatsApp è già presente
 * dentro MobileBottomNav (al posto della voce "Account", spostata nel
 * menu principale). Evitare doppio CTA mobile.
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
      className="fixed right-6 bottom-6 z-[var(--z-sticky)] hidden h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[var(--shadow-md)] transition-[transform,background-color] duration-[var(--transition-base)] ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[#1DA851] motion-safe:hover:scale-[1.05] motion-safe:active:scale-[0.95] md:flex"
    >
      <MessageCircle className="h-7 w-7" aria-hidden="true" />
    </a>
  );
}
