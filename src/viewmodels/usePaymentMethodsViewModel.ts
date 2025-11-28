"use client"

import { useState, useEffect, useCallback } from "react"
import {
  paymentMethodService,
  PaymentMethod,
  CreatePaymentMethodData,
  PaymentScope,
  PaymentType,
} from "@/src/services/payment-method.service"

interface PaginationState {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export function usePaymentMethodsViewModel() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedScope, setSelectedScope] = useState<PaymentScope | null>(null)
  const [selectedType, setSelectedType] = useState<PaymentType | null>(null)
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  })

  const fetchPaymentMethods = useCallback(
    async (
      page: number = 1,
      pageSize: number = 10,
      scope?: PaymentScope | null,
      type?: PaymentType | null
    ) => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await paymentMethodService.getPaginated(
          { page, pageSize },
          {
            scope: scope || undefined,
            type: type || undefined,
          }
        )
        setPaymentMethods(result.data)
        setPagination({
          page: result.page,
          pageSize: result.pageSize,
          totalCount: result.totalCount,
          totalPages: result.totalPages,
        })
      } catch (err) {
        console.error("Error fetching payment methods:", err)
        setError("Error al cargar los métodos de pago")
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    fetchPaymentMethods(1, pagination.pageSize, selectedScope, selectedType)
  }, [selectedScope, selectedType])

  const setPage = useCallback(
    (page: number) => {
      fetchPaymentMethods(page, pagination.pageSize, selectedScope, selectedType)
    },
    [fetchPaymentMethods, pagination.pageSize, selectedScope, selectedType]
  )

  const setPageSize = useCallback(
    (pageSize: number) => {
      fetchPaymentMethods(1, pageSize, selectedScope, selectedType)
    },
    [fetchPaymentMethods, selectedScope, selectedType]
  )

  const filterByScope = useCallback((scope: PaymentScope | null) => {
    setSelectedScope(scope)
    setSelectedType(null) // Reset type when scope changes
  }, [])

  const filterByType = useCallback((type: PaymentType | null) => {
    setSelectedType(type)
  }, [])

  const createPaymentMethod = useCallback(
    async (data: CreatePaymentMethodData) => {
      const created = await paymentMethodService.create(data)
      setPaymentMethods((prev) => [created, ...prev])
      setPagination((prev) => ({
        ...prev,
        totalCount: prev.totalCount + 1,
      }))
      return created
    },
    []
  )

  const updatePaymentMethod = useCallback(
    async (id: string, data: Partial<CreatePaymentMethodData>) => {
      const updated = await paymentMethodService.update(id, data)
      setPaymentMethods((prev) =>
        prev.map((item) => (item.id === id ? updated : item))
      )
      return updated
    },
    []
  )

  const deletePaymentMethod = useCallback(async (id: string) => {
    await paymentMethodService.delete(id)
    setPaymentMethods((prev) => prev.filter((item) => item.id !== id))
    setPagination((prev) => ({
      ...prev,
      totalCount: prev.totalCount - 1,
    }))
  }, [])

  const refresh = useCallback(() => {
    fetchPaymentMethods(pagination.page, pagination.pageSize, selectedScope, selectedType)
  }, [fetchPaymentMethods, pagination.page, pagination.pageSize, selectedScope, selectedType])

  return {
    paymentMethods,
    isLoading,
    error,
    pagination,
    selectedScope,
    selectedType,
    setPage,
    setPageSize,
    filterByScope,
    filterByType,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    refresh,
  }
}

export type { PaymentMethod, CreatePaymentMethodData, PaymentScope, PaymentType }
