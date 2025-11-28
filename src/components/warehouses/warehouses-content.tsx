"use client"

import { useState, useMemo, useRef } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { Plus, Store, Upload, X, Loader2, Trash2 } from "lucide-react"
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
import { Separator } from "@/components/ui/separator"

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"]
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function WarehousesContent() {
  const {
    warehouses,
    isLoading,
    error,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
  } = useWarehousesViewModel()

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseWithProductCount | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [isActive, setIsActive] = useState(true)

  // Logo state
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [warehouseToDelete, setWarehouseToDelete] = useState<WarehouseWithProductCount | null>(null)

  const resetForm = () => {
    setName("")
    setAddress("")
    setPhone("")
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
        isActive,
      }

      if (editingWarehouse) {
        await updateWarehouse(editingWarehouse.id, data)
        toast.success("Bodegón actualizado correctamente")
      } else {
        await createWarehouse(data)
        toast.success("Bodegón creado correctamente")
      }

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
      toast.success("Bodegón eliminado correctamente")
    } catch (err) {
      console.error("Error deleting warehouse:", err)
      toast.error("Error al eliminar el bodegón")
    } finally {
      setDeleteDialogOpen(false)
      setWarehouseToDelete(null)
    }
  }

  const columns = useMemo(
    () =>
      getColumns({
        onEdit: openEditDrawer,
        onDelete: handleDeleteClick,
      }),
    []
  )

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 mx-auto w-full max-w-[1200px]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Bodegones</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona los bodegones de tu negocio
            </p>
          </div>
          <Button disabled>
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
    <div className="flex flex-1 flex-col gap-4 p-4 mx-auto w-full max-w-[1200px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Bodegones{" "}
            <span className="text-muted-foreground font-normal">
              ({warehouses.length})
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los bodegones de tu negocio
          </p>
        </div>
        <Button onClick={openCreateDrawer}>
          <Plus />
          Agregar bodegón
        </Button>
      </div>

      {warehouses.length === 0 ? (
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
        <DataTable columns={columns} data={warehouses} />
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
    </div>
  )
}
