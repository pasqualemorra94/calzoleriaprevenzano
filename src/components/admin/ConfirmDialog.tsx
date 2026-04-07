import { useEffect, useRef } from "react";
import { X, AlertTriangle } from "lucide-react";
import { cn } from "~/lib/utils/cn";

type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title = "Conferma",
  message,
  confirmLabel = "Conferma",
  cancelLabel = "Annulla",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  useEffect(() => {
    if (open) {
      dialogRef.current?.focus();
    }
  }, [open]);

  if (!open) return null;

  const isDanger = variant === "danger";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl mx-4"
      >
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex gap-3">
          {isDanger && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-600 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className={cn(
              "inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium transition-colors",
              "border-gray-300 text-gray-700 hover:bg-gray-50",
            )}
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onCancel();
              onConfirm();
            }}
            className={cn(
              "inline-flex h-9 items-center rounded-md px-4 text-sm font-medium transition-colors",
              isDanger
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]",
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
