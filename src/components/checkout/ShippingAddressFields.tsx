import type { ReactNode } from "react";

/**
 * Blocco campi indirizzo di spedizione del checkout, con selettore paese
 * binario Italia / Altro paese (estero).
 *
 * - Italia: comportamento storico (Provincia 2 char uppercase, CAP 5 cifre).
 * - Estero: campo Nazione obbligatorio, Provincia/Regione e Codice postale
 *   in forma libera (nessun maxLength né trasformazione IT).
 *
 * Componente di presentazione puro: riceve lo state e i setter dal parent
 * (`checkout.tsx`). NON importa nulla da `*.server.ts` (import boundary).
 */

const INPUT_CLASS =
  "h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] transition-colors focus:border-[var(--color-primary)] focus:outline-none";
const LABEL_CLASS = "block text-sm font-medium text-[var(--color-text)]";

export interface ShippingFormState {
  email: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  phone: string;
}

interface ShippingAddressFieldsProps {
  form: ShippingFormState;
  errors: Record<string, string>;
  isEstero: boolean;
  onCountryModeChange: (isEstero: boolean) => void;
  updateField: (field: keyof ShippingFormState, value: string) => void;
}

export function ShippingAddressFields({
  form,
  errors,
  isEstero,
  onCountryModeChange,
  updateField,
}: ShippingAddressFieldsProps): ReactNode {
  return (
    <div className="space-y-5">
      <FormInput
        id="checkout-email"
        label="Email"
        type="email"
        required
        placeholder="mario@esempio.it"
        autoComplete="email"
        value={form.email}
        error={errors.email}
        onChange={(e) => updateField("email", e.target.value)}
      />

      <fieldset className="space-y-2">
        <legend className={LABEL_CLASS}>Paese di spedizione</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <CountryOption
            id="checkout-country-it"
            label="Italia"
            checked={!isEstero}
            onSelect={() => onCountryModeChange(false)}
          />
          <CountryOption
            id="checkout-country-estero"
            label="Altro paese (estero)"
            checked={isEstero}
            onSelect={() => onCountryModeChange(true)}
          />
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormInput
          id="checkout-firstName"
          label="Nome"
          type="text"
          required
          placeholder="Mario"
          autoComplete="given-name"
          value={form.firstName}
          error={errors.firstName}
          onChange={(e) => updateField("firstName", e.target.value)}
        />
        <FormInput
          id="checkout-lastName"
          label="Cognome"
          type="text"
          required
          placeholder="Rossi"
          autoComplete="family-name"
          value={form.lastName}
          error={errors.lastName}
          onChange={(e) => updateField("lastName", e.target.value)}
        />
      </div>

      <FormInput
        id="checkout-address1"
        label="Indirizzo"
        type="text"
        required
        placeholder="Via Roma, 1"
        autoComplete="address-line1"
        value={form.address1}
        error={errors.address1}
        onChange={(e) => updateField("address1", e.target.value)}
      />
      <FormInput
        id="checkout-address2"
        label="Indirizzo 2"
        type="text"
        placeholder="Appartamento, interno..."
        optional
        autoComplete="address-line2"
        value={form.address2}
        onChange={(e) => updateField("address2", e.target.value)}
      />

      {isEstero && (
        <FormInput
          id="checkout-country"
          label="Nazione"
          type="text"
          required
          placeholder="Es. Francia"
          autoComplete="country-name"
          value={form.country}
          error={errors.country}
          onChange={(e) => updateField("country", e.target.value)}
        />
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="sm:col-span-2 space-y-2">
          <FormInput
            id="checkout-city"
            label="Città"
            type="text"
            required
            placeholder="Napoli"
            autoComplete="address-level2"
            value={form.city}
            error={errors.city}
            onChange={(e) => updateField("city", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <FormInput
            id="checkout-province"
            label={isEstero ? "Provincia/Regione" : "Provincia"}
            type="text"
            required={!isEstero}
            optional={isEstero}
            placeholder={isEstero ? "Regione" : "NA"}
            maxLength={isEstero ? undefined : 2}
            autoComplete="address-level1"
            value={form.province}
            error={errors.province}
            onChange={(e) =>
              updateField(
                "province",
                isEstero ? e.target.value : e.target.value.toUpperCase(),
              )
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormInput
          id="checkout-postalCode"
          label={isEstero ? "Codice postale" : "CAP"}
          type="text"
          required={!isEstero}
          optional={isEstero}
          placeholder={isEstero ? "Codice postale" : "80132"}
          maxLength={isEstero ? undefined : 5}
          autoComplete="postal-code"
          value={form.postalCode}
          error={errors.postalCode}
          onChange={(e) =>
            updateField(
              "postalCode",
              isEstero ? e.target.value : e.target.value.replace(/\D/g, ""),
            )
          }
        />
        <FormInput
          id="checkout-phone"
          label="Telefono"
          type="tel"
          placeholder="+39 333 XXX XXXX"
          optional
          autoComplete="tel"
          value={form.phone}
          onChange={(e) => updateField("phone", e.target.value)}
        />
      </div>
    </div>
  );
}

function CountryOption({
  id,
  label,
  checked,
  onSelect,
}: {
  id: string;
  label: string;
  checked: boolean;
  onSelect: () => void;
}): ReactNode {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-sm transition-colors ${
        checked
          ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-text)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]"
      }`}
    >
      <input
        id={id}
        type="radio"
        name="checkout-country-mode"
        checked={checked}
        onChange={onSelect}
        className="h-4 w-4 cursor-pointer accent-[var(--color-primary)]"
      />
      <span className="font-medium">{label}</span>
    </label>
  );
}

function FormInput({
  id,
  label,
  type,
  required,
  placeholder,
  autoComplete,
  optional,
  maxLength,
  value,
  error,
  onChange,
}: {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  optional?: boolean;
  maxLength?: number;
  value: string;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}): ReactNode {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}{" "}
        {optional && (
          <span className="font-normal text-[var(--color-text-muted)]">
            (opzionale)
          </span>
        )}
      </label>
      <input
        id={id}
        type={type ?? "text"}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        value={value}
        onChange={onChange}
        className={`${INPUT_CLASS} ${error ? "border-[var(--color-destructive)]" : ""}`}
      />
      {error && <p className="text-xs text-[var(--color-destructive)]">{error}</p>}
    </div>
  );
}
