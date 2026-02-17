"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { Bell, ShoppingCart, RefreshCw } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useBreadcrumb } from "@/src/contexts/breadcrumb-context"
import { useNotifications } from "@/src/contexts/notifications-context"

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

function formatRelativeTime(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return "ahora"
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  return `hace ${Math.floor(diff / 86400)} d`
}

export function AdminHeader() {
  const pathname = usePathname()
  const { overrides } = useBreadcrumb()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
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
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
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
      <div className="flex items-center gap-2 px-4">
        <Drawer direction="right" onOpenChange={(open) => open && markAllAsRead()}>
          <DrawerTrigger asChild>
            <Button variant="ghost" size="icon" className="relative cursor-pointer">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader className="border-b">
              <DrawerTitle>Notificaciones</DrawerTitle>
            </DrawerHeader>
            <div className="no-scrollbar overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">No tienes notificaciones nuevas.</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const isCreated = notification.type === "order_created"
                  const relativeTime = formatRelativeTime(new Date(notification.created_at))
                  return (
                    <div
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={`flex gap-3 px-4 py-3 border-b last:border-0 cursor-pointer hover:bg-muted/30 transition-colors ${!notification.read ? "bg-muted/40" : ""}`}
                    >
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isCreated ? "bg-primary/10" : "bg-orange-500/10"}`}>
                        {isCreated
                          ? <ShoppingCart className="h-4 w-4 text-primary" />
                          : <RefreshCw className="h-4 w-4 text-orange-500" />
                        }
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-sm font-medium leading-none">{notification.title}</p>
                        <p className="text-sm text-muted-foreground">{notification.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{relativeTime}</p>
                      </div>
                      {!notification.read && (
                        <span className="ml-auto mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </header>
  )
}
