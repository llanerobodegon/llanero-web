"use client"

import * as React from "react"
import { CalendarIcon, Download, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { type DateRange } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useReportsViewModel } from "@/src/viewmodels/useReportsViewModel"
import { DateRangeFilter } from "@/src/services/dashboard.service"
import { StatCard, StatCardSkeleton, formatCurrency } from "@/src/components/shared/stat-card"
import { SalesChart } from "@/src/components/shared/sales-chart"
import { WarehouseSalesChart } from "@/src/components/shared/warehouse-sales-chart"
import { TopProductsTable } from "@/src/components/shared/top-products-table"
import { OrdersTable } from "@/src/components/shared/orders-table"
import { useWarehouseContext } from "@/src/contexts/warehouse-context"
import { useExportPdf } from "@/src/hooks/useExportPdf"
import { ReportPrintView } from "@/src/components/reports/report-print-view"

export function ReportsContent() {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  })
  const rangeComplete = React.useRef(true)
  const { selectedWarehouse } = useWarehouseContext()
  const { printRef, isExporting, exportPdf } = useExportPdf()

  const dateRangeFilter = React.useMemo<DateRangeFilter | undefined>(() => {
    if (date?.from && date?.to) {
      return { from: date.from, to: date.to }
    }
    return undefined
  }, [date?.from, date?.to])

  const { stats, dailySales, topProducts, orders, warehouseSales, isLoading, error } = useReportsViewModel(dateRangeFilter)

  const handleExport = () => {
    const warehousePart = selectedWarehouse ? selectedWarehouse.name.replace(/\s+/g, "_") : "todos"
    const datePart = date?.from
      ? format(date.from, "ddMMyyyy")
      : "periodo"
    const filename = `reporte_${warehousePart}_${datePart}`
    exportPdf(filename)
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <p className="text-destructive mb-4">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-[50px] mx-auto w-full max-w-[1200px]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
        <div className="flex w-full gap-2 sm:w-auto">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="flex-1 justify-start px-2.5 font-normal sm:flex-initial"
            >
              <CalendarIcon />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "dd MMM, y", { locale: es })} -{" "}
                    {format(date.to, "dd MMM, y", { locale: es })}
                  </>
                ) : (
                  format(date.from, "dd MMM, y", { locale: es })
                )
              ) : (
                <span>Seleccionar fechas</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={(newDate) => {
                if (rangeComplete.current) {
                  // Range was complete, start fresh with clicked day as from
                  rangeComplete.current = false
                  setDate({ from: newDate?.from ?? newDate?.to })
                } else {
                  setDate(newDate)
                  if (newDate?.from && newDate?.to) {
                    rangeComplete.current = true
                  }
                }
              }}
              numberOfMonths={1}
              className="sm:hidden"
            />
            <Calendar
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={(newDate) => {
                if (rangeComplete.current) {
                  rangeComplete.current = false
                  setDate({ from: newDate?.from ?? newDate?.to })
                } else {
                  setDate(newDate)
                  if (newDate?.from && newDate?.to) {
                    rangeComplete.current = true
                  }
                }
              }}
              numberOfMonths={2}
              className="hidden sm:block"
            />
          </PopoverContent>
        </Popover>
        <Button onClick={handleExport} disabled={isExporting || isLoading || !stats}>
          {isExporting ? (
            <>
              <Loader2 className="animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Download />
              Exportar
            </>
          )}
        </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : stats ? (
          <>
            <StatCard
              title="Ventas Totales"
              value={formatCurrency(stats.totalSales)}
              change={stats.totalSalesChange}
              trendLabel={stats.totalSalesChange >= 0 ? "Tendencia positiva" : "Tendencia negativa"}
              detailText={`${stats.ordersCompleted} pedidos entregados en el periodo`}
            />
            <StatCard
              title="Productos Facturados"
              value={stats.productsSold.toString()}
              change={stats.productsSoldChange}
              trendLabel={stats.productsSoldChange >= 0 ? "Tendencia positiva" : "Tendencia negativa"}
              detailText="Unidades vendidas en el periodo"
            />
            <StatCard
              title="Crecimiento"
              value={`${stats.growthPercentage >= 0 ? "+" : ""}${stats.growthPercentage.toFixed(1)}%`}
              change={stats.growthChange}
              trendLabel={stats.growthPercentage >= 0 ? "Tendencia positiva" : "Tendencia negativa"}
              detailText="Comparado con el periodo anterior"
            />
          </>
        ) : null}
      </div>

      {/* Warehouse Sales Chart (only when all warehouses selected) */}
      {!selectedWarehouse && (
        <WarehouseSalesChart warehouseSales={warehouseSales} isLoading={isLoading} />
      )}

      {/* Sales Chart */}
      <SalesChart dailySales={dailySales} isLoading={isLoading} />

      {/* Top Products */}
      <TopProductsTable topProducts={topProducts} isLoading={isLoading} paginated />

      {/* Orders */}
      <OrdersTable orders={orders} isLoading={isLoading} />

      {/* Hidden print view for PDF export */}
      {stats && date?.from && date?.to && (
        <div className="fixed left-[-9999px] top-0">
          <ReportPrintView
            ref={printRef}
            warehouseName={selectedWarehouse?.name ?? "Todos los bodegones"}
            dateFrom={date.from}
            dateTo={date.to}
            stats={stats}
            dailySales={dailySales}
            topProducts={topProducts}
            orders={orders}
            warehouseSales={warehouseSales}
          />
        </div>
      )}
    </div>
  )
}
