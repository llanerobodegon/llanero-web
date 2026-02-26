"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { productService, Product } from "@/src/services/product.service"
import { categoryService } from "@/src/services/category.service"
import { subcategoryService } from "@/src/services/subcategory.service"

interface PaginationState {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

interface Category {
  id: string
  name: string
}

interface Subcategory {
  id: string
  name: string
  categoryId: string
}

export interface ProductStats {
  total: number
  active: number
  inactive: number
}

export function useStorehouseViewModel() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [stats, setStats] = useState<ProductStats>({ total: 0, active: 0, inactive: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [selectedSubcategoryIds, setSelectedSubcategoryIds] = useState<string[]>([])
  const [searchInput, setSearchInput] = useState("")
  const [activeSearch, setActiveSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | null>(null)
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  })

  const fetchCategories = useCallback(async () => {
    try {
      const result = await categoryService.getPaginated({ page: 1, pageSize: 100 })
      setCategories(result.data.map((c) => ({ id: c.id, name: c.name })))
    } catch (err) {
      console.error("Error fetching categories:", err)
    }
  }, [])

  const fetchSubcategories = useCallback(async () => {
    try {
      const result = await subcategoryService.getPaginated({ page: 1, pageSize: 100 })
      setSubcategories(result.data.map((s) => ({ id: s.id, name: s.name, categoryId: s.categoryId })))
    } catch (err) {
      console.error("Error fetching subcategories:", err)
    }
  }, [])

  const fetchProducts = useCallback(
    async (
      page: number = 1,
      pageSize: number = 10,
      categoryIds?: string[],
      subcategoryIds?: string[],
      search?: string,
      isActive?: boolean
    ) => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await productService.getPaginated(
          { page, pageSize },
          {
            categoryIds: categoryIds?.length ? categoryIds : undefined,
            subcategoryIds: subcategoryIds?.length ? subcategoryIds : undefined,
            search: search || undefined,
            isActive,
          }
        )
        setProducts(result.data)
        setPagination({
          page: result.page,
          pageSize: result.pageSize,
          totalCount: result.totalCount,
          totalPages: result.totalPages,
        })
      } catch (err) {
        console.error("Error fetching products:", err)
        setError("Error al cargar los productos")
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    fetchCategories()
    fetchSubcategories()
  }, [fetchCategories, fetchSubcategories])

  const fetchStats = useCallback(async () => {
    try {
      const result = await productService.getStats()
      setStats(result)
    } catch (err) {
      console.error("Error fetching product stats:", err)
    }
  }, [])

  const isActiveFilter = statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined

  useEffect(() => {
    fetchProducts(1, pagination.pageSize, selectedCategoryIds, selectedSubcategoryIds, activeSearch, isActiveFilter)
    fetchStats()
  }, [selectedCategoryIds, selectedSubcategoryIds, activeSearch, statusFilter])

  const executeSearch = useCallback(() => {
    setActiveSearch(searchInput)
  }, [searchInput])

  const clearSearch = useCallback(() => {
    setSearchInput("")
    setActiveSearch("")
  }, [])

  const setPage = useCallback(
    (page: number) => {
      fetchProducts(page, pagination.pageSize, selectedCategoryIds, selectedSubcategoryIds, activeSearch, isActiveFilter)
    },
    [fetchProducts, pagination.pageSize, selectedCategoryIds, selectedSubcategoryIds, activeSearch, isActiveFilter]
  )

  const setPageSize = useCallback(
    (pageSize: number) => {
      fetchProducts(1, pageSize, selectedCategoryIds, selectedSubcategoryIds, activeSearch, isActiveFilter)
    },
    [fetchProducts, selectedCategoryIds, selectedSubcategoryIds, activeSearch, isActiveFilter]
  )

  const toggleCategoryFilter = useCallback(
    (categoryId: string) => {
      setSelectedCategoryIds((prev) =>
        prev.includes(categoryId)
          ? prev.filter((id) => id !== categoryId)
          : [...prev, categoryId]
      )
    },
    []
  )

  const toggleSubcategoryFilter = useCallback(
    (subcategoryId: string) => {
      setSelectedSubcategoryIds((prev) =>
        prev.includes(subcategoryId)
          ? prev.filter((id) => id !== subcategoryId)
          : [...prev, subcategoryId]
      )
    },
    []
  )

  const clearCategoryFilters = useCallback(() => {
    setSelectedCategoryIds([])
  }, [])

  const clearSubcategoryFilters = useCallback(() => {
    setSelectedSubcategoryIds([])
  }, [])

  const deleteProduct = useCallback(
    async (productId: string) => {
      await productService.delete(productId)
      setProducts((prev) => prev.filter((item) => item.id !== productId))
      setPagination((prev) => ({
        ...prev,
        totalCount: prev.totalCount - 1,
      }))
    },
    []
  )

  const refresh = useCallback(() => {
    fetchProducts(pagination.page, pagination.pageSize, selectedCategoryIds, selectedSubcategoryIds, activeSearch, isActiveFilter)
    fetchStats()
  }, [fetchProducts, fetchStats, pagination.page, pagination.pageSize, selectedCategoryIds, selectedSubcategoryIds, activeSearch, isActiveFilter])

  const updateAllStatus = useCallback(async (isActive: boolean) => {
    await productService.updateAllStatus(isActive)
    refresh()
  }, [refresh])

  // Filter subcategories based on selected categories
  const filteredSubcategories = selectedCategoryIds.length > 0
    ? subcategories.filter((s) => selectedCategoryIds.includes(s.categoryId))
    : subcategories

  return {
    products,
    categories,
    subcategories: filteredSubcategories,
    stats,
    statusFilter,
    setStatusFilter,
    isLoading,
    error,
    pagination,
    selectedCategoryIds,
    selectedSubcategoryIds,
    searchInput,
    setSearchInput,
    executeSearch,
    clearSearch,
    activeSearch,
    setPage,
    setPageSize,
    toggleCategoryFilter,
    toggleSubcategoryFilter,
    clearCategoryFilters,
    clearSubcategoryFilters,
    deleteProduct,
    updateAllStatus,
    refresh,
  }
}

export type { Product }
