"use client"

import { createClient } from "@/lib/supabase/client"
import { PaginationParams, PaginatedResponse } from "@/src/types/pagination"
import { uploadService } from "@/src/services/upload.service"

const supabase = createClient()

export interface Product {
  id: string
  name: string
  description: string | null
  imageUrls: string[]
  sku: string | null
  barcode: string | null
  price: number
  isActive: boolean
  categoryId: string
  subcategoryId: string | null
  category: {
    id: string
    name: string
  } | null
  subcategory: {
    id: string
    name: string
  } | null
  createdAt: string
  updatedAt: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    imageUrls: row.image_urls ?? [],
    sku: row.sku,
    barcode: row.barcode,
    price: row.price,
    isActive: row.is_active,
    categoryId: row.category_id,
    subcategoryId: row.subcategory_id,
    category: row.categories
      ? {
          id: row.categories.id,
          name: row.categories.name,
        }
      : null,
    subcategory: row.subcategories
      ? {
          id: row.subcategories.id,
          name: row.subcategories.name,
        }
      : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

class ProductService {
  async getPaginated(
    params: PaginationParams,
    filters?: { search?: string; categoryIds?: string[]; subcategoryIds?: string[]; warehouseId?: string }
  ): Promise<PaginatedResponse<Product>> {
    const { page, pageSize } = params
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // If filtering by warehouse, get product IDs first
    let productIdsInWarehouse: string[] | null = null
    if (filters?.warehouseId) {
      const { data: warehouseProducts } = await supabase
        .from("warehouse_products")
        .select("product_id")
        .eq("warehouse_id", filters.warehouseId)

      productIdsInWarehouse = (warehouseProducts || []).map((wp) => wp.product_id)

      if (productIdsInWarehouse.length === 0) {
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
      .from("products")
      .select("*", { count: "exact", head: true })

    if (filters?.categoryIds && filters.categoryIds.length > 0) {
      countQuery = countQuery.in("category_id", filters.categoryIds)
    }
    if (filters?.subcategoryIds && filters.subcategoryIds.length > 0) {
      countQuery = countQuery.in("subcategory_id", filters.subcategoryIds)
    }
    if (productIdsInWarehouse) {
      countQuery = countQuery.in("id", productIdsInWarehouse)
    }

    const { count: totalCount, error: countError } = await countQuery

    if (countError) {
      console.error("Error counting products:", countError)
      throw new Error("Failed to count products")
    }

    // Build data query
    let dataQuery = supabase
      .from("products")
      .select(`
        id,
        name,
        description,
        image_urls,
        sku,
        barcode,
        price,
        is_active,
        category_id,
        subcategory_id,
        created_at,
        updated_at,
        categories (
          id,
          name
        ),
        subcategories (
          id,
          name
        )
      `)
      .order("created_at", { ascending: false })
      .range(from, to)

    if (filters?.categoryIds && filters.categoryIds.length > 0) {
      dataQuery = dataQuery.in("category_id", filters.categoryIds)
    }
    if (filters?.subcategoryIds && filters.subcategoryIds.length > 0) {
      dataQuery = dataQuery.in("subcategory_id", filters.subcategoryIds)
    }
    if (productIdsInWarehouse) {
      dataQuery = dataQuery.in("id", productIdsInWarehouse)
    }

    const { data, error } = await dataQuery

    if (error) {
      console.error("Error fetching products:", error)
      throw new Error("Failed to fetch products")
    }

    // Filter by search if provided (client-side for product name)
    let filteredData = data || []
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filteredData = filteredData.filter((item: any) => {
        return item.name?.toLowerCase().includes(searchLower)
      })
    }

    const items: Product[] = filteredData.map(mapRowToProduct)

    return {
      data: items,
      totalCount: totalCount || 0,
      page,
      pageSize,
      totalPages: Math.ceil((totalCount || 0) / pageSize),
    }
  }

  async getById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        name,
        description,
        image_urls,
        sku,
        barcode,
        price,
        is_active,
        category_id,
        subcategory_id,
        created_at,
        updated_at,
        categories (
          id,
          name
        ),
        subcategories (
          id,
          name
        )
      `)
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null
      console.error("Error fetching product:", error)
      throw new Error("Failed to fetch product")
    }

    return mapRowToProduct(data)
  }

  async delete(id: string): Promise<void> {
    // First, get the product to retrieve image URLs
    const product = await this.getById(id)

    if (product && product.imageUrls.length > 0) {
      // Delete all images from storage
      await Promise.all(
        product.imageUrls.map((url) =>
          uploadService.deleteImage(url, "product-images").catch((err) => {
            console.error("Error deleting product image:", err)
          })
        )
      )
    }

    // Then delete the product record
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting product:", error)
      throw new Error("Failed to delete product")
    }
  }

  async update(
    id: string,
    data: Partial<{
      name: string
      description: string | null
      imageUrls: string[]
      sku: string | null
      barcode: string | null
      price: number
      isActive: boolean
      categoryId: string
      subcategoryId: string | null
    }>
  ): Promise<Product> {
    const updateData: Record<string, unknown> = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.imageUrls !== undefined) updateData.image_urls = data.imageUrls
    if (data.sku !== undefined) updateData.sku = data.sku
    if (data.barcode !== undefined) updateData.barcode = data.barcode
    if (data.price !== undefined) updateData.price = data.price
    if (data.isActive !== undefined) updateData.is_active = data.isActive
    if (data.categoryId !== undefined) updateData.category_id = data.categoryId
    if (data.subcategoryId !== undefined) updateData.subcategory_id = data.subcategoryId

    const { error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", id)

    if (error) {
      console.error("Error updating product:", error)
      throw new Error("Failed to update product")
    }

    const product = await this.getById(id)
    if (!product) throw new Error("Failed to fetch updated product")
    return product
  }
}

export const productService = new ProductService()
