"use client"

import { useState, useEffect, useCallback } from "react"
import {
  bankAccountService,
  BankAccount,
  CreateBankAccountData,
  UpdateBankAccountData,
} from "@/src/services/bank-account.service"

interface PaginationState {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export function useBankAccountsViewModel() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  })

  const fetchBankAccounts = useCallback(
    async (page: number = 1, pageSize: number = 10, warehouseId?: string | null) => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await bankAccountService.getPaginated(
          { page, pageSize },
          warehouseId || undefined
        )
        setBankAccounts(result.data)
        setPagination({
          page: result.page,
          pageSize: result.pageSize,
          totalCount: result.totalCount,
          totalPages: result.totalPages,
        })
      } catch (err) {
        console.error("Error fetching bank accounts:", err)
        setError("Error al cargar las cuentas bancarias")
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    fetchBankAccounts(1, pagination.pageSize, selectedWarehouseId)
  }, [selectedWarehouseId])

  const setPage = useCallback(
    (page: number) => {
      fetchBankAccounts(page, pagination.pageSize, selectedWarehouseId)
    },
    [fetchBankAccounts, pagination.pageSize, selectedWarehouseId]
  )

  const setPageSize = useCallback(
    (pageSize: number) => {
      fetchBankAccounts(1, pageSize, selectedWarehouseId)
    },
    [fetchBankAccounts, selectedWarehouseId]
  )

  const filterByWarehouse = useCallback((warehouseId: string | null) => {
    setSelectedWarehouseId(warehouseId)
  }, [])

  const createBankAccount = useCallback(
    async (data: CreateBankAccountData) => {
      const created = await bankAccountService.create(data)
      setBankAccounts((prev) => [created, ...prev])
      setPagination((prev) => ({
        ...prev,
        totalCount: prev.totalCount + 1,
      }))
      return created
    },
    []
  )

  const updateBankAccount = useCallback(
    async (id: string, data: UpdateBankAccountData) => {
      const updated = await bankAccountService.update(id, data)
      setBankAccounts((prev) =>
        prev.map((item) => (item.id === id ? updated : item))
      )
      return updated
    },
    []
  )

  const deleteBankAccount = useCallback(async (id: string) => {
    await bankAccountService.delete(id)
    setBankAccounts((prev) => prev.filter((item) => item.id !== id))
    setPagination((prev) => ({
      ...prev,
      totalCount: prev.totalCount - 1,
    }))
  }, [])

  const refresh = useCallback(() => {
    fetchBankAccounts(pagination.page, pagination.pageSize, selectedWarehouseId)
  }, [fetchBankAccounts, pagination.page, pagination.pageSize, selectedWarehouseId])

  return {
    bankAccounts,
    isLoading,
    error,
    pagination,
    selectedWarehouseId,
    setPage,
    setPageSize,
    filterByWarehouse,
    createBankAccount,
    updateBankAccount,
    deleteBankAccount,
    refresh,
  }
}

export type { BankAccount, CreateBankAccountData, UpdateBankAccountData, BankAccountScope, BankAccountType } from "@/src/services/bank-account.service"
