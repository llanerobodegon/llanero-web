"use client"

import { useState, useMemo } from "react"
import { toast } from "sonner"
import { Plus, CreditCard, Search, X, Loader2 } from "lucide-react"
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
import { DataTable } from "@/src/components/payment-methods/data-table"
import { getColumns } from "@/src/components/payment-methods/columns"
import { PaymentMethodsSkeleton } from "@/src/components/payment-methods/payment-methods-skeleton"
import { EmptyState } from "@/components/empty-state"
import {
  usePaymentMethodsViewModel,
  PaymentMethod,
  CreatePaymentMethodData,
  PaymentScope,
  PaymentType,
} from "@/src/viewmodels/usePaymentMethodsViewModel"
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
import { getPaymentTypeLabel } from "@/src/services/payment-method.service"

// Bank options for Venezuela
const BANKS = [
  "Banco de Venezuela",
  "100% Banco",
  "Bancamiga",
  "Bancaribe",
  "Banco Activo",
  "Banco Caroni",
  "Banco del Tesoro",
  "Banco Exterior",
  "Banco Fondo Comun",
  "Banco Internacional del Desarrollo",
  "Banco Mercantil",
  "Banco Nacional de Credito",
  "Banco Plaza",
  "Banco Sofitasa",
  "Banco Venezolano de Credito",
  "Bancrecer",
  "Banesco",
  "Banfanb",
  "Bangente",
  "Banplus",
  "BBVA Provincial",
  "Mi Banco",
]

// Phone codes for Venezuela
const PHONE_CODES = ["0412", "0414", "0416", "0422", "0424", "0426"]

