"use client"

import { useMemo, useState, useEffect, useCallback } from "react"
import {
  ShoppingBag,
  Search,
  Filter,
  Clock,
  CheckCircle,
  Truck,
  PackageCheck,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable } from "@/src/components/orders/data-table"
import { getColumns } from "@/src/components/orders/columns"
import { OrdersSkeleton } from "@/src/components/orders/orders-skeleton"
import { OrderDetailDrawer } from "@/src/components/orders/order-detail-drawer"
import { EmptyState } from "@/components/empty-state"
import {
  useOrdersViewModel,
  OrderListItem,
  OrderStatus,
} from "@/src/viewmodels/useOrdersViewModel"
import { getStatusLabel } from "@/src/services/orders.service"
import { useWarehouseContext } from "@/src/contexts/warehouse-context"

const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  "pending",
  "confirmed",
  "on_delivery",
  "completed",
  "cancelled",
]

export function OrdersContent() {
  const { selectedWarehouse } = useWarehouseContext()
  const showWarehouse = selectedWarehouse === null
  const {
    orders,
    selectedOrder,
    deliveryMembers,
    isLoading,
    isLoadingOrder,
    error,
    pagination,
    setPage,
    setPageSize,
    selectOrder,
    clearSelectedOrder,
    updateOrder,
    deleteOrder,
    onNewOrder,
  } = useOrdersViewModel()

  // Register callback for new orders (realtime) - toast is handled globally by NotificationsContext
  useEffect(() => {
    onNewOrder((_orderNumber) => {
      // Intentionally empty: sound and toast are handled by NotificationsContext
    })
  }, [onNewOrder])

  // Search state
  const [searchQuery, setSearchQuery] = useState("")

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Status filter state (multiple selection)
  const [selectedStatuses, setSelectedStatuses] = useState<OrderStatus[]>([])

  const toggleStatusFilter = (status: OrderStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    )
  }

  // Filter orders by selected statuses
  const statusFilteredOrders = useMemo(() => {
    if (selectedStatuses.length === 0) return orders
    return orders.filter((order) => selectedStatuses.includes(order.status))
  }, [orders, selectedStatuses])

  // Count orders by status
  const statusCounts = useMemo(() => {
    const counts = {
      pending: 0,
      confirmed: 0,
      on_delivery: 0,
      completed: 0,
      cancelled: 0,
    }
    orders.forEach((order) => {
      if (counts[order.status] !== undefined) {
        counts[order.status]++
      }
    })
    return counts
  }, [orders])

  // Filtered data (search + status)
  const filteredOrders = useMemo(() => {
    let result = statusFilteredOrders
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((order) => {
        return (
          order.orderNumber.toLowerCase().includes(query) ||
          order.customerName.toLowerCase().includes(query) ||
          order.customerEmail.toLowerCase().includes(query)
        )
      })
    }
    return result
  }, [statusFilteredOrders, searchQuery])

  const handleViewOrder = async (order: OrderListItem) => {
    setIsDrawerOpen(true)
    await selectOrder(order.id)
  }

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
    clearSelectedOrder()
  }

  const columns = useMemo(
    () =>
      getColumns({
        onView: handleViewOrder,
        showWarehouse,
      }),
    [showWarehouse]
  )

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 px-4 py-[50px] mx-auto w-full max-w-[1200px]">
        {/* Title Section */}
        <div className="mb-[25px]">
          <h1 className="text-2xl font-semibold">Pedidos</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los pedidos de tus bodegones
          </p>
        </div>

        {/* Action Section */}
        <div className="flex items-center gap-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar pedido..."
              value=""
              readOnly
              disabled
              className="pl-9 w-64"
            />
          </div>
        </div>

        <OrdersSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <p className="text-destructive mb-4">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-[50px] mx-auto w-full max-w-[1200px]">
      {/* Title Section */}
      <div className="mb-[25px]">
        <h1 className="text-2xl font-semibold">
          Pedidos{" "}
          <span className="text-muted-foreground font-normal">
            ({pagination.totalCount})
          </span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Gestiona los pedidos de tus bodegones
        </p>
      </div>

      {/* Status Cards */}
      <div className="flex flex-wrap gap-2">
        <button
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-all cursor-pointer hover:shadow-md ${
            selectedStatuses.includes("pending")
              ? "bg-yellow-100 border-yellow-500 text-yellow-700"
              : "bg-background border-border hover:bg-yellow-50"
          }`}
          onClick={() => toggleStatusFilter("pending")}
        >
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">Pendientes</span>
          <span className="text-sm font-bold">{statusCounts.pending}</span>
        </button>

        <button
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-all cursor-pointer hover:shadow-md ${
            selectedStatuses.includes("confirmed")
              ? "bg-blue-100 border-blue-500 text-blue-700"
              : "bg-background border-border hover:bg-blue-50"
          }`}
          onClick={() => toggleStatusFilter("confirmed")}
        >
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Confirmados</span>
          <span className="text-sm font-bold">{statusCounts.confirmed}</span>
        </button>

        <button
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-all cursor-pointer hover:shadow-md ${
            selectedStatuses.includes("on_delivery")
              ? "bg-indigo-100 border-indigo-500 text-indigo-700"
              : "bg-background border-border hover:bg-indigo-50"
          }`}
          onClick={() => toggleStatusFilter("on_delivery")}
        >
          <Truck className="h-4 w-4" />
          <span className="text-sm font-medium">En Camino</span>
          <span className="text-sm font-bold">{statusCounts.on_delivery}</span>
        </button>

        <button
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-all cursor-pointer hover:shadow-md ${
            selectedStatuses.includes("completed")
              ? "bg-green-100 border-green-500 text-green-700"
              : "bg-background border-border hover:bg-green-50"
          }`}
          onClick={() => toggleStatusFilter("completed")}
        >
          <PackageCheck className="h-4 w-4" />
          <span className="text-sm font-medium">Completados</span>
          <span className="text-sm font-bold">{statusCounts.completed}</span>
        </button>

        <button
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-all cursor-pointer hover:shadow-md ${
            selectedStatuses.includes("cancelled")
              ? "bg-red-100 border-red-500 text-red-700"
              : "bg-background border-border hover:bg-red-50"
          }`}
          onClick={() => toggleStatusFilter("cancelled")}
        >
          <XCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Cancelados</span>
          <span className="text-sm font-bold">{statusCounts.cancelled}</span>
        </button>
      </div>

      {/* Action Section */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar pedido..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-64"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Estado
              {selectedStatuses.length > 0 && (
                <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {selectedStatuses.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Filtrar por estado</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ORDER_STATUS_OPTIONS.map((status) => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={selectedStatuses.includes(status)}
                onCheckedChange={() => toggleStatusFilter(status)}
              >
                {getStatusLabel(status)}
              </DropdownMenuCheckboxItem>
            ))}
            {selectedStatuses.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={false}
                  onCheckedChange={() => setSelectedStatuses([])}
                  className="text-muted-foreground"
                >
                  Limpiar filtros
                </DropdownMenuCheckboxItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {filteredOrders.length === 0 && (searchQuery || selectedStatuses.length > 0) ? (
        <div className="rounded-lg border bg-background p-8 text-center">
          <p className="text-muted-foreground">
            No se encontraron pedidos con los filtros aplicados
          </p>
          <Button
            variant="link"
            onClick={() => {
              setSearchQuery("")
              setSelectedStatuses([])
            }}
            className="mt-2"
          >
            Limpiar filtros
          </Button>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-lg border bg-background">
          <EmptyState
            icon={ShoppingBag}
            title="No hay pedidos"
            description="Aún no hay pedidos registrados en el sistema"
          />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredOrders}
          pagination={pagination}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}

      {/* Order Detail Drawer */}
      <OrderDetailDrawer
        order={selectedOrder}
        isOpen={isDrawerOpen}
        isLoading={isLoadingOrder}
        deliveryMembers={deliveryMembers}
        onClose={handleCloseDrawer}
        onUpdate={updateOrder}
        onDelete={deleteOrder}
      />
    </div>
  )
}
