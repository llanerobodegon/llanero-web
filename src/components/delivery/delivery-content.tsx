"use client"

import { useState, useMemo, useEffect } from "react"
import { toast } from "sonner"
import { Plus, Truck, Search, X, Loader2, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTable } from "@/src/components/delivery/data-table"
import { getColumns } from "@/src/components/delivery/columns"
import { DeliverySkeleton } from "@/src/components/delivery/delivery-skeleton"
import { EmptyState } from "@/components/empty-state"
import {
  useDeliveryViewModel,
  DeliveryMember,
  CreateDeliveryMemberData,
} from "@/src/viewmodels/useDeliveryViewModel"
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { getFullName, DeliveryStatus, getDeliveryStatusLabel } from "@/src/services/delivery.service"
import { cn } from "@/lib/utils"

// Phone codes for Venezuela
const PHONE_CODES = ["0412", "0414", "0416", "0422", "0424", "0426"]

// Delivery status options
const DELIVERY_STATUS_OPTIONS: DeliveryStatus[] = ["available", "on_delivery", "unavailable"]

export function DeliveryContent() {
  const {
    deliveryMembers,
    warehouses,
    isLoading,
    error,
    pagination,
    setPage,
    setPageSize,
    createDeliveryMember,
    updateDeliveryMember,
    deleteDeliveryMember,
  } = useDeliveryViewModel()

  // Current user state
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id)
    })
  }, [])

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingMember, setEditingMember] = useState<DeliveryMember | null>(null)

  // Form state
  const [selectedWarehouses, setSelectedWarehouses] = useState<string[]>([])
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phoneCode, setPhoneCode] = useState("0414")
  const [phone, setPhone] = useState("")
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>("available")

  // Warehouse popover state
  const [warehousePopoverOpen, setWarehousePopoverOpen] = useState(false)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<DeliveryMember | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Search state
  const [searchQuery, setSearchQuery] = useState("")

  // Filtered data
  const filteredMembers = useMemo(() => {
    if (!searchQuery) return deliveryMembers
    const query = searchQuery.toLowerCase()
    return deliveryMembers.filter((member) => {
      const fullName = getFullName(member).toLowerCase()
      return (
        fullName.includes(query) ||
        member.email.toLowerCase().includes(query)
      )
    })
  }, [deliveryMembers, searchQuery])

  // Reset form
  const resetForm = () => {
    setSelectedWarehouses([])
    setFirstName("")
    setLastName("")
    setEmail("")
    setPhoneCode("0414")
    setPhone("")
    setDeliveryStatus("available")
    setEditingMember(null)
  }

  const openCreateDrawer = () => {
    resetForm()
    setIsDrawerOpen(true)
  }

  const openEditDrawer = (member: DeliveryMember) => {
    setEditingMember(member)
    setSelectedWarehouses(member.warehouses.map((w) => w.id))
    setFirstName(member.firstName)
    setLastName(member.lastName)
    setEmail(member.email)
    setPhoneCode(member.phoneCode || "0414")
    setPhone(member.phone || "")
    setDeliveryStatus(member.deliveryStatus || "available")
    setIsDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
    resetForm()
  }

  // Toggle warehouse selection
  const toggleWarehouse = (warehouseId: string) => {
    setSelectedWarehouses((prev) =>
      prev.includes(warehouseId)
        ? prev.filter((id) => id !== warehouseId)
        : [...prev, warehouseId]
    )
  }

  // Select all warehouses
  const selectAllWarehouses = () => {
    setSelectedWarehouses(warehouses.map((w) => w.id))
  }

  // Clear all warehouses
  const clearAllWarehouses = () => {
    setSelectedWarehouses([])
  }

  // Form validation
  const isFormValid = useMemo(() => {
    return firstName.trim() && lastName.trim() && email.trim()
  }, [firstName, lastName, email])

  const handleSubmit = async () => {
    if (!isFormValid) return

    setIsSubmitting(true)
    try {
      const data: CreateDeliveryMemberData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phoneCode: phone ? phoneCode : null,
        phone: phone || null,
        deliveryStatus,
        warehouseIds: selectedWarehouses,
      }

      if (editingMember) {
        await updateDeliveryMember(editingMember.id, data)
        toast.success("Repartidor actualizado correctamente")
      } else {
        await createDeliveryMember(data)
        toast.success("Repartidor agregado correctamente")
      }

      handleCloseDrawer()
    } catch (err) {
      console.error("Error saving delivery member:", err)
      const errorMessage = err instanceof Error ? err.message : "Error al guardar el repartidor"
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (member: DeliveryMember) => {
    setMemberToDelete(member)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!memberToDelete) return

    setIsDeleting(true)
    try {
      await deleteDeliveryMember(memberToDelete.id)
      toast.success("Repartidor eliminado correctamente")
      setDeleteDialogOpen(false)
      setMemberToDelete(null)
    } catch (err) {
      console.error("Error deleting delivery member:", err)
      toast.error("Error al eliminar el repartidor")
    } finally {
      setIsDeleting(false)
    }
  }

  const columns = useMemo(
    () =>
      getColumns({
        onEdit: openEditDrawer,
        onDelete: handleDeleteClick,
        currentUserId,
      }),
    [currentUserId]
  )

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 px-4 py-[50px] mx-auto w-full max-w-[1200px]">
        {/* Title Section */}
        <div className="mb-[25px]">
          <h1 className="text-2xl font-semibold">Repartidores</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los repartidores de tus bodegones
          </p>
        </div>

        {/* Action Section */}
        <div className="flex items-center gap-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar repartidor..."
              value=""
              readOnly
              disabled
              className="pl-9 w-64"
            />
          </div>
          <Button disabled className="ml-auto">
            <Plus />
            Agregar repartidor
          </Button>
        </div>

        <DeliverySkeleton />
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
          Repartidores{" "}
          <span className="text-muted-foreground font-normal">
            ({pagination.totalCount})
          </span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Gestiona los repartidores de tus bodegones
        </p>
      </div>

      {/* Action Section */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar repartidor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-64"
          />
        </div>
        <Button onClick={openCreateDrawer} className="ml-auto">
          <Plus />
          Agregar repartidor
        </Button>
      </div>

      {filteredMembers.length === 0 && searchQuery ? (
        <div className="rounded-lg border bg-background p-8 text-center">
          <p className="text-muted-foreground">
            No se encontraron repartidores con los filtros aplicados
          </p>
          <Button
            variant="link"
            onClick={() => setSearchQuery("")}
            className="mt-2"
          >
            Limpiar filtros
          </Button>
        </div>
      ) : deliveryMembers.length === 0 ? (
        <div className="rounded-lg border bg-background">
          <EmptyState
            icon={Truck}
            title="No hay repartidores"
            description="Agrega repartidores para gestionar las entregas de tus bodegones"
            actionLabel="Agregar repartidor"
            onAction={openCreateDrawer}
          />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredMembers}
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
                  <Truck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <SheetTitle>
                    {editingMember ? "Editar Repartidor" : "Agregar Repartidor"}
                  </SheetTitle>
                  <SheetDescription>
                    {editingMember
                      ? "Modifica la información del repartidor"
                      : "Agrega un nuevo repartidor al equipo"}
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
              {/* Warehouse Selection */}
              <div className="space-y-2">
                <Label>Bodegones</Label>
                <Popover open={warehousePopoverOpen} onOpenChange={setWarehousePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={warehousePopoverOpen}
                      className="w-full justify-between font-normal"
                      disabled={isSubmitting}
                    >
                      {selectedWarehouses.length === 0
                        ? "Seleccionar bodegones"
                        : selectedWarehouses.length === warehouses.length
                        ? "Todos los bodegones"
                        : `${selectedWarehouses.length} bodegón(es) seleccionado(s)`}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar bodegón..." />
                      <CommandList>
                        <CommandEmpty>No se encontraron bodegones.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              if (selectedWarehouses.length === warehouses.length) {
                                clearAllWarehouses()
                              } else {
                                selectAllWarehouses()
                              }
                            }}
                            className="font-medium"
                          >
                            <div
                              className={cn(
                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                selectedWarehouses.length === warehouses.length
                                  ? "bg-primary text-primary-foreground"
                                  : "opacity-50"
                              )}
                            >
                              {selectedWarehouses.length === warehouses.length && (
                                <Check className="h-3 w-3" />
                              )}
                            </div>
                            Todos los bodegones
                          </CommandItem>
                          {warehouses.map((warehouse) => (
                            <CommandItem
                              key={warehouse.id}
                              onSelect={() => toggleWarehouse(warehouse.id)}
                            >
                              <div
                                className={cn(
                                  "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                  selectedWarehouses.includes(warehouse.id)
                                    ? "bg-primary text-primary-foreground"
                                    : "opacity-50"
                                )}
                              >
                                {selectedWarehouses.includes(warehouse.id) && (
                                  <Check className="h-3 w-3" />
                                )}
                              </div>
                              {warehouse.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedWarehouses.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedWarehouses.map((id) => {
                      const warehouse = warehouses.find((w) => w.id === id)
                      return warehouse ? (
                        <Badge key={id} variant="secondary" className="text-xs">
                          {warehouse.name}
                        </Badge>
                      ) : null
                    })}
                  </div>
                )}
              </div>

              {/* First Name */}
              <div className="space-y-2">
                <Label>
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Nombre"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label>
                  Apellido <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Apellido"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label>
                  Correo electrónico <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting || !!editingMember}
                />
                {editingMember && (
                  <p className="text-xs text-muted-foreground">
                    El correo no puede ser modificado
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <div className="flex gap-2">
                  <Select
                    value={phoneCode}
                    onValueChange={setPhoneCode}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PHONE_CODES.map((code) => (
                        <SelectItem key={code} value={code}>
                          {code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 7))}
                    disabled={isSubmitting}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Delivery Status */}
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={deliveryStatus}
                  onValueChange={(value) => setDeliveryStatus(value as DeliveryStatus)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {DELIVERY_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {getDeliveryStatusLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {editingMember ? "Guardando..." : "Agregando..."}
                  </>
                ) : editingMember ? (
                  "Guardar cambios"
                ) : (
                  "Agregar Repartidor"
                )}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => !isDeleting && setDeleteDialogOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar repartidor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente a{" "}
              <strong>
                {memberToDelete && getFullName(memberToDelete)}
              </strong>{" "}
              del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={isDeleting}
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
