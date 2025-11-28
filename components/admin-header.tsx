"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useBreadcrumb } from "@/src/contexts/breadcrumb-context"

// Route segment to display name mapping (UI text in Spanish)
const routeDisplayNames: Record<string, string> = {
  admin: "Dashboard",
  orders: "Pedidos",
  warehouses: "Bodegones",
  products: "Productos",
  inventory: "Inventario",
  categories: "Categorías",
  subcategories: "Subcategorías",
  "payment-methods": "Métodos de Pago",
  team: "Equipo",
  delivery: "Repartidores",
  customers: "Clientes",
  new: "Nuevo",
}

// Segments to skip in breadcrumb display
const skipSegments = ["edit"]

export function AdminHeader() {
  const pathname = usePathname()
  const { overrides } = useBreadcrumb()
  const segments = pathname.split("/").filter(Boolean)

  // Filter out segments we want to skip
  const filteredSegments = segments.filter((segment) => !skipSegments.includes(segment))

  const getDisplayName = (segment: string): string => {
    // Check for overrides first
    const override = overrides.find((o) => o.segment === segment)
    if (override) {
      return override.label
    }
    // Then check static mappings
    return routeDisplayNames[segment] || segment
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1 cursor-pointer" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {filteredSegments.map((segment, index) => {
              const isLast = index === filteredSegments.length - 1
              // Build href from original segments up to current position
              const originalIndex = segments.indexOf(segment)
              const href = "/" + segments.slice(0, originalIndex + 1).join("/")
              const displayName = getDisplayName(segment)

              return (
                <React.Fragment key={`${segment}-${index}`}>
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{displayName}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={href}>{displayName}</BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </React.Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )
}
