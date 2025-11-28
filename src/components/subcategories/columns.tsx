"use client"

import Image from "next/image"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Package, ImageIcon, FolderOpen, Pencil, Trash2 } from "lucide-react"
import { SubcategoryWithProductCount } from "@/src/viewmodels/useSubcategoriesViewModel"

interface ColumnsProps {
  onEdit: (subcategory: SubcategoryWithProductCount) => void
  onDelete: (subcategory: SubcategoryWithProductCount) => void
}

export function getColumns({ onEdit, onDelete }: ColumnsProps): ColumnDef<SubcategoryWithProductCount>[] {
  return [
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }) => {
        const subcategory = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
              {subcategory.imageUrl ? (
                <Image
                  src={subcategory.imageUrl}
                  alt={subcategory.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <span className="font-medium">{subcategory.name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "category",
      header: "Categoría",
      cell: ({ row }) => {
        const category = row.original.category
        return (
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            <span>{category?.name || "-"}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "productCount",
      header: "Productos",
      cell: ({ row }) => {
        const count = row.original.productCount
        return (
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span>{count}</span>
          </div>
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
        const subcategory = row.original

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
                <DropdownMenuItem onClick={() => onEdit(subcategory)}>
                  <Pencil className="h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(subcategory)}
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
