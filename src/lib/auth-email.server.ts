/**
 * Auth Email Wiring — server-only
 *
 * Connects secure-auth-sdk email hooks to the sendEmail service.
 * Handles: verify email, password reset, magic link.
 */

import { sendEmail } from "./email.server";

type AuthEmailType = "verify" | "reset" | "magic-link";

interface AuthEmailData {
  url: string;
  name?: string;
  email: string;
}

/**
 * Send auth-related transactional email.
 * Called by the auth SDK's onEmailRequired hook.
 */
export async function sendAuthEmail(type: AuthEmailType, data: AuthEmailData): Promise<boolean> {
  const subjects: Record<AuthEmailType, string> = {
    verify: "Verifica il tuo indirizzo email — Calzoleria Prevenzano",
    reset: "Reimposta la tua password — Calzoleria Prevenzano",
    "magic-link": "Il tuo link di accesso — Calzoleria Prevenzano",
  };

  const getHtml = (t: AuthEmailType, d: AuthEmailData): string => {
    const brandName = "Calzoleria Prevenzano";
    const greeting = d.name ? `Ciao ${d.name}` : "Ciao";
    const ctaText = t === "verify" ? "Verifica email" : t === "reset" ? "Reimposta password" : "Accedi";

    return `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; max-width:600px; margin:0 auto; padding:32px;">
        <h1 style="font-size:22px; font-weight:600; color:#2D2D2D; margin:0 0 16px;">${greeting},</h1>
        <p style="font-size:15px; color:#5A5A5A; line-height:1.7; margin:0 0 24px;">
          ${
            t === "verify"
              ? "Per completare la registrazione, verifica il tuo indirizzo email cliccando sul pulsante qui sotto."
              : t === "reset"
                ? "Abbiamo ricevuto una richiesta di reimpostazione della password. Clicca sul pulsante per scegliere una nuova password."
                : "Clicca sul pulsante qui sotto per accedere al tuo account."
          }
        </p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;">
          <tr>
            <td style="border-radius:8px; background-color:#8B5E3C;">
              <a href="${d.url}" target="_blank"
                 style="display:inline-block; padding:14px 32px; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:8px;">
                ${ctaText}
              </a>
            </td>
          </tr>
        </table>
        <p style="font-size:12px; color:#8A8A8A; margin:24px 0 0; text-align:center;">
          Se non hai richiesto questa azione, puoi ignorare questa email.<br>
          Il link scade tra ${t === "reset" ? "1 ora" : "24 ore"}.
        </p>
        <p style="font-size:12px; color:#8A8A8A; margin:16px 0 0; text-align:center;">
          ${brandName} — Via Chiaia, 104, 80132 Napoli
        </p>
      </div>`;
  };

  const result = await sendEmail({
    to: data.email,
    subject: subjects[type],
    html: getHtml(type, data),
  });

  return result.ok;
}
