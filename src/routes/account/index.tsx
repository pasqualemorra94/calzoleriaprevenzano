import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { ShoppingCart, Heart, ChevronRight, Loader2 } from "lucide-react";
import { m } from "motion/react";
import { cn } from "~/lib/utils/cn";

interface UserData {
  name: string;
  email: string;
  role: string;
}

interface OrderPreview {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
}

interface DashboardStats {
  totalOrders: number;
  wishlistCount: number;
  recentOrders: OrderPreview[];
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: "In attesa", className: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confermato", className: "bg-blue-100 text-blue-800" },
  processing: { label: "In lavorazione", className: "bg-indigo-100 text-indigo-800" },
  shipped: { label: "Spedito", className: "bg-green-100 text-green-800" },
  delivered: { label: "Consegnato", className: "bg-emerald-100 text-emerald-800" },
  cancelled: { label: "Annullato", className: "bg-red-100 text-red-800" },
  refunded: { label: "Rimborsato", className: "bg-gray-100 text-gray-800" },
};

export const Route = createFileRoute("/account/")({
  component: AccountDashboard,
});

function AccountDashboard() {
  const [user, setUser] = useState<UserData | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/get-session");
      if (res.ok) {
        const json = await res.json();
        if (json.data?.user) {
          setUser({
            name: json.data.user.name ?? "",
            email: json.data.user.email,
            role: json.data.user.role ?? "user",
          });
        }
      }
    } catch { /* ignore */ }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const [ordersRes, wishlistRes] = await Promise.all([
        fetch("/api/orders?perPage=5"),
        fetch("/api/wishlist"),
      ]);
      const ordersJson = await ordersRes.json();
      const wishlistJson = await wishlistRes.json();

      const orders = ordersRes.ok ? ordersJson.data.items : [];
      const wishlist = wishlistRes.ok ? wishlistJson.data : [];

      setStats({
        totalOrders: ordersRes.ok ? ordersJson.data.total : 0,
        wishlistCount: wishlist.length,
        recentOrders: orders,
      });
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUser();
    fetchStats();
  }, [fetchUser, fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-[var(--color-text)]">
          Bentornato{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Gestisci i tuoi ordini, wishlist e impostazioni account.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-8">
        <Link
          to="/account/ordini"
          className="group flex items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/5"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-text)]">{stats?.totalOrders ?? 0} ordini</p>
            <p className="text-xs text-[var(--color-text-muted)]">Vai allo storico ordini</p>
          </div>
          <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)] transition-transform group-hover:translate-x-0.5" />
        </Link>

        <Link
          to="/account/wishlist"
          className="group flex items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/5"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-500">
            <Heart className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-text)]">{stats?.wishlistCount ?? 0} preferiti</p>
            <p className="text-xs text-[var(--color-text-muted)]">Vai alla wishlist</p>
          </div>
          <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)] transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Recent orders */}
      {stats && stats.recentOrders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-[var(--color-text)]">Ordini recenti</h2>
            <Link
              to="/account/ordini"
              className="text-sm font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-dark)]"
            >
              Vedi tutti
            </Link>
          </div>

          <div className="space-y-3">
            {stats.recentOrders.map((order) => {
              const status = STATUS_LABELS[order.status] ?? { label: order.status, className: "bg-gray-100 text-gray-800" };
              return (
                <Link
                  key={order.id}
                  to="/account/ordini/$orderId"
                  params={{ orderId: order.id }}
                  className="group flex items-center justify-between rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 transition-colors hover:border-[var(--color-primary)]/20"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                        #{order.orderNumber}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {new Date(order.createdAt).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold", status.className)}>
                      {status.label}
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-[var(--color-text)]">
                      €{order.total.toFixed(2)}
                    </span>
                    <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {stats && stats.recentOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] py-16 text-center">
          <ShoppingCart className="h-10 w-10 text-[var(--color-text-muted)] mb-4" />
          <h3 className="font-display text-lg font-semibold text-[var(--color-text)] mb-2">Nessun ordine</h3>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mb-6">
            Non hai ancora effettuato nessun ordine. Esplora il nostro catalogo per trovare i sandali perfetti per te.
          </p>
          <Link
            to="/catalogo"
            className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-6 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)]"
          >
            Esplora il catalogo
          </Link>
        </div>
      )}
    </m.div>
  );
}


