"use client"

import { useState, useEffect, useCallback } from "react"
import { subcategoryService, SubcategoryWithProductCount } from "@/src/services/subcategory.service"
import { categoryService } from "@/src/services/category.service"
import {
  Subcategory,
  Category,
  CreateSubcategoryData,
  UpdateSubcategoryData,
} from "@/src/models/warehouse.model"

export type { SubcategoryWithProductCount }

interface PaginationState {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export function useSubcategoriesViewModel() {
  const [subcategories, setSubcategories] = useState<SubcategoryWithProductCount[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  })

  const fetchCategories = useCallback(async () => {
    const categoriesData = await categoryService.getAll()
    setCategories(categoriesData.filter((c) => c.isActive))
  }, [])

  const fetchSubcategories = useCallback(async (page: number, pageSize: number) => {
    try {
      setIsLoading(true)
      setError(null)
      const [response] = await Promise.all([
        subcategoryService.getPaginated({ page, pageSize }),
        fetchCategories(),
      ])
      setSubcategories(response.data)
      setPagination({
        page: response.page,
        pageSize: response.pageSize,
        totalCount: response.totalCount,
        totalPages: response.totalPages,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar las subcategorías")
    } finally {
      setIsLoading(false)
    }
  }, [fetchCategories])

  useEffect(() => {
    fetchSubcategories(pagination.page, pagination.pageSize)
  }, []) // Only run on mount

  const setPage = useCallback((page: number) => {
    fetchSubcategories(page, pagination.pageSize)
  }, [fetchSubcategories, pagination.pageSize])

  const setPageSize = useCallback((pageSize: number) => {
    fetchSubcategories(1, pageSize) // Reset to page 1 when changing page size
  }, [fetchSubcategories])

  const createSubcategory = useCallback(
    async (data: CreateSubcategoryData): Promise<Subcategory> => {
      const newSubcategory = await subcategoryService.create(data)
      // Refetch current page to show updated data
      await fetchSubcategories(pagination.page, pagination.pageSize)
      return newSubcategory
    },
    [fetchSubcategories, pagination.page, pagination.pageSize]
  )

  const updateSubcategory = useCallback(
    async (id: string, data: UpdateSubcategoryData): Promise<Subcategory> => {
      const updatedSubcategory = await subcategoryService.update(id, data)
      // Update local state optimistically
      setSubcategories((prev) =>
        prev.map((sub) =>
          sub.id === id
            ? { ...updatedSubcategory, productCount: sub.productCount }
            : sub
        )
      )
      return updatedSubcategory
    },
    []
  )

  const deleteSubcategory = useCallback(async (id: string): Promise<void> => {
    await subcategoryService.delete(id)
    // Refetch current page to show updated data
    await fetchSubcategories(pagination.page, pagination.pageSize)
  }, [fetchSubcategories, pagination.page, pagination.pageSize])

  return {
    subcategories,
    categories,
    isLoading,
    error,
    pagination,
    setPage,
    setPageSize,
    refetch: () => fetchSubcategories(pagination.page, pagination.pageSize),
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
  }
}
