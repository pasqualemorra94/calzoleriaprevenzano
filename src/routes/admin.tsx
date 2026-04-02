import { createFileRoute, Link, Outlet, useMatchRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu, X, LayoutDashboard, Package, ShoppingCart, LogOut } from "lucide-react";
import { cn } from "~/lib/utils/cn";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, matchPath: "/admin" as const },
  { label: "Prodotti", href: "/admin/prodotti", icon: Package, matchPath: "/admin/prodotti" as const },
  { label: "Ordini", href: "/admin/ordini", icon: ShoppingCart, matchPath: "/admin/ordini" as const },
] as const;

function AdminLayout(): ReactNode {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const matchRoute = useMatchRoute();

  const isActive = (matchPath: string) => {
    if (matchPath === "/admin") {
      return matchRoute({ to: "/admin" }) !== false;
    }
    return matchRoute({ to: matchPath }) !== false;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-surface)]">
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 lg:hidden",
          !sidebarOpen && "hidden",
        )}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gray-900 text-gray-100 transition-transform duration-200 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between px-6">
          <Link to="/admin" className="text-lg font-semibold tracking-tight text-white">
            Prevenzano Admin
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.matchPath);
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-[var(--color-primary)] text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-700 p-3">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Torna al sito
          </Link>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-4 shadow-sm lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1" />

          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700">
              A
            </div>
            <span className="hidden sm:inline">Esci</span>
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
