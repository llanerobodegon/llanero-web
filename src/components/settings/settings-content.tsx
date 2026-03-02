"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Store, FileText, Loader2, Warehouse } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useStoreSettingsViewModel } from "@/src/viewmodels/useStoreSettingsViewModel"
import { useWarehouseContext } from "@/src/contexts/warehouse-context"

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

export function SettingsContent() {
  const {
    settings,
    isLoading,
    isSaving,
    error,
    updateStoreOpen,
    updateInvoiceMessageEnabled,
    updateInvoiceMessage,
    toggleWarehouseOpen,
  } = useStoreSettingsViewModel()

  const { warehouses, refreshWarehouses } = useWarehouseContext()

  const [invoiceMessageDraft, setInvoiceMessageDraft] = useState<string | null>(null)
  const [isSavingMessage, setIsSavingMessage] = useState(false)
  const [togglingWarehouseId, setTogglingWarehouseId] = useState<string | null>(null)

  const handleStoreOpenChange = async (checked: boolean) => {
    try {
      await updateStoreOpen(checked)
      await Promise.all(warehouses.map((w) => toggleWarehouseOpen(w.id, checked)))
      await refreshWarehouses()
      toast.success(checked ? "Tienda abierta" : "Tienda cerrada")
    } catch {
      toast.error("Error al actualizar el estado de la tienda")
    }
  }

  const handleInvoiceMessageEnabledChange = async (checked: boolean) => {
    try {
      await updateInvoiceMessageEnabled(checked)
      toast.success(checked ? "Mensaje en factura activado" : "Mensaje en factura desactivado")
    } catch {
      toast.error("Error al actualizar la configuración")
    }
  }

  const handleWarehouseOpenChange = async (warehouseId: string, checked: boolean) => {
    try {
      setTogglingWarehouseId(warehouseId)
      await toggleWarehouseOpen(warehouseId, checked)
      await refreshWarehouses()
      toast.success(checked ? "Bodegón abierto" : "Bodegón cerrado")
    } catch {
      toast.error("Error al actualizar el estado del bodegón")
    } finally {
      setTogglingWarehouseId(null)
    }
  }

  const handleSaveMessage = async () => {
    if (invoiceMessageDraft === null) return
    try {
      setIsSavingMessage(true)
      await updateInvoiceMessage(invoiceMessageDraft)
      setInvoiceMessageDraft(null)
      toast.success("Mensaje guardado")
    } catch {
      toast.error("Error al guardar el mensaje")
    } finally {
      setIsSavingMessage(false)
    }
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
    <div className="flex flex-1 flex-col gap-6 px-4 py-[50px] mx-auto w-full max-w-[800px]">
      {/* Title Section */}
      <div className="mb-2">
        <h1 className="text-2xl font-semibold">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Administra la configuración de tu tienda
        </p>
      </div>

      {isLoading ? (
        <SettingsSkeleton />
      ) : settings ? (
        <Tabs defaultValue="estados" className="w-full">
          <TabsList>
            <TabsTrigger value="estados">
              <Store className="h-4 w-4 mr-2" />
              Estados
            </TabsTrigger>
            <TabsTrigger value="factura">
              <FileText className="h-4 w-4 mr-2" />
              Factura
            </TabsTrigger>
          </TabsList>

          <TabsContent value="estados" className="space-y-6 mt-4">
            {/* Store Status Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">Estado de la Tienda</CardTitle>
                </div>
                <CardDescription>
                  Controla si la tienda está disponible para recibir pedidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="store-open">Tienda Abierta</Label>
                    <p className="text-sm text-muted-foreground">
                      {settings.storeOpen
                        ? "Los clientes pueden realizar pedidos"
                        : "La tienda está cerrada temporalmente"}
                    </p>
                  </div>
                  <Switch
                    id="store-open"
                    checked={settings.storeOpen}
                    onCheckedChange={handleStoreOpenChange}
                    disabled={isSaving}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Warehouse Status Card */}
            {warehouses.length > 1 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Warehouse className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-base">Estado por Bodegón</CardTitle>
                  </div>
                  <CardDescription>
                    Abre o cierra cada bodegón de forma individual
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {warehouses.map((warehouse) => (
                    <div key={warehouse.id} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor={`warehouse-open-${warehouse.id}`}>{warehouse.name}</Label>
                        <p className="text-sm text-muted-foreground">
                          {warehouse.isOpen
                            ? "Abierto - recibiendo pedidos"
                            : "Cerrado - no recibe pedidos"}
                        </p>
                      </div>
                      <Switch
                        id={`warehouse-open-${warehouse.id}`}
                        checked={warehouse.isOpen}
                        onCheckedChange={(checked) => handleWarehouseOpenChange(warehouse.id, checked)}
                        disabled={isSaving || togglingWarehouseId === warehouse.id}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="factura" className="space-y-6 mt-4">
            {/* Invoice Message Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">Mensaje en Factura</CardTitle>
                </div>
                <CardDescription>
                  Agrega un mensaje personalizado que aparecerá en las facturas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="invoice-message-enabled">Activar Mensaje</Label>
                    <p className="text-sm text-muted-foreground">
                      Mostrar mensaje personalizado en las facturas
                    </p>
                  </div>
                  <Switch
                    id="invoice-message-enabled"
                    checked={settings.invoiceMessageEnabled}
                    onCheckedChange={handleInvoiceMessageEnabledChange}
                    disabled={isSaving}
                  />
                </div>

                {settings.invoiceMessageEnabled && (
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="invoice-message">Mensaje</Label>
                    <Textarea
                      id="invoice-message"
                      placeholder="Escribe el mensaje que aparecerá en las facturas..."
                      value={invoiceMessageDraft ?? settings.invoiceMessage}
                      onChange={(e) => setInvoiceMessageDraft(e.target.value)}
                      rows={3}
                    />
                    {invoiceMessageDraft !== null && invoiceMessageDraft !== settings.invoiceMessage && (
                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInvoiceMessageDraft(null)}
                          disabled={isSavingMessage}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveMessage}
                          disabled={isSavingMessage}
                        >
                          {isSavingMessage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Guardar
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  )
}
