"use client"

import { useState, useMemo } from "react"
import { ArrowUpDown, Truck } from "lucide-react"
import { DeliveryStatRow } from "@/src/services/dashboard.service"
import {
  Card,
  CardContent,
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

  const sorted = useMemo(() => {
    return [...deliveryStats].sort((a, b) => {
      const valA = a[sortKey]
      const valB = b[sortKey]
      const dir = sortDir === "asc" ? 1 : -1
      if (typeof valA === "string" && typeof valB === "string") {
        return valA.localeCompare(valB) * dir
      }
      return ((valA as number) - (valB as number)) * dir
    })
  }, [deliveryStats, sortKey, sortDir])

  if (isLoading) {
    return (
      <Card className="bg-muted/30">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="p-0 pb-4">
          <div className="space-y-3 px-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16 ml-auto" />
                <Skeleton className="h-4 w-16" />
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
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">Reporte de Repartidores</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0 pb-4">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <Truck className="h-10 w-10 mb-3 opacity-30" />
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
      </CardContent>
    </Card>
  )
}
