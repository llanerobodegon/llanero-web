"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { Package, Store, UtensilsCrossed, Building2, CreditCard, Users, Truck, UserRound, ShoppingBag } from "lucide-react"

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
  warehouses: [
    {
      name: "Bodegon del Este",
      logo: Store,
      plan: "Bodegón",
    },
    {
      name: "Trinitarias",
      logo: Store,
      plan: "Bodegón",
    },
    {
      name: "Express",
      logo: Store,
      plan: "Bodegón",
    },
    {
      name: "Bararida",
      logo: Store,
      plan: "Bodegón",
    },
    {
      name: "West",
      logo: Store,
      plan: "Bodegón",
    },
    {
      name: "Yaritagua",
      logo: Store,
      plan: "Bodegón",
    },
    {
      name: "Cabudare",
      logo: Store,
      plan: "Bodegón",
    },
  ],
  restaurants: [
    {
      name: "Boulevard Rose",
      logo: UtensilsCrossed,
      plan: "Restaurante",
    },
    {
      name: "Orinoco Grill",
      logo: UtensilsCrossed,
      plan: "Restaurante",
    },
    {
      name: "La Nave",
      logo: UtensilsCrossed,
      plan: "Restaurante",
    },
  ],
  navItems: [
    {
      title: "Pedidos",
      url: "/admin/orders",
      icon: ShoppingBag,
    },
    {
      title: "Productos",
      url: "/admin/products",
      icon: Package,
      isActive: true,
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
        <TeamSwitcher warehouses={sidebarData.warehouses} restaurants={sidebarData.restaurants} />
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
