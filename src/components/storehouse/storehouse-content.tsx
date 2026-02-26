"use client"

import { useState, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Package, Search, Filter, Plus, MoreVertical, Download, Upload, FileSpreadsheet, Loader2, Trash2, X, DollarSign, Power, PackageCheck, PackageX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable } from "@/src/components/inventory/data-table"
import { getColumns, ProductItem } from "@/src/components/inventory/columns"
import { InventorySkeleton } from "@/src/components/inventory/inventory-skeleton"
import { EmptyState } from "@/components/empty-state"
import {
  useStorehouseViewModel,
} from "@/src/viewmodels/useStorehouseViewModel"
import { productService } from "@/src/services/product.service"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"

export function StorehouseContent() {
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
    searchInput,
    setSearchInput,
    executeSearch,
    clearSearch,
    activeSearch,
    setPage,
    setPageSize,
    toggleCategoryFilter,
    toggleSubcategoryFilter,
    clearCategoryFilters,
    clearSubcategoryFilters,
    stats,
    statusFilter,
    setStatusFilter,
    deleteProduct,
    updateAllStatus,
  } = useStorehouseViewModel()

  const [bulkStatusAction, setBulkStatusAction] = useState<"activate" | "deactivate" | null>(null)
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)

  const handleBulkStatusConfirm = async () => {
    if (!bulkStatusAction) return
    setIsBulkUpdating(true)
    try {
      await updateAllStatus(bulkStatusAction === "activate")
      toast.success(bulkStatusAction === "activate" ? "Todos los productos fueron activados" : "Todos los productos fueron inactivados")
    } catch {
      toast.error("Error al actualizar los productos")
    } finally {
      setIsBulkUpdating(false)
      setBulkStatusAction(null)
    }
  }

  // Export products to CSV
  const handleExportCSV = () => {
    const headers = ["Nombre", "Descripción", "SKU", "Código de barras", "Precio", "Categoría", "Subcategoría", "Estado", "Imágenes"]

    const csvRows = [
      headers.join(","),
      ...products.map((product) => {
        let imageUrlsArray: string[] = []
        if (Array.isArray(product.imageUrls)) {
          imageUrlsArray = product.imageUrls.map((url) => {
            if (typeof url === "string" && url.startsWith("[")) {
              try {
                const parsed = JSON.parse(url)
                return Array.isArray(parsed) ? parsed[0] : url
              } catch {
                return url
              }
            }
            return url
          })
        }

        const row = [
          `"${product.name.replace(/"/g, '""')}"`,
          product.description ? `"${product.description.replace(/"/g, '""')}"` : "",
          product.sku ? `"${product.sku}"` : "",
          product.barcode ? `"${product.barcode}"` : "",
          product.price.toFixed(2),
          product.category?.name ? `"${product.category.name}"` : "",
          product.subcategory?.name ? `"${product.subcategory.name}"` : "",
          product.isActive ? "Activo" : "Inactivo",
          imageUrlsArray.length > 0 ? `"${imageUrlsArray.join("|")}"` : "",
        ]
        return row.join(",")
      }),
    ]

    const csvContent = csvRows.join("\n")
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `almacen_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success("Productos exportados correctamente")
  }

  // Import CSV state and functions
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importResult, setImportResult] = useState<{
    success: number
    updated?: number
    errors: { row: number; error: string }[]
  } | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim())
        current = ""
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const processCSVFile = async (file: File) => {
    setIsImporting(true)
    const errors: { row: number; error: string }[] = []
    let createdCount = 0
    let updatedCount = 0

    try {
      const text = await file.text()
      const lines = text.split(/\r?\n/).filter((line) => line.trim())

      if (lines.length < 2) {
        toast.error("El archivo CSV está vacío o no tiene datos")
        setIsImporting(false)
        return
      }

      const dataRows = lines.slice(1)

      for (let i = 0; i < dataRows.length; i++) {
        const rowNumber = i + 2
        const values = parseCSVLine(dataRows[i])

        const [name, description, sku, barcode, priceStr, categoryName, subcategoryName, status, imagesStr] = values

        if (!name) {
          errors.push({ row: rowNumber, error: "Nombre es requerido" })
          continue
        }

        if (!priceStr || isNaN(parseFloat(priceStr))) {
          errors.push({ row: rowNumber, error: "Precio inválido" })
          continue
        }

        let category = null
        if (categoryName) {
          category = categories.find(
            (c) => c.name.toLowerCase() === categoryName.toLowerCase()
          )
          if (!category) {
            errors.push({ row: rowNumber, error: `Categoría "${categoryName}" no encontrada` })
            continue
          }
        }

        let subcategoryId: string | null = null
        if (subcategoryName && category) {
          const subcategory = subcategories.find(
            (s) =>
              s.name.toLowerCase() === subcategoryName.toLowerCase() &&
              s.categoryId === category.id
          )
          if (subcategory) {
            subcategoryId = subcategory.id
          }
        }

        let imageUrls: string[] = []
        if (imagesStr) {
          if (imagesStr.startsWith("[")) {
            try {
              const parsed = JSON.parse(imagesStr)
              imageUrls = Array.isArray(parsed) ? parsed : []
            } catch {
              imageUrls = imagesStr.split("|").map((url) => url.trim()).filter((url) => url)
            }
          } else {
            imageUrls = imagesStr.split("|").map((url) => url.trim()).filter((url) => url)
          }
        }

        let existingProduct = null
        if (sku) {
          existingProduct = await productService.getBySku(sku)
        }

        try {
          if (existingProduct) {
            await productService.update(existingProduct.id, {
              name,
              description: description || existingProduct.description,
              barcode: barcode || null,
              price: parseFloat(priceStr),
              categoryId: category?.id || existingProduct.categoryId,
              subcategoryId: subcategoryId || existingProduct.subcategoryId,
              isActive: status?.toLowerCase() !== "inactivo",
              imageUrls: imageUrls.length > 0 ? imageUrls : existingProduct.imageUrls,
            })
            updatedCount++
          } else {
            const isActive = category
              ? status?.toLowerCase() !== "inactivo"
              : false

            await productService.create({
              name,
              description: description || null,
              sku: sku || null,
              barcode: barcode || null,
              price: parseFloat(priceStr),
              categoryId: category?.id || null,
              subcategoryId,
              isActive,
              imageUrls,
            })
            createdCount++
          }
        } catch (err) {
          errors.push({ row: rowNumber, error: existingProduct ? "Error al actualizar el producto" : "Error al crear el producto" })
        }
      }

      setImportResult({
        success: createdCount,
        updated: updatedCount,
        errors
      })
      setIsImporting(false)
      setImportModalOpen(false)
      setImportDialogOpen(true)

      if (createdCount > 0 || updatedCount > 0) {
        setTimeout(() => window.location.reload(), 1500)
      }
    } catch (err) {
      console.error("Error importing CSV:", err)
      toast.error("Error al procesar el archivo CSV")
      setIsImporting(false)
      setImportModalOpen(false)
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await processCSVFile(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.name.endsWith(".csv")) {
      processCSVFile(file)
    } else {
      toast.error("Por favor, selecciona un archivo CSV válido")
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleImportClick = () => {
    setImportModalOpen(true)
  }

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<ProductItem | null>(null)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  // Price update dialog state
  const [priceDialogOpen, setPriceDialogOpen] = useState(false)
  const [priceUpdates, setPriceUpdates] = useState<Record<string, string>>({})
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false)

  // Status update dialog state
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [statusUpdates, setStatusUpdates] = useState<Record<string, boolean>>({})
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  // Map Product to ProductItem for table
  const tableData: ProductItem[] = useMemo(() => {
    return products.map((p) => ({
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
  }, [products])

  const handleEditClick = (item: ProductItem) => {
    router.push(`/admin/stock/${item.id}/edit`)
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
      const errorMessage = err instanceof Error ? err.message : ""
      if (errorMessage.startsWith("PRODUCT_IN_ORDERS:")) {
        const orderCount = errorMessage.split(":")[1]
        toast.error(
          `No se puede eliminar este producto porque está asociado a ${orderCount} pedido${Number(orderCount) > 1 ? "s" : ""}`
        )
      } else {
        toast.error("Error al eliminar el producto")
      }
    } finally {
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return

    setIsBulkDeleting(true)
    let successCount = 0
    let errorCount = 0

    for (const productId of selectedIds) {
      try {
        await deleteProduct(productId)
        successCount++
      } catch {
        errorCount++
      }
    }

    setIsBulkDeleting(false)
    setBulkDeleteDialogOpen(false)
    setSelectedIds(new Set())

    if (successCount > 0) {
      toast.success(`${successCount} producto(s) eliminado(s)`)
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} producto(s) no pudieron ser eliminados`)
    }
  }

  // Get selected products for price update modal
  const selectedProducts = useMemo(() => {
    return products.filter((p) => selectedIds.has(p.id))
  }, [products, selectedIds])

  const openPriceDialog = () => {
    const initialPrices: Record<string, string> = {}
    selectedProducts.forEach((p) => {
      initialPrices[p.id] = p.price.toString()
    })
    setPriceUpdates(initialPrices)
    setPriceDialogOpen(true)
  }

  const handleBulkPriceUpdate = async () => {
    for (const [productId, priceStr] of Object.entries(priceUpdates)) {
      const price = parseFloat(priceStr)
      if (isNaN(price) || price < 0) {
        const product = selectedProducts.find((p) => p.id === productId)
        toast.error(`Precio inválido para "${product?.name}"`)
        return
      }
    }

    setIsUpdatingPrice(true)
    let successCount = 0
    let errorCount = 0

    for (const [productId, priceStr] of Object.entries(priceUpdates)) {
      const price = parseFloat(priceStr)
      try {
        await productService.update(productId, { price })
        successCount++
      } catch {
        errorCount++
      }
    }

    setIsUpdatingPrice(false)
    setPriceDialogOpen(false)
    setPriceUpdates({})
    setSelectedIds(new Set())

    if (successCount > 0) {
      toast.success(`Precio actualizado en ${successCount} producto(s)`)
      setTimeout(() => window.location.reload(), 500)
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} producto(s) no pudieron ser actualizados`)
    }
  }

  const openStatusDialog = () => {
    const initialStatus: Record<string, boolean> = {}
    selectedProducts.forEach((p) => {
      initialStatus[p.id] = p.isActive
    })
    setStatusUpdates(initialStatus)
    setStatusDialogOpen(true)
  }

  const handleBulkStatusUpdate = async () => {
    setIsUpdatingStatus(true)
    let successCount = 0
    let errorCount = 0

    for (const [productId, isActive] of Object.entries(statusUpdates)) {
      try {
        await productService.update(productId, { isActive })
        successCount++
      } catch {
        errorCount++
      }
    }

    setIsUpdatingStatus(false)
    setStatusDialogOpen(false)
    setStatusUpdates({})
    setSelectedIds(new Set())

    if (successCount > 0) {
      toast.success(`Estado actualizado en ${successCount} producto(s)`)
      setTimeout(() => window.location.reload(), 500)
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} producto(s) no pudieron ser actualizados`)
    }
  }

  const columns = useMemo(
    () =>
      getColumns({
        onEdit: handleEditClick,
        onDelete: handleDeleteClick,
        showStatus: false,
      }),
    []
  )

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
          Almacén{" "}
          <span className="text-muted-foreground font-normal">
            ({pagination.totalCount})
          </span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Todos los productos del catálogo
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card
          className={`cursor-pointer transition-colors ${statusFilter === null ? "bg-muted/60 ring-1 ring-border" : "bg-muted/30 hover:bg-muted/50"}`}
          onClick={() => setStatusFilter(null)}
        >
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`relative cursor-pointer transition-colors ${statusFilter === "active" ? "bg-muted/60 ring-1 ring-border" : "bg-muted/30 hover:bg-muted/50"}`}
          onClick={() => setStatusFilter(statusFilter === "active" ? null : "active")}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-muted-foreground">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => setBulkStatusAction("deactivate")}>
                <PackageX className="mr-2 h-4 w-4" />
                Inactivar todos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <PackageCheck className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Activos</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`relative cursor-pointer transition-colors ${statusFilter === "inactive" ? "bg-muted/60 ring-1 ring-border" : "bg-muted/30 hover:bg-muted/50"}`}
          onClick={() => setStatusFilter(statusFilter === "inactive" ? null : "inactive")}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-muted-foreground">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => setBulkStatusAction("activate")}>
                <PackageCheck className="mr-2 h-4 w-4" />
                Activar todos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
              <PackageX className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Inactivos</p>
              <p className="text-2xl font-bold">{stats.inactive}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Section */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex items-center">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar producto..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                executeSearch()
              }
            }}
            className={`pl-9 w-64 ${activeSearch ? "pr-8" : ""}`}
          />
          {activeSearch && (
            <button
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {searchInput && searchInput !== activeSearch && (
            <Button
              size="icon"
              variant="default"
              className="ml-2 h-9 w-9"
              onClick={executeSearch}
            >
              <Search className="h-4 w-4" />
            </Button>
          )}
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
        <div className="ml-auto flex items-center gap-2">
          {selectedIds.size > 0 && (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={openPriceDialog}
              >
                <DollarSign className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={openStatusDialog}
              >
                <Power className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setBulkDeleteDialogOpen(true)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV}>
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleImportClick} disabled={isImporting}>
                <Upload className="mr-2 h-4 w-4" />
                Importar CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => router.push("/admin/stock/new")}>
            <Plus />
            Agregar producto
          </Button>
        </div>
      </div>

      {/* Hidden file input for CSV import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleImportCSV}
        className="hidden"
      />

      {isLoading ? (
        <InventorySkeleton />
      ) : tableData.length === 0 && (activeSearch || selectedCategoryIds.length > 0 || selectedSubcategoryIds.length > 0 || statusFilter !== null) ? (
        <div className="rounded-lg border bg-background p-8 text-center">
          <p className="text-muted-foreground">
            No se encontraron productos con los filtros aplicados
          </p>
          <Button
            variant="link"
            onClick={() => {
              clearSearch()
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
            onAction={() => router.push("/admin/stock/new")}
          />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={tableData}
          pagination={pagination}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      )}

      {/* Bulk Price Update Dialog */}
      <Dialog open={priceDialogOpen} onOpenChange={(open) => !isUpdatingPrice && setPriceDialogOpen(open)}>
        <DialogContent className="sm:max-w-lg" showCloseButton={!isUpdatingPrice}>
          <DialogHeader>
            <DialogTitle>Actualizar precios</DialogTitle>
            <DialogDescription>
              Modifica el precio de los productos seleccionados
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 max-h-[400px] overflow-y-auto">
            <div className="space-y-3">
              {selectedProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-3 p-2 rounded-lg border bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{product.name}</p>
                    {product.sku && (
                      <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                    )}
                  </div>
                  <div className="relative w-32">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={priceUpdates[product.id] || ""}
                      onChange={(e) => setPriceUpdates((prev) => ({
                        ...prev,
                        [product.id]: e.target.value
                      }))}
                      className="pl-9"
                      min="0"
                      step="0.01"
                      disabled={isUpdatingPrice}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setPriceDialogOpen(false)
                setPriceUpdates({})
              }}
              disabled={isUpdatingPrice}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleBulkPriceUpdate}
              disabled={isUpdatingPrice}
            >
              {isUpdatingPrice ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                "Actualizar"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={(open) => !isUpdatingStatus && setStatusDialogOpen(open)}>
        <DialogContent className="sm:max-w-lg" showCloseButton={!isUpdatingStatus}>
          <DialogHeader>
            <DialogTitle>Actualizar estado</DialogTitle>
            <DialogDescription>
              Cambia el estado de los productos seleccionados
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 max-h-[400px] overflow-y-auto">
            <div className="space-y-3">
              {selectedProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-3 p-2 rounded-lg border bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{product.name}</p>
                    {product.sku && (
                      <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${statusUpdates[product.id] ? "text-green-600" : "text-muted-foreground"}`}>
                      {statusUpdates[product.id] ? "Activo" : "Inactivo"}
                    </span>
                    <Switch
                      checked={statusUpdates[product.id] || false}
                      onCheckedChange={(checked) => setStatusUpdates((prev) => ({
                        ...prev,
                        [product.id]: checked
                      }))}
                      disabled={isUpdatingStatus}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setStatusDialogOpen(false)
                setStatusUpdates({})
              }}
              disabled={isUpdatingStatus}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleBulkStatusUpdate}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                "Actualizar"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {selectedIds.size} producto(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente los productos seleccionados y los removerá de todos los bodegones donde estén disponibles.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isBulkDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      {/* Import CSV Modal */}
      <Dialog open={importModalOpen} onOpenChange={(open) => !isImporting && setImportModalOpen(open)}>
        <DialogContent className="sm:max-w-lg" showCloseButton={!isImporting}>
          <DialogHeader>
            <DialogTitle>Importar productos desde CSV</DialogTitle>
            <DialogDescription>
              Sube un archivo CSV con los productos que deseas importar
            </DialogDescription>
          </DialogHeader>

          {isImporting ? (
            <div className="border-2 border-primary/30 bg-primary/5 rounded-lg p-8 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-3" />
              <p className="text-sm font-medium">Importando productos...</p>
              <p className="text-xs text-muted-foreground mt-1">
                Por favor espera, esto puede tomar unos segundos
              </p>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
            >
              <FileSpreadsheet className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium mb-1">
                Arrastra tu archivo CSV aquí
              </p>
              <p className="text-xs text-muted-foreground">
                o <span className="text-primary">haz clic para seleccionar</span>
              </p>
            </div>
          )}

          {!isImporting && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium">Columnas del CSV:</p>
              <div className="text-xs text-muted-foreground grid grid-cols-2 gap-1">
                <span>1. <strong>Nombre</strong> *</span>
                <span>2. Descripción</span>
                <span>3. SKU</span>
                <span>4. Código de barras</span>
                <span>5. <strong>Precio</strong> *</span>
                <span>6. Categoría</span>
                <span>7. Subcategoría</span>
                <span>8. Estado</span>
                <span>9. Imágenes</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1 border-t border-border pt-3">
                <p className="font-medium text-foreground mb-2">Notas importantes:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>La primera fila debe ser el encabezado</li>
                  <li>Si el <strong>SKU</strong> ya existe, el producto se actualizará</li>
                  <li>Al actualizar, campos vacíos mantienen los valores actuales</li>
                  <li>Productos nuevos sin categoría se crean como <strong>Inactivos</strong></li>
                  <li>Estado: &quot;Activo&quot; o &quot;Inactivo&quot; (por defecto: Activo)</li>
                  <li>Imágenes: URLs separadas por <code className="bg-muted px-1 rounded">|</code></li>
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Import Result Dialog */}
      <AlertDialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resultado de importación</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {importResult && (
                  <>
                    {importResult.success > 0 && (
                      <p className="text-green-600">
                        {importResult.success} producto(s) creado(s)
                      </p>
                    )}
                    {importResult.updated && importResult.updated > 0 && (
                      <p className="text-blue-600">
                        {importResult.updated} producto(s) actualizado(s)
                      </p>
                    )}
                    {importResult.success === 0 && (!importResult.updated || importResult.updated === 0) && importResult.errors.length === 0 && (
                      <p className="text-muted-foreground">
                        No se procesaron productos
                      </p>
                    )}
                    {importResult.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="text-destructive mb-2">
                          {importResult.errors.length} error(es):
                        </p>
                        <div className="max-h-32 overflow-y-auto text-sm space-y-1">
                          {importResult.errors.map((err, idx) => (
                            <p key={idx} className="text-muted-foreground">
                              Fila {err.row}: {err.error}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setImportDialogOpen(false)}>
              Cerrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Status Update Dialog */}
      <AlertDialog open={bulkStatusAction !== null} onOpenChange={(open) => !isBulkUpdating && !open && setBulkStatusAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkStatusAction === "activate" ? "Activar todos los productos" : "Inactivar todos los productos"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkStatusAction === "activate"
                ? `Se activarán ${stats.inactive} producto(s) inactivo(s). Esta acción se puede revertir.`
                : `Se inactivarán ${stats.active} producto(s) activo(s). Esta acción se puede revertir.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkUpdating}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkStatusConfirm} disabled={isBulkUpdating}>
              {isBulkUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                bulkStatusAction === "activate" ? "Activar todos" : "Inactivar todos"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
