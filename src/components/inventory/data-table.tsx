"use client"

import { useMemo, useCallback } from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  RowSelectionState,
} from "@tanstack/react-table"
import { ChevronLeft, ChevronRight } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DataTableProps<TData extends { id: string }, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  selectedIds?: Set<string>
  onSelectionChange?: (selectedIds: Set<string>) => void
}

export function DataTable<TData extends { id: string }, TValue>({
  columns,
  data,
  pagination,
  onPageChange,
  onPageSizeChange,
  selectedIds = new Set(),
  onSelectionChange,
}: DataTableProps<TData, TValue>) {
  // Convert Set<string> to RowSelectionState for current page items
  const rowSelection: RowSelectionState = useMemo(() => {
    const selection: RowSelectionState = {}
    data.forEach((row) => {
      if (selectedIds.has(row.id)) {
        selection[row.id] = true
      }
    })
    return selection
  }, [data, selectedIds])

  // Handle row selection changes
  const handleRowSelectionChange = useCallback(
    (updaterOrValue: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)) => {
      if (!onSelectionChange) return

      const newRowSelection = typeof updaterOrValue === "function"
        ? updaterOrValue(rowSelection)
        : updaterOrValue

      // Create new Set starting from current selectedIds
      const newSelectedIds = new Set(selectedIds)

      // Update selection for current page items
      data.forEach((row) => {
        if (newRowSelection[row.id]) {
          newSelectedIds.add(row.id)
        } else {
          newSelectedIds.delete(row.id)
        }
      })

      onSelectionChange(newSelectedIds)
    },
    [data, selectedIds, onSelectionChange, rowSelection]
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: pagination.totalPages,
    enableRowSelection: true,
    getRowId: (row) => row.id,
    state: {
      rowSelection,
    },
    onRowSelectionChange: handleRowSelectionChange,
  })

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="text-muted-foreground font-normal"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-b last:border-0"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Sin resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {selectedIds.size > 0 ? (
              <span>{selectedIds.size} seleccionado(s)</span>
            ) : (
              <span>0 seleccionado(s)</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Filas por página</span>
          <Select
            value={String(pagination.pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Página {pagination.page} de {pagination.totalPages || 1}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
