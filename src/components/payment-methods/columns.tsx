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
import { MoreVertical, Pencil, Trash2 } from "lucide-react"
import {
  PaymentMethod,
  getPaymentTypeLabel,
  getAccountDisplay,
} from "@/src/services/payment-method.service"

interface ColumnsProps {
  onEdit: (item: PaymentMethod) => void
  onDelete: (item: PaymentMethod) => void
}

export function getColumns({ onEdit, onDelete }: ColumnsProps): ColumnDef<PaymentMethod>[] {
  return [
    {
      accessorKey: "bank",
      header: "Banco",
      cell: ({ row }) => {
        const method = row.original
        let bankName: string

        // For Zelle, show "Zelle"
        if (method.type === "zelle") {
          bankName = "Zelle"
        }
        // For Banesco Panama
        else if (method.type === "banesco_panama") {
          bankName = "Banesco Panamá"
        } else {
          bankName = method.bank || "-"
        }

        return (
          <div className="flex flex-col">
            <span className="font-medium">{bankName}</span>
            {method.holderName && (
              <span className="text-xs text-muted-foreground">{method.holderName}</span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }) => {
        const type = row.original.type
        return (
          <Badge variant="outline" className="font-normal">
            {getPaymentTypeLabel(type)}
          </Badge>
        )
      },
    },
    {
      accessorKey: "account",
      header: "Cuenta",
      cell: ({ row }) => {
        const method = row.original
        const display = getAccountDisplay(method)
        return <span className="text-muted-foreground">{display}</span>
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
        const item = row.original

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
                <DropdownMenuItem onClick={() => onEdit(item)}>
                  <Pencil className="h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(item)}
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
