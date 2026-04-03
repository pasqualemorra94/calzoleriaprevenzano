import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import { ScrollAnimatedSection } from "~/components/ui/ScrollAnimatedSection";
import { m } from "motion/react";
import { MapPin, Phone, MessageCircle, Mail, Loader2, Check } from "lucide-react";

export const Route = createFileRoute("/contatti")({
  component: ContattiPage,
});

const CONTACT_INFO = {
  headline: "Contattaci",
  body: "Hai una domanda sui nostri prodotti, un dubbio sulla taglia o vuoi creare un sandalo completamente su misura? Siamo qui per aiutarti. Scrivici, chiamaci o vieni a trovarci in bottega.",
  address: "Via Chiaia, 104 — 80132 Napoli (NA)",
  email: "info@calzoleriaprevenzano.it",
  phone: "+39 081 XXX XXXX",
  whatsapp: "+39 333 XXX XXXX",
  piva: "04590921211",
} as const;

function ContattiPage(): ReactNode {
  const [formState, setFormState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormState("loading");
    setErrorMessage(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          subject: formData.get("subject"),
          message: formData.get("message"),
        }),
      });

      const data = await response.json() as { error?: string };

      if (!response.ok) {
        setErrorMessage(data.error ?? "Errore nell'invio del messaggio. Riprova.");
        setFormState("error");
        return;
      }

      setFormState("success");
      form.reset();
    } catch {
      setErrorMessage("Errore di connessione. Riprova.");
      setFormState("error");
    }
  };

  return (
    <>
      {/* Page hero */}
      <section className="bg-[var(--color-surface)] py-[var(--section-padding-y-lg)]">
        <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
          <m.div
            className="mx-auto max-w-3xl text-center"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="font-display text-[var(--text-lg)] font-semibold tracking-tight md:text-[var(--text-xl)]">
              {CONTACT_INFO.headline}
            </h1>
            <p className="mt-4 text-[var(--text-lg)] leading-[var(--leading-relaxed)] text-[var(--color-text-secondary)]">
              {CONTACT_INFO.body}
            </p>
          </m.div>
        </div>
      </section>

      {/* Contact info + Form */}
      <ScrollAnimatedSection className="bg-[var(--color-background)] py-[var(--section-padding-y)]">
        <section className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_2fr] lg:gap-16">
            {/* Left — Contact details */}
            <div>
              <p className="text-xs font-medium tracking-wider text-[var(--color-text-muted)]">
                Informazioni di contatto
              </p>
              <hr className="stitch-divider stitch-divider--left my-4" />

              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-primary)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text)]">Indirizzo</p>
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{CONTACT_INFO.address}</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-primary)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text)]">Telefono</p>
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{CONTACT_INFO.phone}</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-primary)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text)]">WhatsApp</p>
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{CONTACT_INFO.whatsapp}</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-primary)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text)]">Email</p>
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{CONTACT_INFO.email}</p>
                  </div>
                </li>
              </ul>

              {/* WhatsApp CTA */}
              <a
                href={`https://wa.me/${CONTACT_INFO.whatsapp.replace(/\s/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[#25D366] px-6 text-sm font-medium text-white transition-colors hover:bg-[#1DA851]"
              >
                <MessageCircle className="h-4 w-4" />
                Scrivici su WhatsApp
              </a>
            </div>

            {/* Right — Contact form */}
            <div>
              <p className="text-xs font-medium tracking-wider text-[var(--color-text-muted)]">
                Inviaci un messaggio
              </p>
              <hr className="stitch-divider stitch-divider--left my-4" />

              {formState === "success" ? (
                <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
                  <Check className="mx-auto mb-3 h-8 w-8 text-green-600" />
                  <p className="font-display text-base font-semibold text-[var(--color-text)]">
                    Messaggio inviato!
                  </p>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                    Ti risponderemo il prima possibile. Grazie per averci contattato.
                  </p>
                </div>
              ) : (
                <form
                  className="space-y-5"
                  onSubmit={handleSubmit}
                >
                  {errorMessage && (
                    <div className="rounded-md border border-[var(--color-destructive)]/20 bg-[var(--color-destructive)]/5 p-4">
                      <p className="text-sm text-[var(--color-destructive)]">{errorMessage}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="contact-name" className="text-sm font-medium text-[var(--color-text)]">
                        Nome
                      </label>
                      <input
                        id="contact-name"
                        name="name"
                        type="text"
                        required
                        placeholder="Il tuo nome"
                        className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] transition-colors focus:border-[var(--color-primary)] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="contact-email" className="text-sm font-medium text-[var(--color-text)]">
                        Email
                      </label>
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        required
                        placeholder="La tua email"
                        className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] transition-colors focus:border-[var(--color-primary)] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="contact-subject" className="text-sm font-medium text-[var(--color-text)]">
                      Oggetto
                    </label>
                    <input
                      id="contact-subject"
                      name="subject"
                      type="text"
                      placeholder="Come possiamo aiutarti?"
                      className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] transition-colors focus:border-[var(--color-primary)] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="contact-message" className="text-sm font-medium text-[var(--color-text)]">
                      Messaggio
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      rows={5}
                      required
                      placeholder="Scrivi il tuo messaggio..."
                      className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] transition-colors focus:border-[var(--color-primary)] focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={formState === "loading"}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-8 text-sm font-medium text-white transition-colors duration-[var(--transition-base)] hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {formState === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
                    Invia messaggio
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </ScrollAnimatedSection>
    </>
  );
}
