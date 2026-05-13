import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { m } from "motion/react";
import { Loader2, Check } from "lucide-react";
import { Truck } from "lucide-react";
import { OrderSummary } from "~/components/checkout/OrderSummary";
import type { CartItemDetail } from "~/components/checkout/OrderSummary";
import { $getPublicShippingConfig } from "~/lib/shipping-functions";
import { computeShippingCost, type ShippingConfigShape } from "~/lib/utils/shipping";

const INPUT_CLASS =
  "h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] transition-colors focus:border-[var(--color-primary)] focus:outline-none";
const LABEL_CLASS = "block text-sm font-medium text-[var(--color-text)]";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

function CheckoutPage(): ReactNode {
  const navigate = useNavigate();
  const [cart, setCart] = useState<{ items: CartItemDetail[]; subtotal: number } | null>(null);
  const [shippingConfig, setShippingConfig] = useState<ShippingConfigShape | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const [form, setForm] = useState({
    email: "", firstName: "", lastName: "", address1: "", address2: "", city: "", province: "", postalCode: "", phone: "",
  });
  const [discountCode, setDiscountCode] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedTermsError, setAcceptedTermsError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.email.trim()) errs.email = "L'email è obbligatoria";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = "Email non valida";
    if (!form.firstName.trim()) errs.firstName = "Il nome è obbligatorio";
    if (!form.lastName.trim()) errs.lastName = "Il cognome è obbligatorio";
    if (!form.address1.trim()) errs.address1 = "L'indirizzo è obbligatorio";
    if (!form.city.trim()) errs.city = "La città è obbligatoria";
    if (!form.province.trim() || form.province.length !== 2) errs.province = "Inserisci 2 caratteri";
    if (!form.postalCode.trim() || form.postalCode.length !== 5) errs.postalCode = "Inserisci 5 caratteri";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return false;
    if (!acceptedTerms) {
      setAcceptedTermsError("Devi accettare i Termini di Vendita per procedere");
      return false;
    }
    setAcceptedTermsError(null);
    return true;
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  useEffect(() => {
    (async () => {
      try {
        const [cartRes, configRes] = await Promise.all([
          fetch("/api/cart").then((r) => r.json()),
          $getPublicShippingConfig().catch(() => null),
        ]);
        if (cartRes.ok && cartRes.data.items.length === 0) { navigate({ to: "/carrello" }); return; }
        if (cartRes.ok) setCart(cartRes.data);
        if (configRes) {
          setShippingConfig({
            cost: configRes.cost,
            freeThreshold: configRes.freeThreshold,
            enabled: configRes.enabled,
          });
        }
      } catch { /* ignore */ }
      setAuthChecked(true);
      setLoading(false);
    })();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitStatus("loading");
    setSubmitError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email, firstName: form.firstName, lastName: form.lastName,
          address: { address1: form.address1, address2: form.address2, city: form.city, province: form.province, postalCode: form.postalCode, country: "IT", phone: form.phone || undefined },
          shippingMethod: "standard", discountCode: discountCode || undefined, notes: notes || undefined,
          acceptedTerms: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setSubmitError(json.error?.message ?? "Errore durante il checkout. Riprova."); setSubmitStatus("error"); return; }
      setOrderNumber(json.data.orderNumber);
      if (json.data.checkoutUrl) {
        setCheckoutUrl(json.data.checkoutUrl);
        setRedirecting(true);
        setTimeout(() => { window.location.href = json.data.checkoutUrl; }, 2000);
      } else { setSubmitStatus("success"); }
    } catch {
      setSubmitError("Errore di connessione. Riprova."); setSubmitStatus("error");
    }
  };

  if (loading || !authChecked) {
    return (
      <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)] py-[var(--section-padding-y)]">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
        </div>
      </div>
    );
  }

  if (!cart) return null;

  if (submitStatus === "success" && orderNumber) {
    return (
      <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)] py-[var(--section-padding-y)]">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="mb-2 font-display text-[var(--text-xl)] font-semibold">Ordine confermato!</h1>
          <p className="text-[var(--color-text-secondary)]">
            Il tuo ordine <span className="font-semibold text-[var(--color-text)]">{orderNumber}</span> è stato creato con successo.
          </p>
          <Link to="/" className="mt-8 inline-flex h-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-8 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)]">Torna alla homepage</Link>
        </div>
      </div>
    );
  }

  if (redirecting && checkoutUrl) {
    return (
      <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)] py-[var(--section-padding-y)]">
        <div className="mx-auto max-w-lg text-center">
          <Loader2 className="mx-auto mb-6 h-8 w-8 animate-spin text-[var(--color-primary)]" />
          <h1 className="mb-2 font-display text-[var(--text-lg)] font-semibold">Reindirizzamento al pagamento...</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Verrai redirected alla pagina di pagamento sicuro.</p>
        </div>
      </div>
    );
  }

  const shippingCost = shippingConfig
    ? computeShippingCost(cart.subtotal, shippingConfig)
    : 0;

  return (
    <>
      <section className="bg-[var(--color-surface)] py-[var(--section-padding-y)]">
        <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
          <m.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
            <nav className="mb-4 text-sm text-[var(--color-text-muted)]" aria-label="Breadcrumb">
              <Link to="/" className="hover:text-[var(--color-primary)]">Home</Link>
              <span className="mx-2">/</span>
              <Link to="/carrello" className="hover:text-[var(--color-primary)]">Carrello</Link>
              <span className="mx-2">/</span>
              <span className="text-[var(--color-text)]">Checkout</span>
            </nav>
            <h1 className="font-display text-[var(--text-lg)] font-semibold tracking-tight md:text-[var(--text-xl)]">Checkout</h1>
          </m.div>
        </div>
      </section>

      <section className="bg-[var(--color-background)] py-[var(--section-padding-y)]">
        <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px] lg:gap-16">
              <m.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}>
                <div className="flex items-center gap-2 mb-6">
                  <Truck className="h-5 w-5 text-[var(--color-primary)]" />
                  <p className="text-xs font-medium tracking-wider text-[var(--color-text-muted)] mb-4">Indirizzo di spedizione</p>
                </div>
                <hr className="stitch-divider stitch-divider--left mb-6" />

                {submitError && (
                  <div className="mb-6 rounded-md border border-[var(--color-destructive)]/20 bg-[var(--color-destructive)]/5 p-4">
                    <p className="text-sm text-[var(--color-destructive)]">{submitError}</p>
                  </div>
                )}

                <div className="space-y-5">
                  <FormInput id="checkout-email" label="Email" type="email" required placeholder="mario@esempio.it" autoComplete="email" value={form.email} error={errors.email} onChange={(e) => updateField("email", e.target.value)} />
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <FormInput id="checkout-firstName" label="Nome" type="text" required placeholder="Mario" autoComplete="given-name" value={form.firstName} error={errors.firstName} onChange={(e) => updateField("firstName", e.target.value)} />
                    <FormInput id="checkout-lastName" label="Cognome" type="text" required placeholder="Rossi" autoComplete="family-name" value={form.lastName} error={errors.lastName} onChange={(e) => updateField("lastName", e.target.value)} />
                  </div>
                  <FormInput id="checkout-address1" label="Indirizzo" type="text" required placeholder="Via Roma, 1" autoComplete="address-line1" value={form.address1} error={errors.address1} onChange={(e) => updateField("address1", e.target.value)} />
                  <FormInput id="checkout-address2" label="Indirizzo 2" type="text" placeholder="Appartamento, interno..." optional autoComplete="address-line2" value={form.address2} onChange={(e) => updateField("address2", e.target.value)} />
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <div className="sm:col-span-2 space-y-2">
                      <FormInput id="checkout-city" label="Città" type="text" required placeholder="Napoli" autoComplete="address-level2" value={form.city} error={errors.city} onChange={(e) => updateField("city", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <FormInput id="checkout-province" label="Provincia" type="text" required placeholder="NA" maxLength={2} autoComplete="address-level1" value={form.province} error={errors.province} onChange={(e) => updateField("province", e.target.value.toUpperCase())} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <FormInput id="checkout-postalCode" label="CAP" type="text" required placeholder="80132" maxLength={5} autoComplete="postal-code" value={form.postalCode} error={errors.postalCode} onChange={(e) => updateField("postalCode", e.target.value.replace(/\D/g, ""))} />
                    <FormInput id="checkout-phone" label="Telefono" type="tel" placeholder="+39 333 XXX XXXX" optional autoComplete="tel" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="checkout-discount" className={LABEL_CLASS}>Codice sconto</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]">🏷</span>
                        <input id="checkout-discount" type="text" placeholder="Inserisci il codice" value={discountCode} onChange={(e) => setDiscountCode(e.target.value.toUpperCase())} className={`${INPUT_CLASS} pl-10`} />
                      </div>
                      <button type="button" className="h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-muted)]">Applica</button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="checkout-notes" className={LABEL_CLASS}>Note <span className="font-normal text-[var(--color-text-muted)]">(opzionale)</span></label>
                    <textarea id="checkout-notes" rows={3} placeholder="Note per la spedizione..." value={notes} onChange={(e) => setNotes(e.target.value)}
                      className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] transition-colors focus:border-[var(--color-primary)] focus:outline-none" />
                  </div>
                </div>
              </m.div>

              <div className="lg:sticky lg:top-24">
                <label htmlFor="checkout-accept-terms" className="mb-4 flex items-start gap-2 text-sm text-[var(--color-text-secondary)] cursor-pointer">
                  <input
                    id="checkout-accept-terms"
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => {
                      setAcceptedTerms(e.target.checked);
                      if (e.target.checked) setAcceptedTermsError(null);
                    }}
                    required
                    aria-required="true"
                    aria-describedby={acceptedTermsError ? "checkout-accept-terms-error" : undefined}
                    className="mt-1 h-4 w-4 cursor-pointer accent-[var(--color-primary)]"
                  />
                  <span>
                    Ho letto e accetto i{" "}
                    <a href="/termini" target="_blank" rel="noopener" className="text-[var(--color-primary)] underline underline-offset-2">
                      Termini di Vendita
                    </a>
                  </span>
                </label>
                {acceptedTermsError && (
                  <p id="checkout-accept-terms-error" className="mb-4 -mt-2 text-xs text-[var(--color-destructive)]">
                    {acceptedTermsError}
                  </p>
                )}
                <OrderSummary
                  items={cart.items} subtotal={cart.subtotal} shippingCost={shippingCost}
                  freeShippingThreshold={shippingConfig?.freeThreshold ?? 199}
                  shippingEnabled={shippingConfig?.enabled ?? true}
                  submitStatus={submitStatus} isCheckout
                  disabled={!acceptedTerms}
                />
              </div>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}

function FormInput({ id, label, type, required, placeholder, autoComplete, optional, maxLength, value, error, onChange }: {
  id: string; label: string; type?: string; required?: boolean; placeholder?: string; autoComplete?: string; optional?: boolean; maxLength?: number;
  value: string; error?: string; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}): ReactNode {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className={LABEL_CLASS}>
        {label} {optional && <span className="font-normal text-[var(--color-text-muted)]">(opzionale)</span>}
      </label>
      <input id={id} type={type ?? "text"} required={required} placeholder={placeholder} autoComplete={autoComplete} maxLength={maxLength} value={value}
        onChange={onChange} className={`${INPUT_CLASS} ${error ? "border-[var(--color-destructive)]" : ""}`} />
      {error && <p className="text-xs text-[var(--color-destructive)]">{error}</p>}
    </div>
  );
}
