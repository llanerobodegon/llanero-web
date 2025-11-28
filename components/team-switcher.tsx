"use client"

import { ChevronsUpDown, Store, LayoutGrid } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useWarehouseContext } from "@/src/contexts/warehouse-context"
import { Skeleton } from "@/components/ui/skeleton"

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const { warehouses, selectedWarehouse, setSelectedWarehouse, isLoading } = useWarehouseContext()

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Skeleton className="size-8 rounded-lg" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                {selectedWarehouse ? (
                  <Store className="size-4" />
                ) : (
                  <LayoutGrid className="size-4" />
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {selectedWarehouse?.name || "Todos los bodegones"}
                </span>
                <span className="truncate text-xs">
                  {selectedWarehouse ? "Bodegón" : "Vista global"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuItem
              onClick={() => setSelectedWarehouse(null)}
              className="gap-2 p-2 cursor-pointer"
            >
              <div className="flex size-6 items-center justify-center rounded-md border">
                <LayoutGrid className="size-3.5 shrink-0" />
              </div>
              Todos los bodegones
            </DropdownMenuItem>
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Bodegones
            </DropdownMenuLabel>
            {warehouses.map((warehouse) => (
              <DropdownMenuItem
                key={warehouse.id}
                onClick={() => setSelectedWarehouse(warehouse)}
                className="gap-2 p-2 cursor-pointer"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <Store className="size-3.5 shrink-0" />
                </div>
                {warehouse.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
