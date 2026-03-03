# Delivery Reports Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Agregar una sección "Reporte de Repartidores" al final del módulo de reportes, mostrando cuántos deliveries completados realizó cada repartidor y el fee total en USD, filtrado por rango de fecha y almacén.

**Architecture:** Sigue el patrón existente del proyecto: nuevo método en `dashboard.service.ts` → nueva propiedad en `useReportsViewModel.ts` → nuevo componente de tabla → integración en `reports-content.tsx`. La consulta usa la FK `orders_delivery_person_id_fkey` para hacer join con la tabla `users`.

**Tech Stack:** Next.js 14, Supabase (client-side), TypeScript, shadcn/ui (`Table`, `TableHeader`, `TableBody`, etc.), lucide-react

---

## Task 1: Agregar interfaz y método `getDeliveryStats` en el servicio

**Files:**
- Modify: `src/services/dashboard.service.ts`

**Context:**
El servicio usa `supabase` (client-side) y el patrón de filtros es `warehouseId?: string, dateRange?: DateRangeFilter`. La FK para el repartidor en la tabla `orders` es `orders_delivery_person_id_fkey`.

**Step 1: Agregar la interfaz `DeliveryStatRow` después de `ReportOrder`**

En `src/services/dashboard.service.ts`, después de la interfaz `ReportOrder` (línea 63), agregar:

```typescript
export interface DeliveryStatRow {
  deliveryPersonId: string
  deliveryPersonName: string
  totalDeliveries: number
  totalFeeUsd: number
}
```

**Step 2: Agregar el método `getDeliveryStats` en la clase `DashboardService`**

Agregar este método antes del cierre de la clase (antes de la línea `}` final de la clase, línea ~468):

```typescript
async getDeliveryStats(warehouseId?: string, dateRange?: DateRangeFilter): Promise<DeliveryStatRow[]> {
  const now = new Date()
  const startDate = dateRange?.from ?? new Date(now.getFullYear(), now.getMonth(), 1)
  const endDate = dateRange?.to ?? now

  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)

  let query = supabase
    .from("orders")
    .select(`
      delivery_person_id,
      delivery_fee_usd,
      users!orders_delivery_person_id_fkey (
        first_name,
        last_name
      )
    `)
    .eq("delivery_type", "delivery")
    .eq("status", "completed")
    .gte("created_at", startDate.toISOString())
    .lte("created_at", end.toISOString())
    .not("delivery_person_id", "is", null)

  if (warehouseId) {
    query = query.eq("warehouse_id", warehouseId)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching delivery stats:", error)
    return []
  }

  const personMap = new Map<string, DeliveryStatRow>()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(data || []).forEach((row: any) => {
    const personId = row.delivery_person_id
    const user = row.users as { first_name: string; last_name: string } | null
    const name = user
      ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
      : "Repartidor"
    const fee = parseFloat(row.delivery_fee_usd || 0)

    const existing = personMap.get(personId)
    if (existing) {
      existing.totalDeliveries += 1
      existing.totalFeeUsd += fee
    } else {
      personMap.set(personId, {
        deliveryPersonId: personId,
        deliveryPersonName: name,
        totalDeliveries: 1,
        totalFeeUsd: fee,
      })
    }
  })

  return Array.from(personMap.values()).sort(
    (a, b) => b.totalDeliveries - a.totalDeliveries
  )
}
```

**Step 3: Commit**

```bash
git add src/services/dashboard.service.ts
git commit -m "feat: add getDeliveryStats method to dashboard service"
```

---

## Task 2: Actualizar `useReportsViewModel` para incluir `deliveryStats`

**Files:**
- Modify: `src/viewmodels/useReportsViewModel.ts`

**Context:**
El viewmodel usa `Promise.all` para cargar todo en paralelo. Hay dos ramas: con `warehouseId` (sin chart de almacenes) y sin `warehouseId` (con chart de almacenes). `getDeliveryStats` siempre se incluye en ambas ramas.

**Step 1: Agregar el import de `DeliveryStatRow` y `getDeliveryStats`**

En la línea del import (línea 7), agregar `DeliveryStatRow` a la lista:

```typescript
import {
  dashboardService,
  DashboardStats,
  DailySales,
  TopProduct,
  ReportOrder,
  DateRangeFilter,
  WarehouseSales,
  DeliveryStatRow,
} from "@/src/services/dashboard.service"
```

**Step 2: Agregar `deliveryStats` a la interfaz de retorno**

En `UseReportsViewModelReturn` (línea 15), agregar la propiedad:

```typescript
interface UseReportsViewModelReturn {
  stats: DashboardStats | null
  dailySales: DailySales[]
  topProducts: TopProduct[]
  orders: ReportOrder[]
  warehouseSales: WarehouseSales[]
  deliveryStats: DeliveryStatRow[]
  isLoading: boolean
  error: string | null
}
```

**Step 3: Agregar el estado `deliveryStats`**

