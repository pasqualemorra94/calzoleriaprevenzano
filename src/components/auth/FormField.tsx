"use client";

import type { ReactNode } from "react";

interface FormFieldProps {
  id: string;
  label: string;
  type: string;
  placeholder?: string;
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  errors: (string | undefined)[];
  children?: ReactNode;
}

const inputBaseClass =
  "block w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2.5 text-sm text-[var(--color-text)] transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]";

/**
 * Reusable form field with label, input, and error display.
 * Extracted from RegisterForm to reduce LOC and enable reuse across auth forms.
 */
export function FormField({
  id,
  label,
  type,
  placeholder,
  autoComplete,
  value,
  onChange,
  onBlur,
  errors,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-[var(--color-text)]">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={errors.length > 0}
          className={children ? `${inputBaseClass} pr-10` : inputBaseClass}
          placeholder={placeholder}
        />
        {children}
      </div>
      {errors.length > 0 && errors[0] && (
        <p className="text-xs text-[var(--color-destructive)]">{errors[0]}</p>
      )}
    </div>
  );
}
