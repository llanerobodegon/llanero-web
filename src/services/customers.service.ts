"use client"

import { createClient } from "@/lib/supabase/client"
import { PaginationParams, PaginatedResponse } from "@/src/types/pagination"

const supabase = createClient()

export interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  createdAt: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToCustomer(row: any): Customer {
  return {
    id: row.id,
    firstName: row.first_name || "",
    lastName: row.last_name || "",
    email: row.email,
    createdAt: row.created_at,
  }
}

class CustomersService {
  private async getCustomerRoleId(): Promise<number | null> {
    const { data } = await supabase
      .from("roles")
      .select("id")
      .eq("name", "customer")
      .single()

    return data?.id || null
  }

  async getPaginated(
    params: PaginationParams
  ): Promise<PaginatedResponse<Customer>> {
    const { page, pageSize } = params
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const customerRoleId = await this.getCustomerRoleId()

    if (!customerRoleId) {
      return {
        data: [],
        totalCount: 0,
        page,
        pageSize,
        totalPages: 0,
      }
    }

    // Build count query
    const { count: totalCount, error: countError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role_id", customerRoleId)

    if (countError) {
      console.error("Error counting customers:", countError)
      throw new Error("Failed to count customers")
    }

    // Build data query
    const { data, error } = await supabase
      .from("users")
      .select("id, first_name, last_name, email, created_at")
      .eq("role_id", customerRoleId)
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) {
      console.error("Error fetching customers:", error)
      throw new Error("Failed to fetch customers")
    }

    const items: Customer[] = (data || []).map(mapRowToCustomer)

    return {
      data: items,
      totalCount: totalCount || 0,
      page,
      pageSize,
      totalPages: Math.ceil((totalCount || 0) / pageSize),
    }
  }
}

export const customersService = new CustomersService()

// Helper functions for display
export function getFullName(customer: Customer): string {
  return `${customer.firstName} ${customer.lastName}`.trim() || customer.email.split("@")[0]
}

export function getInitials(customer: Customer): string {
  const first = customer.firstName?.[0] || customer.email?.[0] || ""
  const last = customer.lastName?.[0] || ""
  return (first + last).toUpperCase() || "?"
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}
