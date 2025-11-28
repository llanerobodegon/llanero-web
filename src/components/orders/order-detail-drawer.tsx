"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  X,
  Loader2,
  MapPin,
  Phone,
  Mail,
  Store,
  Truck,
  CreditCard,
  Package,
  Calendar,
  User,
  FileText,
  ImageIcon,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Order,
  OrderStatus,
  PaymentStatus,
  UpdateOrderData,
  getStatusLabel,
  getStatusColor,
  getPaymentStatusLabel,
  getPaymentStatusColor,
  getDeliveryTypeLabel,
  getPaymentMethodLabel,
  formatCurrency,
  formatDateTime,
} from "@/src/services/orders.service"

interface OrderDetailDrawerProps {
  order: Order | null
  isOpen: boolean
  isLoading: boolean
  deliveryMembers: { id: string; name: string }[]
  onClose: () => void
  onUpdate: (id: string, data: UpdateOrderData) => Promise<Order>
}

const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "on_delivery",
  "completed",
  "cancelled",
]

const PAYMENT_STATUSES: PaymentStatus[] = ["pending", "verified", "rejected"]

export function OrderDetailDrawer({
  order,
  isOpen,
  isLoading,
  deliveryMembers,
  onClose,
  onUpdate,
}: OrderDetailDrawerProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState<OrderStatus | "">("")
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | "">("")
  const [deliveryPersonId, setDeliveryPersonId] = useState<string>("")
  const [adminNotes, setAdminNotes] = useState("")

  // Reset form when order changes
  const resetForm = () => {
    if (order) {
      setStatus(order.status)
      setPaymentStatus(order.paymentStatus)
      setDeliveryPersonId(order.deliveryPerson?.id || "")
      setAdminNotes(order.adminNotes || "")
    }
  }

  // Reset when order changes
  if (order && status === "") {
    resetForm()
  }

  const handleSave = async () => {
    if (!order) return

    setIsSaving(true)
    try {
      const updateData: UpdateOrderData = {}

      if (status && status !== order.status) {
        updateData.status = status
      }
      if (paymentStatus && paymentStatus !== order.paymentStatus) {
        updateData.paymentStatus = paymentStatus
      }
      if (deliveryPersonId !== (order.deliveryPerson?.id || "")) {
        updateData.deliveryPersonId = deliveryPersonId || null
      }
      if (adminNotes !== (order.adminNotes || "")) {
        updateData.adminNotes = adminNotes
      }

      if (Object.keys(updateData).length > 0) {
        await onUpdate(order.id, updateData)
        toast.success("Pedido actualizado correctamente")
      }
    } catch (err) {
      console.error("Error updating order:", err)
      toast.error("Error al actualizar el pedido")
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    setStatus("")
    setPaymentStatus("")
    setDeliveryPersonId("")
    setAdminNotes("")
    onClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="right" className="flex flex-col gap-0 sm:max-w-lg overflow-hidden p-0">
        <SheetHeader className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <SheetTitle>
                  {order?.orderNumber || "Cargando..."}
                </SheetTitle>
                <SheetDescription>
                  Detalles del pedido
                </SheetDescription>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-full bg-muted hover:bg-muted/80 cursor-pointer transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </SheetHeader>

        <Separator />

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : order ? (
          <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 pt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details" className="gap-2 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  Detalles
                </TabsTrigger>
                <TabsTrigger value="manage" className="gap-2 cursor-pointer">
                  <Settings className="h-4 w-4" />
                  Gestionar
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="details" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <div className="px-6 py-4 space-y-6">
                  {/* Status Badges */}
                  <div className="flex gap-2">
                    <Badge
                      variant="outline"
                      className="bg-transparent border-gray-300 text-gray-700 font-normal"
                    >
                      <span className={`h-2 w-2 rounded-full ${getStatusColor(order.status)}`} />
                      {getStatusLabel(order.status)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-transparent border-gray-300 text-gray-700 font-normal"
                    >
                      <span className={`h-2 w-2 rounded-full ${getPaymentStatusColor(order.paymentStatus)}`} />
                      Pago: {getPaymentStatusLabel(order.paymentStatus)}
                    </Badge>
                  </div>

                  {/* Delivery Code */}
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Código de Entrega</p>
                    <p className="text-3xl font-bold tracking-widest">{order.deliveryCode}</p>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Cliente
                    </h4>
                    <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-sm">
                      <p className="font-medium">
                        {order.customer.firstName} {order.customer.lastName}
                      </p>
                      <p className="text-muted-foreground flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {order.customer.email}
                      </p>
                      {order.customer.phone && (
                        <a
                          href={`tel:${order.customer.phoneCode}${order.customer.phone}`}
                          className="text-muted-foreground flex items-center gap-2 hover:text-primary transition-colors"
                        >
                          <Phone className="h-3 w-3" />
                          {order.customer.phoneCode} {order.customer.phone}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Delivery Info */}
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      {order.deliveryType === "delivery" ? (
                        <Truck className="h-4 w-4" />
                      ) : (
                        <Store className="h-4 w-4" />
                      )}
                      {getDeliveryTypeLabel(order.deliveryType)}
                    </h4>
                    <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-sm">
                      <p className="font-medium">{order.warehouse.name}</p>
                      {order.deliveryType === "delivery" && order.address && (
                        <p className="text-muted-foreground flex items-start gap-2">
                          <MapPin className="h-3 w-3 mt-1 flex-shrink-0" />
                          <span>
                            {order.address.address1}
                            {order.address.address2 && `, ${order.address.address2}`}
                            {order.address.city && `, ${order.address.city}`}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Información de Pago
                    </h4>
                    <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-sm">
                      <p>
                        <span className="text-muted-foreground">Método:</span>{" "}
                        <span className="font-medium">{getPaymentMethodLabel(order.paymentMethodType)}</span>
                      </p>
                      {order.paymentBank && (
                        <p>
                          <span className="text-muted-foreground">Banco:</span>{" "}
                          <span className="font-medium">{order.paymentBank}</span>
                        </p>
                      )}
                      {order.paymentReference && (
                        <p>
                          <span className="text-muted-foreground">Referencia:</span>{" "}
                          <span className="font-medium">****{order.paymentReference}</span>
                        </p>
                      )}
                      <p className="flex items-center gap-1">
                        <span className="text-muted-foreground">Comprobante:</span>{" "}
                        {order.paymentProofUrl ? (
                          <a
                            href={order.paymentProofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
                          >
                            <ImageIcon className="h-3 w-3" />
                            Ver imagen
                          </a>
                        ) : (
                          <span className="text-muted-foreground italic">No adjunto</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Productos ({order.items.length})
                    </h4>
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="bg-muted/30 rounded-lg p-3 flex justify-between items-center"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.productName}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity} × {formatCurrency(item.unitPriceUsd, "USD")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">{formatCurrency(item.totalUsd, "USD")}</p>
                            <p className="text-xs text-muted-foreground">{formatCurrency(item.totalBs, "BS")}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="space-y-2 bg-muted/30 rounded-lg p-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(order.subtotalUsd, "USD")}</span>
                    </div>
                    {order.deliveryFeeUsd > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Delivery</span>
                        <span>{formatCurrency(order.deliveryFeeUsd, "USD")}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <div className="text-right">
                        <p>{formatCurrency(order.totalUsd, "USD")}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(order.totalBs, "BS")}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground text-right">
                      Tasa: {order.exchangeRate} Bs/$
                    </p>
                  </div>

                  {/* Timestamps */}
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Creado: {formatDateTime(order.createdAt)}
                    </p>
                    {order.confirmedAt && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Confirmado: {formatDateTime(order.confirmedAt)}
                      </p>
                    )}
                    {order.deliveredAt && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Entregado: {formatDateTime(order.deliveredAt)}
                      </p>
                    )}
                  </div>

                  {/* Customer Notes */}
                  {order.customerNotes && (
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4" />
                        Notas del Cliente
                      </h4>
                      <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                        {order.customerNotes}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="manage" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <div className="px-6 py-4 space-y-6">
                  {/* Current Status Display */}
                  <div className="flex gap-2">
                    <Badge
                      variant="outline"
                      className="bg-transparent border-gray-300 text-gray-700 font-normal"
                    >
                      <span className={`h-2 w-2 rounded-full ${getStatusColor(order.status)}`} />
                      {getStatusLabel(order.status)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-transparent border-gray-300 text-gray-700 font-normal"
                    >
                      <span className={`h-2 w-2 rounded-full ${getPaymentStatusColor(order.paymentStatus)}`} />
                      Pago: {getPaymentStatusLabel(order.paymentStatus)}
                    </Badge>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label>Estado del Pedido</Label>
                    <Select
                      value={status}
                      onValueChange={(value) => setStatus(value as OrderStatus)}
                      disabled={isSaving}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {getStatusLabel(s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Payment Status */}
                  <div className="space-y-2">
                    <Label>Estado del Pago</Label>
                    <Select
                      value={paymentStatus}
                      onValueChange={(value) => setPaymentStatus(value as PaymentStatus)}
                      disabled={isSaving}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar estado de pago" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {getPaymentStatusLabel(s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Delivery Person */}
                  {order.deliveryType === "delivery" && (
                    <div className="space-y-2">
                      <Label>Repartidor Asignado</Label>
                      <Select
                        value={deliveryPersonId || "none"}
                        onValueChange={(value) => setDeliveryPersonId(value === "none" ? "" : value)}
                        disabled={isSaving}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar repartidor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin asignar</SelectItem>
                          {deliveryMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Admin Notes */}
                  <div className="space-y-2">
                    <Label>Notas Internas</Label>
                    <Textarea
                      placeholder="Notas internas del pedido..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      disabled={isSaving}
                      rows={4}
                    />
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : null}

        <SheetFooter className="border-t px-6 py-4">
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={isSaving}
            >
              Cerrar
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={isSaving || !order}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
