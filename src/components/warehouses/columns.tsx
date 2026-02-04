"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Package, Store, Pencil, Trash2 } from "lucide-react"
import { WarehouseWithProductCount } from "@/src/viewmodels/useWarehousesViewModel"

interface ColumnsProps {
  onEdit: (warehouse: WarehouseWithProductCount) => void
  onDelete: (warehouse: WarehouseWithProductCount) => void
  onViewProducts: (warehouse: WarehouseWithProductCount) => void
}

export function getColumns({ onEdit, onDelete, onViewProducts }: ColumnsProps): ColumnDef<WarehouseWithProductCount>[] {
  return [
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }) => {
        const name = row.getValue("name") as string
        const address = row.original.address
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <Store className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium">{name}</span>
              {address && (
                <span className="text-xs text-muted-foreground">{address}</span>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "productCount",
      header: "Productos",
      cell: ({ row }) => {
        const count = row.original.productCount
        const warehouse = row.original
        return (
          <button
            onClick={() => onViewProducts(warehouse)}
            className="flex items-center gap-2 hover:bg-muted px-2 py-1 rounded-md transition-colors cursor-pointer"
          >
            <Package className="h-4 w-4 text-muted-foreground" />
            <span>{count}</span>
          </button>
        )
      },
    },
    {
      accessorKey: "isActive",
      header: "Estado",
      cell: ({ row }) => {
        const isActive = row.original.isActive
        return (
          <Badge
            variant="outline"
            className="bg-transparent border-gray-300 text-gray-700 font-normal"
          >
            <span className={`h-2 w-2 rounded-full ${isActive ? "bg-green-500" : "bg-gray-400"}`} />
            {isActive ? "Activo" : "Inactivo"}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right"></div>,
      cell: ({ row }) => {
        const warehouse = row.original

        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Abrir menú</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(warehouse)}>
                  <Pencil className="h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(warehouse)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]
}
