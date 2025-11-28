"use client"

import { createClient } from "@/lib/supabase/client"
import { PaginationParams, PaginatedResponse } from "@/src/types/pagination"

const supabase = createClient()

export interface Warehouse {
  id: string
  name: string
}

export type DeliveryStatus = "available" | "on_delivery" | "unavailable"

export interface DeliveryMember {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneCode: string | null
  phone: string | null
  roleId: number
  roleName: string
  isActive: boolean
  deliveryStatus: DeliveryStatus
  warehouses: Warehouse[]
  createdAt: string
  updatedAt: string
}

export interface CreateDeliveryMemberData {
  firstName: string
  lastName: string
  email: string
  phoneCode?: string | null
  phone?: string | null
  isActive?: boolean
  deliveryStatus?: DeliveryStatus
  warehouseIds?: string[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToDeliveryMember(row: any): DeliveryMember {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phoneCode: row.phone_code,
    phone: row.phone,
    roleId: row.role_id,
    roleName: row.roles?.name || "",
    isActive: row.is_active,
    deliveryStatus: row.delivery_status || "available",
    warehouses: (row.warehouse_users || []).map((wu: { warehouses: { id: string; name: string } }) => ({
      id: wu.warehouses.id,
      name: wu.warehouses.name,
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

class DeliveryService {
  private async getDeliveryRoleId(): Promise<number | null> {
    const { data } = await supabase
      .from("roles")
      .select("id")
      .eq("name", "delivery")
      .single()

    return data?.id || null
  }

  async getWarehouses(): Promise<Warehouse[]> {
    const { data, error } = await supabase
      .from("warehouses")
      .select("id, name")
      .eq("is_active", true)
      .order("name")

    if (error) {
      console.error("Error fetching warehouses:", error)
      throw new Error("Failed to fetch warehouses")
    }

    return data || []
  }

  async getPaginated(
    params: PaginationParams,
    filters?: { warehouseId?: string }
  ): Promise<PaginatedResponse<DeliveryMember>> {
    const { page, pageSize } = params
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const deliveryRoleId = await this.getDeliveryRoleId()

    if (!deliveryRoleId) {
      return {
        data: [],
        totalCount: 0,
        page,
        pageSize,
        totalPages: 0,
      }
    }

    // If filtering by warehouse, get user IDs first
    let userIdsInWarehouse: string[] | null = null
    if (filters?.warehouseId) {
      const { data: warehouseUsers } = await supabase
        .from("warehouse_users")
        .select("user_id")
        .eq("warehouse_id", filters.warehouseId)

      userIdsInWarehouse = (warehouseUsers || []).map((wu) => wu.user_id)

      if (userIdsInWarehouse.length === 0) {
        return {
          data: [],
          totalCount: 0,
          page,
          pageSize,
          totalPages: 0,
        }
      }
    }

    // Build count query
    let countQuery = supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role_id", deliveryRoleId)

    if (userIdsInWarehouse) {
      countQuery = countQuery.in("id", userIdsInWarehouse)
    }

    const { count: totalCount, error: countError } = await countQuery

    if (countError) {
      console.error("Error counting delivery members:", countError)
      throw new Error("Failed to count delivery members")
    }

    // Build data query
    let dataQuery = supabase
      .from("users")
      .select(`
        *,
        roles (id, name, description),
        warehouse_users (
          warehouses (id, name)
        )
      `)
      .eq("role_id", deliveryRoleId)
      .order("created_at", { ascending: false })
      .range(from, to)

    if (userIdsInWarehouse) {
      dataQuery = dataQuery.in("id", userIdsInWarehouse)
    }

    const { data, error } = await dataQuery

    if (error) {
      console.error("Error fetching delivery members:", error)
      throw new Error("Failed to fetch delivery members")
    }

    const items: DeliveryMember[] = (data || []).map(mapRowToDeliveryMember)

    return {
      data: items,
      totalCount: totalCount || 0,
      page,
      pageSize,
      totalPages: Math.ceil((totalCount || 0) / pageSize),
    }
  }

  async getById(id: string): Promise<DeliveryMember | null> {
    const { data, error } = await supabase
      .from("users")
      .select(`
        *,
        roles (id, name, description),
        warehouse_users (
          warehouses (id, name)
        )
      `)
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null
      console.error("Error fetching delivery member:", error)
      throw new Error("Failed to fetch delivery member")
    }

    return mapRowToDeliveryMember(data)
  }

  async create(data: CreateDeliveryMemberData): Promise<DeliveryMember> {
    const deliveryRoleId = await this.getDeliveryRoleId()

    if (!deliveryRoleId) {
      throw new Error("Delivery role not found")
    }

    // Call the API route to create the user
    const response = await fetch("/api/delivery", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneCode: data.phoneCode,
        phone: data.phone,
        roleId: deliveryRoleId,
        isActive: data.isActive,
        warehouseIds: data.warehouseIds,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || "Failed to create delivery member")
    }

    return mapRowToDeliveryMember(result.data)
  }

  async update(id: string, data: Partial<CreateDeliveryMemberData>): Promise<DeliveryMember> {
    const updateData: Record<string, unknown> = {}

    if (data.firstName !== undefined) updateData.first_name = data.firstName
    if (data.lastName !== undefined) updateData.last_name = data.lastName
    if (data.phoneCode !== undefined) updateData.phone_code = data.phoneCode
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.isActive !== undefined) updateData.is_active = data.isActive
    if (data.deliveryStatus !== undefined) updateData.delivery_status = data.deliveryStatus

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", id)

      if (error) {
        console.error("Error updating delivery member:", error)
        throw new Error("Failed to update delivery member")
      }
    }

    // Update warehouse assignments if provided
    if (data.warehouseIds !== undefined) {
      // Remove existing assignments
      await supabase
        .from("warehouse_users")
        .delete()
        .eq("user_id", id)

      // Add new assignments
      if (data.warehouseIds.length > 0) {
        const warehouseAssignments = data.warehouseIds.map((warehouseId) => ({
          user_id: id,
          warehouse_id: warehouseId,
        }))

        const { error: warehouseError } = await supabase
          .from("warehouse_users")
          .insert(warehouseAssignments)

        if (warehouseError) {
          console.error("Error assigning warehouses:", warehouseError)
          throw new Error("Failed to assign warehouses")
        }
      }
    }

    const member = await this.getById(id)
    if (!member) throw new Error("Failed to retrieve updated member")
    return member
  }

  async delete(id: string): Promise<void> {
    // Call the API route to delete the user
    const response = await fetch(`/api/delivery?id=${id}`, {
      method: "DELETE",
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || "Failed to delete delivery member")
    }
  }
}

export const deliveryService = new DeliveryService()

// Helper functions for display
export function getFullName(member: DeliveryMember): string {
  return `${member.firstName} ${member.lastName}`.trim()
}

export function getInitials(member: DeliveryMember): string {
  const first = member.firstName?.[0] || ""
  const last = member.lastName?.[0] || ""
  return (first + last).toUpperCase()
}

export function getDeliveryStatusLabel(status: DeliveryStatus): string {
  const labels: Record<DeliveryStatus, string> = {
    available: "Disponible",
    on_delivery: "En Delivery",
    unavailable: "No Disponible",
  }
  return labels[status] || status
}

export function getDeliveryStatusColor(status: DeliveryStatus): string {
  const colors: Record<DeliveryStatus, string> = {
    available: "bg-green-500",
    on_delivery: "bg-blue-500",
    unavailable: "bg-gray-400",
  }
  return colors[status] || "bg-gray-400"
}
