"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { Package, Building2, CreditCard, Users, Truck, UserRound, ShoppingBag, LayoutDashboard, Megaphone, FileBarChart } from "lucide-react"

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

const allNavItems = [
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
        title: "Stock",
        url: "/admin/stock",
      },
      {
        title: "Almacén",
        url: "/admin/storehouse",
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
  {
    title: "Reportes",
    url: "/admin/reports",
    icon: FileBarChart,
  },
]

// Items hidden for manager role
const managerHiddenItems = ["Bodegones", "Equipo", "Marketing"]
// Subitems hidden for manager role
const managerHiddenSubItems = ["Categorías", "Subcategorías"]

function getNavItemsForRole(roleId: number | null) {
  if (roleId !== 3) return allNavItems // Admin or loading: full access

  // Manager: filtered access
  return allNavItems
    .filter((item) => !managerHiddenItems.includes(item.title))
    .map((item) => {
      if (!item.items) return item
      return {
        ...item,
        items: item.items.filter((sub) => !managerHiddenSubItems.includes(sub.title)),
      }
    })
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = useState<{ name: string; email: string }>({
    name: "Usuario",
    email: "",
  })
  const [roleId, setRoleId] = useState<number | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        setUser({
          name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || "Usuario",
          email: authUser.email || "",
        })

        const { data: userData } = await supabase
          .from("users")
          .select("role_id")
          .eq("id", authUser.id)
          .single()

        setRoleId(userData?.role_id ?? null)
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

  const navItems = getNavItemsForRole(roleId)

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
