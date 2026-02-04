"use client"

import { useState, useMemo, useRef } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { Plus, Layers, Upload, X, Loader2, Trash2, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable } from "@/src/components/subcategories/data-table"
import { getColumns } from "@/src/components/subcategories/columns"
import { SubcategoriesSkeleton } from "@/src/components/subcategories/subcategories-skeleton"
import { EmptyState } from "@/components/empty-state"
import {
  useSubcategoriesViewModel,
  SubcategoryWithProductCount,
} from "@/src/viewmodels/useSubcategoriesViewModel"
import { CreateSubcategoryData } from "@/src/models/warehouse.model"
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

export function SubcategoriesContent() {
  const {
    subcategories,
    categories,
    isLoading,
    error,
    pagination,
    setPage,
    setPageSize,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
  } = useSubcategoriesViewModel()

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingSubcategory, setEditingSubcategory] = useState<SubcategoryWithProductCount | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [isActive, setIsActive] = useState(true)

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [subcategoryToDelete, setSubcategoryToDelete] = useState<SubcategoryWithProductCount | null>(null)

  // Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])

  // Filtered data
  const filteredSubcategories = useMemo(() => {
    return subcategories.filter((subcategory) => {
      const matchesSearch = subcategory.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
      const matchesCategory =
        selectedCategoryIds.length === 0 ||
        selectedCategoryIds.includes(subcategory.categoryId)
      return matchesSearch && matchesCategory
    })
  }, [subcategories, searchQuery, selectedCategoryIds])

  const toggleCategoryFilter = (categoryId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const resetForm = () => {
    setName("")
    setCategoryId("")
    setIsActive(true)
    setImageFile(null)
    setImagePreview(null)
    setImageError(null)
    setEditingSubcategory(null)
  }

  const openCreateDrawer = () => {
    resetForm()
    setIsDrawerOpen(true)
  }

  const openEditDrawer = (subcategory: SubcategoryWithProductCount) => {
    setEditingSubcategory(subcategory)
    setName(subcategory.name)
    setCategoryId(subcategory.categoryId)
    setIsActive(subcategory.isActive)
    setImagePreview(subcategory.imageUrl)
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
    if (!name.trim() || !categoryId) return

    setIsSubmitting(true)
    try {
      let imageUrl: string | undefined = editingSubcategory?.imageUrl || undefined

      // Upload new image if selected
      if (imageFile) {
        setIsUploadingImage(true)
        try {
          imageUrl = await uploadService.uploadSubcategoryImage(imageFile)
        } catch (err) {
          console.error("Error uploading image:", err)
          setImageError("Error al subir la imagen")
          setIsSubmitting(false)
          setIsUploadingImage(false)
          return
        }
        setIsUploadingImage(false)
      } else if (!imagePreview && editingSubcategory?.imageUrl) {
        // Image was removed
        imageUrl = undefined
      }

      const data: CreateSubcategoryData = {
        name: name.trim(),
        categoryId,
        imageUrl,
        isActive,
      }

      if (editingSubcategory) {
        await updateSubcategory(editingSubcategory.id, data)
        toast.success("Subcategoría actualizada correctamente")
      } else {
        await createSubcategory(data)
        toast.success("Subcategoría creada correctamente")
      }

      handleCloseDrawer()
    } catch (err) {
      console.error("Error saving subcategory:", err)
      toast.error("Error al guardar la subcategoría")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (subcategory: SubcategoryWithProductCount) => {
    setSubcategoryToDelete(subcategory)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!subcategoryToDelete) return

    try {
      await deleteSubcategory(subcategoryToDelete.id)
      toast.success("Subcategoría eliminada correctamente")
    } catch (err) {
      console.error("Error deleting subcategory:", err)
      toast.error("Error al eliminar la subcategoría")
    } finally {
      setDeleteDialogOpen(false)
      setSubcategoryToDelete(null)
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
          <h1 className="text-2xl font-semibold">Subcategorías</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona las subcategorías de productos
          </p>
        </div>

        {/* Action Section */}
        <div className="flex items-center gap-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar subcategoría..."
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
          <Button disabled className="ml-auto">
            <Plus />
            Agregar subcategoría
          </Button>
        </div>

        <SubcategoriesSkeleton />
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
          Subcategorías{" "}
          <span className="text-muted-foreground font-normal">
            ({pagination.totalCount})
          </span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Gestiona las subcategorías de productos
        </p>
      </div>

      {/* Action Section */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar subcategoría..."
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
          <DropdownMenuContent align="start" className="w-56">
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
                  onCheckedChange={() => setSelectedCategoryIds([])}
                  className="text-muted-foreground"
                >
                  Limpiar filtros
                </DropdownMenuCheckboxItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button onClick={openCreateDrawer} className="ml-auto">
          <Plus />
          Agregar subcategoría
        </Button>
      </div>

      {filteredSubcategories.length === 0 && (searchQuery || selectedCategoryIds.length > 0) ? (
        <div className="rounded-lg border bg-background p-8 text-center">
          <p className="text-muted-foreground">No se encontraron subcategorías con los filtros aplicados</p>
          <Button
            variant="link"
            onClick={() => {
              setSearchQuery("")
              setSelectedCategoryIds([])
            }}
            className="mt-2"
          >
            Limpiar filtros
          </Button>
        </div>
      ) : subcategories.length === 0 ? (
        <div className="rounded-lg border bg-background">
          <EmptyState
            icon={Layers}
            title="No hay subcategorías"
            description="Crea tu primera subcategoría para organizar mejor tus productos"
            actionLabel="Agregar subcategoría"
            onAction={openCreateDrawer}
          />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredSubcategories}
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
                  <Layers className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <SheetTitle>
                    {editingSubcategory ? "Editar Subcategoría" : "Agregar Subcategoría"}
                  </SheetTitle>
                  <SheetDescription>
                    {editingSubcategory
                      ? "Modifica la información de la subcategoría"
                      : "Completa la información de la subcategoría"}
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
                  Nombre de la Subcategoría <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Ej: Refrescos"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">
                  Categoría <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={categoryId}
                  onValueChange={setCategoryId}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    Subcategoría activa
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
                disabled={!name.trim() || !categoryId || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isUploadingImage
                      ? "Subiendo imagen..."
                      : editingSubcategory
                      ? "Guardando..."
                      : "Agregando..."}
                  </>
                ) : editingSubcategory ? (
                  "Guardar cambios"
                ) : (
                  "Agregar Subcategoría"
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
            <AlertDialogTitle>¿Eliminar subcategoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la
              subcategoría <strong>{subcategoryToDelete?.name}</strong> y todos sus
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
