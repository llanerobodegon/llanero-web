import { forwardRef } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  DashboardStats,
  DailySales,
  TopProduct,
  ReportOrder,
  WarehouseSales,
} from "@/src/services/dashboard.service"
import { formatCurrency } from "@/src/components/shared/stat-card"
import { OrderStatus, getStatusLabel } from "@/src/services/orders.service"
import { TrendingUp, TrendingDown } from "lucide-react"

interface ReportPrintViewProps {
  warehouseName: string
  dateFrom: Date
  dateTo: Date
  stats: DashboardStats
  dailySales: DailySales[]
  topProducts: TopProduct[]
  orders: ReportOrder[]
  warehouseSales: WarehouseSales[]
}

function formatPercentage(value: number): string {
  const sign = value >= 0 ? "+" : ""
  return `${sign}${value.toFixed(1)}%`
}

function getStatusDot(status: string): string {
  const colors: Record<string, string> = {
    pending: "#eab308",
    confirmed: "#3b82f6",
    on_delivery: "#6366f1",
    completed: "#22c55e",
    cancelled: "#ef4444",
  }
  return colors[status] || "#9ca3af"
}

export const ReportPrintView = forwardRef<HTMLDivElement, ReportPrintViewProps>(
  function ReportPrintView(
    { warehouseName, dateFrom, dateTo, stats, dailySales, topProducts, orders, warehouseSales },
    ref
  ) {
    const soldProducts = [...topProducts].sort((a, b) =>
      b.lastSoldAt > a.lastSoldAt ? -1 : a.lastSoldAt > b.lastSoldAt ? 1 : 0
    )

    const bestSellers = [...topProducts].sort(
      (a, b) => b.quantitySold - a.quantitySold
    )

    const totalWeekSales = dailySales.reduce((sum, day) => sum + day.sales, 0)

    return (
      <div
        ref={ref}
        className="bg-white text-black p-8"
        style={{ width: "800px", fontFamily: "sans-serif" }}
      >
        {/* Header */}
        <div className="mb-6 border-b border-gray-300 pb-4">
          <h1 className="text-2xl font-bold mb-1">Reportes</h1>
          <p className="text-sm text-gray-600">
            {format(dateFrom, "dd MMM, yyyy", { locale: es })} -{" "}
            {format(dateTo, "dd MMM, yyyy", { locale: es })}
          </p>
          <p className="text-sm text-gray-600 font-medium">{warehouseName}</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCardPrint
            title="Ventas Totales"
            value={formatCurrency(stats.totalSales)}
            change={stats.totalSalesChange}
            detail={`${stats.ordersCompleted} pedidos entregados`}
          />
          <StatCardPrint
            title="Productos Facturados"
            value={stats.productsSold.toString()}
            change={stats.productsSoldChange}
            detail="Unidades vendidas"
          />
          <StatCardPrint
            title="Crecimiento"
            value={`${stats.growthPercentage >= 0 ? "+" : ""}${stats.growthPercentage.toFixed(1)}%`}
            change={stats.growthChange}
            detail="vs periodo anterior"
          />
        </div>

        {/* Warehouse Sales Table (only when all warehouses) */}
        {warehouseSales.length > 0 && (
          <div className="mb-6 border border-gray-200 rounded-lg p-4">
            <h2 className="text-base font-semibold mb-1">Ventas por Bodegón</h2>
            <p className="text-xs text-gray-500 mb-3">
              Total: {formatCurrency(warehouseSales.reduce((s, w) => s + w.totalSales, 0))}
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-1.5 font-medium text-gray-600">Bodegón</th>
                  <th className="text-right py-1.5 font-medium text-gray-600">Ventas</th>
                  <th className="text-right py-1.5 font-medium text-gray-600">Pedidos</th>
                </tr>
              </thead>
              <tbody>
                {warehouseSales.map((w) => (
                  <tr key={w.warehouseId} className="border-b border-gray-100">
                    <td className="py-1.5">{w.warehouseName}</td>
                    <td className="text-right py-1.5">{formatCurrency(w.totalSales)}</td>
                    <td className="text-right py-1.5">{w.ordersCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Sales Chart - Table representation for PDF */}
        <div className="mb-6 border border-gray-200 rounded-lg p-4">
          <h2 className="text-base font-semibold mb-1">Ventas por Día</h2>
          <p className="text-xs text-gray-500 mb-3">
            Total: {formatCurrency(totalWeekSales)}
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-1.5 font-medium text-gray-600">Día</th>
                <th className="text-right py-1.5 font-medium text-gray-600">Ventas</th>
                <th className="text-right py-1.5 font-medium text-gray-600">Pedidos</th>
              </tr>
            </thead>
            <tbody>
              {dailySales.map((day) => (
                <tr key={day.date} className="border-b border-gray-100">
                  <td className="py-1.5">{day.dayName}</td>
                  <td className="text-right py-1.5">
                    {formatCurrency(day.sales)}
                  </td>
                  <td className="text-right py-1.5">{day.orders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Productos Vendidos */}
        <div className="mb-6 border border-gray-200 rounded-lg p-4">
          <h2 className="text-base font-semibold mb-1">Productos Vendidos</h2>
          <p className="text-xs text-gray-500 mb-3">
            Ordenados por última venta
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-1.5 font-medium text-gray-600">Producto</th>
                <th className="text-right py-1.5 font-medium text-gray-600">Cantidad</th>
                <th className="text-right py-1.5 font-medium text-gray-600">Ventas</th>
              </tr>
            </thead>
            <tbody>
              {soldProducts.map((product) => (
                <tr key={product.id} className="border-b border-gray-100">
                  <td className="py-1.5">
                    <div className="flex items-center gap-2">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-6 w-6 rounded object-cover"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="h-6 w-6 rounded bg-gray-200" />
                      )}
                      <span>{product.name}</span>
                    </div>
                  </td>
                  <td className="text-right py-1.5">{product.quantitySold}</td>
                  <td className="text-right py-1.5">
                    {formatCurrency(product.totalSales)}
                  </td>
                </tr>
              ))}
              {soldProducts.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-gray-400">
                    No hay datos de productos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Más Vendidos */}
        <div className="mb-6 border border-gray-200 rounded-lg p-4">
          <h2 className="text-base font-semibold mb-1">Más Vendidos</h2>
          <p className="text-xs text-gray-500 mb-3">
            Ordenados por cantidad vendida
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-1.5 font-medium text-gray-600">Producto</th>
                <th className="text-right py-1.5 font-medium text-gray-600">Cantidad</th>
                <th className="text-right py-1.5 font-medium text-gray-600">Ventas</th>
              </tr>
            </thead>
            <tbody>
              {bestSellers.map((product) => (
                <tr key={product.id} className="border-b border-gray-100">
                  <td className="py-1.5">
                    <div className="flex items-center gap-2">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-6 w-6 rounded object-cover"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="h-6 w-6 rounded bg-gray-200" />
                      )}
                      <span>{product.name}</span>
                    </div>
                  </td>
                  <td className="text-right py-1.5">{product.quantitySold}</td>
                  <td className="text-right py-1.5">
                    {formatCurrency(product.totalSales)}
                  </td>
                </tr>
              ))}
              {bestSellers.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-gray-400">
                    No hay datos de productos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pedidos */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h2 className="text-base font-semibold mb-1">Pedidos</h2>
          <p className="text-xs text-gray-500 mb-3">
            Todos los pedidos del periodo
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-1.5 font-medium text-gray-600"># Pedido</th>
                <th className="text-left py-1.5 font-medium text-gray-600">Cliente</th>
                <th className="text-left py-1.5 font-medium text-gray-600">Estado</th>
                <th className="text-right py-1.5 font-medium text-gray-600">Total</th>
                <th className="text-right py-1.5 font-medium text-gray-600">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100">
                  <td className="py-1.5 font-medium">{order.orderNumber}</td>
                  <td className="py-1.5">{order.customerName}</td>
                  <td className="py-1.5">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: getStatusDot(order.status) }}
                      />
                      <span>{getStatusLabel(order.status as OrderStatus)}</span>
                    </span>
                  </td>
                  <td className="text-right py-1.5">
                    {formatCurrency(order.totalUsd)}
                  </td>
                  <td className="text-right py-1.5 text-gray-500">
                    {format(new Date(order.createdAt), "dd MMM, y", { locale: es })}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-400">
                    No hay pedidos en este periodo
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }
)

function StatCardPrint({
  title,
  value,
  change,
  detail,
}: {
  title: string
  value: string
  change: number
  detail: string
}) {
  const isPositive = change >= 0

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">{title}</span>
        <span
          className={`text-xs font-medium flex items-center gap-0.5 ${
            isPositive ? "text-green-600" : "text-red-600"
          }`}
        >
          {isPositive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {formatPercentage(change)}
        </span>
      </div>
      <div className="text-2xl font-bold mb-2">{value}</div>
      <div className="text-xs text-gray-500">{detail}</div>
    </div>
  )
}
