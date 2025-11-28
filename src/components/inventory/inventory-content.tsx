"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Package, Search, Filter, Plus } from "lucide-react"
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
import { DataTable } from "@/src/components/inventory/data-table"
import { getColumns, ProductItem } from "@/src/components/inventory/columns"
import { InventorySkeleton } from "@/src/components/inventory/inventory-skeleton"
import { EmptyState } from "@/components/empty-state"
import {
  useInventoryViewModel,
  Product,
} from "@/src/viewmodels/useInventoryViewModel"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function InventoryContent() {
  const router = useRouter()
  const {
    products,
    categories,
    subcategories,
    isLoading,
    error,
    pagination,
    selectedCategoryIds,
    selectedSubcategoryIds,
    setPage,
    setPageSize,
    toggleCategoryFilter,
    toggleSubcategoryFilter,
    clearCategoryFilters,
    clearSubcategoryFilters,
    deleteProduct,
  } = useInventoryViewModel()

  // Filter state
  const [searchQuery, setSearchQuery] = useState("")

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<ProductItem | null>(null)

  // Filtered data
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products
    return products.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [products, searchQuery])

  // Map Product to ProductItem for table
  const tableData: ProductItem[] = useMemo(() => {
    return filteredProducts.map((p) => ({
      id: p.id,
      name: p.name,
      imageUrls: p.imageUrls,
      sku: p.sku,
      barcode: p.barcode,
      price: p.price,
      isActive: p.isActive,
      category: p.category,
      subcategory: p.subcategory,
    }))
  }, [filteredProducts])

  const handleEditClick = (item: ProductItem) => {
    router.push(`/admin/inventory/${item.id}/edit`)
  }

  const handleDeleteClick = (item: ProductItem) => {
    setItemToDelete(item)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return

    try {
      await deleteProduct(itemToDelete.id)
      toast.success("Producto eliminado correctamente")
    } catch (err) {
      console.error("Error deleting product:", err)
      toast.error("Error al eliminar el producto")
    } finally {
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    }
  }

  const columns = useMemo(
    () =>
      getColumns({
        onEdit: handleEditClick,
        onDelete: handleDeleteClick,
      }),
    []
  )

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 px-4 py-[50px] mx-auto w-full max-w-[1200px]">
        {/* Title Section */}
        <div className="mb-[25px]">
          <h1 className="text-2xl font-semibold">Productos</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los productos del catálogo
          </p>
        </div>

        {/* Action Section */}
        <div className="flex items-center gap-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar producto..."
              value=""
              readOnly
              disabled
              className="pl-9 w-64"
            />
          </div>
          <Button variant="outline" disabled className="gap-2">
            <Filter className="h-4 w-4" />
            Categorías
          </Button>
          <Button variant="outline" disabled className="gap-2">
            <Filter className="h-4 w-4" />
            Subcategorías
          </Button>
          <Button
            className="ml-auto"
            onClick={() => router.push("/admin/inventory/new")}
          >
            <Plus />
            Agregar producto
          </Button>
        </div>

        <InventorySkeleton />
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
          Productos{" "}
          <span className="text-muted-foreground font-normal">
            ({pagination.totalCount})
          </span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Gestiona los productos del catálogo
        </p>
      </div>

      {/* Action Section */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar producto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-64"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Categorías
              {selectedCategoryIds.length > 0 && (
                <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {selectedCategoryIds.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 max-h-80 overflow-y-auto">
            <DropdownMenuLabel>Filtrar por categoría</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {categories.map((category) => (
              <DropdownMenuCheckboxItem
                key={category.id}
                checked={selectedCategoryIds.includes(category.id)}
                onCheckedChange={() => toggleCategoryFilter(category.id)}
              >
                {category.name}
              </DropdownMenuCheckboxItem>
            ))}
            {selectedCategoryIds.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={false}
                  onCheckedChange={() => clearCategoryFilters()}
                  className="text-muted-foreground"
                >
                  Limpiar filtros
                </DropdownMenuCheckboxItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Subcategorías
              {selectedSubcategoryIds.length > 0 && (
                <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {selectedSubcategoryIds.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 max-h-80 overflow-y-auto">
            <DropdownMenuLabel>Filtrar por subcategoría</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {subcategories.map((subcategory) => (
              <DropdownMenuCheckboxItem
                key={subcategory.id}
                checked={selectedSubcategoryIds.includes(subcategory.id)}
                onCheckedChange={() => toggleSubcategoryFilter(subcategory.id)}
              >
                {subcategory.name}
              </DropdownMenuCheckboxItem>
            ))}
            {selectedSubcategoryIds.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={false}
                  onCheckedChange={() => clearSubcategoryFilters()}
                  className="text-muted-foreground"
                >
                  Limpiar filtros
                </DropdownMenuCheckboxItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          className="ml-auto"
          onClick={() => router.push("/admin/inventory/new")}
        >
          <Plus />
          Agregar producto
        </Button>
      </div>

      {tableData.length === 0 && (searchQuery || selectedCategoryIds.length > 0 || selectedSubcategoryIds.length > 0) ? (
        <div className="rounded-lg border bg-background p-8 text-center">
          <p className="text-muted-foreground">
            No se encontraron productos con los filtros aplicados
          </p>
          <Button
            variant="link"
            onClick={() => {
              setSearchQuery("")
              clearCategoryFilters()
              clearSubcategoryFilters()
            }}
            className="mt-2"
          >
            Limpiar filtros
          </Button>
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-lg border bg-background">
          <EmptyState
            icon={Package}
            title="No hay productos"
            description="Agrega productos al catálogo para comenzar"
            actionLabel="Agregar producto"
            onAction={() => router.push("/admin/inventory/new")}
          />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={tableData}
          pagination={pagination}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente{" "}
              <strong>{itemToDelete?.name}</strong> y lo removerá de todos los
              bodegones donde esté disponible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
