import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingCart, Euro, Package, Clock, ArrowRight } from "lucide-react";
import { $getDashboardStats } from "~/lib/admin-functions";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "In attesa",
  confirmed: "Confermato",
  processing: "In lavorazione",
  shipped: "Spedito",
  delivered: "Consegnato",
  cancelled: "Annullato",
  refunded: "Rimborsato",
};

export const Route = createFileRoute("/admin/")({
  beforeLoad: async () => {
    const stats = await $getDashboardStats();
    return { stats };
  },
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const { stats } = Route.useRouteContext();

  const statCards = [
    { label: "Ordini Totali", value: stats.totalOrders, icon: ShoppingCart, color: "bg-blue-500" },
    { label: "Ricavo Totale", value: `€${stats.totalRevenue.toFixed(2)}`, icon: Euro, color: "bg-green-500" },
    { label: "Prodotti Attivi", value: stats.activeProducts, icon: Package, color: "bg-purple-500" },
    { label: "Ordini in Attesa", value: stats.pendingOrders, icon: Clock, color: "bg-yellow-500" },
  ];

  return (
    <div className="space-y-6">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Dashboard</span>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-lg bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${card.color} text-white`}>
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

      <div className="rounded-lg bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">

          <Link
            to="/admin/ordini"
            className="flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]"
          >
            Vedi tutti
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium tracking-wider text-gray-500">
                <th className="px-6 py-3">Numero</th>
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Stato</th>
                <th className="px-6 py-3 text-right">Totale</th>
                <th className="px-6 py-3">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {order.orderNumber}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {order.userName}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-800"}`}>
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-gray-900">
                    €{order.total.toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
