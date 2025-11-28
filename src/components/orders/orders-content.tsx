"use client"

import { useMemo, useState } from "react"
import { ShoppingBag, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

const ORDER_STATUS_OPTIONS: (OrderStatus | "all")[] = [
  "all",
  "pending",
  "confirmed",
  "on_delivery",
  "completed",
  "cancelled",
]

export function OrdersContent() {
  const {
    orders,
    selectedOrder,
    deliveryMembers,
    isLoading,
    isLoadingOrder,
    error,
    pagination,
    filters,
    setPage,
    setPageSize,
    setFilters,
    selectOrder,
    clearSelectedOrder,
    updateOrder,
  } = useOrdersViewModel()

  // Search state
  const [searchQuery, setSearchQuery] = useState("")

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Filtered data
  const filteredOrders = useMemo(() => {
    if (!searchQuery) return orders
    const query = searchQuery.toLowerCase()
    return orders.filter((order) => {
      return (
        order.orderNumber.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.customerEmail.toLowerCase().includes(query)
      )
    })
  }, [orders, searchQuery])

  const handleViewOrder = async (order: OrderListItem) => {
    setIsDrawerOpen(true)
    await selectOrder(order.id)
  }

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
    clearSelectedOrder()
  }

  const handleStatusFilterChange = (value: string) => {
    if (value === "all") {
      setFilters({ ...filters, status: undefined })
    } else {
      setFilters({ ...filters, status: value as OrderStatus })
    }
  }

  const columns = useMemo(
    () =>
      getColumns({
        onView: handleViewOrder,
      }),
    []
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

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select
            value={filters.status || "all"}
            onValueChange={handleStatusFilterChange}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === "all" ? "Todos" : getStatusLabel(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredOrders.length === 0 && searchQuery ? (
        <div className="rounded-lg border bg-background p-8 text-center">
          <p className="text-muted-foreground">
            No se encontraron pedidos con los filtros aplicados
          </p>
          <Button
            variant="link"
            onClick={() => setSearchQuery("")}
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
      />
    </div>
  )
}
