import { createFileRoute, Link, Outlet, useMatchRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect, type ReactNode } from "react";
import { Menu, X, LayoutDashboard, ShoppingCart, Heart, MapPin, User, KeyRound, LogOut, ExternalLink } from "lucide-react";
import { cn } from "~/lib/utils/cn";
import { $signOut } from "~/lib/auth-functions";

// ── Server-side auth guard ──
async function userGuard() {
  const { $getUser } = await import("~/lib/auth-functions");
  const user = await $getUser();
  if (!user) {
    throw redirect({ to: "/auth/login" });
  }
  return user;
}

export const Route = createFileRoute("/account")({
  beforeLoad: userGuard,
  component: AccountLayout,
});

const NAV_ITEMS = [
  { label: "Riepilogo", href: "/account", icon: LayoutDashboard, matchPath: "/account" as const, exact: true },
  { label: "Ordini", href: "/account/ordini", icon: ShoppingCart, matchPath: "/account/ordini" as const },
  { label: "Wishlist", href: "/account/wishlist", icon: Heart, matchPath: "/account/wishlist" as const },
  { label: "Indirizzi", href: "/account/indirizzi", icon: MapPin, matchPath: "/account/indirizzi" as const },
  { label: "Profilo", href: "/account/profilo", icon: User, matchPath: "/account/profilo" as const },
  { label: "Password", href: "/account/password", icon: KeyRound, matchPath: "/account/password" as const },
] as const;

function AccountLayout(): ReactNode {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const matchRoute = useMatchRoute();

  // Close sidebar on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Lock body scroll when sidebar is open (mobile)
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  const isActive = (matchPath: string, exact?: boolean) => {
    if (exact) {
      return matchRoute({ to: matchPath }) !== false;
    }
    return matchRoute({ to: matchPath }) !== false;
  };

  const handleLogout = async () => {
    await $signOut();
    window.location.href = "/";
  };

  return (
    <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)] py-8 md:py-12">
      {/* Mobile header */}
      <div className="flex items-center gap-3 mb-6 lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-muted)]"
          aria-label="Apri menu account"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="font-display text-xl font-semibold text-[var(--color-text)]">Il mio account</h1>
      </div>

      <div className="flex gap-8">
        {/* Mobile overlay */}
        <div
          className={cn(
            "fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 lg:hidden",
            sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0",
          )}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />

        {/* Sidebar */}
        <aside
          className={cn(
            "flex-col lg:static lg:flex lg:w-56 lg:shrink-0 lg:shadow-none lg:border-r lg:border-[var(--color-border-light)]",
            sidebarOpen
              ? "fixed inset-y-0 left-0 z-50 flex w-72 bg-[var(--color-surface)] shadow-xl"
              : "hidden",
          )}
          aria-label="Menu account"
        >
          {/* Mobile sidebar header */}
          <div className="flex items-center justify-between border-b border-[var(--color-border-light)] px-5 py-4 lg:hidden">
            <Link to="/" className="text-sm font-display font-semibold text-[var(--color-primary)]">
              Calzoleria Prevenzano
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-md p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-text)]"
              aria-label="Chiudi menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Desktop sidebar header */}
          <div className="hidden lg:block px-5 pt-6 pb-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
              Il mio account
            </span>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 lg:px-3 lg:py-2">
            <div className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.matchPath, "exact" in item ? item.exact : undefined);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                      active
                        ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                        : "text-[var(--color-text-secondary)] hover:bg-[var(--color-muted)] hover:text-[var(--color-text)]",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2 : 1.5} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Sidebar footer */}
          <div className="shrink-0 border-t border-[var(--color-border-light)] p-3 space-y-1">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-text)]"
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
              Logout
            </button>
            <Link
              to="/"
              className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-text-secondary)]"
            >
              <ExternalLink className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
              Torna al negozio
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
