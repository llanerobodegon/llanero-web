"use client"

import { useState } from "react"
import { ArrowUpDown, Package } from "lucide-react"
import { DeliveryStatRow } from "@/src/services/dashboard.service"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/src/components/shared/stat-card"

type SortKey = "deliveryPersonName" | "totalDeliveries" | "totalFeeUsd"
type SortDir = "asc" | "desc"

interface DeliveryStatsTableProps {
  deliveryStats: DeliveryStatRow[]
  isLoading: boolean
}

export function DeliveryStatsTable({ deliveryStats, isLoading }: DeliveryStatsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("totalDeliveries")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  const sorted = [...deliveryStats].sort((a, b) => {
    const valA = a[sortKey]
    const valB = b[sortKey]
    const dir = sortDir === "asc" ? 1 : -1
    if (typeof valA === "string" && typeof valB === "string") {
      return valA.localeCompare(valB) * dir
    }
    return ((valA as number) - (valB as number)) * dir
  })

  return (
    <div className="rounded-xl border bg-card">
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Package className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Reporte de Repartidores</h2>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <Package className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">No hay deliveries completados en este período</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 font-semibold"
                    onClick={() => handleSort("deliveryPersonName")}
                  >
                    Repartidor
                    <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 font-semibold"
                    onClick={() => handleSort("totalDeliveries")}
                  >
                    N° de Deliveries
                    <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 font-semibold"
                    onClick={() => handleSort("totalFeeUsd")}
                  >
                    Fee Total (USD)
                    <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((row) => (
                <TableRow key={row.deliveryPersonId}>
                  <TableCell className="font-medium">{row.deliveryPersonName}</TableCell>
                  <TableCell className="text-right">{row.totalDeliveries}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.totalFeeUsd)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
