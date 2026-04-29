import { useEffect, useRef, useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { cn } from "~/lib/utils/cn";

type TypeConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  /** Stringa che l'utente deve digitare letteralmente per abilitare la conferma. */
  confirmText: string;
  confirmLabel?: string;
  danger?: boolean;
  isLoading?: boolean;
};

/**
 * Dialog di conferma con typing-gate per azioni distruttive irreversibili.
 * Mirror del pattern handcrafted di ConfirmDialog (no Radix), aggiunge input
 * + check trim() === confirmText sul bottone di conferma.
 */
export function TypeConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  confirmLabel = "Elimina definitivamente",
  danger = true,
  isLoading = false,
}: TypeConfirmDialogProps) {
  const [typed, setTyped] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset typed + auto-focus su open
  useEffect(() => {
    if (open) {
      setTyped("");
      // microtask per garantire che l'input sia montato
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Esc chiude
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const matches = typed.trim() === confirmText;
  const canConfirm = matches && !isLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl mx-4">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label="Chiudi"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex gap-3">
          {danger && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-600 leading-relaxed">{message}</p>
            <p className="mt-3 text-xs text-gray-500">
              Per confermare digita{" "}
              <span className="font-mono font-semibold text-gray-900">{confirmText}</span>
            </p>
            <input
              ref={inputRef}
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="mt-2 w-full h-9 rounded-md border border-gray-300 px-3 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-md border border-gray-300 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Annulla
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            className={cn(
              "inline-flex h-9 items-center rounded-md px-4 text-sm font-medium transition-colors",
              canConfirm
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-red-300 text-white cursor-not-allowed",
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
