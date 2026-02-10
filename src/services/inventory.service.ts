"use client"

import { createClient } from "@/lib/supabase/client"
import {
  CreateWarehouseProductData,
  UpdateWarehouseProductData,
} from "@/src/models/warehouse.model"
import { PaginationParams, PaginatedResponse } from "@/src/types/pagination"

const supabase = createClient()

export interface InventoryItem {
  warehouseId: string
  productId: string
  isAvailable: boolean
  createdAt: string
  updatedAt: string
  product: {
    id: string
    name: string
    imageUrls: string[]
    sku: string | null
    barcode: string | null
    price: number
    isOnDiscount: boolean
    isPromo: boolean
    discountPrice: number | null
    category: {
      id: string
      name: string
    } | null
  }
  warehouse: {
    id: string
    name: string
    logoUrl: string | null
  }
}

interface InventoryFilters {
  warehouseId?: string
  search?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToInventoryItem(row: any): InventoryItem {
  const product = row.products
  const warehouse = row.warehouses

  return {
    warehouseId: row.warehouse_id,
    productId: row.product_id,
    isAvailable: row.is_available,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    product: {
      id: product?.id ?? "",
      name: product?.name ?? "",
      imageUrls: product?.image_urls ?? [],
      sku: product?.sku ?? null,
      barcode: product?.barcode ?? null,
      price: product?.price ?? 0,
      isOnDiscount: product?.is_on_discount ?? false,
      isPromo: product?.is_promo ?? false,
      discountPrice: product?.discount_price ?? null,
      category: product?.categories ?? null,
    },
    warehouse: {
      id: warehouse?.id ?? "",
      name: warehouse?.name ?? "",
      logoUrl: warehouse?.logo_url ?? null,
    },
  }
}

class InventoryService {
  async getPaginated(
    params: PaginationParams,
    filters?: InventoryFilters
  ): Promise<PaginatedResponse<InventoryItem>> {
    const { page, pageSize } = params
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Build count query
    let countQuery = supabase
      .from("warehouse_products")
      .select("*", { count: "exact", head: true })

    if (filters?.warehouseId) {
      countQuery = countQuery.eq("warehouse_id", filters.warehouseId)
    }

    const { count: totalCount, error: countError } = await countQuery

    if (countError) {
      console.error("Error counting inventory:", countError)
      throw new Error("Failed to count inventory")
    }

    // Build data query
    let dataQuery = supabase
      .from("warehouse_products")
      .select(`
        warehouse_id,
        product_id,
        is_available,
        created_at,
        updated_at,
        products (
          id,
          name,
          image_urls,
          sku,
          barcode,
          price,
          is_on_discount,
          is_promo,
          discount_price,
          categories (
            id,
            name
          )
        ),
        warehouses (
          id,
          name,
          logo_url
        )
      `)
      .order("created_at", { ascending: false })
      .range(from, to)

    if (filters?.warehouseId) {
      dataQuery = dataQuery.eq("warehouse_id", filters.warehouseId)
    }

    const { data, error } = await dataQuery

    if (error) {
      console.error("Error fetching inventory:", error)
      throw new Error("Failed to fetch inventory")
    }

    // Filter by search if provided (client-side for product name)
    let filteredData = data || []
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filteredData = filteredData.filter((item: any) => {
        return item.products?.name?.toLowerCase().includes(searchLower)
      })
    }

    const items: InventoryItem[] = filteredData.map(mapRowToInventoryItem)

    return {
      data: items,
      totalCount: totalCount || 0,
      page,
      pageSize,
      totalPages: Math.ceil((totalCount || 0) / pageSize),
    }
  }

  async getById(
    warehouseId: string,
    productId: string
  ): Promise<InventoryItem | null> {
    const { data, error } = await supabase
      .from("warehouse_products")
      .select(`
        warehouse_id,
        product_id,
        is_available,
        created_at,
        updated_at,
        products (
          id,
          name,
          image_urls,
          sku,
          barcode,
          price,
          is_on_discount,
          is_promo,
          discount_price,
          categories (
            id,
            name
          )
        ),
        warehouses (
          id,
          name,
          logo_url
        )
      `)
      .eq("warehouse_id", warehouseId)
      .eq("product_id", productId)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null
      console.error("Error fetching inventory item:", error)
      throw new Error("Failed to fetch inventory item")
    }

