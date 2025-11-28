"use client"

import { useState, useEffect, useCallback } from "react"
import {
  teamService,
  TeamMember,
  CreateTeamMemberData,
  Role,
  Warehouse,
} from "@/src/services/team.service"
import { useWarehouseContext } from "@/src/contexts/warehouse-context"

export type { TeamMember, CreateTeamMemberData, Role, Warehouse }

interface UseTeamViewModelReturn {
  teamMembers: TeamMember[]
  roles: Role[]
  warehouses: Warehouse[]
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
  filters: {
    roleId?: number
  }
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  setFilters: (filters: { roleId?: number }) => void
  createTeamMember: (data: CreateTeamMemberData) => Promise<TeamMember>
  updateTeamMember: (id: string, data: Partial<CreateTeamMemberData>) => Promise<TeamMember>
  deleteTeamMember: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useTeamViewModel(): UseTeamViewModelReturn {
  const { selectedWarehouse } = useWarehouseContext()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [filters, setFilters] = useState<{ roleId?: number }>({})

  const fetchTeamMembers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await teamService.getPaginated(
        { page, pageSize },
        {
          ...filters,
          warehouseId: selectedWarehouse?.id,
        }
      )

      setTeamMembers(response.data)
      setTotalCount(response.totalCount)
      setTotalPages(response.totalPages)
    } catch (err) {
      console.error("Error fetching team members:", err)
      setError("Error al cargar los miembros del equipo")
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, filters, selectedWarehouse])

  const fetchRolesAndWarehouses = useCallback(async () => {
    try {
      const [rolesData, warehousesData] = await Promise.all([
        teamService.getRoles(),
        teamService.getWarehouses(),
      ])
      setRoles(rolesData)
      setWarehouses(warehousesData)
    } catch (err) {
      console.error("Error fetching roles/warehouses:", err)
    }
  }, [])

  // Reset page when warehouse changes
  useEffect(() => {
    setPage(1)
  }, [selectedWarehouse])

  useEffect(() => {
    fetchTeamMembers()
  }, [fetchTeamMembers])

  useEffect(() => {
    fetchRolesAndWarehouses()
  }, [fetchRolesAndWarehouses])

  const createTeamMember = useCallback(
    async (data: CreateTeamMemberData): Promise<TeamMember> => {
      const member = await teamService.create(data)
      await fetchTeamMembers()
      return member
    },
    [fetchTeamMembers]
  )

  const updateTeamMember = useCallback(
    async (id: string, data: Partial<CreateTeamMemberData>): Promise<TeamMember> => {
      const member = await teamService.update(id, data)
      await fetchTeamMembers()
      return member
    },
    [fetchTeamMembers]
  )

  const deleteTeamMember = useCallback(
    async (id: string): Promise<void> => {
      await teamService.delete(id)
      await fetchTeamMembers()
    },
    [fetchTeamMembers]
  )

  const handleSetPage = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  const handleSetPageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1)
  }, [])

  const handleSetFilters = useCallback((newFilters: { roleId?: number }) => {
    setFilters(newFilters)
    setPage(1)
  }, [])

  return {
    teamMembers,
    roles,
    warehouses,
    isLoading,
    error,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages,
    },
    filters,
    setPage: handleSetPage,
    setPageSize: handleSetPageSize,
    setFilters: handleSetFilters,
    createTeamMember,
    updateTeamMember,
    deleteTeamMember,
    refresh: fetchTeamMembers,
  }
}
