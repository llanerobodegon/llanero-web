"use client"

import { useState, useEffect, useCallback } from "react"
import { productService, Product } from "@/src/services/product.service"
import { categoryService } from "@/src/services/category.service"
import { subcategoryService } from "@/src/services/subcategory.service"
import { useWarehouseContext } from "@/src/contexts/warehouse-context"

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

export function useInventoryViewModel() {
  const { selectedWarehouse } = useWarehouseContext()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [selectedSubcategoryIds, setSelectedSubcategoryIds] = useState<string[]>([])
  const [searchInput, setSearchInput] = useState("")
  const [activeSearch, setActiveSearch] = useState("")
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
      warehouseId?: string,
      search?: string
    ) => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await productService.getPaginated(
          { page, pageSize },
          {
            categoryIds: categoryIds?.length ? categoryIds : undefined,
            subcategoryIds: subcategoryIds?.length ? subcategoryIds : undefined,
            warehouseId,
            search: search || undefined,
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

  // Reset pagination when warehouse changes
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [selectedWarehouse])

  useEffect(() => {
    fetchProducts(1, pagination.pageSize, selectedCategoryIds, selectedSubcategoryIds, selectedWarehouse?.id, activeSearch)
  }, [selectedCategoryIds, selectedSubcategoryIds, selectedWarehouse, activeSearch])

  const executeSearch = useCallback(() => {
    setActiveSearch(searchInput)
  }, [searchInput])

  const clearSearch = useCallback(() => {
    setSearchInput("")
    setActiveSearch("")
  }, [])

  const setPage = useCallback(
    (page: number) => {
      fetchProducts(page, pagination.pageSize, selectedCategoryIds, selectedSubcategoryIds, selectedWarehouse?.id, activeSearch)
    },
    [fetchProducts, pagination.pageSize, selectedCategoryIds, selectedSubcategoryIds, selectedWarehouse, activeSearch]
  )

  const setPageSize = useCallback(
    (pageSize: number) => {
      fetchProducts(1, pageSize, selectedCategoryIds, selectedSubcategoryIds, selectedWarehouse?.id, activeSearch)
    },
    [fetchProducts, selectedCategoryIds, selectedSubcategoryIds, selectedWarehouse, activeSearch]
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
    fetchProducts(pagination.page, pagination.pageSize, selectedCategoryIds, selectedSubcategoryIds, selectedWarehouse?.id, activeSearch)
  }, [fetchProducts, pagination.page, pagination.pageSize, selectedCategoryIds, selectedSubcategoryIds, selectedWarehouse, activeSearch])

  // Filter subcategories based on selected categories
  const filteredSubcategories = selectedCategoryIds.length > 0
    ? subcategories.filter((s) => selectedCategoryIds.includes(s.categoryId))
    : subcategories

  return {
    products,
    categories,
    subcategories: filteredSubcategories,
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
    refresh,
  }
}

export type { Product }
