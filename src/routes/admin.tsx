import { createFileRoute, Link, Outlet, useMatchRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect, type ReactNode } from "react";
import { Menu, X, LayoutDashboard, Package, ShoppingCart, Layers, ExternalLink, ImageIcon, LogOut, Sparkles } from "lucide-react";
import { cn } from "~/lib/utils/cn";
import { $signOut } from "~/lib/auth-functions";

// ── Server-side auth guard ──
async function adminGuard() {
  const { $getUser } = await import("~/lib/auth-functions");
  const user = await $getUser();
  if (!user || user.role !== "admin") {
    throw redirect({ to: "/auth/login" });
  }
  return user;
}

export const Route = createFileRoute("/admin")({
  beforeLoad: adminGuard,
  component: AdminLayout,
});

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, matchPath: "/admin" as const, exact: true },
  { label: "Prodotti", href: "/admin/prodotti", icon: Package, matchPath: "/admin/prodotti" as const },
  { label: "Media", href: "/admin/media", icon: ImageIcon, matchPath: "/admin/media" as const },
  { label: "Variant templates", href: "/admin/variant-templates", icon: Layers, matchPath: "/admin/variant-templates" as const },
  { label: "Ordini", href: "/admin/ordini", icon: ShoppingCart, matchPath: "/admin/ordini" as const },
  { label: "AI Advisor", href: "/admin/ai-advisor", icon: Sparkles, matchPath: "/admin/ai-advisor" as const },
] as const;

function AdminLayout(): ReactNode {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const matchRoute = useMatchRoute();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  const handleLogout = async () => {
    await $signOut();
    window.location.href = "/auth/login";
  };

  const isActive = (matchPath: string, exact?: boolean) => {
    if (exact) {
      return matchRoute({ to: matchPath }) !== false;
    }
    return matchRoute({ to: matchPath }) !== false;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-surface)]">
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 lg:hidden",
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gray-900 text-gray-100 transition-transform duration-200 ease-out lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Menu di navigazione admin"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-800 px-6">
          <Link to="/admin" className="text-sm font-medium tracking-tight text-white">
            <span className="text-[var(--color-primary-light)]">Prevenzano</span>
            {" "}Admin
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white lg:hidden"
            aria-label="Chiudi menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <span className="px-3 text-[11px] font-medium tracking-wider text-gray-400">Navigazione</span>
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
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-[var(--color-primary)] text-white shadow-sm"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="shrink-0 border-t border-gray-700 p-3 space-y-1">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Logout
          </button>
          <Link
            to="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
          >
            <ExternalLink className="h-5 w-5 shrink-0" />
            Torna al sito
          </Link>
          <div className="px-3 py-2">
            <p className="text-[10px] text-gray-500">Calzoleria Prevenzano v1.0</p>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 lg:hidden"
            aria-label="Apri menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden lg:block">
            <span className="text-xs font-medium tracking-wider text-gray-500">Pannello di amministrazione</span>
          </div>

          <div className="flex-1" />

          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 sm:inline-flex"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-xs font-semibold text-[var(--color-primary)]">
              P
            </div>
            Vai al sito
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
