"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Store } from "lucide-react"
import {
  OrderListItem,
  getStatusLabel,
  getStatusColor,
  formatCurrency,
  formatDate,
} from "@/src/services/orders.service"

interface ColumnsProps {
  onView: (order: OrderListItem) => void
  showWarehouse?: boolean
}

export function getColumns({ onView, showWarehouse }: ColumnsProps): ColumnDef<OrderListItem>[] {
  return [
    {
      accessorKey: "orderNumber",
      header: "# Orden",
      cell: ({ row }) => {
        return (
          <span className="font-medium">{row.original.orderNumber}</span>
        )
      },
    },
    {
      accessorKey: "customerName",
      header: "Cliente",
      cell: ({ row }) => {
        return (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.customerName}</span>
            <span className="text-xs text-muted-foreground">{row.original.customerEmail}</span>
          </div>
        )
      },
    },
    ...(showWarehouse
      ? [
          {
            accessorKey: "warehouseName",
            header: "Bodegón",
            cell: ({ row }: { row: { original: OrderListItem } }) => {
              return (
                <div className="flex items-center gap-2">
                  <Store className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{row.original.warehouseName}</span>
                </div>
              )
            },
          } satisfies ColumnDef<OrderListItem>,
        ]
      : []),
    {
      accessorKey: "totalUsd",
      header: "Total",
      cell: ({ row }) => {
        return (
          <div className="flex flex-col">
            <span className="font-medium">{formatCurrency(row.original.totalUsd, "USD")}</span>
            <span className="text-xs text-muted-foreground">{formatCurrency(row.original.totalBs, "BS")}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => {
        const status = row.original.status
        const statusLabel = getStatusLabel(status)
        const statusColor = getStatusColor(status)

        return (
          <Badge
            variant="outline"
            className="bg-transparent border-gray-300 text-gray-700 font-normal"
          >
            <span className={`h-2 w-2 rounded-full ${statusColor}`} />
            {statusLabel}
          </Badge>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: "Fecha",
      cell: ({ row }) => {
        return (
          <span className="text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        )
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right"></div>,
      cell: ({ row }) => {
        return (
          <div className="text-right">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              onClick={() => onView(row.original)}
            >
              <Eye className="h-4 w-4" />
              <span className="sr-only">Ver pedido</span>
            </Button>
          </div>
        )
      },
    },
  ]
}
