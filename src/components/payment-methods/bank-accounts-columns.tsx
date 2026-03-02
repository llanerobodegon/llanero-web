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
import { MoreVertical, Pencil, Trash2, Check, Minus } from "lucide-react"
import { BankAccount } from "@/src/services/bank-account.service"

interface ColumnsProps {
  onEdit: (item: BankAccount) => void
  onDelete: (item: BankAccount) => void
}

export function getColumns({ onEdit, onDelete }: ColumnsProps): ColumnDef<BankAccount>[] {
  return [
    {
      accessorKey: "holderName",
      header: "Titular",
      cell: ({ row }) => {
        const account = row.original
        return (
          <div className="flex flex-col">
            <span className="font-medium">{account.holderName}</span>
            {account.rif && (
              <span className="text-xs text-muted-foreground">{account.rif}</span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "bank",
      header: "Banco / Tipo",
      cell: ({ row }) => {
        const account = row.original
        if (account.scope === "internacional") {
          const label = account.type === "zelle" ? "Zelle" : "Banesco Panam\u00e1"
          return (
            <Badge variant="outline" className="font-normal">
              {label}
            </Badge>
          )
        }
        return <span className="font-medium">{account.bank}</span>
      },
    },
    {
      accessorKey: "accountNumber",
      header: "N\u00b0 de Cuenta / Dato",
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-sm">
          {row.original.accountNumber}
        </span>
      ),
    },
    {
      accessorKey: "pagoMovilPhone",
      header: "Pago M\u00f3vil",
      cell: ({ row }) => {
        const account = row.original
        if (account.scope === "internacional") {
          return <Minus className="h-4 w-4 text-muted-foreground" />
        }
        const phone = account.pagoMovilPhone
        return phone ? (
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-green-500" />
            <span className="text-sm text-muted-foreground">{phone}</span>
          </div>
        ) : (
          <Minus className="h-4 w-4 text-muted-foreground" />
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
        const item = row.original
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Abrir menu</span>
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
