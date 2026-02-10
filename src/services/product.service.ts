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
  isOnDiscount: boolean
  isPromo: boolean
  discountPrice: number | null
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
  // Ensure imageUrls is always an array of clean URL strings
  let imageUrls: string[] = []
  if (Array.isArray(row.image_urls)) {
    imageUrls = row.image_urls.flatMap((item: unknown) => {
      if (typeof item === "string") {
        // Check if it's a JSON array string
        if (item.startsWith("[")) {
          try {
            const parsed = JSON.parse(item)
            return Array.isArray(parsed) ? parsed : [item]
          } catch {
            return [item]
          }
        }
        return [item]
      }
      return []
    })
  } else if (typeof row.image_urls === "string") {
    try {
      const parsed = JSON.parse(row.image_urls)
      imageUrls = Array.isArray(parsed) ? parsed : []
    } catch {
      imageUrls = []
    }
  }

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    imageUrls,
    sku: row.sku,
    barcode: row.barcode,
    price: row.price,
    isActive: row.is_active,
    isOnDiscount: row.is_on_discount ?? false,
    isPromo: row.is_promo ?? false,
    discountPrice: row.discount_price ?? null,
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
    filters?: { search?: string; categoryIds?: string[]; subcategoryIds?: string[]; warehouseId?: string; warehouseIds?: string[] }
  ): Promise<PaginatedResponse<Product>> {
    const { page, pageSize } = params
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    const hasWarehouseFilter = filters?.warehouseId || (filters?.warehouseIds && filters.warehouseIds.length > 0)

    // When filtering by warehouse, query through warehouse_products to avoid RLS issues on products
    if (hasWarehouseFilter) {
      return this.getPaginatedByWarehouse(params, filters!)
    }

    // No warehouse filter (admin "Todos") - query products directly
    let countQuery = supabase
      .from("products")
      .select("*", { count: "exact", head: true })

    if (filters?.categoryIds && filters.categoryIds.length > 0) {
      countQuery = countQuery.in("category_id", filters.categoryIds)
    }
    if (filters?.subcategoryIds && filters.subcategoryIds.length > 0) {
      countQuery = countQuery.in("subcategory_id", filters.subcategoryIds)
    }
    if (filters?.search) {
      countQuery = countQuery.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
    }

    const { count: totalCount, error: countError } = await countQuery

    if (countError) {
      console.error("Error counting products:", countError)
      throw new Error("Failed to count products")
    }

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
        is_on_discount,
        is_promo,
        discount_price,
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
    if (filters?.search) {
      dataQuery = dataQuery.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
    }

    const { data, error } = await dataQuery

    if (error) {
      console.error("Error fetching products:", error)
      throw new Error("Failed to fetch products")
    }

    const items: Product[] = (data || []).map(mapRowToProduct)

    return {
      data: items,
      totalCount: totalCount || 0,
      page,
      pageSize,
      totalPages: Math.ceil((totalCount || 0) / pageSize),
    }
  }

  private async getPaginatedByWarehouse(
    params: PaginationParams,
    filters: { search?: string; categoryIds?: string[]; subcategoryIds?: string[]; warehouseId?: string; warehouseIds?: string[] }
  ): Promise<PaginatedResponse<Product>> {
    const { page, pageSize } = params
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Step 1: Get unique product IDs from warehouse_products
    let wpQuery = supabase
      .from("warehouse_products")
      .select("product_id")

    if (filters.warehouseId) {
      wpQuery = wpQuery.eq("warehouse_id", filters.warehouseId)
    } else if (filters.warehouseIds && filters.warehouseIds.length > 0) {
      wpQuery = wpQuery.in("warehouse_id", filters.warehouseIds)
    }

    const { data: wpData, error: wpError } = await wpQuery

    if (wpError) {
      console.error("Error fetching warehouse products:", wpError)
      throw new Error("Failed to fetch warehouse products")
    }

    const productIds = [...new Set((wpData || []).map((wp) => wp.product_id))]

    if (productIds.length === 0) {
      return { data: [], totalCount: 0, page, pageSize, totalPages: 0 }
    }

    // Step 2: Count and fetch products using warehouse_products as base table
    // Use warehouse_products with inner join to products to bypass RLS on products table
    const selectFields = `
      products!inner (
        id,
        name,
        description,
        image_urls,
        sku,
        barcode,
        price,
        is_active,
        is_on_discount,
        is_promo,
        discount_price,
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
      )
    `

    // Count query
    let countQuery = supabase
      .from("warehouse_products")
      .select("product_id", { count: "exact", head: true })

    if (filters.warehouseId) {
      countQuery = countQuery.eq("warehouse_id", filters.warehouseId)
    } else if (filters.warehouseIds && filters.warehouseIds.length > 0) {
      countQuery = countQuery.in("warehouse_id", filters.warehouseIds)
    }

    const { count: totalCount, error: countError } = await countQuery

    if (countError) {
      console.error("Error counting warehouse products:", countError)
      throw new Error("Failed to count products")
    }

    // Data query
    let dataQuery = supabase
      .from("warehouse_products")
      .select(selectFields)
      .in("product_id", productIds)
      .range(from, to)

    if (filters.warehouseId) {
      dataQuery = dataQuery.eq("warehouse_id", filters.warehouseId)
    } else if (filters.warehouseIds && filters.warehouseIds.length > 0) {
      dataQuery = dataQuery.in("warehouse_id", filters.warehouseIds)
    }

    if (filters.categoryIds && filters.categoryIds.length > 0) {
      dataQuery = dataQuery.in("products.category_id", filters.categoryIds)
    }
    if (filters.subcategoryIds && filters.subcategoryIds.length > 0) {
      dataQuery = dataQuery.in("products.subcategory_id", filters.subcategoryIds)
    }
    if (filters.search) {
      dataQuery = dataQuery.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`, { referencedTable: "products" })
    }

    const { data, error } = await dataQuery

    if (error) {
      console.error("Error fetching products by warehouse:", error)
      throw new Error("Failed to fetch products")
    }

    // Map and deduplicate (a product could be in multiple warehouses)
    const seen = new Set<string>()
    const items: Product[] = []
    for (const row of data || []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const product = (row as any).products
      if (product && !seen.has(product.id)) {
        seen.add(product.id)
        items.push(mapRowToProduct(product))
      }
    }

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
        is_on_discount,
        is_promo,
        discount_price,
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

  async checkProductInOrders(productId: string): Promise<{ inOrders: boolean; orderCount: number }> {
    const { count, error } = await supabase
      .from("order_items")
      .select("*", { count: "exact", head: true })
      .eq("product_id", productId)

    if (error) {
      console.error("Error checking product in orders:", error)
      return { inOrders: false, orderCount: 0 }
    }

    return { inOrders: (count || 0) > 0, orderCount: count || 0 }
  }

  async delete(id: string): Promise<void> {
    // Check if product is in any orders
    const { inOrders, orderCount } = await this.checkProductInOrders(id)
    if (inOrders) {
      throw new Error(`PRODUCT_IN_ORDERS:${orderCount}`)
    }

    // First, get the product to retrieve image URLs
    const product = await this.getById(id)

    if (product && product.imageUrls.length > 0) {
      // Delete all images from storage
      await Promise.all(
        product.imageUrls.map((url) =>
          uploadService.deleteImage(url).catch((err) => {
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

  async getBySku(sku: string): Promise<Product | null> {
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
        is_on_discount,
        is_promo,
        discount_price,
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
      .eq("sku", sku)
      .maybeSingle()

    if (error) {
      console.error("Error fetching product by SKU:", error)
      return null
    }

    if (!data) return null

    return mapRowToProduct(data)
  }

  async create(data: {
    name: string
    description?: string | null
    sku?: string | null
    barcode?: string | null
    price: number
    isActive?: boolean
    isOnDiscount?: boolean
    isPromo?: boolean
    discountPrice?: number | null
    categoryId?: string | null
    subcategoryId?: string | null
    imageUrls?: string[]
  }): Promise<Product> {
    const { data: product, error } = await supabase
      .from("products")
      .insert({
        name: data.name,
        description: data.description || null,
        sku: data.sku || null,
        barcode: data.barcode || null,
        price: data.price,
        is_active: data.isActive ?? true,
        is_on_discount: data.isOnDiscount ?? false,
        is_promo: data.isPromo ?? false,
        discount_price: data.discountPrice ?? null,
        category_id: data.categoryId || null,
        subcategory_id: data.subcategoryId || null,
        image_urls: data.imageUrls || [],
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating product:", error)
      throw new Error("Failed to create product")
    }

    return mapRowToProduct(product)
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
      isOnDiscount: boolean
      isPromo: boolean
      discountPrice: number | null
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
    if (data.isOnDiscount !== undefined) updateData.is_on_discount = data.isOnDiscount
    if (data.isPromo !== undefined) updateData.is_promo = data.isPromo
    if (data.discountPrice !== undefined) updateData.discount_price = data.discountPrice
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
