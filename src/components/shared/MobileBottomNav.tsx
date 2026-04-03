"use client";

import { Link, useRouterState } from "@tanstack/react-router";
import { Home, ShoppingBag, Search, User, Store } from "lucide-react";
import { cn } from "~/lib/utils/cn";
import type { ReactNode } from "react";

const NAV_ITEMS = [
  { label: "Home", to: "/", icon: Home, matchPath: "/" as const, exact: true },
  { label: "Catalogo", to: "/catalogo", icon: Store, matchPath: "/catalogo" as const },
  { label: "Cerca", to: "/catalogo", icon: Search, matchPath: "/sandali" as const, exact: true },
  { label: "Carrello", to: "/carrello", icon: ShoppingBag, matchPath: "/carrello" as const },
  { label: "Account", to: "/auth/login", icon: User, matchPath: "/auth" as const },
];

/**
 * Mobile bottom navigation — app-style fixed bar visible only on mobile.
 * Uses glassmorphism, golden accent (🧬 DNA), and route-aware active states.
 * Hidden when on /admin/* routes.
 */
export function MobileBottomNav({ cartCount = 0 }: { cartCount?: number }): ReactNode {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) return null;

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-[var(--z-navbar)]",
        "flex md:hidden",
        "border-t border-[var(--color-border)]",
        "bg-[var(--color-background)]/85 backdrop-blur-xl",
      )}
      aria-label="Menu di navigazione"
    >
      {/* 🧬 DNA: Golden stitch line on top */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-center">
        <span className="h-[var(--stitch-width)] w-[60px] bg-[var(--stitch-color)]/40" />
      </div>

      <div className="flex w-full items-stretch">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.matchPath
            : pathname.startsWith(item.matchPath);

          // Special case: Catalogo and Cerca both match /catalogo — differentiate via icon
          const isCatalogoActive = item.matchPath === "/catalogo" && pathname === "/catalogo";
          const isCartActive = item.matchPath === "/carrello";
          const isActiveFinal = isCatalogoActive || (isCartActive ? pathname === "/carrello" : isActive);

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 pt-3 text-center transition-colors duration-200",
                isActiveFinal
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-text-muted)]",
              )}
              aria-current={isActiveFinal ? "page" : undefined}
            >
              <div className="relative">
                <Icon className="h-5 w-5" strokeWidth={isActiveFinal ? 2 : 1.5} />
                {isCartActive && cartCount > 0 && (
                  <span
                    className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-primary)] text-[9px] font-bold text-white"
                  >
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] leading-tight font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Safe area for iPhone notch/home indicator */}
      <div className="h-[env(safe-area-inset-bottom)] bg-[var(--color-background)]" />
    </nav>
  );
}