Después del estado `warehouseSales` (línea 31), agregar:

```typescript
const [deliveryStats, setDeliveryStats] = useState<DeliveryStatRow[]>([])
```

**Step 4: Agregar el fetch de `deliveryStats` en `fetchData`**

Modificar las dos ramas del `Promise.all`. El nuevo `basePromises` debe incluir `getDeliveryStats`:

```typescript
const basePromises = [
  dashboardService.getStats(warehouseId, dateRange),
  dashboardService.getSalesLast7Days(warehouseId, dateRange),
  dashboardService.getTopProducts(0, warehouseId, dateRange),
  dashboardService.getOrders(warehouseId, dateRange),
  dashboardService.getDeliveryStats(warehouseId, dateRange),
] as const

if (!warehouseId) {
  const [statsData, salesData, productsData, ordersData, deliveryStatsData, warehouseSalesData] =
    await Promise.all([...basePromises, dashboardService.getSalesByWarehouse(dateRange)])
  setStats(statsData)
  setDailySales(salesData)
  setTopProducts(productsData)
  setOrders(ordersData)
  setDeliveryStats(deliveryStatsData)
  setWarehouseSales(warehouseSalesData)
} else {
  const [statsData, salesData, productsData, ordersData, deliveryStatsData] =
    await Promise.all(basePromises)
  setStats(statsData)
  setDailySales(salesData)
  setTopProducts(productsData)
  setOrders(ordersData)
  setDeliveryStats(deliveryStatsData)
  setWarehouseSales([])
}
```

**Step 5: Agregar `deliveryStats` al return**

```typescript
return {
  stats,
  dailySales,
  topProducts,
  orders,
  warehouseSales,
  deliveryStats,
  isLoading,
  error,
}
```

**Step 6: Commit**

```bash
git add src/viewmodels/useReportsViewModel.ts
git commit -m "feat: add deliveryStats to useReportsViewModel"
```

---

## Task 3: Crear el componente `DeliveryStatsTable`

**Files:**
- Create: `src/components/shared/delivery-stats-table.tsx`

**Context:**
El proyecto usa shadcn/ui. Los componentes de tabla están en `components/ui/table.tsx` y se importan como `@/components/ui/table`. El helper `formatCurrency` está en `@/src/components/shared/stat-card`. Patrón de skeleton: usar `Skeleton` de `@/components/ui/skeleton`.

**Step 1: Crear el archivo del componente**

Crear `src/components/shared/delivery-stats-table.tsx` con este contenido:

```typescript
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
```

**Step 2: Commit**

```bash
git add src/components/shared/delivery-stats-table.tsx
git commit -m "feat: add DeliveryStatsTable component"
```

---

## Task 4: Integrar la sección en `reports-content.tsx`

**Files:**
- Modify: `src/components/reports/reports-content.tsx`

**Context:**
La nueva sección va justo después de `<OrdersTable>` (línea 190) y antes del div oculto del PDF (línea 193).

**Step 1: Agregar el import del nuevo componente**

En las líneas de imports (alrededor de línea 21), agregar:

```typescript
import { DeliveryStatsTable } from "@/src/components/shared/delivery-stats-table"
```

**Step 2: Actualizar el destructuring del viewmodel**

En la línea 42, agregar `deliveryStats`:

```typescript
const { stats, dailySales, topProducts, orders, warehouseSales, deliveryStats, isLoading, error } = useReportsViewModel(dateRangeFilter)
```

**Step 3: Agregar la sección `DeliveryStatsTable` después de `OrdersTable`**

Después de la línea `{/* Orders */}` y `<OrdersTable orders={orders} isLoading={isLoading} />`, agregar:

```tsx
{/* Delivery Stats */}
<DeliveryStatsTable deliveryStats={deliveryStats} isLoading={isLoading} />
```

El bloque completo de esa sección queda así:

```tsx
{/* Orders */}
<OrdersTable orders={orders} isLoading={isLoading} />

{/* Delivery Stats */}
<DeliveryStatsTable deliveryStats={deliveryStats} isLoading={isLoading} />

{/* Hidden print view for PDF export */}
```

**Step 4: Verificar que el proyecto compila sin errores**

```bash
cd /Users/adirsonmartinez/Projects/Nextjs/llanero-app && npx tsc --noEmit
```

Expected: Sin errores de TypeScript.

**Step 5: Commit**

```bash
git add src/components/reports/reports-content.tsx
git commit -m "feat: integrate DeliveryStatsTable into reports page"
```

---

## Verificación Final

1. Navegar a `/admin/reports` en el navegador
2. Al final de la página debe aparecer la sección "Reporte de Repartidores"
3. Cambiar el rango de fechas → la tabla debe actualizarse
4. Seleccionar un almacén específico → la tabla debe filtrar por ese almacén
5. Si no hay deliveries completados en el período → debe mostrarse el mensaje vacío con ícono
6. Click en los headers de columnas → debe ordenar correctamente
