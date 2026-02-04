"use client"

import Image from "next/image"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, ImageIcon, Pencil, Trash2 } from "lucide-react"

export interface ProductItem {
  id: string
  name: string
  imageUrls: string[]
  sku: string | null
  barcode: string | null
  price: number
  isActive: boolean
  category: {
    id: string
    name: string
  } | null
  subcategory: {
    id: string
    name: string
  } | null
}

interface ColumnsProps {
  onEdit: (item: ProductItem) => void
  onDelete: (item: ProductItem) => void
}

export function getColumns({ onEdit, onDelete }: ColumnsProps): ColumnDef<ProductItem>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Seleccionar todos"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Seleccionar fila"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Producto",
      cell: ({ row }) => {
        const item = row.original
        const imageUrl = item.imageUrls?.[0]
        const isValidUrl = imageUrl && (imageUrl.startsWith("http://") || imageUrl.startsWith("https://") || imageUrl.startsWith("/"))
        return (
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
              {isValidUrl ? (
                <Image
                  src={imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div>
              <span className="font-medium">{item.name}</span>
              {item.sku && (
                <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
              )}
            </div>
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
          <span className="text-muted-foreground">
            {category?.name ?? "Sin categoría"}
          </span>
        )
      },
    },
    {
      accessorKey: "subcategory",
      header: "Subcategoría",
      cell: ({ row }) => {
        const subcategory = row.original.subcategory
        return (
          <span className="text-muted-foreground">
            {subcategory?.name ?? "-"}
          </span>
        )
      },
    },
    {
      accessorKey: "price",
      header: "Precio",
      cell: ({ row }) => {
        const price = row.original.price
        return <span className="font-medium">${price.toFixed(2)}</span>
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
