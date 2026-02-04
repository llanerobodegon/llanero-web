"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { ImagePlus, Pencil, Trash2, Upload, X, Loader2, Link as LinkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/src/models/slider.model"
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

interface SliderCardProps {
  slider: Slider | null
  position: number
  slot: number
  onSave: (
    position: number,
    slot: number,
    data: { name: string; imageUrl: string; linkUrl?: string; isActive?: boolean },
    imageFile?: File
  ) => Promise<void>
  onDelete: (id: string) => Promise<void>
  isSubmitting: boolean
  disabled?: boolean
}

export function SliderCard({
  slider,
  position,
  slot,
  onSave,
  onDelete,
  isSubmitting,
  disabled = false,
}: SliderCardProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [isActive, setIsActive] = useState(true)

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetForm = () => {
    if (slider) {
      setName(slider.name)
      setLinkUrl(slider.linkUrl || "")
      setIsActive(slider.isActive)
      setImagePreview(slider.imageUrl)
    } else {
      setName(`Banner ${slot}`)
      setLinkUrl("")
      setIsActive(true)
      setImagePreview(null)
    }
    setImageFile(null)
    setImageError(null)
  }

  const openDrawer = () => {
    resetForm()
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
    setImagePreview(slider?.imageUrl || null)
    setImageError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async () => {
    if (!name.trim()) return
    if (!imagePreview && !imageFile) {
      setImageError("La imagen es requerida")
      return
    }

    await onSave(
      position,
      slot,
      {
        name: name.trim(),
        imageUrl: slider?.imageUrl || "",
        linkUrl: linkUrl.trim() || undefined,
        isActive,
      },
      imageFile || undefined
    )

    handleCloseDrawer()
  }

  const handleDelete = async () => {
    if (slider) {
      await onDelete(slider.id)
    }
    setDeleteDialogOpen(false)
  }

  return (
    <>
      <div className="group relative">
        {slider ? (
          <div className="relative aspect-[16/9] rounded-lg overflow-hidden border bg-muted">
            <Image
              src={slider.imageUrl}
              alt={slider.name}
              fill
              className="object-cover"
            />
            {!slider.isActive && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white text-sm font-medium px-2 py-1 bg-black/50 rounded">
                  Inactivo
                </span>
              </div>
            )}
            {!disabled && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <Button size="sm" variant="secondary" onClick={openDrawer}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={openDrawer}
            disabled={disabled}
            className={`aspect-[16/9] w-full rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-2 transition-colors bg-muted/50 ${
              disabled ? "cursor-not-allowed opacity-50" : "hover:border-primary/50 cursor-pointer"
            }`}
          >
            <ImagePlus className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Agregar imagen</span>
          </button>
        )}
        <p className="text-sm text-muted-foreground mt-2">
          {slider ? slider.name : `Slot ${slot}`}
        </p>
      </div>

      {/* Edit/Create Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent side="right" className="flex flex-col gap-0">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <ImagePlus className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <SheetTitle>
                    {slider ? "Editar Banner" : "Agregar Banner"}
                  </SheetTitle>
                  <SheetDescription>
                    {slider
                      ? "Modifica la información del banner"
                      : "Completa la información del banner"}
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
                  Nombre del Banner <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Ej: Promoción de verano"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Imagen <span className="text-destructive">*</span>
                </Label>
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
                    <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-sm text-muted-foreground">
                        {imageFile?.name || "Imagen actual"}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeImage}
                        disabled={isSubmitting}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Cambiar
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
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Arrastra y suelta o{" "}
                      <span className="text-primary">selecciona un archivo</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, GIF o WEBP (máx. 5MB)
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Recomendado: 1920x1080px (16:9)
                    </p>
                  </div>
                )}

                {imageError && (
                  <p className="text-sm text-destructive">{imageError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkUrl" className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  URL de enlace (opcional)
                </Label>
                <Input
                  id="linkUrl"
                  placeholder="https://ejemplo.com/promocion"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Si se proporciona, el banner será clickeable
                </p>
              </div>

              <div className="space-y-2">
                <Label>Estado</Label>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Banner activo
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
                disabled={!name.trim() || (!imagePreview && !imageFile) || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : slider ? (
                  "Guardar cambios"
                ) : (
                  "Agregar Banner"
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
            <AlertDialogTitle>¿Eliminar banner?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el
              banner <strong>{slider?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
