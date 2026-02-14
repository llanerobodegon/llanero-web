"use client"

import { useMemo, useState } from "react"
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
import { TopProduct } from "@/src/services/dashboard.service"
import { formatCurrency } from "@/src/components/shared/stat-card"
import Image from "next/image"
import { ImageIcon, Search, ChevronLeft, ChevronRight } from "lucide-react"

interface TopProductsTableProps {
  topProducts: TopProduct[]
  isLoading: boolean
  paginated?: boolean
}

export function TopProductsTable({ topProducts, isLoading, paginated = false }: TopProductsTableProps) {
  const [viewMode, setViewMode] = useState<"sold" | "top">("sold")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filteredAndSorted = useMemo(() => {
    let products = [...topProducts]

    if (paginated && search) {
      products = products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      )
    }

    products.sort((a, b) =>
      viewMode === "top"
        ? b.quantitySold - a.quantitySold
        : b.lastSoldAt > a.lastSoldAt ? -1 : a.lastSoldAt > b.lastSoldAt ? 1 : 0
    )

    return products
  }, [topProducts, viewMode, search, paginated])

  const totalPages = paginated ? Math.ceil(filteredAndSorted.length / pageSize) : 1
  const displayProducts = paginated
    ? filteredAndSorted.slice((page - 1) * pageSize, page * pageSize)
    : filteredAndSorted

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
                <Skeleton className="h-9 w-9 rounded-lg" />
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
            <CardTitle className="text-base">
              {viewMode === "top" ? "Productos Más Vendidos" : "Productos Vendidos"}
            </CardTitle>
            <CardDescription>
              {viewMode === "top" ? "Top 5 del mes actual" : "Últimos productos vendidos"}
            </CardDescription>
          </div>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "sold" | "top")}>
            <TabsList className="h-8">
              <TabsTrigger value="sold" className="text-xs px-3 cursor-pointer">
                Productos vendidos
              </TabsTrigger>
              <TabsTrigger value="top" className="text-xs px-3 cursor-pointer">
                Más vendidos
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {paginated && (
          <div className="px-6 pb-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar producto..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-muted-foreground font-normal">Producto</TableHead>
              <TableHead className="text-muted-foreground font-normal text-right">Cantidad</TableHead>
              <TableHead className="text-muted-foreground font-normal text-right">Ventas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayProducts.length > 0 ? (
              displayProducts.map((product) => (
                <TableRow key={product.id} className="border-b last:border-0">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative h-9 w-9 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{product.quantitySold}</TableCell>
                  <TableCell className="text-right">{formatCurrency(product.totalSales)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  {search ? "No se encontraron productos" : "No hay datos de productos este mes"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {paginated && filteredAndSorted.length > 0 && (
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
