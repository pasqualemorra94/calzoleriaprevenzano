import { createFileRoute, Link } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { ArrowLeft, PackageX } from "lucide-react";
import { $getAbandonedCart } from "~/lib/admin-functions";

export const Route = createFileRoute("/admin/carrelli-abbandonati/$id")({
  beforeLoad: async ({ params }) => {
    const detail = await $getAbandonedCart({ data: { id: params.id } });
    return { detail };
  },
  component: AdminAbandonedCartDetailPage,
});

function formatAbsolute(iso: string): string {
  return new Date(iso).toLocaleString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

function AdminAbandonedCartDetailPage(): ReactNode {
  const { detail } = Route.useRouteContext();

  if (!detail) {
    return (
      <div className="space-y-4">
        <Link
          to="/admin/carrelli-abbandonati"
          search={{ threshold: "1h", userFilter: "all", page: 1 }}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" /> Torna ai carrelli abbandonati
        </Link>
        <div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-12 text-center">
          <PackageX className="mb-3 h-10 w-10 text-red-400" aria-hidden="true" />
          <p className="text-sm font-medium text-red-700">Carrello non trovato</p>
          <p className="mt-1 text-xs text-red-600">
            Potrebbe essere stato cancellato o l&apos;ID non è valido.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <Link
          to="/admin/carrelli-abbandonati"
          search={{ threshold: "1h", userFilter: "all", page: 1 }}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna ai carrelli abbandonati
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Carrello abbandonato
          </span>
          <span className="font-mono text-xs text-gray-500">{detail.id}</span>
        </div>
      </div>

      {/* Card Info cart */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Info carrello</h2>
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-500">Utente</span>
            {detail.userId ? (
              <span className="text-gray-900">
                <span className="font-medium">{detail.userName ?? "—"}</span>
                {detail.userEmail && (
                  <span className="text-gray-500"> ({detail.userEmail})</span>
                )}
              </span>
            ) : (
              <span className="text-gray-900">Ospite</span>
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-500">Session ID</span>
            <span className="font-mono text-xs text-gray-700">
              {detail.sessionId ?? "—"}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-500">Creato il</span>
            <span className="text-gray-900">{formatAbsolute(detail.createdAt)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-500">Ultima attività</span>
            <span className="text-gray-900">
              {formatAbsolute(detail.updatedAt)}{" "}
              <span className="text-gray-500">
                ({formatRelative(detail.updatedAt)})
              </span>
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-500">Scade il</span>
            <span className="text-gray-900">{formatAbsolute(detail.expiresAt)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-500">Totale potenziale</span>
            <span className="text-gray-900">
              <strong>€{detail.totalValue.toFixed(2)}</strong>
              <span className="text-gray-500"> ({detail.itemCount} articoli)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Card Prodotti */}
      <div className="rounded-lg bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Prodotti nel carrello
          </h2>
        </div>

        {detail.items.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">
            Questo carrello non ha articoli
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium tracking-wider text-gray-500">
                  <th className="px-4 py-3">Prodotto</th>
                  <th className="px-4 py-3">Variante / Opzioni</th>
                  <th className="px-4 py-3 text-right">Q.tà</th>
                  <th className="px-4 py-3 text-right">Prezzo</th>
                  <th className="px-4 py-3 text-right">Subtotale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {detail.items.map((item) => (
                  <tr key={item.id} className="align-top">
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="h-16 w-16 shrink-0 rounded bg-gray-50 object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className="h-16 w-16 shrink-0 rounded bg-gray-100"
                            aria-hidden="true"
                          />
                        )}
                        <div className="min-w-0">
                          <Link
                            to="/prodotti/$slug"
                            params={{ slug: item.productSlug }}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-gray-900 hover:underline"
                          >
                            {item.productName}
                          </Link>
                          <div className="mt-0.5 font-mono text-[11px] text-gray-400">
                            {item.productId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.variantName && (
                        <div className="mb-1 text-gray-900">{item.variantName}</div>
                      )}
                      {item.selectedOptions && item.selectedOptions.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {item.selectedOptions.map((o, idx) => (
                            <span
                              key={`${item.id}-${idx}-${o.label}`}
                              className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs"
                            >
                              <span>
                                {o.label}: {o.value}
                              </span>
                              {o.color && (
                                <span
                                  className="inline-block h-3 w-3 rounded-full border border-gray-300"
                                  style={{ backgroundColor: o.color }}
                                  aria-hidden="true"
                                />
                              )}
                            </span>
                          ))}
                        </div>
                      ) : !item.variantName ? (
                        <span className="text-xs text-gray-400">—</span>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">
                      €{item.unitPrice.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900">
                      €{item.subtotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 bg-gray-50">
                  <td
                    colSpan={4}
                    className="px-4 py-3 text-right text-sm font-medium text-gray-700"
                  >
                    Totale potenziale
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-base font-bold text-gray-900">
                    €{detail.totalValue.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
