"use client"

import { useState, useEffect, useCallback } from "react"
import { categoryService, CategoryWithProductCount } from "@/src/services/category.service"
import {
  Category,
  CreateCategoryData,
  UpdateCategoryData,
} from "@/src/models/warehouse.model"

export type { CategoryWithProductCount }

interface PaginationState {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export function useCategoriesViewModel() {
  const [categories, setCategories] = useState<CategoryWithProductCount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  })

  const fetchCategories = useCallback(async (page: number, pageSize: number) => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await categoryService.getPaginated({ page, pageSize })
      setCategories(response.data)
      setPagination({
        page: response.page,
        pageSize: response.pageSize,
        totalCount: response.totalCount,
        totalPages: response.totalPages,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar las categorías")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories(pagination.page, pagination.pageSize)
  }, []) // Only run on mount

  const setPage = useCallback((page: number) => {
    fetchCategories(page, pagination.pageSize)
  }, [fetchCategories, pagination.pageSize])

  const setPageSize = useCallback((pageSize: number) => {
    fetchCategories(1, pageSize) // Reset to page 1 when changing page size
  }, [fetchCategories])

  const createCategory = useCallback(
    async (data: CreateCategoryData): Promise<Category> => {
      const newCategory = await categoryService.create(data)
      // Refetch current page to show updated data
      await fetchCategories(pagination.page, pagination.pageSize)
      return newCategory
    },
    [fetchCategories, pagination.page, pagination.pageSize]
  )

  const updateCategory = useCallback(
    async (id: string, data: UpdateCategoryData): Promise<Category> => {
      const updatedCategory = await categoryService.update(id, data)
      // Update local state optimistically
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === id
            ? { ...updatedCategory, productCount: cat.productCount }
            : cat
        )
      )
      return updatedCategory
    },
    []
  )

  const deleteCategory = useCallback(async (id: string): Promise<void> => {
    await categoryService.delete(id)
    // Refetch current page to show updated data
    await fetchCategories(pagination.page, pagination.pageSize)
  }, [fetchCategories, pagination.page, pagination.pageSize])

  return {
    categories,
    isLoading,
    error,
    pagination,
    setPage,
    setPageSize,
    refetch: () => fetchCategories(pagination.page, pagination.pageSize),
    createCategory,
    updateCategory,
    deleteCategory,
  }
}
