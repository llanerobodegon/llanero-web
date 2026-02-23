"use client"

import { useState, useMemo, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Image from "next/image"
import { Package, Search, Filter, Plus, MoreVertical, Download, Upload, FileSpreadsheet, Loader2, Trash2, X, DollarSign, Power, Store, SearchCheck, Check } from "lucide-react"
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
  useInventoryViewModel,
} from "@/src/viewmodels/useInventoryViewModel"
import { productService, Product } from "@/src/services/product.service"
import { inventoryService } from "@/src/services/inventory.service"
import { useWarehouseContext } from "@/src/contexts/warehouse-context"
import { createClient } from "@/lib/supabase/client"
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
    deleteProduct,
    refresh,
  } = useInventoryViewModel()

  const { selectedWarehouse, warehouses } = useWarehouseContext()

  // Export products to CSV
  const handleExportCSV = () => {
    const headers = ["Nombre", "Descripción", "SKU", "Código de barras", "Precio", "Categoría", "Subcategoría", "Estado", "Imágenes"]

    const csvRows = [
      headers.join(","),
      ...products.map((product) => {
        // Ensure imageUrls is an array of strings
        let imageUrlsArray: string[] = []
        if (Array.isArray(product.imageUrls)) {
          imageUrlsArray = product.imageUrls.map((url) => {
            // If url is a JSON string array, parse it
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
    link.setAttribute("download", `productos_${new Date().toISOString().split("T")[0]}.csv`)
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

      // Skip header row
      const dataRows = lines.slice(1)

      for (let i = 0; i < dataRows.length; i++) {
        const rowNumber = i + 2 // +2 because we skip header and rows are 1-indexed
        const values = parseCSVLine(dataRows[i])

        // Expected: Nombre, Descripción, SKU, Código de barras, Precio, Categoría, Subcategoría, Estado, Imágenes
        const [name, description, sku, barcode, priceStr, categoryName, subcategoryName, status, imagesStr] = values

        if (!name) {
          errors.push({ row: rowNumber, error: "Nombre es requerido" })
          continue
        }

        if (!priceStr || isNaN(parseFloat(priceStr))) {
          errors.push({ row: rowNumber, error: "Precio inválido" })
          continue
        }

        // Find category by name (optional for updates, required for new products)
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

        // Find subcategory by name (optional)
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

        // Parse image URLs (separated by | or JSON array format)
        let imageUrls: string[] = []
        if (imagesStr) {
          // Check if it's a JSON array format
          if (imagesStr.startsWith("[")) {
            try {
              const parsed = JSON.parse(imagesStr)
              imageUrls = Array.isArray(parsed) ? parsed : []
            } catch {
              // If parsing fails, treat as pipe-separated
              imageUrls = imagesStr.split("|").map((url) => url.trim()).filter((url) => url)
            }
          } else {
            // Pipe-separated format
            imageUrls = imagesStr.split("|").map((url) => url.trim()).filter((url) => url)
          }
        }

        // Check if product with same SKU exists
        let existingProduct = null
        if (sku) {
          existingProduct = await productService.getBySku(sku)
        }

        try {
          if (existingProduct) {
            // Update existing product - keep existing values if not provided
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
            // Create new product
            // If no category provided, product is created as inactive by default
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
        // Refresh the page to show new/updated products
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
  const [deleteTargetWarehouseIds, setDeleteTargetWarehouseIds] = useState<string[]>([])
  const [deleteAvailableWarehouses, setDeleteAvailableWarehouses] = useState<Map<string, number>>(new Map()) // warehouseId -> product count
  const [isLoadingDeleteWarehouses, setIsLoadingDeleteWarehouses] = useState(false)

  // Price update dialog state
  const [priceDialogOpen, setPriceDialogOpen] = useState(false)
  const [priceUpdates, setPriceUpdates] = useState<Record<string, string>>({})
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false)

  // Status update dialog state
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [statusUpdates, setStatusUpdates] = useState<Record<string, boolean>>({})
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  // Bulk add to warehouses state
  const [bulkAddDialogOpen, setBulkAddDialogOpen] = useState(false)
  const [isBulkAdding, setIsBulkAdding] = useState(false)
  const [bulkAddResultDialogOpen, setBulkAddResultDialogOpen] = useState(false)
  const [bulkAddResult, setBulkAddResult] = useState<{ added: number; skipped: number; errors: number } | null>(null)

  // SKU CSV import state (temporary)
  const [skuCsvModalOpen, setSkuCsvModalOpen] = useState(false)
  const [isProcessingSkuCsv, setIsProcessingSkuCsv] = useState(false)
  const [skuCsvResultOpen, setSkuCsvResultOpen] = useState(false)
  const [skuCsvResult, setSkuCsvResult] = useState<{ updated: number; notFound: string[]; errors: string[] } | null>(null)
  const [skuCsvDragging, setSkuCsvDragging] = useState(false)
  const skuCsvInputRef = useRef<HTMLInputElement>(null)
  const [skuCsvProgress, setSkuCsvProgress] = useState({ current: 0, total: 0, updated: 0, enabled: 0, notFound: 0 })
  const skuCsvStartTimeRef = useRef<number>(0)

  const processSkuCsvFile = async (file: File) => {
    if (!selectedWarehouse) return
    setIsProcessingSkuCsv(true)
    setSkuCsvProgress({ current: 0, total: 0, updated: 0, enabled: 0, notFound: 0 })
    skuCsvStartTimeRef.current = Date.now()
    let updated = 0
    let enabled = 0
    let notFoundCount = 0
    const notFound: string[] = []
    const errors: string[] = []

    try {
      const text = await file.text()
      const lines = text.split(/\r?\n/).filter((line) => line.trim())

      if (lines.length < 2) {
        toast.error("El archivo CSV está vacío o no tiene datos")
        setIsProcessingSkuCsv(false)
        return
      }

      const dataRows = lines.slice(1)
      const total = dataRows.length
      setSkuCsvProgress((prev) => ({ ...prev, total }))

      for (let i = 0; i < dataRows.length; i++) {
        const rowNumber = i + 2
        setSkuCsvProgress((prev) => ({ ...prev, current: i + 1 }))

        const values = dataRows[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""))
        const [sku, priceStr] = values

        if (!sku) {
          errors.push(`Fila ${rowNumber}: SKU vacío`)
          continue
        }

        const price = parseFloat(priceStr)
        if (isNaN(price) || price < 0) {
          errors.push(`Fila ${rowNumber}: Precio inválido para SKU "${sku}"`)
          continue
        }

        try {
          const product = await productService.getBySku(sku)
          if (!product) {
            notFound.push(sku)
            notFoundCount++
            setSkuCsvProgress((prev) => ({ ...prev, notFound: notFoundCount }))
            continue
          }

          // Update price
          await productService.update(product.id, { price })
          updated++
          setSkuCsvProgress((prev) => ({ ...prev, updated }))

          // Add to warehouse if not already there
          const { data: existing } = await supabase
            .from("warehouse_products")
            .select("product_id")
            .eq("warehouse_id", selectedWarehouse.id)
            .eq("product_id", product.id)
            .maybeSingle()

          if (!existing) {
            await supabase
              .from("warehouse_products")
              .insert({
                warehouse_id: selectedWarehouse.id,
                product_id: product.id,
                is_available: true,
              })
            enabled++
            setSkuCsvProgress((prev) => ({ ...prev, enabled }))
          }
        } catch (err) {
          errors.push(`Fila ${rowNumber}: Error procesando SKU "${sku}"`)
        }
      }

      setSkuCsvResult({ updated, notFound, errors })
      setIsProcessingSkuCsv(false)
      setSkuCsvModalOpen(false)
      setSkuCsvResultOpen(true)

      if (updated > 0) {
        refresh()
      }
    } catch (err) {
      console.error("Error processing SKU CSV:", err)
      toast.error("Error al procesar el archivo CSV")
      setIsProcessingSkuCsv(false)
      setSkuCsvModalOpen(false)
    } finally {
      if (skuCsvInputRef.current) {
        skuCsvInputRef.current.value = ""
      }
    }
  }

  // Add product options modal state
  const [addProductModalOpen, setAddProductModalOpen] = useState(false)
  const [addProductStep, setAddProductStep] = useState<"options" | "select-warehouse">("options")
  const [searchTargetWarehouseIds, setSearchTargetWarehouseIds] = useState<string[]>([])

  // Search products modal state
  const [searchProductsModalOpen, setSearchProductsModalOpen] = useState(false)
  const [searchProductsQuery, setSearchProductsQuery] = useState("")
  const [searchProductsResults, setSearchProductsResults] = useState<Product[]>([])
  const [isSearchingProducts, setIsSearchingProducts] = useState(false)
  const [warehouseProductIds, setWarehouseProductIds] = useState<Set<string>>(new Set())
  const [togglingProductId, setTogglingProductId] = useState<string | null>(null)

  const supabase = createClient()

  // Resolve the active warehouse IDs for the search modal
  const activeWarehouseIds = selectedWarehouse ? [selectedWarehouse.id] : searchTargetWarehouseIds

  // Load warehouse product IDs when modal opens
  // A product shows as "active" only if it's in ALL selected warehouses
  const loadWarehouseProductIds = useCallback(async (warehouseIds?: string[]) => {
    const wIds = warehouseIds ?? activeWarehouseIds
    if (!wIds.length) return

    // Load product IDs for each warehouse
    const results = await Promise.all(
      wIds.map(async (wId) => {
        const { data } = await supabase
          .from("warehouse_products")
          .select("product_id")
          .eq("warehouse_id", wId)
        return new Set((data || []).map((d) => d.product_id))
      })
    )

    // Intersect: product is "active" if it's in ALL selected warehouses
    if (results.length === 1) {
      setWarehouseProductIds(results[0])
    } else {
      const intersection = new Set(
        [...results[0]].filter((id) => results.every((s) => s.has(id)))
      )
      setWarehouseProductIds(intersection)
    }
  }, [activeWarehouseIds])

  // Search products for the modal
  const searchAllProducts = useCallback(async (query: string) => {
    setIsSearchingProducts(true)
    try {
      const result = await productService.getPaginated(
        { page: 1, pageSize: 20 },
        { search: query || undefined }
      )
      setSearchProductsResults(result.data)
    } catch (err) {
      console.error("Error searching products:", err)
    } finally {
      setIsSearchingProducts(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    if (!searchProductsModalOpen) return
    const timer = setTimeout(() => {
      searchAllProducts(searchProductsQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchProductsQuery, searchProductsModalOpen, searchAllProducts])

  const handleOpenSearchProducts = async (warehouseIds?: string[]) => {
    setSearchProductsQuery("")
    setSearchProductsResults([])
    setSearchProductsModalOpen(true)
    await loadWarehouseProductIds(warehouseIds)
    searchAllProducts("")
  }

  const handleToggleProductInWarehouse = async (productId: string) => {
    if (!activeWarehouseIds.length) return
    setTogglingProductId(productId)
    try {
      const isCurrentlyIn = warehouseProductIds.has(productId)
      if (isCurrentlyIn) {
        // Remove from all selected warehouses
        await Promise.all(
          activeWarehouseIds.map((wId) =>
            supabase
              .from("warehouse_products")
              .delete()
              .eq("warehouse_id", wId)
              .eq("product_id", productId)
          )
        )
        setWarehouseProductIds((prev) => {
          const next = new Set(prev)
          next.delete(productId)
          return next
        })
      } else {
        // Add to all selected warehouses (upsert to skip existing)
        const rows = activeWarehouseIds.map((wId) => ({
          warehouse_id: wId,
          product_id: productId,
          is_available: true,
        }))
        await supabase
          .from("warehouse_products")
          .upsert(rows, { onConflict: "warehouse_id,product_id" })
        setWarehouseProductIds((prev) => new Set(prev).add(productId))
      }
    } catch (err) {
      console.error("Error toggling product:", err)
      toast.error("Error al actualizar disponibilidad")
    } finally {
      setTogglingProductId(null)
    }
  }

  const handleCloseSearchProducts = () => {
    setSearchProductsModalOpen(false)
    setSearchProductsQuery("")
    setSearchProductsResults([])
    setSearchTargetWarehouseIds([])
    refresh()
  }

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

  // Load which warehouses have the given products
  const loadDeleteWarehouses = async (productIds: string[]) => {
    setIsLoadingDeleteWarehouses(true)
    try {
      const { data } = await supabase
        .from("warehouse_products")
        .select("warehouse_id, product_id")
        .in("product_id", productIds)
        .in("warehouse_id", warehouses.map((w) => w.id))

      // Count how many of the selected products each warehouse has
      const countMap = new Map<string, number>()
      for (const row of data || []) {
        countMap.set(row.warehouse_id, (countMap.get(row.warehouse_id) || 0) + 1)
      }
      setDeleteAvailableWarehouses(countMap)
    } catch (err) {
      console.error("Error loading warehouse availability:", err)
    } finally {
      setIsLoadingDeleteWarehouses(false)
    }
  }

  const handleDeleteClick = (item: ProductItem) => {
    setItemToDelete(item)
    setDeleteTargetWarehouseIds([])
    setDeleteDialogOpen(true)
    if (!selectedWarehouse) {
      loadDeleteWarehouses([item.id])
    }
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return

    const warehouseIdsToRemove = selectedWarehouse
      ? [selectedWarehouse.id]
      : deleteTargetWarehouseIds

    if (warehouseIdsToRemove.length === 0) return

    try {
      await Promise.all(
        warehouseIdsToRemove.map((wId) => deleteProduct(wId, itemToDelete.id))
      )
      const warehouseNames = warehouseIdsToRemove.map((id) => warehouses.find((w) => w.id === id)?.name).filter(Boolean).join(", ")
      toast.success(`Producto removido de ${warehouseNames}`)
    } catch (err) {
      console.error("Error removing product from warehouse:", err)
      toast.error("Error al remover el producto")
    } finally {
      setDeleteDialogOpen(false)
      setItemToDelete(null)
      setDeleteTargetWarehouseIds([])
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return

    const warehouseIdsToRemove = selectedWarehouse
      ? [selectedWarehouse.id]
      : deleteTargetWarehouseIds

    if (warehouseIdsToRemove.length === 0) return

    setIsBulkDeleting(true)
    let successCount = 0
    let errorCount = 0

    for (const productId of selectedIds) {
      try {
        await Promise.all(
          warehouseIdsToRemove.map((wId) => deleteProduct(wId, productId))
        )
        successCount++
      } catch {
        errorCount++
      }
    }

    setIsBulkDeleting(false)
    setBulkDeleteDialogOpen(false)
    setSelectedIds(new Set())
    setDeleteTargetWarehouseIds([])

    const warehouseNames = warehouseIdsToRemove.map((id) => warehouses.find((w) => w.id === id)?.name).filter(Boolean).join(", ")
    if (successCount > 0) {
      toast.success(`${successCount} producto(s) removido(s) de ${warehouseNames}`)
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} producto(s) no pudieron ser removidos`)
    }
  }

  // Get selected products for price update modal
  const selectedProducts = useMemo(() => {
    return products.filter((p) => selectedIds.has(p.id))
  }, [products, selectedIds])

  const openPriceDialog = () => {
    // Initialize price updates with current prices
    const initialPrices: Record<string, string> = {}
    selectedProducts.forEach((p) => {
      initialPrices[p.id] = p.price.toString()
    })
    setPriceUpdates(initialPrices)
    setPriceDialogOpen(true)
  }

  const handleBulkPriceUpdate = async () => {
    // Validate all prices
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
      // Refresh to show updated prices
      setTimeout(() => window.location.reload(), 500)
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} producto(s) no pudieron ser actualizados`)
    }
  }

  const openStatusDialog = () => {
    // Initialize status updates with current status
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
      // Refresh to show updated status
      setTimeout(() => window.location.reload(), 500)
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} producto(s) no pudieron ser actualizados`)
    }
  }

  const handleBulkAddToWarehouses = async () => {
    setIsBulkAdding(true)
    try {
      const result = await inventoryService.bulkAddToWarehouses()
      setBulkAddResult(result)
      setBulkAddDialogOpen(false)
      setBulkAddResultDialogOpen(true)
    } catch (err) {
      console.error("Error adding products to warehouses:", err)
      toast.error("Error al agregar productos a los bodegones")
    } finally {
      setIsBulkAdding(false)
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
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" disabled>
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
            <Button disabled>
              <Plus />
              Agregar producto
            </Button>
          </div>
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
                onClick={() => {
                  setDeleteTargetWarehouseIds([])
                  setBulkDeleteDialogOpen(true)
                  if (!selectedWarehouse) {
                    loadDeleteWarehouses([...selectedIds])
                  }
                }}
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
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setBulkAddDialogOpen(true)}>
                <Store className="mr-2 h-4 w-4" />
                Agregar a bodegones
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {selectedWarehouse && (
            <Button variant="outline" onClick={() => setSkuCsvModalOpen(true)}>
              <FileSpreadsheet className="h-4 w-4" />
              Importar SKU/Precio
            </Button>
          )}
          <Button onClick={() => { setAddProductStep("options"); setAddProductModalOpen(true) }}>
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

      {isLoading && activeSearch ? (
        <div className="rounded-lg border bg-background p-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            Buscando producto...
          </p>
        </div>
      ) : tableData.length === 0 && (activeSearch || selectedCategoryIds.length > 0 || selectedSubcategoryIds.length > 0) ? (
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
            description={selectedWarehouse ? "Busca y agrega productos a este bodegón" : "Agrega productos al catálogo para comenzar"}
            actionLabel="Agregar producto"
            onAction={() => { setAddProductStep("options"); setAddProductModalOpen(true) }}
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
      <Dialog open={bulkDeleteDialogOpen} onOpenChange={(open) => {
        if (!isBulkDeleting) {
          setBulkDeleteDialogOpen(open)
          if (!open) setDeleteTargetWarehouseIds([])
        }
      }}>
        <DialogContent className="sm:max-w-md">
          {!selectedWarehouse && deleteTargetWarehouseIds.length === 0 ? (
            <>
              <DialogHeader>
                <DialogTitle>Seleccionar bodegones</DialogTitle>
                <DialogDescription>
                  ¿De qué bodegones deseas remover los {selectedIds.size} producto(s) seleccionado(s)?
                </DialogDescription>
              </DialogHeader>
              {isLoadingDeleteWarehouses ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid gap-2 py-2">
                  {warehouses.filter((w) => deleteAvailableWarehouses.has(w.id)).map((w) => {
                    const isSelected = deleteTargetWarehouseIds.includes(w.id)
                    const productCount = deleteAvailableWarehouses.get(w.id) || 0
                    return (
                      <Button
                        key={w.id}
                        variant="outline"
                        className={`w-full justify-start gap-3 h-auto py-3 px-4 ${isSelected ? "border-primary bg-primary/5" : ""}`}
                        onClick={() => {
                          setDeleteTargetWarehouseIds((prev) =>
                            prev.includes(w.id)
                              ? prev.filter((id) => id !== w.id)
                              : [...prev, w.id]
                          )
                        }}
                      >
                        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
                          {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                          <Store className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{w.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {productCount} de {selectedIds.size} producto(s)
                        </span>
                      </Button>
                    )
                  })}
                  {warehouses.filter((w) => deleteAvailableWarehouses.has(w.id)).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Los productos seleccionados no están disponibles en ningún bodegón
                    </p>
                  )}
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setBulkDeleteDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-destructive text-white hover:bg-destructive/90"
                  disabled={deleteTargetWarehouseIds.length === 0}
                  onClick={handleBulkDelete}
                >
                  Eliminar
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>¿Remover {selectedIds.size} producto(s)?</DialogTitle>
                <DialogDescription>
                  Se removerán los productos seleccionados de <strong>{selectedWarehouse?.name ?? deleteTargetWarehouseIds.map((id) => warehouses.find((w) => w.id === id)?.name).filter(Boolean).join(", ")}</strong>. Los productos seguirán existiendo en el catálogo.
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => { setBulkDeleteDialogOpen(false); setDeleteTargetWarehouseIds([]) }} disabled={isBulkDeleting}>
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-destructive text-white hover:bg-destructive/90"
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                >
                  {isBulkDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    "Eliminar"
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => {
        setDeleteDialogOpen(open)
        if (!open) { setItemToDelete(null); setDeleteTargetWarehouseIds([]) }
      }}>
        <DialogContent className="sm:max-w-md">
          {!selectedWarehouse && deleteTargetWarehouseIds.length === 0 ? (
            <>
              <DialogHeader>
                <DialogTitle>Seleccionar bodegones</DialogTitle>
                <DialogDescription>
                  ¿De qué bodegones deseas remover <strong>{itemToDelete?.name}</strong>?
                </DialogDescription>
              </DialogHeader>
              {isLoadingDeleteWarehouses ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid gap-2 py-2">
                  {warehouses.filter((w) => deleteAvailableWarehouses.has(w.id)).map((w) => {
                    const isSelected = deleteTargetWarehouseIds.includes(w.id)
                    return (
                      <Button
                        key={w.id}
                        variant="outline"
                        className={`w-full justify-start gap-3 h-auto py-3 px-4 ${isSelected ? "border-primary bg-primary/5" : ""}`}
                        onClick={() => {
                          setDeleteTargetWarehouseIds((prev) =>
                            prev.includes(w.id)
                              ? prev.filter((id) => id !== w.id)
                              : [...prev, w.id]
                          )
                        }}
                      >
                        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
                          {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{w.name}</span>
                        </div>
                      </Button>
                    )
                  })}
                  {warehouses.filter((w) => deleteAvailableWarehouses.has(w.id)).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Este producto no está disponible en ningún bodegón
                    </p>
                  )}
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => { setDeleteDialogOpen(false); setItemToDelete(null) }}>
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-destructive text-white hover:bg-destructive/90"
                  disabled={deleteTargetWarehouseIds.length === 0}
                  onClick={handleConfirmDelete}
                >
                  Eliminar
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>¿Remover producto?</DialogTitle>
                <DialogDescription>
                  Se removerá <strong>{itemToDelete?.name}</strong> de <strong>{selectedWarehouse?.name ?? deleteTargetWarehouseIds.map((id) => warehouses.find((w) => w.id === id)?.name).filter(Boolean).join(", ")}</strong>. El producto seguirá existiendo en el catálogo.
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => { setDeleteDialogOpen(false); setItemToDelete(null); setDeleteTargetWarehouseIds([]) }}>
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-destructive text-white hover:bg-destructive/90"
                  onClick={handleConfirmDelete}
                >
                  Eliminar
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Import CSV Modal */}
      <Dialog open={importModalOpen} onOpenChange={(open) => !isImporting && setImportModalOpen(open)}>
        <DialogContent className="sm:max-w-lg" showCloseButton={!isImporting}>
          <DialogHeader>
            <DialogTitle>Importar productos desde CSV</DialogTitle>
            <DialogDescription>
              Sube un archivo CSV con los productos que deseas importar
            </DialogDescription>
          </DialogHeader>

          {/* Drop Zone */}
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

          {/* Format Info */}
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

      {/* Bulk Add to Warehouses Confirmation Dialog */}
      <AlertDialog open={bulkAddDialogOpen} onOpenChange={setBulkAddDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Agregar productos a bodegones</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>Esta acción agregará todos los productos a todos los bodegones activos como disponibles.</p>
                <p className="mt-2 text-muted-foreground">
                  Los productos que ya estén en un bodegón no serán duplicados.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkAdding}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkAddToWarehouses}
              disabled={isBulkAdding}
            >
              {isBulkAdding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Agregando...
                </>
              ) : (
                "Agregar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Add Result Dialog */}
      <AlertDialog open={bulkAddResultDialogOpen} onOpenChange={setBulkAddResultDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resultado</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                {bulkAddResult && (
                  <>
                    {bulkAddResult.added > 0 && (
                      <p className="text-green-600">
                        {bulkAddResult.added} producto(s) agregado(s) a bodegones
                      </p>
                    )}
                    {bulkAddResult.skipped > 0 && (
                      <p className="text-muted-foreground">
                        {bulkAddResult.skipped} producto(s) omitido(s) (ya existían)
                      </p>
                    )}
                    {bulkAddResult.errors > 0 && (
                      <p className="text-destructive">
                        {bulkAddResult.errors} error(es) al agregar
                      </p>
                    )}
                    {bulkAddResult.added === 0 && bulkAddResult.skipped === 0 && bulkAddResult.errors === 0 && (
                      <p className="text-muted-foreground">
                        No hay productos o bodegones disponibles
                      </p>
                    )}
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setBulkAddResultDialogOpen(false)}>
              Cerrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* SKU CSV Import (temporary) */}
      <input
        ref={skuCsvInputRef}
        type="file"
        accept=".csv"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) processSkuCsvFile(file)
        }}
        className="hidden"
      />

      <Dialog open={skuCsvModalOpen} onOpenChange={(open) => !isProcessingSkuCsv && setSkuCsvModalOpen(open)}>
        <DialogContent className="sm:max-w-lg" showCloseButton={!isProcessingSkuCsv}>
          <DialogHeader>
            <DialogTitle>Importar SKU / Precio</DialogTitle>
            <DialogDescription>
              Actualiza precios y agrega productos a <strong>{selectedWarehouse?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          {isProcessingSkuCsv ? (() => {
            const elapsed = (Date.now() - skuCsvStartTimeRef.current) / 1000
            const avgPerItem = skuCsvProgress.current > 0 ? elapsed / skuCsvProgress.current : 0
            const remaining = avgPerItem * (skuCsvProgress.total - skuCsvProgress.current)
            const mins = Math.floor(remaining / 60)
            const secs = Math.ceil(remaining % 60)
            const etaText = skuCsvProgress.current > 2
              ? mins > 0 ? `~${mins}m ${secs}s restantes` : `~${secs}s restantes`
              : "Calculando..."
            return (
            <div className="border-2 border-primary/30 bg-primary/5 rounded-lg p-6 space-y-4">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm font-medium">
                  Producto {skuCsvProgress.current}/{skuCsvProgress.total}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{etaText}</p>
                {skuCsvProgress.total > 0 && (
                  <div className="w-full bg-muted rounded-full h-2 mt-3">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-200"
                      style={{ width: `${(skuCsvProgress.current / skuCsvProgress.total) * 100}%` }}
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-background border p-2">
                  <p className="text-lg font-semibold text-green-600">{skuCsvProgress.updated}</p>
                  <p className="text-xs text-muted-foreground">Actualizados</p>
                </div>
                <div className="rounded-lg bg-background border p-2">
                  <p className="text-lg font-semibold text-blue-600">{skuCsvProgress.enabled}</p>
                  <p className="text-xs text-muted-foreground">Habilitados</p>
                </div>
                <div className="rounded-lg bg-background border p-2">
                  <p className="text-lg font-semibold text-amber-600">{skuCsvProgress.notFound}</p>
                  <p className="text-xs text-muted-foreground">Sin match</p>
                </div>
              </div>
            </div>)
          })() : (
            <div
              onClick={() => skuCsvInputRef.current?.click()}
              onDrop={(e) => {
                e.preventDefault()
                setSkuCsvDragging(false)
                const file = e.dataTransfer.files?.[0]
                if (file && file.name.endsWith(".csv")) {
                  processSkuCsvFile(file)
                } else {
                  toast.error("Por favor, selecciona un archivo CSV válido")
                }
              }}
              onDragOver={(e) => { e.preventDefault(); setSkuCsvDragging(true) }}
              onDragLeave={(e) => { e.preventDefault(); setSkuCsvDragging(false) }}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                skuCsvDragging
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

          {!isProcessingSkuCsv && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">Formato esperado:</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Columna 1: <strong>SKU</strong> — Columna 2: <strong>Precio</strong></p>
                <p className="mt-2">Por cada fila se busca el producto por SKU, se actualiza el precio y se agrega como disponible en <strong>{selectedWarehouse?.name}</strong>.</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={skuCsvResultOpen} onOpenChange={setSkuCsvResultOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resultado de importación</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {skuCsvResult && (
                  <>
                    {skuCsvResult.updated > 0 && (
                      <p className="text-green-600">
                        {skuCsvResult.updated} producto(s) actualizado(s) y agregado(s) al bodegón
                      </p>
                    )}
                    {skuCsvResult.notFound.length > 0 && (
                      <div>
                        <p className="text-amber-600 mb-1">
                          {skuCsvResult.notFound.length} SKU(s) no encontrado(s):
                        </p>
                        <div className="max-h-32 overflow-y-auto text-sm text-muted-foreground">
                          {skuCsvResult.notFound.map((sku, i) => (
                            <p key={i}>{sku}</p>
                          ))}
                        </div>
                      </div>
                    )}
                    {skuCsvResult.errors.length > 0 && (
                      <div>
                        <p className="text-destructive mb-1">
                          {skuCsvResult.errors.length} error(es):
                        </p>
                        <div className="max-h-32 overflow-y-auto text-sm text-muted-foreground">
                          {skuCsvResult.errors.map((err, i) => (
                            <p key={i}>{err}</p>
                          ))}
                        </div>
                      </div>
                    )}
                    {skuCsvResult.updated === 0 && skuCsvResult.notFound.length === 0 && skuCsvResult.errors.length === 0 && (
                      <p className="text-muted-foreground">No se procesaron productos</p>
                    )}
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {skuCsvResult && skuCsvResult.notFound.length > 0 && (
              <Button
                variant="outline"
                className="mr-auto"
                onClick={() => {
                  const csvContent = "SKU\n" + skuCsvResult.notFound.join("\n")
                  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
                  const url = URL.createObjectURL(blob)
                  const link = document.createElement("a")
                  link.setAttribute("href", url)
                  link.setAttribute("download", `sku_sin_match_${new Date().toISOString().split("T")[0]}.csv`)
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                  URL.revokeObjectURL(url)
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar sin match
              </Button>
            )}
            <AlertDialogAction onClick={() => setSkuCsvResultOpen(false)}>
              Cerrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Product Options Modal */}
      <Dialog open={addProductModalOpen} onOpenChange={(open) => {
        setAddProductModalOpen(open)
        if (!open) {
          setAddProductStep("options")
          setSearchTargetWarehouseIds([])
        }
      }}>
        <DialogContent className="sm:max-w-md">
          {addProductStep === "options" ? (
            <>
              <DialogHeader>
                <DialogTitle>Agregar producto</DialogTitle>
                <DialogDescription>
                  {selectedWarehouse
                    ? <>¿Cómo deseas agregar el producto a <strong>{selectedWarehouse.name}</strong>?</>
                    : "¿Cómo deseas agregar el producto?"
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-4 px-4"
                  onClick={() => {
                    if (selectedWarehouse) {
                      setAddProductModalOpen(false)
                      handleOpenSearchProducts()
                    } else {
                      setAddProductStep("select-warehouse")
                    }
                  }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <SearchCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Desde el catálogo</p>
                    <p className="text-xs text-muted-foreground">
                      Busca un producto existente y agrégalo a un bodegón
                    </p>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-4 px-4"
                  onClick={() => {
                    setAddProductModalOpen(false)
                    router.push(selectedWarehouse ? `/admin/stock/new?warehouse=${selectedWarehouse.id}` : "/admin/stock/new")
                  }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Plus className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Nuevo producto</p>
                    <p className="text-xs text-muted-foreground">
                      Crea un producto nuevo desde cero
                    </p>
                  </div>
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Seleccionar bodegones</DialogTitle>
                <DialogDescription>
                  Selecciona los bodegones donde deseas agregar productos del catálogo
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-2 py-2">
                {warehouses.map((w) => {
                  const isSelected = searchTargetWarehouseIds.includes(w.id)
                  return (
                    <Button
                      key={w.id}
                      variant="outline"
                      className={`w-full justify-start gap-3 h-auto py-3 px-4 ${isSelected ? "border-primary bg-primary/5" : ""}`}
                      onClick={() => {
                        setSearchTargetWarehouseIds((prev) =>
                          prev.includes(w.id)
                            ? prev.filter((id) => id !== w.id)
                            : [...prev, w.id]
                        )
                      }}
                    >
                      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
                        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{w.name}</span>
                      </div>
                    </Button>
                  )
                })}
              </div>
              <Button
                className="w-full"
                disabled={searchTargetWarehouseIds.length === 0}
                onClick={() => {
                  setAddProductModalOpen(false)
                  setAddProductStep("options")
                  handleOpenSearchProducts(searchTargetWarehouseIds)
                }}
              >
                Continuar
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Search Products Modal */}
      <Dialog open={searchProductsModalOpen} onOpenChange={handleCloseSearchProducts}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SearchCheck className="h-5 w-5" />
              Buscar productos
            </DialogTitle>
            <DialogDescription>
              Activa o desactiva productos en <strong>{selectedWarehouse?.name ?? searchTargetWarehouseIds.map((id) => warehouses.find((w) => w.id === id)?.name).filter(Boolean).join(", ")}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre..."
              value={searchProductsQuery}
              onChange={(e) => setSearchProductsQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {isSearchingProducts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : searchProductsResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Package className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  {searchProductsQuery ? "No se encontraron productos" : "No hay productos disponibles"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {searchProductsResults.map((product) => {
                  const isInWarehouse = warehouseProductIds.has(product.id)
                  const isToggling = togglingProductId === product.id
                  return (
                    <div
                      key={product.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        isInWarehouse ? "border-primary bg-muted/30" : "bg-background"
                      }`}
                    >
                      <div className="relative h-10 w-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
                        {product.imageUrls?.[0] ? (
                          <Image
                            src={product.imageUrls[0]}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{product.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {product.category && <span>{product.category.name}</span>}
                          <span>${product.price.toFixed(2)}</span>
                        </div>
                      </div>
                      <Switch
                        checked={isInWarehouse}
                        onCheckedChange={() => handleToggleProductInWarehouse(product.id)}
                        disabled={isToggling}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
