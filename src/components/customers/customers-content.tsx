"use client"

import { useMemo } from "react"
import { Users, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/src/components/customers/data-table"
import { getColumns } from "@/src/components/customers/columns"
import { CustomersSkeleton } from "@/src/components/customers/customers-skeleton"
import { EmptyState } from "@/components/empty-state"
import { useCustomersViewModel } from "@/src/viewmodels/useCustomersViewModel"
import { getFullName } from "@/src/services/customers.service"
import { useState } from "react"

export function CustomersContent() {
  const {
    customers,
    isLoading,
    error,
    pagination,
    setPage,
    setPageSize,
  } = useCustomersViewModel()

  // Search state
  const [searchQuery, setSearchQuery] = useState("")

  // Filtered data
  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers
    const query = searchQuery.toLowerCase()
    return customers.filter((customer) => {
      const fullName = getFullName(customer).toLowerCase()
      return (
        fullName.includes(query) ||
        customer.email.toLowerCase().includes(query)
      )
    })
  }, [customers, searchQuery])

  const columns = useMemo(() => getColumns(), [])

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 px-4 py-[50px] mx-auto w-full max-w-[1200px]">
        {/* Title Section */}
        <div className="mb-[25px]">
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            Lista de clientes registrados
          </p>
        </div>

        {/* Action Section */}
        <div className="flex items-center gap-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              value=""
              readOnly
              disabled
              className="pl-9 w-64"
            />
          </div>
        </div>

        <CustomersSkeleton />
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
          Clientes{" "}
          <span className="text-muted-foreground font-normal">
            ({pagination.totalCount})
          </span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Lista de clientes registrados
        </p>
      </div>

      {/* Action Section */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-64"
          />
        </div>
      </div>

      {filteredCustomers.length === 0 && searchQuery ? (
        <div className="rounded-lg border bg-background p-8 text-center">
          <p className="text-muted-foreground">
            No se encontraron clientes con los filtros aplicados
          </p>
          <Button
            variant="link"
            onClick={() => setSearchQuery("")}
            className="mt-2"
          >
            Limpiar filtros
          </Button>
        </div>
      ) : customers.length === 0 ? (
        <div className="rounded-lg border bg-background">
          <EmptyState
            icon={Users}
            title="No hay clientes"
            description="Aún no hay clientes registrados en el sistema"
          />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredCustomers}
          pagination={pagination}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  )
}
