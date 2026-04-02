/**
 * Premium Email Templates — server-only
 *
 * Table-based HTML layout compatible with all major email clients.
 * Uses resolved design tokens from emailBrand.
 */

import { emailBrand, type EmailBrand } from "./email-brand.server";

// ─── Helpers ───────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

// ─── Layout ────────────────────────────────────────────────────────

interface EmailLayoutOptions {
  preheader: string;
  body: string;
  brand?: Partial<EmailBrand>;
}

function premiumEmailLayout(options: EmailLayoutOptions): string {
  const b = { ...emailBrand, ...options.brand };

  return `<!DOCTYPE html>
<html lang="it" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <title>${escapeHtml(b.brandName)}</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .padding-mobile { padding-left: 20px !important; padding-right: 20px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:${b.surfaceColor}; font-family:${b.bodyFont}; -webkit-font-smoothing:antialiased;">

  <div style="display:none; font-size:1px; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden; mso-hide:all;">
    ${escapeHtml(options.preheader)}${"\u200B".repeat(30)}
  </div>

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:${b.surfaceColor};">
    <tr>
      <td align="center" style="padding:24px 10px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="max-width:600px; width:600px; background-color:${b.backgroundColor}; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.06);">

          <!-- HEADER -->
          <tr>
            <td style="background-color:${b.primaryColor}; padding:28px 40px; text-align:center;" class="padding-mobile">
              <span style="font-family:${b.displayFont}; font-size:22px; font-weight:700; color:#ffffff; letter-spacing:0.5px;">
                ${escapeHtml(b.brandName)}
              </span>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:36px 40px 24px; color:${b.textColor}; font-family:${b.bodyFont}; font-size:15px; line-height:1.7;" class="padding-mobile">
              ${options.body}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:20px 40px 28px; border-top:1px solid ${b.borderColor};" class="padding-mobile">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="font-family:${b.bodyFont}; font-size:12px; color:${b.mutedColor}; text-align:center; line-height:1.6;">
                    &copy; ${new Date().getFullYear()} ${escapeHtml(b.brandName)}. Tutti i diritti riservati.<br>
                    ${b.siteUrl ? `<a href="${escapeHtml(b.siteUrl)}" style="color:${b.primaryColor}; text-decoration:none;">${escapeHtml(b.siteUrl.replace(/^https?:\/\//, ""))}</a><br>` : ""}
                    ${b.companyAddress ? `<span style="color:${b.mutedColor};">${escapeHtml(b.companyAddress)}</span><br>` : ""}
                    ${b.unsubscribeUrl ? `<a href="${escapeHtml(b.unsubscribeUrl)}" style="color:${b.mutedColor}; text-decoration:underline;">Annulla iscrizione</a>` : ""}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ─── CTA Button ─────────────────────────────────────────────────────

function ctaButton(text: string, href: string): string {
  const b = emailBrand;
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px auto;">
      <tr>
        <td style="border-radius:8px; background-color:${b.primaryColor};">
          <a href="${escapeHtml(href)}" target="_blank"
             style="display:inline-block; padding:14px 32px; font-family:${b.bodyFont}; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:8px; letter-spacing:0.3px;">
            ${escapeHtml(text)}
          </a>
        </td>
      </tr>
    </table>`;
}

// ─── Data Table Row ────────────────────────────────────────────────

function dataRow(label: string, value: string, bold = false): string {
  const b = emailBrand;
  return `
    <tr>
      <td style="padding:10px 14px; color:${b.mutedColor}; font-size:13px; border-bottom:1px solid ${b.borderColor}; width:140px; vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:10px 14px; color:${b.textColor}; font-size:14px; border-bottom:1px solid ${b.borderColor};${bold ? " font-weight:600;" : ""}">${escapeHtml(value)}</td>
    </tr>`;
}

// ─── Templates ─────────────────────────────────────────────────────

interface ContactData {
  name: string;
  email: string;
  message: string;
  subject?: string;
}

export function contactNotificationTemplate(data: ContactData): string {
  const b = emailBrand;

  const body = `
    <h1 style="font-family:${b.displayFont}; font-size:20px; color:${b.textColor}; margin:0 0 8px;">
      Nuovo messaggio dal sito
    </h1>
    <p style="color:${b.mutedColor}; font-size:13px; margin:0 0 24px;">
      Ricevuto il ${formatDate(new Date())}
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border:1px solid ${b.borderColor}; border-radius:8px; border-collapse:separate; overflow:hidden;">
      ${dataRow("Nome", data.name, true)}
      ${dataRow("Email", data.email)}
      ${data.subject ? dataRow("Oggetto", data.subject) : ""}
    </table>

    <div style="margin-top:24px; padding:16px 20px; background-color:${b.surfaceColor}; border-radius:8px; border-left:4px solid ${b.primaryColor};">
      <p style="margin:0 0 4px; font-size:11px; text-transform:uppercase; letter-spacing:0.8px; color:${b.mutedColor}; font-weight:600;">Messaggio</p>
      <p style="margin:0; color:${b.textColor}; line-height:1.7; font-size:14px;">${escapeHtml(data.message)}</p>
    </div>

    ${ctaButton("Rispondi a " + data.name, `mailto:${data.email}`)}

    <p style="text-align:center; font-size:12px; color:${b.mutedColor}; margin-top:8px;">
      Puoi anche rispondere direttamente a questa email.
    </p>`;

  return premiumEmailLayout({
    preheader: `Nuovo contatto: ${data.name}`,
    body,
  });
}

export function autoReplyTemplate(name: string): string {
  const b = emailBrand;

  const body = `
    <h1 style="font-family:${b.displayFont}; font-size:22px; color:${b.textColor}; margin:0 0 16px;">
      Grazie, ${escapeHtml(name)}!
    </h1>

    <p style="color:${b.textColor}; line-height:1.7; margin:0 0 16px;">
      Abbiamo ricevuto il tuo messaggio e ti risponderemo entro <strong>24 ore lavorative</strong>.
    </p>

    <p style="color:${b.textColor}; line-height:1.7; margin:0 0 24px;">
      Nel frattempo, puoi esplorare le nostre collezioni di sandali artigianali.
    </p>

    ${b.siteUrl ? ctaButton("Visita il negozio", b.siteUrl) : ""}

    <p style="color:${b.textColor}; line-height:1.7; margin:24px 0 0;">
      A presto,<br>
      <strong style="font-family:${b.displayFont}; color:${b.primaryColor};">${escapeHtml(b.brandName)}</strong>
    </p>`;

  return premiumEmailLayout({
    preheader: `Grazie per averci contattato! Ti risponderemo entro 24 ore.`,
    body,
  });
}

interface OrderEmailData {
  customerName: string;
  orderNumber: string;
  items: Array<{ name: string; quantity: number; priceCents: number }>;
  totalCents: number;
}

export function orderConfirmationTemplate(data: OrderEmailData): string {
  const b = emailBrand;

  const itemRows = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 14px; color:${b.textColor}; font-size:14px; border-bottom:1px solid ${b.borderColor};">
          ${escapeHtml(item.name)}
          <span style="color:${b.mutedColor};"> &times; ${item.quantity}</span>
        </td>
        <td style="padding:10px 14px; color:${b.textColor}; font-size:14px; border-bottom:1px solid ${b.borderColor}; text-align:right; font-weight:500;">
          ${formatCurrency(item.priceCents * item.quantity)}
        </td>
      </tr>`,
    )
    .join("");

  const body = `
    <h1 style="font-family:${b.displayFont}; font-size:22px; color:${b.textColor}; margin:0 0 8px;">
      Ordine confermato
    </h1>
    <p style="color:${b.mutedColor}; font-size:13px; margin:0 0 24px;">
      Ordine #${escapeHtml(data.orderNumber)} — ${formatDate(new Date())}
    </p>

    <p style="color:${b.textColor}; line-height:1.7; margin:0 0 20px;">
      Grazie, <strong>${escapeHtml(data.customerName)}</strong>! Il tuo ordine &egrave; stato ricevuto e confermato.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border:1px solid ${b.borderColor}; border-radius:8px; border-collapse:separate; overflow:hidden;">
      <tr style="background-color:${b.surfaceColor};">
        <td style="padding:10px 14px; font-size:11px; text-transform:uppercase; letter-spacing:0.8px; color:${b.mutedColor}; font-weight:600; border-bottom:1px solid ${b.borderColor};">Articolo</td>
        <td style="padding:10px 14px; font-size:11px; text-transform:uppercase; letter-spacing:0.8px; color:${b.mutedColor}; font-weight:600; border-bottom:1px solid ${b.borderColor}; text-align:right;">Prezzo</td>
      </tr>
      ${itemRows}
      <tr style="background-color:${b.surfaceColor};">
        <td style="padding:14px; font-size:15px; font-weight:700; color:${b.textColor};">Totale</td>
        <td style="padding:14px; font-size:15px; font-weight:700; color:${b.primaryColor}; text-align:right;">${formatCurrency(data.totalCents)}</td>
      </tr>
    </table>

    ${b.siteUrl ? ctaButton("Vai al negozio", b.siteUrl) : ""}

    <p style="text-align:center; font-size:12px; color:${b.mutedColor}; margin-top:8px;">
      Riceverai un'email quando il tuo ordine sar&agrave; spedito.
    </p>`;

  return premiumEmailLayout({
    preheader: `Ordine #${data.orderNumber} confermato — ${formatCurrency(data.totalCents)}`,
    body,
  });
}
