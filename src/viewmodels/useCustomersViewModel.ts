"use client"

import { useState, useEffect, useCallback } from "react"
import { customersService, Customer } from "@/src/services/customers.service"

export type { Customer }

interface UseCustomersViewModelReturn {
  customers: Customer[]
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  refresh: () => Promise<void>
}

export function useCustomersViewModel(): UseCustomersViewModelReturn {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await customersService.getPaginated({ page, pageSize })

      setCustomers(response.data)
      setTotalCount(response.totalCount)
      setTotalPages(response.totalPages)
    } catch (err) {
      console.error("Error fetching customers:", err)
      setError("Error al cargar los clientes")
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const handleSetPage = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  const handleSetPageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1)
  }, [])

  return {
    customers,
    isLoading,
    error,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages,
    },
    setPage: handleSetPage,
    setPageSize: handleSetPageSize,
    refresh: fetchCustomers,
  }
}
