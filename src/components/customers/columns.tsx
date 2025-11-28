"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Customer,
  getFullName,
  getInitials,
  formatDate,
} from "@/src/services/customers.service"

export function getColumns(): ColumnDef<Customer>[] {
  return [
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }) => {
        const customer = row.original
        const fullName = getFullName(customer)
        const initials = getInitials(customer)

        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{fullName}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "email",
      header: "Correo",
      cell: ({ row }) => {
        return (
          <span className="text-muted-foreground">{row.original.email}</span>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: "Fecha de Registro",
      cell: ({ row }) => {
        return (
          <span className="text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        )
      },
    },
  ]
}
