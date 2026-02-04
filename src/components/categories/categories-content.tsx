"use client"

import { useState, useMemo, useRef } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { Plus, FolderOpen, Upload, X, Loader2, Trash2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { DataTable } from "@/src/components/categories/data-table"
import { getColumns } from "@/src/components/categories/columns"
import { CategoriesSkeleton } from "@/src/components/categories/categories-skeleton"
import { EmptyState } from "@/components/empty-state"
import {
  useCategoriesViewModel,
  CategoryWithProductCount,
} from "@/src/viewmodels/useCategoriesViewModel"
import { CreateCategoryData } from "@/src/models/warehouse.model"
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

export function CategoriesContent() {
  const {
    categories,
    isLoading,
    error,
    pagination,
    setPage,
    setPageSize,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategoriesViewModel()

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryWithProductCount | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [isActive, setIsActive] = useState(true)

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryWithProductCount | null>(null)

  // Filter state
  const [searchQuery, setSearchQuery] = useState("")

  // Filtered data
  const filteredCategories = useMemo(() => {
    return categories.filter((category) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [categories, searchQuery])

  const resetForm = () => {
    setName("")
    setIsActive(true)
    setImageFile(null)
    setImagePreview(null)
    setImageError(null)
    setEditingCategory(null)
  }

  const openCreateDrawer = () => {
    resetForm()
    setIsDrawerOpen(true)
  }

  const openEditDrawer = (category: CategoryWithProductCount) => {
    setEditingCategory(category)
    setName(category.name)
    setIsActive(category.isActive)
    setImagePreview(category.imageUrl)
    setImageFile(null)
    setImageError(null)
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
      setImageError(error)
      return
    }

    setImageError(null)
    setImageFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
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

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setImageError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async () => {
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      let imageUrl: string | undefined = editingCategory?.imageUrl || undefined

      // Upload new image if selected
      if (imageFile) {
        setIsUploadingImage(true)
        try {
          imageUrl = await uploadService.uploadCategoryImage(imageFile)
        } catch (err) {
          console.error("Error uploading image:", err)
          setImageError("Error al subir la imagen")
          setIsSubmitting(false)
          setIsUploadingImage(false)
          return
        }
        setIsUploadingImage(false)
      } else if (!imagePreview && editingCategory?.imageUrl) {
        // Image was removed
        imageUrl = undefined
      }

      const data: CreateCategoryData = {
        name: name.trim(),
        imageUrl,
        isActive,
      }

      if (editingCategory) {
        await updateCategory(editingCategory.id, data)
        toast.success("Categoría actualizada correctamente")
      } else {
        await createCategory(data)
        toast.success("Categoría creada correctamente")
      }

      handleCloseDrawer()
    } catch (err) {
      console.error("Error saving category:", err)
      toast.error("Error al guardar la categoría")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (category: CategoryWithProductCount) => {
    setCategoryToDelete(category)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return

    try {
      await deleteCategory(categoryToDelete.id)
      toast.success("Categoría eliminada correctamente")
    } catch (err) {
      console.error("Error deleting category:", err)
      toast.error("Error al eliminar la categoría")
    } finally {
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
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
      <div className="flex flex-1 flex-col gap-4 px-4 py-[50px] mx-auto w-full max-w-[1200px]">
        {/* Title Section */}
        <div className="mb-[25px]">
          <h1 className="text-2xl font-semibold">Categorías</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona las categorías de productos
          </p>
        </div>

        {/* Action Section */}
        <div className="flex items-center gap-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar categoría..."
              value=""
              readOnly
              disabled
              className="pl-9 w-64"
            />
          </div>
          <Button disabled className="ml-auto">
            <Plus />
            Agregar categoría
          </Button>
        </div>

        <CategoriesSkeleton />
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
          Categorías{" "}
          <span className="text-muted-foreground font-normal">
            ({pagination.totalCount})
          </span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Gestiona las categorías de productos
        </p>
      </div>

      {/* Action Section */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar categoría..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-64"
          />
        </div>
        <Button onClick={openCreateDrawer} className="ml-auto">
          <Plus />
          Agregar categoría
        </Button>
      </div>

      {filteredCategories.length === 0 && searchQuery ? (
        <div className="rounded-lg border bg-background p-8 text-center">
          <p className="text-muted-foreground">No se encontraron categorías con los filtros aplicados</p>
          <Button
            variant="link"
            onClick={() => setSearchQuery("")}
            className="mt-2"
          >
            Limpiar filtros
          </Button>
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-lg border bg-background">
          <EmptyState
            icon={FolderOpen}
            title="No hay categorías"
            description="Crea tu primera categoría para organizar tus productos"
            actionLabel="Agregar categoría"
            onAction={openCreateDrawer}
          />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredCategories}
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
                  <FolderOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <SheetTitle>
                    {editingCategory ? "Editar Categoría" : "Agregar Categoría"}
                  </SheetTitle>
                  <SheetDescription>
                    {editingCategory
                      ? "Modifica la información de la categoría"
                      : "Completa la información de la categoría"}
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
                  Nombre de la Categoría <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Ej: Bebidas"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label>Imagen</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES.join(",")}
                  onChange={handleFileInputChange}
                  className="hidden"
                  disabled={isSubmitting}
                />

                {imagePreview ? (
                  <div className="relative rounded-lg border p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted">
                        <Image
                          src={imagePreview}
                          alt="Image preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {imageFile?.name || "Imagen actual"}
                        </p>
                        {imageFile && (
                          <p className="text-xs text-muted-foreground">
                            {(imageFile.size / 1024).toFixed(1)} KB
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={removeImage}
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
                    {isUploadingImage ? (
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

                {imageError && (
                  <p className="text-sm text-destructive">{imageError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Estado</Label>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Categoría activa
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
                    {isUploadingImage
                      ? "Subiendo imagen..."
                      : editingCategory
                      ? "Guardando..."
                      : "Agregando..."}
                  </>
                ) : editingCategory ? (
                  "Guardar cambios"
                ) : (
                  "Agregar Categoría"
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
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la
              categoría <strong>{categoryToDelete?.name}</strong> y todos sus
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
