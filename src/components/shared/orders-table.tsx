"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { ReportOrder } from "@/src/services/dashboard.service"
import { formatCurrency } from "@/src/components/shared/stat-card"
import { OrderStatus, getStatusLabel, getStatusColor } from "@/src/services/orders.service"

interface OrdersTableProps {
  orders: ReportOrder[]
  isLoading: boolean
}

type ViewMode = "all" | "completed" | "cancelled"

export function OrdersTable({ orders, isLoading }: OrdersTableProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filteredOrders = useMemo(() => {
    let result = [...orders]

    if (viewMode === "completed") {
      result = result.filter((o) => o.status === "completed")
    } else if (viewMode === "cancelled") {
      result = result.filter((o) => o.status === "cancelled")
    }

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q)
      )
    }

    return result
  }, [orders, viewMode, search])

  const totalPages = Math.ceil(filteredOrders.length / pageSize)
  const displayOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize)

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(1)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  if (isLoading) {
    return (
      <Card className="bg-muted/30">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16 ml-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-muted/30">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Pedidos</CardTitle>
            <CardDescription>
              {viewMode === "all" && "Todos los pedidos del periodo"}
              {viewMode === "completed" && "Pedidos completados"}
              {viewMode === "cancelled" && "Pedidos cancelados"}
            </CardDescription>
          </div>
          <Tabs value={viewMode} onValueChange={(v) => { setViewMode(v as ViewMode); setPage(1) }}>
            <TabsList className="h-8">
              <TabsTrigger value="all" className="text-xs px-3 cursor-pointer">
                Todos
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-xs px-3 cursor-pointer">
                Completados
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="text-xs px-3 cursor-pointer">
                Cancelados
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="px-6 pb-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por # pedido o cliente..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-muted-foreground font-normal"># Pedido</TableHead>
              <TableHead className="text-muted-foreground font-normal">Cliente</TableHead>
              <TableHead className="text-muted-foreground font-normal">Estado</TableHead>
              <TableHead className="text-muted-foreground font-normal text-right">Total</TableHead>
              <TableHead className="text-muted-foreground font-normal text-right">Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayOrders.length > 0 ? (
              displayOrders.map((order) => (
                <TableRow key={order.id} className="border-b last:border-0">
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${getStatusColor(order.status as OrderStatus)}`} />
                      <span className="text-sm">{getStatusLabel(order.status as OrderStatus)}</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(order.totalUsd)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {format(new Date(order.createdAt), "dd MMM, y", { locale: es })}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  {search ? "No se encontraron pedidos" : "No hay pedidos en este periodo"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {filteredOrders.length > 0 && (
          <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Filas por página</span>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => handlePageSizeChange(Number(value))}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <span className="text-sm text-muted-foreground">
                Página {page} de {totalPages || 1}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