export function PaymentMethodsContent() {
  const {
    paymentMethods,
    isLoading,
    error,
    pagination,
    setPage,
    setPageSize,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
  } = usePaymentMethodsViewModel()

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)

  // Form state
  const [scope, setScope] = useState<PaymentScope>("nacional")
  const [type, setType] = useState<PaymentType>("pago_movil")
  const [bank, setBank] = useState("")
  const [documentType, setDocumentType] = useState<"V" | "J" | "E">("V")
  const [documentNumber, setDocumentNumber] = useState("")
  const [phoneCode, setPhoneCode] = useState("0414")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [email, setEmail] = useState("")
  const [holderName, setHolderName] = useState("")
  const [isActive, setIsActive] = useState(true)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [methodToDelete, setMethodToDelete] = useState<PaymentMethod | null>(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState("")

  // Filtered data
  const filteredMethods = useMemo(() => {
    if (!searchQuery) return paymentMethods
    const query = searchQuery.toLowerCase()
    return paymentMethods.filter((method) => {
      return (
        method.bank?.toLowerCase().includes(query) ||
        method.email?.toLowerCase().includes(query) ||
        method.accountNumber?.toLowerCase().includes(query) ||
        method.phoneNumber?.toLowerCase().includes(query)
      )
    })
  }, [paymentMethods, searchQuery])

  // Reset form
  const resetForm = () => {
    setScope("nacional")
    setType("pago_movil")
    setBank("")
    setDocumentType("V")
    setDocumentNumber("")
    setPhoneCode("0414")
    setPhoneNumber("")
    setAccountNumber("")
    setEmail("")
    setHolderName("")
    setIsActive(true)
    setEditingMethod(null)
  }

  // Handle scope change
  const handleScopeChange = (newScope: PaymentScope) => {
    setScope(newScope)
    // Set default type based on scope
    if (newScope === "nacional") {
      setType("pago_movil")
    } else {
      setType("zelle")
    }
    // Clear fields
    setBank("")
    setDocumentNumber("")
    setAccountNumber("")
    setEmail("")
    setPhoneNumber("")
  }

  const openCreateDrawer = () => {
    resetForm()
    setIsDrawerOpen(true)
  }

  const openEditDrawer = (method: PaymentMethod) => {
    setEditingMethod(method)
    setScope(method.scope)
    setType(method.type)
    setBank(method.bank || "")
    setDocumentType(method.documentType || "V")
    setDocumentNumber(method.documentNumber || "")
    setPhoneCode(method.phoneCode || "0414")
    setPhoneNumber(method.phoneNumber || "")
    setAccountNumber(method.accountNumber || "")
    setEmail(method.email || "")
    setHolderName(method.holderName || "")
    setIsActive(method.isActive)
    setIsDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
    resetForm()
  }

  // Form validation
  const isFormValid = useMemo(() => {
    if (type === "pago_movil") {
      return bank && documentType && documentNumber && phoneCode && phoneNumber
    }
    if (type === "transferencia") {
      return bank && documentType && documentNumber && accountNumber
    }
    if (type === "zelle") {
      return email
    }
    if (type === "banesco_panama") {
      return accountNumber
    }
    return false
  }, [type, bank, documentType, documentNumber, phoneCode, phoneNumber, accountNumber, email])

  const handleSubmit = async () => {
    if (!isFormValid) return

    setIsSubmitting(true)
    try {
      const data: CreatePaymentMethodData = {
        scope,
        type,
        bank: type === "pago_movil" || type === "transferencia" ? bank : null,
        documentType: type === "pago_movil" || type === "transferencia" ? documentType : null,
        documentNumber: type === "pago_movil" || type === "transferencia" ? documentNumber : null,
        phoneCode: type === "pago_movil" ? phoneCode : null,
        phoneNumber: type === "pago_movil" ? phoneNumber : null,
        accountNumber: type === "transferencia" || type === "banesco_panama" ? accountNumber : null,
        email: type === "zelle" ? email : null,
        holderName: holderName || null,
        isActive,
      }

      if (editingMethod) {
        await updatePaymentMethod(editingMethod.id, data)
        toast.success("Método de pago actualizado correctamente")
      } else {
        await createPaymentMethod(data)
        toast.success("Método de pago creado correctamente")
      }

      handleCloseDrawer()
    } catch (err) {
      console.error("Error saving payment method:", err)
      toast.error("Error al guardar el método de pago")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (method: PaymentMethod) => {
    setMethodToDelete(method)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!methodToDelete) return

    try {
      await deletePaymentMethod(methodToDelete.id)
      toast.success("Método de pago eliminado correctamente")
    } catch (err) {
      console.error("Error deleting payment method:", err)
      toast.error("Error al eliminar el método de pago")
    } finally {
      setDeleteDialogOpen(false)
      setMethodToDelete(null)
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
          <h1 className="text-2xl font-semibold">Métodos de Pago</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los métodos de pago disponibles
          </p>
        </div>

        {/* Action Section */}
        <div className="flex items-center gap-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar método de pago..."
              value=""
              readOnly
              disabled
              className="pl-9 w-64"
            />
          </div>
          <Button disabled className="ml-auto">
            <Plus />
            Agregar método
          </Button>
        </div>

        <PaymentMethodsSkeleton />
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
          Métodos de Pago{" "}
          <span className="text-muted-foreground font-normal">
            ({pagination.totalCount})
          </span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Gestiona los métodos de pago disponibles
        </p>
      </div>

      {/* Action Section */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar método de pago..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-64"
          />
        </div>
        <Button onClick={openCreateDrawer} className="ml-auto">
          <Plus />
          Agregar método
        </Button>
      </div>

      {filteredMethods.length === 0 && searchQuery ? (
        <div className="rounded-lg border bg-background p-8 text-center">
          <p className="text-muted-foreground">
            No se encontraron métodos de pago con los filtros aplicados
          </p>
          <Button
            variant="link"
            onClick={() => setSearchQuery("")}
            className="mt-2"
          >
            Limpiar filtros
          </Button>
        </div>
      ) : paymentMethods.length === 0 ? (
        <div className="rounded-lg border bg-background">
          <EmptyState
            icon={CreditCard}
            title="No hay métodos de pago"
            description="Agrega métodos de pago para que los clientes puedan realizar sus compras"
            actionLabel="Agregar método"
            onAction={openCreateDrawer}
          />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredMethods}
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
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <SheetTitle>
                    {editingMethod ? "Editar Método de Pago" : "Agregar Método de Pago"}
                  </SheetTitle>
                  <SheetDescription>
                    {editingMethod
                      ? "Modifica la información del método de pago"
                      : "Configura un nuevo método de pago"}
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
              {/* Scope Selection */}
              <div className="space-y-2">
                <Label>
                  Tipo de método <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={scope}
                  onValueChange={(value) => handleScopeChange(value as PaymentScope)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nacional">Nacional</SelectItem>
                    <SelectItem value="internacional">Internacional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Type Selection */}
              <div className="space-y-2">
                <Label>
                  Método <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={type}
                  onValueChange={(value) => setType(value as PaymentType)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {scope === "nacional" ? (
                      <>
                        <SelectItem value="pago_movil">Pago Móvil</SelectItem>
                        <SelectItem value="transferencia">Transferencia</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="zelle">Zelle</SelectItem>
                        <SelectItem value="banesco_panama">Banesco Panamá</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Dynamic fields based on type */}
              {(type === "pago_movil" || type === "transferencia") && (
                <>
                  <div className="space-y-2">
                    <Label>
                      Banco <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={bank}
                      onValueChange={setBank}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un banco" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {BANKS.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Documento <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Select
                        value={documentType}
                        onValueChange={(value) => setDocumentType(value as "V" | "J" | "E")}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="V">V</SelectItem>
                          <SelectItem value="J">J</SelectItem>
                          <SelectItem value="E">E</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="12345678"
                        value={documentNumber}
                        onChange={(e) => setDocumentNumber(e.target.value.replace(/\D/g, ""))}
                        disabled={isSubmitting}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </>
              )}

              {type === "pago_movil" && (
                <div className="space-y-2">
                  <Label>
                    Teléfono <span className="text-destructive">*</span>
                  </Label>
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
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 7))}
                      disabled={isSubmitting}
                      className="flex-1"
                    />
                  </div>
                </div>
              )}

              {type === "transferencia" && (
                <div className="space-y-2">
                  <Label>
                    Número de cuenta <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="0000-0000-00-0000000000"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {type === "zelle" && (
                <div className="space-y-2">
                  <Label>
                    Correo electrónico <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {type === "banesco_panama" && (
                <div className="space-y-2">
                  <Label>
                    Número de cuenta <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="Número de cuenta Banesco Panamá"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {/* Holder name (optional) */}
              <div className="space-y-2">
                <Label>Titular</Label>
                <Input
                  placeholder="Nombre del titular (opcional)"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {/* Active status */}
              <div className="space-y-2">
                <Label>Estado</Label>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Método de pago activo
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
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {editingMethod ? "Guardando..." : "Agregando..."}
                  </>
                ) : editingMethod ? (
                  "Guardar cambios"
                ) : (
                  "Agregar Método"
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
            <AlertDialogTitle>¿Eliminar método de pago?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el
              método de pago{" "}
              <strong>
                {methodToDelete?.type && getPaymentTypeLabel(methodToDelete.type)}
              </strong>
              .
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
