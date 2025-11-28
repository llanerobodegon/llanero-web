"use client"

import { createClient } from "@/lib/supabase/client"
import { PaginationParams, PaginatedResponse } from "@/src/types/pagination"

const supabase = createClient()

export type RoleName = "admin" | "manager" | "delivery"

export interface Role {
  id: number
  name: string
  description: string | null
}

export interface Warehouse {
  id: string
  name: string
}

export interface TeamMember {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneCode: string | null
  phone: string | null
  roleId: number
  roleName: string
  isActive: boolean
  warehouses: Warehouse[]
  createdAt: string
  updatedAt: string
}

export interface CreateTeamMemberData {
  firstName: string
  lastName: string
  email: string
  phoneCode?: string | null
  phone?: string | null
  roleId: number
  isActive?: boolean
  warehouseIds?: string[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToTeamMember(row: any): TeamMember {
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
    warehouses: (row.warehouse_users || []).map((wu: { warehouses: { id: string; name: string } }) => ({
      id: wu.warehouses.id,
      name: wu.warehouses.name,
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

class TeamService {
  async getRoles(): Promise<Role[]> {
    const { data, error } = await supabase
      .from("roles")
      .select("*")
      .in("name", ["admin", "manager", "delivery"])
      .order("id")

    if (error) {
      console.error("Error fetching roles:", error)
      throw new Error("Failed to fetch roles")
    }

    return data || []
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
    filters?: { roleId?: number }
  ): Promise<PaginatedResponse<TeamMember>> {
    const { page, pageSize } = params
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Get role IDs for team members (non-customer roles)
    const { data: teamRoles } = await supabase
      .from("roles")
      .select("id")
      .in("name", ["admin", "manager", "delivery"])

    const teamRoleIds = teamRoles?.map((r) => r.id) || []

    if (teamRoleIds.length === 0) {
      return {
        data: [],
        totalCount: 0,
        page,
        pageSize,
        totalPages: 0,
      }
    }

    // Build count query
    let countQuery = supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .in("role_id", teamRoleIds)

    if (filters?.roleId) {
      countQuery = countQuery.eq("role_id", filters.roleId)
    }

    const { count: totalCount, error: countError } = await countQuery

    if (countError) {
      console.error("Error counting team members:", countError)
      throw new Error("Failed to count team members")
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
      .in("role_id", teamRoleIds)
      .order("created_at", { ascending: false })
      .range(from, to)

    if (filters?.roleId) {
      dataQuery = dataQuery.eq("role_id", filters.roleId)
    }

    const { data, error } = await dataQuery

    if (error) {
      console.error("Error fetching team members:", error)
      throw new Error("Failed to fetch team members")
    }

    const items: TeamMember[] = (data || []).map(mapRowToTeamMember)

    return {
      data: items,
      totalCount: totalCount || 0,
      page,
      pageSize,
      totalPages: Math.ceil((totalCount || 0) / pageSize),
    }
  }

  async getById(id: string): Promise<TeamMember | null> {
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
      console.error("Error fetching team member:", error)
      throw new Error("Failed to fetch team member")
    }

    return mapRowToTeamMember(data)
  }

  async create(data: CreateTeamMemberData): Promise<TeamMember> {
    // Call the API route to create the user (uses service role key server-side)
    const response = await fetch("/api/team", {
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
        roleId: data.roleId,
        isActive: data.isActive,
        warehouseIds: data.warehouseIds,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || "Failed to create user")
    }

    return mapRowToTeamMember(result.data)
  }

  async update(id: string, data: Partial<CreateTeamMemberData>): Promise<TeamMember> {
    const updateData: Record<string, unknown> = {}

    if (data.firstName !== undefined) updateData.first_name = data.firstName
    if (data.lastName !== undefined) updateData.last_name = data.lastName
    if (data.phoneCode !== undefined) updateData.phone_code = data.phoneCode
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.roleId !== undefined) updateData.role_id = data.roleId
    if (data.isActive !== undefined) updateData.is_active = data.isActive

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", id)

      if (error) {
        console.error("Error updating team member:", error)
        throw new Error("Failed to update team member")
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
    // Call the API route to delete the user (uses service role key server-side)
    const response = await fetch(`/api/team?id=${id}`, {
      method: "DELETE",
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || "Failed to delete user")
    }
  }
}

export const teamService = new TeamService()

// Helper functions for display
export function getRoleLabel(roleName: string): string {
  const labels: Record<string, string> = {
    admin: "Administrador",
    manager: "Gerente",
    delivery: "Repartidor",
    customer: "Cliente",
  }
  return labels[roleName] || roleName
}

export function getFullName(member: TeamMember): string {
  return `${member.firstName} ${member.lastName}`.trim()
}

export function getInitials(member: TeamMember): string {
  const first = member.firstName?.[0] || ""
  const last = member.lastName?.[0] || ""
  return (first + last).toUpperCase()
}
