"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { Package, Building2, CreditCard, Users, Truck, UserRound, ShoppingBag, LayoutDashboard, Megaphone } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { createClient } from "@/lib/supabase/client"

const sidebarData = {
  navItems: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: LayoutDashboard,
    },
    {
      title: "Pedidos",
      url: "/admin/orders",
      icon: ShoppingBag,
    },
    {
      title: "Productos",
      url: "/admin/products",
      icon: Package,
      items: [
        {
          title: "Inventario",
          url: "/admin/inventory",
        },
        {
          title: "Categorías",
          url: "/admin/categories",
        },
        {
          title: "Subcategorías",
          url: "/admin/subcategories",
        },
      ],
    },
    {
      title: "Bodegones",
      url: "/admin/warehouses",
      icon: Building2,
    },
    {
      title: "Métodos de Pago",
      url: "/admin/payment-methods",
      icon: CreditCard,
    },
    {
      title: "Equipo",
      url: "/admin/team",
      icon: Users,
    },
    {
      title: "Repartidores",
      url: "/admin/delivery",
      icon: Truck,
    },
    {
      title: "Clientes",
      url: "/admin/customers",
      icon: UserRound,
    },
    {
      title: "Marketing",
      url: "/admin/marketing",
      icon: Megaphone,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = useState<{ name: string; email: string }>({
    name: "Usuario",
    email: "",
  })

  useEffect(() => {
    const supabase = createClient()

    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        setUser({
          name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || "Usuario",
          email: authUser.email || "",
        })
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "Usuario",
          email: session.user.email || "",
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarData.navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
