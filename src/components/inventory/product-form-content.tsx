"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeft,
  Upload,
  Trash2,
  Loader2,
  Package,
  DollarSign,
  Barcode,
  Store,
  CirclePower,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { categoryService } from "@/src/services/category.service"
import { subcategoryService } from "@/src/services/subcategory.service"
import { warehouseService } from "@/src/services/warehouse.service"
import { uploadService } from "@/src/services/upload.service"
import { productService } from "@/src/services/product.service"
import { useBreadcrumb } from "@/src/contexts/breadcrumb-context"

interface Category {
  id: string
  name: string
}

interface Subcategory {
  id: string
  name: string
  categoryId: string
}

interface Warehouse {
  id: string
  name: string
  logoUrl: string | null
}

interface WarehouseProduct {
  warehouseId: string
}

interface ProductFormContentProps {
  productId?: string
}

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"]
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_IMAGES = 4

export function ProductFormContent({ productId }: ProductFormContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setOverride } = useBreadcrumb()
  const isEditMode = Boolean(productId)
  const preselectedWarehouseId = searchParams.get("warehouse")

  // Data state
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Form state - General Info
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [subcategoryId, setSubcategoryId] = useState("")

  // Form state - Images
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([])
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([])
  const [imageError, setImageError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state - Price
  const [price, setPrice] = useState("")

  // Form state - Inventory (SKU/Barcode)
  const [hasSkuBarcode, setHasSkuBarcode] = useState(false)
  const [sku, setSku] = useState("")
  const [barcode, setBarcode] = useState("")

  // Form state - Status
  const [isActive, setIsActive] = useState(true)

  // Form state - Discount/Promo (global)
  const [isOnDiscount, setIsOnDiscount] = useState(false)
  const [isPromo, setIsPromo] = useState(false)
  const [discountPrice, setDiscountPrice] = useState("")

  // Form state - Availability (Warehouses)
  const [selectedWarehouses, setSelectedWarehouses] = useState<string[]>([])
  const [existingWarehouseProducts, setExistingWarehouseProducts] = useState<WarehouseProduct[]>([])

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Filtered subcategories based on selected category
  const filteredSubcategories = subcategories.filter(
    (sub) => sub.categoryId === categoryId
  )

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true)
      try {
        const [categoriesRes, subcategoriesRes, warehousesRes] = await Promise.all([
          categoryService.getPaginated({ page: 1, pageSize: 100 }),
          subcategoryService.getPaginated({ page: 1, pageSize: 100 }),
          warehouseService.getPaginated({ page: 1, pageSize: 100 }),
        ])

        setCategories(categoriesRes.data.map((c) => ({ id: c.id, name: c.name })))
        setSubcategories(
          subcategoriesRes.data.map((s) => ({
            id: s.id,
            name: s.name,
            categoryId: s.categoryId,
          }))
        )
        setWarehouses(
          warehousesRes.data.map((w) => ({
            id: w.id,
            name: w.name,
            logoUrl: w.logoUrl,
          }))
        )

        // Pre-select warehouse from query param (create mode only)
        if (!productId && preselectedWarehouseId) {
          const exists = warehousesRes.data.some((w) => w.id === preselectedWarehouseId)
          if (exists) {
            setSelectedWarehouses([preselectedWarehouseId])
          }
        }

        // Load product data if editing
        if (productId) {
          const product = await productService.getById(productId)
          if (product) {
            setName(product.name)
            setDescription(product.description || "")
            setCategoryId(product.categoryId || "")
            setSubcategoryId(product.subcategoryId || "")
            setPrice(product.price.toString())
            setExistingImageUrls(product.imageUrls)
            setIsActive(product.isActive)

            // Set breadcrumb override with product name
            setOverride(productId, product.name)

            if (product.sku || product.barcode) {
              setHasSkuBarcode(true)
              setSku(product.sku || "")
              setBarcode(product.barcode || "")
            }

            // Load discount/promo from product
            setIsOnDiscount(product.isOnDiscount)
            setIsPromo(product.isPromo)
            if (product.discountPrice) {
              setDiscountPrice(product.discountPrice.toString())
            }

            // Load warehouse products
            const { createClient } = await import("@/lib/supabase/client")
            const supabase = createClient()

            const { data: warehouseProducts } = await supabase
              .from("warehouse_products")
              .select("warehouse_id")
              .eq("product_id", productId)

            if (warehouseProducts && warehouseProducts.length > 0) {
              const wpData: WarehouseProduct[] = warehouseProducts.map((wp) => ({
                warehouseId: wp.warehouse_id,
              }))

              setExistingWarehouseProducts(wpData)
              setSelectedWarehouses(wpData.map((wp) => wp.warehouseId))
            }
          } else {
            toast.error("Producto no encontrado")
            router.push("/admin/stock")
          }
        }
      } catch (err) {
        console.error("Error loading data:", err)
        toast.error("Error al cargar los datos")
      } finally {
        setIsLoadingData(false)
      }
    }

    loadData()
  }, [productId, router])

  // Reset subcategory when category changes (only in create mode or when user manually changes)
  const handleCategoryChange = (newCategoryId: string) => {
    setCategoryId(newCategoryId)
    // Only reset subcategory if it doesn't belong to the new category
    const currentSubcategory = subcategories.find((s) => s.id === subcategoryId)
    if (currentSubcategory && currentSubcategory.categoryId !== newCategoryId) {
      setSubcategoryId("")
    }
  }

  // Image handling
  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return "Formato no válido. Usa PNG, JPG, GIF o WEBP"
    }
    if (file.size > MAX_FILE_SIZE) {
      return "El archivo es muy grande. Máximo 5MB"
    }
    return null
  }

  const totalImages = existingImageUrls.length + imageFiles.length

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const remainingSlots = MAX_IMAGES - totalImages
    if (remainingSlots <= 0) {
      setImageError(`Máximo ${MAX_IMAGES} imágenes permitidas`)
      return
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots)
    const newFiles: File[] = []
    const newPreviews: string[] = []

    filesToProcess.forEach((file) => {
      const error = validateFile(file)
      if (error) {
        setImageError(error)
        return
      }

      newFiles.push(file)

      const reader = new FileReader()
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string)
        if (newPreviews.length === newFiles.length) {
          setImageFiles((prev) => [...prev, ...newFiles])
          setImagePreviews((prev) => [...prev, ...newPreviews])
        }
      }
      reader.readAsDataURL(file)
    })

    setImageError(null)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const removeNewImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = (url: string) => {
    setExistingImageUrls((prev) => prev.filter((u) => u !== url))
    setImagesToDelete((prev) => [...prev, url])
  }

  // Warehouse selection
  const toggleWarehouse = (warehouseId: string) => {
    setSelectedWarehouses((prev) => {
      if (prev.includes(warehouseId)) {
        return prev.filter((id) => id !== warehouseId)
      } else {
        return [...prev, warehouseId]
      }
    })
  }

  const selectAllWarehouses = () => {
    if (selectedWarehouses.length === warehouses.length) {
      setSelectedWarehouses([])
    } else {
      setSelectedWarehouses(warehouses.map((w) => w.id))
    }
  }

  // Form validation
  const isFormValid =
    name.trim() &&
    categoryId &&
    price &&
    parseFloat(price) > 0 &&
    selectedWarehouses.length > 0

  // Delete product
  const handleDelete = async () => {
    if (!productId) return

    setIsDeleting(true)
    try {
      await productService.delete(productId)
      toast.success("Producto eliminado correctamente")
      router.push("/admin/stock")
    } catch (err) {
      console.error("Error deleting product:", err)
      toast.error("Error al eliminar el producto")
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  // Submit
  const handleSubmit = async () => {
    if (!isFormValid) return

    setIsSubmitting(true)
    try {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()

      // Handle images
      let finalImageUrls: string[] = [...existingImageUrls]

      // Delete removed images
      if (imagesToDelete.length > 0) {
        await Promise.all(
          imagesToDelete.map((url) =>
            uploadService.deleteImage(url).catch((err) => {
              console.error("Error deleting image:", err)
            })
          )
        )
      }

      // Upload new images
      if (imageFiles.length > 0) {
        const uploadPromises = imageFiles.map((file) =>
          uploadService.uploadProductImage(file)
        )
        const newUrls = await Promise.all(uploadPromises)
        finalImageUrls = [...finalImageUrls, ...newUrls]
      }

      if (isEditMode && productId) {
        // Update product (including discount/promo)
        await productService.update(productId, {
          name: name.trim(),
          description: description.trim() || null,
          categoryId: categoryId || undefined,
          subcategoryId: subcategoryId || null,
          imageUrls: finalImageUrls,
          price: parseFloat(price),
          sku: hasSkuBarcode && sku.trim() ? sku.trim() : null,
          barcode: hasSkuBarcode && barcode.trim() ? barcode.trim() : null,
          isActive,
          isOnDiscount,
          isPromo,
          discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        })

        // Update warehouse products
        // First, delete existing ones
        await supabase
          .from("warehouse_products")
          .delete()
          .eq("product_id", productId)

        // Then insert updated ones
        const warehouseProducts = selectedWarehouses.map((warehouseId) => ({
          warehouse_id: warehouseId,
          product_id: productId,
          is_available: true,
        }))

        const { error: warehouseError } = await supabase
          .from("warehouse_products")
          .insert(warehouseProducts)

        if (warehouseError) {
          throw warehouseError
        }

        toast.success("Producto actualizado correctamente")
      } else {
        // Create product (including discount/promo)
        const { data: product, error: productError } = await supabase
          .from("products")
          .insert({
            name: name.trim(),
            description: description.trim() || null,
            category_id: categoryId,
            subcategory_id: subcategoryId || null,
            image_urls: finalImageUrls,
            price: parseFloat(price),
            sku: hasSkuBarcode && sku.trim() ? sku.trim() : null,
            barcode: hasSkuBarcode && barcode.trim() ? barcode.trim() : null,
            is_active: true,
            is_on_discount: isOnDiscount,
            is_promo: isPromo,
            discount_price: discountPrice ? parseFloat(discountPrice) : null,
          })
          .select()
          .single()

        if (productError) {
          throw productError
        }

        // Add to selected warehouses
        const warehouseProducts = selectedWarehouses.map((warehouseId) => ({
          warehouse_id: warehouseId,
          product_id: product.id,
          is_available: true,
        }))

        const { error: warehouseError } = await supabase
          .from("warehouse_products")
          .insert(warehouseProducts)

        if (warehouseError) {
          throw warehouseError
        }

        toast.success("Producto agregado correctamente")
      }

      router.push("/admin/stock")
    } catch (err) {
      console.error("Error saving product:", err)
      toast.error(isEditMode ? "Error al actualizar el producto" : "Error al crear el producto")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingData) {
    return (
      <div className="flex flex-1 flex-col gap-4 px-4 py-[50px] mx-auto w-full max-w-[1200px]">
        <div className="flex items-center gap-4 mb-[25px]">
          <Button variant="ghost" size="icon" disabled>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">
              {isEditMode ? "Editar Producto" : "Agregar Producto"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEditMode
                ? "Modifica la información del producto"
                : "Crea un nuevo producto y agrégalo al inventario"}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-[50px] mx-auto w-full max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-[25px]">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/stock")}
            className="cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">
              {isEditMode ? "Editar Producto" : "Agregar Producto"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEditMode
                ? "Modifica la información del producto"
                : "Crea un nuevo producto y agrégalo al inventario"}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {isEditMode && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isSubmitting || isDeleting}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => router.push("/admin/stock")}
            disabled={isSubmitting || isDeleting}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!isFormValid || isSubmitting || isDeleting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : isEditMode ? (
              "Guardar cambios"
            ) : (
              "Guardar producto"
            )}
          </Button>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Status Card - only show in edit mode */}
          {isEditMode && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CirclePower className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Estado</CardTitle>
                </div>
                <CardDescription>
                  Controla la visibilidad del producto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive" className="cursor-pointer">
                      Producto {isActive ? "activo" : "inactivo"}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {isActive ? "Visible en el catálogo" : "Oculto del catálogo"}
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                    disabled={isSubmitting}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* General Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Información General</CardTitle>
              </div>
              <CardDescription>
                Datos básicos del producto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nombre del producto <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Ej: Coca-Cola 2L"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Descripción del producto (opcional)"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">
                  Categoría <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={categoryId}
                  onValueChange={handleCategoryChange}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue placeholder="Selecciona" />
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
                <Label htmlFor="subcategory">Subcategoría</Label>
                <Select
                  value={subcategoryId}
                  onValueChange={setSubcategoryId}
                  disabled={isSubmitting || !categoryId}
                >
                  <SelectTrigger id="subcategory" className="w-full">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSubcategories.map((subcategory) => (
                      <SelectItem key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Imágenes</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES.join(",")}
                  onChange={handleFileInputChange}
                  className="hidden"
                  multiple
                  disabled={isSubmitting}
                />

                {(existingImageUrls.length > 0 || imagePreviews.length > 0) && (
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {/* Existing images */}
                    {existingImageUrls.map((url, index) => (
                      <div
                        key={`existing-${index}`}
                        className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
                      >
                        <Image
                          src={url}
                          alt={`Image ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(url)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={isSubmitting}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {/* New images */}
                    {imagePreviews.map((preview, index) => (
                      <div
                        key={`new-${index}`}
                        className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
                      >
                        <Image
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={isSubmitting}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {totalImages < MAX_IMAGES && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                      isSubmitting
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:border-primary/50"
                    }`}
                  >
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Arrastra imágenes o{" "}
                      <span className="text-primary">selecciona archivos</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, GIF o WEBP (máx. 5MB, {MAX_IMAGES - totalImages} restantes)
                    </p>
                  </div>
                )}

                {imageError && (
                  <p className="text-sm text-destructive">{imageError}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Price Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Precio</CardTitle>
              </div>
              <CardDescription>
                Precio base del producto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="price">
                  Precio <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="price"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    disabled={isSubmitting}
                    className="pl-7"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Precio del producto en todos los bodegones
                </p>
              </div>

              {/* Promo switch */}
              <div className="flex items-center justify-between">
                <Label htmlFor="isPromo" className="cursor-pointer">
                  Promoción
                </Label>
                <Switch
                  id="isPromo"
                  checked={isPromo}
                  onCheckedChange={setIsPromo}
                  disabled={isSubmitting}
                />
              </div>

              {/* Discount switch */}
              <div className="flex items-center justify-between">
                <Label htmlFor="isOnDiscount" className="cursor-pointer">
                  Descuento
                </Label>
                <Switch
                  id="isOnDiscount"
                  checked={isOnDiscount}
                  onCheckedChange={setIsOnDiscount}
                  disabled={isSubmitting}
                />
              </div>

              {/* Discount price input */}
              {isOnDiscount && (
                <div className="space-y-2">
                  <Label htmlFor="discountPrice">
                    Precio con descuento <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="discountPrice"
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      value={discountPrice}
                      onChange={(e) => setDiscountPrice(e.target.value)}
                      disabled={isSubmitting}
                      className="pl-7"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Inventory Card (SKU/Barcode) */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Barcode className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Inventario</CardTitle>
              </div>
              <CardDescription>
                Identificadores del producto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasSkuBarcode"
                  checked={hasSkuBarcode}
                  onCheckedChange={(checked) => setHasSkuBarcode(checked as boolean)}
                  disabled={isSubmitting}
                  className="cursor-pointer"
                />
                <Label htmlFor="hasSkuBarcode" className="cursor-pointer">
                  Este producto tiene un SKU o Código de barras
                </Label>
              </div>

              {hasSkuBarcode && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      placeholder="Ej: COCA-2L-001"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="barcode">Código de barras</Label>
                    <Input
                      id="barcode"
                      placeholder="Ej: 7501055300167"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Availability Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Disponibilidad</CardTitle>
              </div>
              <CardDescription>
                Selecciona los bodegones donde estará disponible{" "}
                <span className="text-destructive">*</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-end mb-3">
                <Button
                  variant="link"
                  size="sm"
                  onClick={selectAllWarehouses}
                  disabled={isSubmitting}
                  className="text-xs h-auto p-0"
                >
                  {selectedWarehouses.length === warehouses.length
                    ? "Deseleccionar todos"
                    : "Seleccionar todos"}
                </Button>
              </div>
              <div className="space-y-2">
                {warehouses.map((warehouse) => {
                  const isSelected = selectedWarehouses.includes(warehouse.id)
                  return (
                    <div
                      key={warehouse.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? "border-primary bg-muted/30"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => !isSubmitting && toggleWarehouse(warehouse.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleWarehouse(warehouse.id)}
                        onClick={(e) => e.stopPropagation()}
                        disabled={isSubmitting}
                        className="cursor-pointer"
                      />
                      <div className="relative h-8 w-8 rounded overflow-hidden bg-muted flex items-center justify-center">
                        {warehouse.logoUrl ? (
                          <Image
                            src={warehouse.logoUrl}
                            alt={warehouse.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <Store className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <span className="font-medium flex-1">{warehouse.name}</span>
                    </div>
                  )
                })}

                {warehouses.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No hay bodegones disponibles
                  </p>
                )}
              </div>

              {selectedWarehouses.length > 0 && (
                <p className="text-sm text-muted-foreground mt-4">
                  {selectedWarehouses.length} bodegón(es) seleccionado(s)
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente <strong>{name}</strong> y lo
              removerá de todos los bodegones donde esté disponible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
