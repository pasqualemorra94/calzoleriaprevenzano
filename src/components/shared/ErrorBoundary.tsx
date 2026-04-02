import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Reusable Error Boundary — wraps any route or component subtree.
 * Displays a styled error page consistent with the design system.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[ErrorBoundary]", error, errorInfo.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <main className="flex min-h-screen flex-col items-center justify-center px-4 bg-[var(--color-background)]">
          <div className="text-center max-w-lg">
            <p className="text-6xl mb-6 text-[var(--color-primary)]">
              ⚠
            </p>
            <h1 className="text-2xl font-display font-semibold text-[var(--color-text)] mb-4">
              Qualcosa è andato storto
            </h1>
            <p className="text-[var(--color-text-secondary)] mb-8 leading-relaxed">
              Si è verificato un errore imprevisto.
              Riprova o contattaci se il problema persiste.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-md bg-[var(--color-primary)] px-6 py-3 text-sm font-medium text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)]"
              >
                Torna alla homepage
              </a>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="inline-flex items-center justify-center rounded-md border border-[var(--color-border)] px-6 py-3 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-muted)]"
              >
                Ricarica la pagina
              </button>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
