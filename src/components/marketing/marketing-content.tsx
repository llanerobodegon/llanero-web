"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Megaphone, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useMarketingViewModel } from "@/src/viewmodels/useMarketingViewModel"
import { uploadService } from "@/src/services/upload.service"
import { MarketingSkeleton } from "@/src/components/marketing/marketing-skeleton"
import { SliderCard } from "@/src/components/marketing/slider-card"
import { EmptyState } from "@/components/empty-state"

export function MarketingContent() {
  const { sliderGroups, isLoading, error, upsertSlider, deleteSlider, toggleSliderEnabled, refetch } =
    useMarketingViewModel()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [togglingSlider, setTogglingSlider] = useState<string | null>(null)

  const handleSaveSlider = async (
    position: number,
    slot: number,
    data: { name: string; imageUrl: string; linkUrl?: string; isActive?: boolean },
    imageFile?: File
  ) => {
    setIsSubmitting(true)
    try {
      let imageUrl = data.imageUrl

      if (imageFile) {
        imageUrl = await uploadService.uploadSliderImage(imageFile)
      }

      await upsertSlider(position, slot, {
        name: data.name,
        imageUrl,
        linkUrl: data.linkUrl,
        isActive: data.isActive,
      })

      toast.success("Banner guardado correctamente")
    } catch (err) {
      console.error("Error saving slider:", err)
      toast.error("Error al guardar el banner")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteSlider = async (id: string) => {
    try {
      await deleteSlider(id)
      toast.success("Banner eliminado correctamente")
    } catch (err) {
      console.error("Error deleting slider:", err)
      toast.error("Error al eliminar el banner")
    }
  }

  const handleToggleSlider = async (settingsId: string, isEnabled: boolean) => {
    setTogglingSlider(settingsId)
    try {
      await toggleSliderEnabled(settingsId, isEnabled)
      toast.success(isEnabled ? "Slider activado" : "Slider desactivado")
    } catch (err) {
      console.error("Error toggling slider:", err)
      toast.error("Error al cambiar el estado del slider")
    } finally {
      setTogglingSlider(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 px-4 py-[50px] mx-auto w-full max-w-[1200px]">
        <div className="mb-[25px]">
          <h1 className="text-2xl font-semibold">Marketing</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los banners y sliders de la aplicación
          </p>
        </div>
        <MarketingSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <p className="text-destructive mb-4">{error}</p>
        <Button variant="outline" onClick={() => refetch()}>
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-[50px] mx-auto w-full max-w-[1200px]">
      {/* Title Section */}
      <div className="mb-[25px]">
        <h1 className="text-2xl font-semibold">Marketing</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona los banners y sliders de la aplicación
        </p>
      </div>

      {/* Sliders Groups */}
      <div className="space-y-8">
        {sliderGroups.map((group) => (
          <Card key={group.position} className={!group.isEnabled ? "opacity-60" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5" />
                    {group.title}
                  </CardTitle>
                  <CardDescription>
                    {group.position === 1
                      ? "Banners principales que se muestran en la parte superior de la app"
                      : "Banners secundarios que se muestran en la sección inferior"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  {togglingSlider === group.settingsId && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  <Label htmlFor={`slider-toggle-${group.position}`} className="text-sm text-muted-foreground">
                    {group.isEnabled ? "Activo" : "Inactivo"}
                  </Label>
                  <Switch
                    id={`slider-toggle-${group.position}`}
                    checked={group.isEnabled}
                    onCheckedChange={(checked) => handleToggleSlider(group.settingsId, checked)}
                    disabled={togglingSlider === group.settingsId}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {group.sliders.map((slider, index) => (
                  <SliderCard
                    key={`${group.position}-${index}`}
                    slider={slider}
                    position={group.position}
                    slot={index + 1}
                    onSave={handleSaveSlider}
                    onDelete={handleDeleteSlider}
                    isSubmitting={isSubmitting}
                    disabled={!group.isEnabled}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Megaphone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Recomendaciones para los banners</h3>
              <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                <li>• Usa imágenes de alta calidad con resolución 1920x1080px (proporción 16:9)</li>
                <li>• Los banners inactivos no se mostrarán en la aplicación del cliente</li>
                <li>• Puedes agregar un enlace opcional para redirigir a los usuarios al hacer clic</li>
                <li>• El slider principal aparece en la parte superior de la app</li>
                <li>• El slider secundario aparece en una sección inferior de la app</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
