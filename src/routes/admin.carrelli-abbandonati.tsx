import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Loader2, Eye, ShoppingBag, Euro, Users } from "lucide-react";
import {
  $listAbandonedCarts,
  $getAbandonedCartsStats,
} from "~/lib/admin-functions";
import type {
  AbandonedCartListItem,
  ThresholdRange,
  UserFilter,
} from "~/lib/admin-functions";

const THRESHOLD_OPTIONS: Array<{ value: ThresholdRange; label: string }> = [
  { value: "1h", label: "Oltre 1 ora" },
  { value: "24h", label: "Oltre 24 ore" },
  { value: "7gg", label: "Oltre 7 giorni" },
  { value: "30gg", label: "Oltre 30 giorni" },
];

const USER_FILTER_OPTIONS: Array<{ value: UserFilter; label: string }> = [
  { value: "all", label: "Tutti gli utenti" },
  { value: "logged", label: "Solo loggati" },
  { value: "guest", label: "Solo ospiti" },
];

const THRESHOLD_VALUES: ReadonlyArray<ThresholdRange> = ["1h", "24h", "7gg", "30gg"];
const USER_FILTER_VALUES: ReadonlyArray<UserFilter> = ["all", "logged", "guest"];

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 60) return `${diffMin} min fa`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH} h fa`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 30) return `${diffD} gg fa`;
  return date.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatAbsolute(iso: string): string {
  return new Date(iso).toLocaleString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface RouteSearch {
  threshold: ThresholdRange;
  userFilter: UserFilter;
  page: number;
}

export const Route = createFileRoute("/admin/carrelli-abbandonati")({
  validateSearch: (search: Record<string, unknown>): RouteSearch => {
    const rawThreshold = search.threshold;
    const threshold: ThresholdRange =
      typeof rawThreshold === "string" &&
      (THRESHOLD_VALUES as ReadonlyArray<string>).includes(rawThreshold)
        ? (rawThreshold as ThresholdRange)
        : "1h";
    const rawUserFilter = search.userFilter;
    const userFilter: UserFilter =
      typeof rawUserFilter === "string" &&
      (USER_FILTER_VALUES as ReadonlyArray<string>).includes(rawUserFilter)
        ? (rawUserFilter as UserFilter)
        : "all";
    const rawPage = search.page;
    const page =
      typeof rawPage === "number" && Number.isFinite(rawPage) && rawPage > 0
        ? Math.floor(rawPage)
        : 1;
    return { threshold, userFilter, page };
  },
  beforeLoad: async ({ search }) => {
    const [initialList, initialStats] = await Promise.all([
      $listAbandonedCarts({
        data: {
          page: search.page,
          perPage: 20,
          threshold: search.threshold,
          userFilter: search.userFilter,
        },
      }),
      $getAbandonedCartsStats({
        data: { threshold: search.threshold, userFilter: search.userFilter },
      }),
    ]);
    return { initialList, initialStats };
  },
  component: AdminAbandonedCartsPage,
});

function AdminAbandonedCartsPage(): ReactNode {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/admin/carrelli-abbandonati") {
    return <Outlet />;
  }
  return <AdminAbandonedCartsList />;
}

function AdminAbandonedCartsList(): ReactNode {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { initialList, initialStats } = Route.useRouteContext();

  const [list, setList] = useState(initialList);
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    if (!hasMounted) {
      setHasMounted(true);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [l, s] = await Promise.all([
          $listAbandonedCarts({
            data: {
              page: search.page,
              perPage: 20,
              threshold: search.threshold,
              userFilter: search.userFilter,
            },
          }),
          $getAbandonedCartsStats({
            data: { threshold: search.threshold, userFilter: search.userFilter },
          }),
        ]);
        if (cancelled) return;
        setList(l);
        setStats(s);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Errore di caricamento");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.threshold, search.userFilter, search.page]);

  const inputClass =
    "h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]";

  const statCards: Array<{
    label: string;
    value: string;
    icon: typeof ShoppingBag;
    color: string;
  }> = [
    {
      label: "Carrelli abbandonati",
      value: String(stats.totalCount),
      icon: ShoppingBag,
      color: "bg-blue-500",
    },
    {
      label: "Valore potenziale",
      value: `€${stats.totalPotentialValue.toFixed(2)}`,
      icon: Euro,
      color: "bg-green-500",
    },
    {
      label: "Loggati / Ospiti",
      value: `${stats.loggedCount} / ${stats.guestCount}`,
      icon: Users,
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Carrelli abbandonati
          <span className="ml-1.5 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
            {stats.totalCount}
          </span>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-lg bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg ${card.color} text-white`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{card.label}</p>
                  <p className="text-lg font-bold text-gray-900">{card.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <select
          value={search.threshold}
          onChange={(e) =>
            navigate({
              search: {
                ...search,
                threshold: e.target.value as ThresholdRange,
                page: 1,
              },
            })
          }
          className={inputClass}
          aria-label="Filtra per soglia temporale"
        >
          {THRESHOLD_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={search.userFilter}
          onChange={(e) =>
            navigate({
              search: {
                ...search,
                userFilter: e.target.value as UserFilter,
                page: 1,
              },
            })
          }
          className={inputClass}
          aria-label="Filtra per tipo utente"
        >
          {USER_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-lg bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium tracking-wider text-gray-500">
                <th className="px-4 py-3">Ultima attività</th>
                <th className="px-4 py-3">Utente</th>
                <th className="px-4 py-3 text-right">Articoli</th>
                <th className="px-4 py-3 text-right">Totale</th>
                <th className="px-4 py-3">Anteprima</th>
                <th className="px-4 py-3 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-[var(--color-primary)]" />
                  </td>
                </tr>
              ) : list.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-sm text-gray-500"
                  >
                    Nessun carrello abbandonato in questa finestra
                  </td>
                </tr>
              ) : (
                list.items.map((row: AbandonedCartListItem) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      <span title={formatAbsolute(row.updatedAt)}>
                        {formatRelative(row.updatedAt)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.userId ? (
                        <>
                          <div className="text-sm font-medium text-gray-900">
                            {row.userName ?? "—"}
                          </div>
                          <div className="text-xs text-gray-500">{row.userEmail}</div>
                        </>
                      ) : (
                        <>
                          <div className="text-sm font-medium text-gray-900">
                            Ospite
                          </div>
                          <div className="font-mono text-xs text-gray-500">
                            {row.sessionId ? `${row.sessionId.slice(0, 8)}…` : "—"}
                          </div>
                        </>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">
                      {row.itemCount}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900">
                      €{row.totalValue.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className="text-gray-900">{row.firstProductName}</span>
                      {row.additionalProductsCount > 0 && (
                        <span className="text-gray-500">
                          {" "}
                          +{row.additionalProductsCount} altri
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link
                        to="/admin/carrelli-abbandonati/$id"
                        params={{ id: row.id }}
                        search={search}
                        className="inline-flex h-8 items-center gap-1 rounded-md border border-gray-300 px-2.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Apri
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {list.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <p className="text-sm text-gray-500">{list.total} carrelli</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  navigate({
                    search: { ...search, page: Math.max(1, search.page - 1) },
                  })
                }
                disabled={search.page <= 1}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Precedente
              </button>
              <span className="flex items-center px-3 text-sm text-gray-500">
                Pagina {search.page} di {list.totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  navigate({
                    search: {
                      ...search,
                      page: Math.min(list.totalPages, search.page + 1),
                    },
                  })
                }
                disabled={search.page >= list.totalPages}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Successiva
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
