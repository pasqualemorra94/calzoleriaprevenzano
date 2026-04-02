import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { m } from "motion/react";
import { Loader2, Check, ShieldCheck, Truck, Tag, ShoppingBag } from "lucide-react";

interface CartItemDetail {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  price: number;
  product: { name: string; slug: string };
  variant: { name: string; color: string | null; size: string | null } | null;
}

interface CartResult {
  id: string;
  items: CartItemDetail[];
  itemCount: number;
  subtotal: number;
}

const FREE_SHIPPING_THRESHOLD = 99;
const SHIPPING_COST = 7.9;

const INPUT_CLASS =
  "h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] transition-colors focus:border-[var(--color-primary)] focus:outline-none";

const LABEL_CLASS = "block text-sm font-medium text-[var(--color-text)]";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

function CheckoutPage(): ReactNode {
  const navigate = useNavigate();

  const [cart, setCart] = useState<CartResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    address1: "",
    address2: "",
    city: "",
    province: "",
    postalCode: "",
    phone: "",
  });

  const [discountCode, setDiscountCode] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.firstName.trim()) errs.firstName = "Il nome è obbligatorio";
    if (!form.lastName.trim()) errs.lastName = "Il cognome è obbligatorio";
    if (!form.address1.trim()) errs.address1 = "L'indirizzo è obbligatorio";
    if (!form.city.trim()) errs.city = "La città è obbligatoria";
    if (!form.province.trim() || form.province.length !== 2) errs.province = "Inserisci 2 caratteri";
    if (!form.postalCode.trim() || form.postalCode.length !== 5) errs.postalCode = "Inserisci 5 caratteri";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  useEffect(() => {
    async function checkAuthAndCart() {
      try {
        const ordersRes = await fetch("/api/orders");
        if (ordersRes.status === 401) {
          navigate({ to: "/auth/login" });
          return;
        }

        const cartRes = await fetch("/api/cart");
        const cartJson = await cartRes.json();
        if (cartJson.ok && cartJson.data.items.length === 0) {
          navigate({ to: "/carrello" });
          return;
        }
        if (cartJson.ok) setCart(cartJson.data);
      } catch { /* ignore */ }
      setAuthChecked(true);
      setLoading(false);
    }
    checkAuthAndCart();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitStatus("loading");
    setSubmitError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: form,
          shippingMethod: "standard",
          discountCode: discountCode || undefined,
          notes: notes || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setSubmitError(json.error?.message ?? "Errore durante il checkout. Riprova.");
        setSubmitStatus("error");
        return;
      }

      setOrderNumber(json.data.orderNumber);
      if (json.data.checkoutUrl) {
        setCheckoutUrl(json.data.checkoutUrl);
        setRedirecting(true);
        setTimeout(() => {
          window.location.href = json.data.checkoutUrl;
        }, 2000);
      } else {
        setSubmitStatus("success");
      }
    } catch {
      setSubmitError("Errore di connessione. Riprova.");
      setSubmitStatus("error");
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
          <h1 className="mb-2 font-display text-[var(--text-3xl)] font-semibold">
            Ordine confermato!
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            Il tuo ordine <span className="font-semibold text-[var(--color-text)]">{orderNumber}</span> è stato creato con successo.
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-8 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)]"
          >
            Torna alla homepage
          </Link>
        </div>
      </div>
    );
  }

  if (redirecting && checkoutUrl) {
    return (
      <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)] py-[var(--section-padding-y)]">
        <div className="mx-auto max-w-lg text-center">
          <Loader2 className="mx-auto mb-6 h-8 w-8 animate-spin text-[var(--color-primary)]" />
          <h1 className="mb-2 font-display text-[var(--text-2xl)] font-semibold">
            Reindirizzamento al pagamento...
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Verrai redirected alla pagina di pagamento sicuro.
          </p>
        </div>
      </div>
    );
  }

  const shippingCost = cart.subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = cart.subtotal + shippingCost;

  return (
    <>
      {/* Header */}
      <section className="bg-[var(--color-surface)] py-[var(--section-padding-y)]">
        <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
          <m.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <nav className="mb-4 text-sm text-[var(--color-text-muted)]" aria-label="Breadcrumb">
              <Link to="/" className="hover:text-[var(--color-primary)]">Home</Link>
              <span className="mx-2">/</span>
              <Link to="/carrello" className="hover:text-[var(--color-primary)]">Carrello</Link>
              <span className="mx-2">/</span>
              <span className="text-[var(--color-text)]">Checkout</span>
            </nav>
            <h1 className="font-display text-[var(--text-4xl)] font-semibold tracking-tight md:text-[var(--text-5xl)]">
              Checkout
            </h1>
          </m.div>
        </div>
      </section>

      {/* Checkout form */}
      <section className="bg-[var(--color-background)] py-[var(--section-padding-y)]">
        <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px] lg:gap-16">
              {/* Left — Shipping form */}
              <m.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              >
                <div className="flex items-center gap-2 mb-6">
                  <Truck className="h-5 w-5 text-[var(--color-primary)]" />
                  <h2 className="font-display text-[var(--text-2xl)] font-semibold">Indirizzo di spedizione</h2>
                </div>
                <hr className="stitch-divider stitch-divider--left mb-6" />

                {submitError && (
                  <div className="mb-6 rounded-md border border-[var(--color-destructive)]/20 bg-[var(--color-destructive)]/5 p-4">
                    <p className="text-sm text-[var(--color-destructive)]">{submitError}</p>
                  </div>
                )}

                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="checkout-firstName" className={LABEL_CLASS}>Nome</label>
                      <input
                        id="checkout-firstName"
                        type="text"
                        required
                        placeholder="Mario"
                        autoComplete="given-name"
                        value={form.firstName}
                        onChange={(e) => updateField("firstName", e.target.value)}
                        className={`${INPUT_CLASS} ${errors.firstName ? "border-[var(--color-destructive)]" : ""}`}
                      />
                      {errors.firstName && <p className="text-xs text-[var(--color-destructive)]">{errors.firstName}</p>}
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="checkout-lastName" className={LABEL_CLASS}>Cognome</label>
                      <input
                        id="checkout-lastName"
                        type="text"
                        required
                        placeholder="Rossi"
                        autoComplete="family-name"
                        value={form.lastName}
                        onChange={(e) => updateField("lastName", e.target.value)}
                        className={`${INPUT_CLASS} ${errors.lastName ? "border-[var(--color-destructive)]" : ""}`}
                      />
                      {errors.lastName && <p className="text-xs text-[var(--color-destructive)]">{errors.lastName}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="checkout-address1" className={LABEL_CLASS}>Indirizzo</label>
                    <input
                      id="checkout-address1"
                      type="text"
                      required
                      placeholder="Via Roma, 1"
                      autoComplete="address-line1"
                      value={form.address1}
                      onChange={(e) => updateField("address1", e.target.value)}
                      className={`${INPUT_CLASS} ${errors.address1 ? "border-[var(--color-destructive)]" : ""}`}
                    />
                    {errors.address1 && <p className="text-xs text-[var(--color-destructive)]">{errors.address1}</p>}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="checkout-address2" className={LABEL_CLASS}>
                      Indirizzo 2 <span className="font-normal text-[var(--color-text-muted)]">(opzionale)</span>
                    </label>
                    <input
                      id="checkout-address2"
                      type="text"
                      placeholder="Appartamento, interno..."
                      autoComplete="address-line2"
                      value={form.address2}
                      onChange={(e) => updateField("address2", e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <div className="sm:col-span-2 space-y-2">
                      <label htmlFor="checkout-city" className={LABEL_CLASS}>Città</label>
                      <input
                        id="checkout-city"
                        type="text"
                        required
                        placeholder="Napoli"
                        autoComplete="address-level2"
                        value={form.city}
                        onChange={(e) => updateField("city", e.target.value)}
                        className={`${INPUT_CLASS} ${errors.city ? "border-[var(--color-destructive)]" : ""}`}
                      />
                      {errors.city && <p className="text-xs text-[var(--color-destructive)]">{errors.city}</p>}
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="checkout-province" className={LABEL_CLASS}>Provincia</label>
                      <input
                        id="checkout-province"
                        type="text"
                        required
                        placeholder="NA"
                        maxLength={2}
                        autoComplete="address-level1"
                        value={form.province}
                        onChange={(e) => updateField("province", e.target.value.toUpperCase())}
                        className={`${INPUT_CLASS} ${errors.province ? "border-[var(--color-destructive)]" : ""}`}
                      />
                      {errors.province && <p className="text-xs text-[var(--color-destructive)]">{errors.province}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="checkout-postalCode" className={LABEL_CLASS}>CAP</label>
                      <input
                        id="checkout-postalCode"
                        type="text"
                        required
                        placeholder="80132"
                        maxLength={5}
                        autoComplete="postal-code"
                        value={form.postalCode}
                        onChange={(e) => updateField("postalCode", e.target.value.replace(/\D/g, ""))}
                        className={`${INPUT_CLASS} ${errors.postalCode ? "border-[var(--color-destructive)]" : ""}`}
                      />
                      {errors.postalCode && <p className="text-xs text-[var(--color-destructive)]">{errors.postalCode}</p>}
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="checkout-phone" className={LABEL_CLASS}>
                        Telefono <span className="font-normal text-[var(--color-text-muted)]">(opzionale)</span>
                      </label>
                      <input
                        id="checkout-phone"
                        type="tel"
                        placeholder="+39 333 XXX XXXX"
                        autoComplete="tel"
                        value={form.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>

                  {/* Discount code */}
                  <div className="space-y-2">
                    <label htmlFor="checkout-discount" className={LABEL_CLASS}>Codice sconto</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                        <input
                          id="checkout-discount"
                          type="text"
                          placeholder="Inserisci il codice"
                          value={discountCode}
                          onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                          className={`${INPUT_CLASS} pl-10`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (discountCode) {
                            /* Discount code applied on submit */
                          }
                        }}
                        className="h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-muted)]"
                      >
                        Applica
                      </button>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <label htmlFor="checkout-notes" className={LABEL_CLASS}>
                      Note <span className="font-normal text-[var(--color-text-muted)]">(opzionale)</span>
                    </label>
                    <textarea
                      id="checkout-notes"
                      rows={3}
                      placeholder="Note per la spedizione..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] transition-colors focus:border-[var(--color-primary)] focus:outline-none"
                    />
                  </div>
                </div>
              </m.div>

              {/* Right — Order summary */}
              <div className="lg:sticky lg:top-24">
                <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                  <h2 className="font-display text-[var(--text-lg)] font-semibold">Riepilogo ordine</h2>
                  <hr className="stitch-divider stitch-divider--left my-4" />

                  {/* Items */}
                  <div className="space-y-3">
                    {cart.items.map((item) => (
                      <div key={item.id} className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-muted)]">
                            <ShoppingBag className="h-5 w-5 text-[var(--color-text-muted)]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium leading-snug text-[var(--color-text)] truncate">
                              {item.product.name}
                            </p>
                            {item.variant && (
                              <p className="text-xs text-[var(--color-text-muted)]">
                                {[item.variant.color, item.variant.size].filter(Boolean).join(" / ")} · x{item.quantity}
                              </p>
                            )}
                            {!item.variant && (
                              <p className="text-xs text-[var(--color-text-muted)]">x{item.quantity}</p>
                            )}
                          </div>
                        </div>
                        <span className="shrink-0 text-sm font-medium text-[var(--color-text)]">
                          €{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <hr className="my-4 border-[var(--color-border)]" />

                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--color-text-secondary)]">Subtotale</span>
                      <span className="font-medium">€{cart.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--color-text-secondary)]">Spedizione</span>
                      {shippingCost === 0 ? (
                        <span className="font-medium text-green-600">Gratis</span>
                      ) : (
                        <span className="font-medium">€{shippingCost.toFixed(2)}</span>
                      )}
                    </div>
                    <hr className="border-[var(--color-border)]" />
                    <div className="flex justify-between">
                      <span className="font-display text-[var(--text-lg)] font-semibold">Totale</span>
                      <span className="font-display text-[var(--text-lg)] font-semibold text-[var(--color-primary)]">
                        €{total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitStatus === "loading"}
                    className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-6 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitStatus === "loading" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" />
                    )}
                    Conferma e paga
                  </button>

                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[var(--color-text-muted)]">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Pagamento sicuro con Stripe</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
