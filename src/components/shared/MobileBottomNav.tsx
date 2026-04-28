"use client";

import { Link, useRouterState } from "@tanstack/react-router";
import { Home, ShoppingBag, Search, User } from "lucide-react";
import { cn } from "~/lib/utils/cn";
import type { ReactNode } from "react";

type LinkItem = {
  kind: "link";
  label: string;
  to: "/" | "/carrello" | "/account";
  icon: typeof Home;
  matchPath: "/" | "/carrello" | "/account";
  exact?: boolean;
};

type ActionItem = {
  kind: "action";
  label: string;
  icon: typeof Search;
  action: "open-search";
};

type NavItem = LinkItem | ActionItem;

const NAV_ITEMS: NavItem[] = [
  { kind: "link", label: "Home", to: "/", icon: Home, matchPath: "/", exact: true },
  { kind: "action", label: "Cerca", icon: Search, action: "open-search" },
  { kind: "link", label: "Carrello", to: "/carrello", icon: ShoppingBag, matchPath: "/carrello" },
  { kind: "link", label: "Account", to: "/account", icon: User, matchPath: "/account" },
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

  const openSearch = () => {
    window.dispatchEvent(new CustomEvent("open-mobile-search"));
  };

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

          if (item.kind === "action") {
            return (
              <button
                key={item.label}
                type="button"
                onClick={openSearch}
                className="flex flex-1 flex-col items-center gap-0.5 py-2 pt-3 text-center text-[var(--color-text-muted)] transition-colors duration-200 active:text-[var(--color-primary)]"
                aria-label="Apri ricerca"
              >
                <Icon className="h-5 w-5" strokeWidth={1.5} />
                <span className="text-[10px] font-medium leading-tight">
                  {item.label}
                </span>
              </button>
            );
          }

          const isActive = item.exact
            ? pathname === item.matchPath
            : pathname.startsWith(item.matchPath);
          const isCartActive = item.matchPath === "/carrello";
          const isActiveFinal = isCartActive ? pathname === "/carrello" : isActive;

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
