"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { Plus, Store, Upload, X, Loader2, Trash2, Search, Package, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { DataTable } from "@/src/components/warehouses/data-table"
import { getColumns } from "@/src/components/warehouses/columns"
import { WarehousesSkeleton } from "@/src/components/warehouses/warehouses-skeleton"
import { EmptyState } from "@/components/empty-state"
import {
  useWarehousesViewModel,
  WarehouseWithProductCount,
} from "@/src/viewmodels/useWarehousesViewModel"
import { CreateWarehouseData } from "@/src/models/warehouse.model"
import { uploadService } from "@/src/services/upload.service"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
import { Separator } from "@/components/ui/separator"
import { inventoryService, InventoryItem } from "@/src/services/inventory.service"
import { useWarehouseContext } from "@/src/contexts/warehouse-context"

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"]
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function WarehousesContent() {
  const {
    warehouses,
    isLoading,
    error,
    pagination,
    setPage,
    setPageSize,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
  } = useWarehousesViewModel()

  const { refreshWarehouses } = useWarehouseContext()

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseWithProductCount | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [deliveryFee, setDeliveryFee] = useState("")

  // Logo state
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [warehouseToDelete, setWarehouseToDelete] = useState<WarehouseWithProductCount | null>(null)

  // Products modal state
  const [productsModalOpen, setProductsModalOpen] = useState(false)
  const [selectedWarehouseForProducts, setSelectedWarehouseForProducts] = useState<WarehouseWithProductCount | null>(null)
  const [warehouseProducts, setWarehouseProducts] = useState<InventoryItem[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)

  // Filter state
  const [searchQuery, setSearchQuery] = useState("")

  // Filtered data
  const filteredWarehouses = useMemo(() => {
    return warehouses.filter((warehouse) =>
      warehouse.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [warehouses, searchQuery])

  const resetForm = () => {
    setName("")
    setAddress("")
    setPhone("")
    setDeliveryFee("")
    setIsActive(true)
    setLogoFile(null)
    setLogoPreview(null)
    setLogoError(null)
    setEditingWarehouse(null)
  }

  const openCreateDrawer = () => {
    resetForm()
    setIsDrawerOpen(true)
  }

  const openEditDrawer = (warehouse: WarehouseWithProductCount) => {
    setEditingWarehouse(warehouse)
    setName(warehouse.name)
    setAddress(warehouse.address || "")
    setPhone(warehouse.phone || "")
    setDeliveryFee(warehouse.deliveryFee ? warehouse.deliveryFee.toString() : "")
    setIsActive(warehouse.isActive)
    setLogoPreview(warehouse.logoUrl)
    setLogoFile(null)
    setLogoError(null)
    setIsDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
    resetForm()
  }

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return "Formato no válido. Usa PNG, JPG, GIF o WEBP"
    }
    if (file.size > MAX_FILE_SIZE) {
      return "El archivo es muy grande. Máximo 5MB"
    }
    return null
  }

  const handleFileSelect = (file: File) => {
    const error = validateFile(file)
    if (error) {
      setLogoError(error)
      return
    }

    setLogoError(null)
    setLogoFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const removeLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    setLogoError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async () => {
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      let logoUrl: string | undefined = editingWarehouse?.logoUrl || undefined

      // Upload new logo if selected
      if (logoFile) {
        setIsUploadingLogo(true)
        try {
          logoUrl = await uploadService.uploadWarehouseLogo(logoFile)
        } catch (err) {
          console.error("Error uploading logo:", err)
          setLogoError("Error al subir la imagen")
          setIsSubmitting(false)
          setIsUploadingLogo(false)
          return
        }
        setIsUploadingLogo(false)
      } else if (!logoPreview && editingWarehouse?.logoUrl) {
        // Logo was removed
        logoUrl = undefined
      }

      const data: CreateWarehouseData = {
        name: name.trim(),
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        logoUrl,
        deliveryFee: deliveryFee ? parseFloat(deliveryFee) : 0,
        isActive,
      }

      if (editingWarehouse) {
        await updateWarehouse(editingWarehouse.id, data)
        toast.success("Bodegón actualizado correctamente")
      } else {
        await createWarehouse(data)
        toast.success("Bodegón creado correctamente")
      }

      await refreshWarehouses()
      handleCloseDrawer()
    } catch (err) {
      console.error("Error saving warehouse:", err)
      toast.error("Error al guardar el bodegón")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (warehouse: WarehouseWithProductCount) => {
    setWarehouseToDelete(warehouse)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!warehouseToDelete) return

    try {
      await deleteWarehouse(warehouseToDelete.id)
      await refreshWarehouses()
      toast.success("Bodegón eliminado correctamente")
    } catch (err) {
      console.error("Error deleting warehouse:", err)
      toast.error("Error al eliminar el bodegón")
    } finally {
      setDeleteDialogOpen(false)
      setWarehouseToDelete(null)
    }
  }

  const fetchWarehouseProducts = useCallback(async (warehouseId: string) => {
    setIsLoadingProducts(true)
    try {
      const result = await inventoryService.getPaginated(
        { page: 1, pageSize: 100 },
        { warehouseId }
      )
      setWarehouseProducts(result.data)
    } catch (err) {
      console.error("Error fetching warehouse products:", err)
      toast.error("Error al cargar los productos")
    } finally {
      setIsLoadingProducts(false)
    }
  }, [])

  const handleViewProducts = (warehouse: WarehouseWithProductCount) => {
    setSelectedWarehouseForProducts(warehouse)
    setProductsModalOpen(true)
    fetchWarehouseProducts(warehouse.id)
  }

  const handleCloseProductsModal = () => {
    setProductsModalOpen(false)
    setSelectedWarehouseForProducts(null)
    setWarehouseProducts([])
  }

  const columns = useMemo(
    () =>
      getColumns({
        onEdit: openEditDrawer,
        onDelete: handleDeleteClick,
        onViewProducts: handleViewProducts,
      }),
    [handleViewProducts]
  )

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 px-4 py-[50px] mx-auto w-full max-w-[1200px]">
        {/* Title Section */}
        <div className="mb-[25px]">
          <h1 className="text-2xl font-semibold">Bodegones</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los bodegones de tu negocio
          </p>
        </div>

        {/* Action Section */}
        <div className="flex items-center gap-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar bodegón..."
              value=""
              readOnly
              disabled
              className="pl-9 w-64"
            />
          </div>
          <Button disabled className="ml-auto">
            <Plus />
            Agregar bodegón
          </Button>
        </div>

        <WarehousesSkeleton />
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
          Bodegones{" "}
          <span className="text-muted-foreground font-normal">
            ({pagination.totalCount})
          </span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Gestiona los bodegones de tu negocio
        </p>
      </div>

      {/* Action Section */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar bodegón..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-64"
          />
        </div>
        <Button onClick={openCreateDrawer} className="ml-auto">
          <Plus />
          Agregar bodegón
        </Button>
      </div>

      {filteredWarehouses.length === 0 && searchQuery ? (
        <div className="rounded-lg border bg-background p-8 text-center">
          <p className="text-muted-foreground">No se encontraron bodegones con los filtros aplicados</p>
          <Button
            variant="link"
            onClick={() => setSearchQuery("")}
            className="mt-2"
          >
            Limpiar filtros
          </Button>
        </div>
      ) : warehouses.length === 0 ? (
        <div className="rounded-lg border bg-background">
          <EmptyState
            icon={Store}
            title="No hay bodegones"
            description="Crea tu primer bodegón para comenzar a gestionar tu inventario"
            actionLabel="Agregar bodegón"
            onAction={openCreateDrawer}
          />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredWarehouses}
          pagination={pagination}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}

      {/* Create/Edit Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent side="right" className="flex flex-col gap-0">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Store className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <SheetTitle>
                    {editingWarehouse ? "Editar Bodegón" : "Agregar Bodegón"}
                  </SheetTitle>
                  <SheetDescription>
                    {editingWarehouse
                      ? "Modifica la información del bodegón"
                      : "Completa la información del bodegón"}
                  </SheetDescription>
                </div>
              </div>
              <button
                onClick={handleCloseDrawer}
                className="p-1.5 rounded-full bg-muted hover:bg-muted/80 cursor-pointer transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
          </SheetHeader>

          <Separator />

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nombre del Bodegón <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Ej: Bodegón Central"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Textarea
                  id="address"
                  placeholder="Av. Principal #123, Centro"
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  placeholder="+58 412 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryFee">Costo de Delivery ($)</Label>
                <Input
                  id="deliveryFee"
                  type="number"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label>Logo</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES.join(",")}
                  onChange={handleFileInputChange}
                  className="hidden"
                  disabled={isSubmitting}
                />

                {logoPreview ? (
                  <div className="relative rounded-lg border p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted">
                        <Image
                          src={logoPreview}
                          alt="Logo preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {logoFile?.name || "Logo actual"}
                        </p>
                        {logoFile && (
                          <p className="text-xs text-muted-foreground">
                            {(logoFile.size / 1024).toFixed(1)} KB
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={removeLogo}
                        disabled={isSubmitting}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      isSubmitting
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:border-primary/50"
                    }`}
                  >
                    {isUploadingLogo ? (
                      <Loader2 className="h-8 w-8 mx-auto text-muted-foreground mb-2 animate-spin" />
                    ) : (
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    )}
                    <p className="text-sm text-muted-foreground">
                      Arrastra y suelta o{" "}
                      <span className="text-primary">selecciona un archivo</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, GIF o WEBP (máx. 5MB)
                    </p>
                  </div>
                )}

                {logoError && (
                  <p className="text-sm text-destructive">{logoError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Estado</Label>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Bodegón activo
                  </span>
                  <Switch
                    checked={isActive}
                    onCheckedChange={setIsActive}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          </div>

          <SheetFooter className="border-t pt-4">
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCloseDrawer}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={!name.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isUploadingLogo
                      ? "Subiendo imagen..."
                      : editingWarehouse
                      ? "Guardando..."
                      : "Agregando..."}
                  </>
                ) : editingWarehouse ? (
                  "Guardar cambios"
                ) : (
                  "Agregar Bodegón"
                )}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar bodegón?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el
              bodegón <strong>{warehouseToDelete?.name}</strong> y todos sus
              datos asociados.
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

      {/* Products Modal */}
      <Dialog open={productsModalOpen} onOpenChange={handleCloseProductsModal}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Productos en {selectedWarehouseForProducts?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedWarehouseForProducts?.productCount} producto(s) en este bodegón
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {isLoadingProducts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : warehouseProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Package className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No hay productos en este bodegón</p>
              </div>
            ) : (
              <div className="space-y-2">
                {warehouseProducts.map((item) => (
                  <div
                    key={`${item.warehouseId}-${item.productId}`}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                  >
                    {/* Product Image */}
                    <div className="relative h-12 w-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      {item.product.imageUrls?.[0] ? (
                        <Image
                          src={item.product.imageUrls[0]}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.product.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {item.product.sku && <span>SKU: {item.product.sku}</span>}
                        {item.product.category && (
                          <span>{item.product.category.name}</span>
                        )}
                      </div>
                    </div>

                    {/* Price & Availability */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-muted-foreground text-xs">Precio</p>
                        <p className="font-medium flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {item.product.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground text-xs">Estado</p>
                        <p className={`font-medium text-xs ${item.isAvailable ? "text-green-600" : "text-muted-foreground"}`}>
                          {item.isAvailable ? "Disponible" : "No disponible"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
