"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconBuilding,
  IconBuildingStore,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconPackage,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
  IconToolsKitchen2,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const bodegonData = {
  navMain: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: IconDashboard,
    },
    {
      title: "Productos",
      url: "/admin/bodegon-products",
      icon: IconPackage,
    },
    {
      title: "Categorías",
      url: "/admin/bodegon-categories",
      icon: IconFolder,
    },
    {
      title: "Inventario",
      url: "/admin/bodegon-inventory",
      icon: IconDatabase,
    },
    {
      title: "Pedidos",
      url: "/admin/orders",
      icon: IconListDetails,
    },
    {
      title: "Analíticas",
      url: "/admin/analytics",
      icon: IconChartBar,
    },
  ],
}

const restaurantData = {
  navMain: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: IconDashboard,
    },
    {
      title: "Menú",
      url: "/admin/restaurant-products",
      icon: IconToolsKitchen2,
    },
    {
      title: "Categorías",
      url: "/admin/restaurant-categories",
      icon: IconFolder,
    },
    {
      title: "Pedidos",
      url: "/admin/orders",
      icon: IconListDetails,
    },
    {
      title: "Analíticas",
      url: "/admin/analytics",
      icon: IconChartBar,
    },
  ],
}

const commonData = {
  user: {
    name: "Admin",
    email: "admin@llanero.com",
    avatar: "/avatars/admin.jpg",
  },
  navSecondary: [
    {
      title: "Configuración",
      url: "/admin/settings",
      icon: IconSettings,
    },
    {
      title: "Usuarios",
      url: "/admin/users",
      icon: IconUsers,
    },
    {
      title: "Ayuda",
      url: "/admin/help",
      icon: IconHelp,
    },
    {
      title: "Buscar",
      url: "/admin/search",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Reportes",
      url: "/admin/reports",
      icon: IconReport,
    },
    {
      name: "Documentos",
      url: "/admin/documents",
      icon: IconFileWord,
    },
    {
      name: "Archivos",
      url: "/admin/files",
      icon: IconFileDescription,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [activeTab, setActiveTab] = React.useState<"bodegon" | "restaurant">("bodegon")

  const currentNavData = activeTab === "bodegon" ? bodegonData : restaurantData

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/admin">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Llanero Admin</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        {/* Selector de pestañas */}
        <div className="px-2 py-2">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "bodegon" | "restaurant")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="bodegon" className="flex items-center gap-2">
                <IconBuildingStore className="h-4 w-4" />
                <span className="hidden sm:inline">Bodegones</span>
              </TabsTrigger>
              <TabsTrigger value="restaurant" className="flex items-center gap-2">
                <IconBuilding className="h-4 w-4" />
                <span className="hidden sm:inline">Restaurantes</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <NavMain items={currentNavData.navMain} />
        <NavDocuments items={commonData.documents} />
        <NavSecondary items={commonData.navSecondary} className="mt-auto" />
      </SidebarContent>
      
      <SidebarFooter>
        <NavUser user={commonData.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
