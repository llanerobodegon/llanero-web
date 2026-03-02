"use client"

import { useState, useMemo, useEffect } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/src/components/payment-methods/data-table"
import { getColumns } from "@/src/components/payment-methods/bank-accounts-columns"
import { PaymentMethodsSkeleton } from "@/src/components/payment-methods/payment-methods-skeleton"
import { EmptyState } from "@/components/empty-state"
import {
  useBankAccountsViewModel,
  BankAccount,
  CreateBankAccountData,
} from "@/src/viewmodels/useBankAccountsViewModel"
import type { BankAccountScope, BankAccountType } from "@/src/services/bank-account.service"
import { useWarehouseContext } from "@/src/contexts/warehouse-context"
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

export function BankAccountsContent() {
  const {
    bankAccounts,
    isLoading,
    error,
    pagination,
    selectedWarehouseId,
    setPage,
    setPageSize,
    filterByWarehouse,
    createBankAccount,
    updateBankAccount,
    deleteBankAccount,
  } = useBankAccountsViewModel()

  const { warehouses, selectedWarehouse } = useWarehouseContext()

  // Auto-filter by warehouse from context (managers with 1 warehouse get auto-filtered)
  const hasMultipleWarehouses = warehouses.length > 1
  useEffect(() => {
    if (selectedWarehouse && !selectedWarehouseId) {
      filterByWarehouse(selectedWarehouse.id)
    }
  }, [selectedWarehouse])

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)

  // Form state
  const [scope, setScope] = useState<BankAccountScope>("nacional")
  const [type, setType] = useState<BankAccountType>("zelle")
  const [warehouseId, setWarehouseId] = useState("")
  const [holderName, setHolderName] = useState("")
  const [rif, setRif] = useState("")
  const [bank, setBank] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [pagoMovilPhone, setPagoMovilPhone] = useState("")
  const [isActive, setIsActive] = useState(true)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [accountToDelete, setAccountToDelete] = useState<BankAccount | null>(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState("")

  // Filtered data
  const filteredAccounts = useMemo(() => {
    if (!searchQuery) return bankAccounts
    const query = searchQuery.toLowerCase()
    return bankAccounts.filter((account) => {
      return (
        account.holderName.toLowerCase().includes(query) ||
        account.rif?.toLowerCase().includes(query) ||
        account.bank?.toLowerCase().includes(query) ||
        account.accountNumber.toLowerCase().includes(query) ||
        account.pagoMovilPhone?.toLowerCase().includes(query)
      )
    })
  }, [bankAccounts, searchQuery])

  // Reset form
  const resetForm = () => {
    setScope("nacional")
    setType("zelle")
    setWarehouseId(selectedWarehouseId || "")
    setHolderName("")
    setRif("")
    setBank("")
    setAccountNumber("")
    setPagoMovilPhone("")
    setIsActive(true)
    setEditingAccount(null)
  }

  const openCreateDrawer = () => {
    resetForm()
    setIsDrawerOpen(true)
  }

  const openEditDrawer = (account: BankAccount) => {
    setEditingAccount(account)
    setScope(account.scope)
    setType(account.type || "zelle")
    setWarehouseId(account.warehouseId)
    setHolderName(account.holderName)
    setRif(account.rif || "")
    setBank(account.bank || "")
    setAccountNumber(account.accountNumber)
    setPagoMovilPhone(account.pagoMovilPhone || "")
    setIsActive(account.isActive)
    setIsDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
    resetForm()
  }

  // Handle scope tab change — clear scope-specific fields
  const handleScopeChange = (newScope: string) => {
    setScope(newScope as BankAccountScope)
    setBank("")
    setRif("")
    setAccountNumber("")
    setPagoMovilPhone("")
    setType("zelle")
  }

  // Form validation
  const isFormValid = useMemo(() => {
    const hasWarehouse = editingAccount || warehouseId
    if (!hasWarehouse || !holderName || !accountNumber) return false

    if (scope === "nacional") {
      return !!(rif && bank)
    }
    // internacional — type is required, accountNumber holds email/account
    return !!type
  }, [scope, type, holderName, rif, bank, accountNumber, editingAccount, warehouseId])

  const handleSubmit = async () => {
    if (!isFormValid) return

    setIsSubmitting(true)
    try {
      if (editingAccount) {
        await updateBankAccount(editingAccount.id, {
          scope,
          type: scope === "internacional" ? type : null,
          holderName,
          rif: scope === "nacional" ? rif : null,
          bank: scope === "nacional" ? bank : null,
          accountNumber,
          pagoMovilPhone: scope === "nacional" ? (pagoMovilPhone || null) : null,
          isActive,
        })
        toast.success("Método de pago actualizado correctamente")
      } else {
        const data: CreateBankAccountData = {
          warehouseId,
          scope,
          type: scope === "internacional" ? type : null,
          holderName,
          rif: scope === "nacional" ? rif : null,
          bank: scope === "nacional" ? bank : null,
          accountNumber,
          pagoMovilPhone: scope === "nacional" ? (pagoMovilPhone || null) : null,
          isActive,
        }
        await createBankAccount(data)
        toast.success("Método de pago creado correctamente")
      }

      handleCloseDrawer()
    } catch (err) {
      console.error("Error saving bank account:", err)
      toast.error("Error al guardar el método de pago")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (account: BankAccount) => {
    setAccountToDelete(account)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!accountToDelete) return

    try {
      await deleteBankAccount(accountToDelete.id)
      toast.success("Método de pago eliminado correctamente")
    } catch (err) {
      console.error("Error deleting bank account:", err)
      toast.error("Error al eliminar el método de pago")
    } finally {
      setDeleteDialogOpen(false)
      setAccountToDelete(null)
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
        <div className="mb-[25px]">
          <h1 className="text-2xl font-semibold">Métodos de Pago</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los métodos de pago por bodegón
          </p>
        </div>

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
          Gestiona los métodos de pago por bodegón
        </p>
      </div>

      {/* Action Section */}
      <div className="flex items-center gap-3">
        {/* Warehouse Filter */}
        <Select
          value={selectedWarehouseId || "all"}
          onValueChange={(value) => filterByWarehouse(value === "all" ? null : value)}
          disabled={!hasMultipleWarehouses}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Todos los bodegones" />
          </SelectTrigger>
          <SelectContent>
            {hasMultipleWarehouses && (
              <SelectItem value="all">Todos los bodegones</SelectItem>
            )}
            {warehouses.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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

      {filteredAccounts.length === 0 && searchQuery ? (
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
      ) : bankAccounts.length === 0 ? (
        <div className="rounded-lg border bg-background">
          <EmptyState
            icon={CreditCard}
            title="No hay métodos de pago"
            description={
              selectedWarehouseId
                ? "Agrega métodos de pago para este bodegón"
                : "Selecciona un bodegón y agrega métodos de pago"
            }
            actionLabel="Agregar método"
            onAction={openCreateDrawer}
          />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredAccounts}
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
                    {editingAccount ? "Editar Método de Pago" : "Agregar Método de Pago"}
                  </SheetTitle>
                  <SheetDescription>
                    {editingAccount
                      ? "Modifica la información del método de pago"
                      : "Configura un nuevo método de pago para un bodegón"}
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
              {/* Warehouse Selection (only on create) */}
              {!editingAccount && (
                <div className="space-y-2">
                  <Label>
                    Bodegón <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={warehouseId}
                    onValueChange={setWarehouseId}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona un bodegón" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Scope Tabs */}
              <Tabs value={scope} onValueChange={handleScopeChange}>
                <TabsList className="w-full">
                  <TabsTrigger value="nacional" className="flex-1" disabled={isSubmitting}>
                    Nacional
                  </TabsTrigger>
                  <TabsTrigger value="internacional" className="flex-1" disabled={isSubmitting}>
                    Internacional
                  </TabsTrigger>
                </TabsList>

                {/* Nacional Tab */}
                <TabsContent value="nacional" className="space-y-6 mt-4">
                  {/* Holder Name */}
                  <div className="space-y-2">
                    <Label>
                      Titular de la cuenta <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder="Ej: BARILICORES EL LLANERO, C.A"
                      value={holderName}
                      onChange={(e) => setHolderName(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* RIF */}
                  <div className="space-y-2">
                    <Label>
                      RIF <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder="Ej: J-50107296-5"
                      value={rif}
                      onChange={(e) => setRif(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Bank */}
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

                  {/* Account Number */}
                  <div className="space-y-2">
                    <Label>
                      Número de cuenta <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder="Ej: 0134-0218-3621-81024504"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Pago Movil Phone (optional) */}
                  <div className="space-y-2">
                    <Label>Teléfono Pago Móvil</Label>
                    <Input
                      placeholder="Ej: 0414-525.11.99 (opcional)"
                      value={pagoMovilPhone}
                      onChange={(e) => setPagoMovilPhone(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </TabsContent>

                {/* Internacional Tab */}
                <TabsContent value="internacional" className="space-y-6 mt-4">
                  {/* Type Selection */}
                  <div className="space-y-2">
                    <Label>
                      Tipo <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={type}
                      onValueChange={(value) => setType(value as BankAccountType)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zelle">Zelle</SelectItem>
                        <SelectItem value="banesco_panama">Banesco Panamá</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Holder Name */}
                  <div className="space-y-2">
                    <Label>
                      Titular <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder="Nombre del titular"
                      value={holderName}
                      onChange={(e) => setHolderName(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Account / Email */}
                  <div className="space-y-2">
                    <Label>
                      {type === "zelle" ? "Correo electrónico" : "Número de cuenta"}{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder={
                        type === "zelle"
                          ? "correo@ejemplo.com"
                          : "Número de cuenta Banesco Panamá"
                      }
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Active status (shared) */}
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
                    {editingAccount ? "Guardando..." : "Agregando..."}
                  </>
                ) : editingAccount ? (
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
              Esta acción no se puede deshacer. Se eliminará permanentemente
              {accountToDelete?.scope === "internacional"
                ? ` el método ${accountToDelete?.type === "zelle" ? "Zelle" : "Banesco Panamá"}`
                : ` la cuenta de ${accountToDelete?.bank}`
              }
              {" "}({accountToDelete?.accountNumber}).
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