    return mapRowToInventoryItem(data)
  }

  async create(inventoryData: CreateWarehouseProductData): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from("warehouse_products")
      .insert({
        warehouse_id: inventoryData.warehouseId,
        product_id: inventoryData.productId,
        is_available: inventoryData.isAvailable ?? true,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating inventory item:", error)
      throw new Error("Failed to create inventory item")
    }

    const item = await this.getById(data.warehouse_id, data.product_id)
    if (!item) throw new Error("Failed to fetch created inventory item")
    return item
  }

  async update(
    warehouseId: string,
    productId: string,
    inventoryData: UpdateWarehouseProductData
  ): Promise<InventoryItem> {
    const updateData: Record<string, unknown> = {}

    if (inventoryData.isAvailable !== undefined) {
      updateData.is_available = inventoryData.isAvailable
    }

    const { error } = await supabase
      .from("warehouse_products")
      .update(updateData)
      .eq("warehouse_id", warehouseId)
      .eq("product_id", productId)

    if (error) {
      console.error("Error updating inventory item:", error)
      throw new Error("Failed to update inventory item")
    }

    const item = await this.getById(warehouseId, productId)
    if (!item) throw new Error("Failed to fetch updated inventory item")
    return item
  }

  async delete(warehouseId: string, productId: string): Promise<void> {
    const { error } = await supabase
      .from("warehouse_products")
      .delete()
      .eq("warehouse_id", warehouseId)
      .eq("product_id", productId)

    if (error) {
      console.error("Error deleting inventory item:", error)
      throw new Error("Failed to delete inventory item")
    }
  }

  async bulkAddToWarehouses(): Promise<{ added: number; skipped: number; errors: number }> {
    // Get all products
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id")

    if (productsError && productsError.message) {
      console.error("Error fetching products:", productsError)
      throw new Error("Failed to fetch products")
    }

    // Get all active warehouses
    const { data: warehouses, error: warehousesError } = await supabase
      .from("warehouses")
      .select("id")
      .eq("is_active", true)

    if (warehousesError && warehousesError.message) {
      console.error("Error fetching warehouses:", warehousesError)
      throw new Error("Failed to fetch warehouses")
    }

    if (!products?.length || !warehouses?.length) {
      return { added: 0, skipped: 0, errors: 0 }
    }

    // Get existing warehouse_products to avoid duplicates
    const { data: existing } = await supabase
      .from("warehouse_products")
      .select("warehouse_id, product_id")

    const existingSet = new Set(
      (existing || []).map((e) => `${e.warehouse_id}-${e.product_id}`)
    )

    // Prepare records to insert
    const recordsToInsert: {
      warehouse_id: string
      product_id: string
      is_available: boolean
    }[] = []

    for (const warehouse of warehouses) {
      for (const product of products) {
        const key = `${warehouse.id}-${product.id}`
        if (!existingSet.has(key)) {
          recordsToInsert.push({
            warehouse_id: warehouse.id,
            product_id: product.id,
            is_available: true,
          })
        }
      }
    }

    const skipped = (products.length * warehouses.length) - recordsToInsert.length

    if (recordsToInsert.length === 0) {
      return { added: 0, skipped, errors: 0 }
    }

    // Insert in batches of 100 to avoid timeout
    const batchSize = 100
    let added = 0
    let errors = 0

    for (let i = 0; i < recordsToInsert.length; i += batchSize) {
      const batch = recordsToInsert.slice(i, i + batchSize)
      const { error } = await supabase
        .from("warehouse_products")
        .insert(batch)

      if (error) {
        console.error("Error inserting batch:", error)
        errors += batch.length
      } else {
        added += batch.length
      }
    }

    return { added, skipped, errors }
  }
}

export const inventoryService = new InventoryService()
