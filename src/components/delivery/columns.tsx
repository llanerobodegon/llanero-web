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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DeliveryMember,
  getFullName,
  getInitials,
  getDeliveryStatusLabel,
  getDeliveryStatusColor,
} from "@/src/services/delivery.service"

interface ColumnsProps {
  onEdit: (item: DeliveryMember) => void
  onDelete: (item: DeliveryMember) => void
  currentUserId?: string
}

export function getColumns({ onEdit, onDelete, currentUserId }: ColumnsProps): ColumnDef<DeliveryMember>[] {
  return [
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }) => {
        const member = row.original
        const fullName = getFullName(member)
        const initials = getInitials(member)

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
      accessorKey: "deliveryStatus",
      header: "Estado",
      cell: ({ row }) => {
        const status = row.original.deliveryStatus
        const statusLabel = getDeliveryStatusLabel(status)
        const statusColor = getDeliveryStatusColor(status)

        return (
          <Badge
            variant="outline"
            className="bg-transparent border-gray-300 text-gray-700 font-normal"
          >
            <span className={`h-2 w-2 rounded-full ${statusColor}`} />
            {statusLabel}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right"></div>,
      cell: ({ row }) => {
        const item = row.original
        const isCurrentUser = currentUserId === item.id

        if (isCurrentUser) {
          return null
        }

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
