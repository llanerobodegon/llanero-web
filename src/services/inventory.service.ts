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
  stock: number
  price: number | null
  isAvailable: boolean
  isOnDiscount: boolean
  isPromo: boolean
  discountPrice: number | null
  createdAt: string
  updatedAt: string
  product: {
    id: string
    name: string
    imageUrls: string[]
    sku: string | null
    barcode: string | null
    price: number
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
    stock: row.stock,
    price: row.price,
    isAvailable: row.is_available,
    isOnDiscount: row.is_on_discount,
    isPromo: row.is_promo,
    discountPrice: row.discount_price,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    product: {
      id: product?.id ?? "",
      name: product?.name ?? "",
      imageUrls: product?.image_urls ?? [],
      sku: product?.sku ?? null,
      barcode: product?.barcode ?? null,
      price: product?.price ?? 0,
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
        stock,
        price,
        is_available,
        is_on_discount,
        is_promo,
        discount_price,
        created_at,
        updated_at,
        products (
          id,
          name,
          image_urls,
          sku,
          barcode,
          price,
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
        stock,
        price,
        is_available,
        is_on_discount,
        is_promo,
        discount_price,
        created_at,
        updated_at,
        products (
          id,
          name,
          image_urls,
          sku,
          barcode,
          price,
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
        stock: inventoryData.stock ?? 0,
        price: inventoryData.price ?? null,
        is_available: inventoryData.isAvailable ?? true,
        is_on_discount: inventoryData.isOnDiscount ?? false,
        is_promo: inventoryData.isPromo ?? false,
        discount_price: inventoryData.discountPrice ?? null,
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

    if (inventoryData.stock !== undefined) {
      updateData.stock = inventoryData.stock
    }
    if (inventoryData.price !== undefined) {
      updateData.price = inventoryData.price
    }
    if (inventoryData.isAvailable !== undefined) {
      updateData.is_available = inventoryData.isAvailable
    }
    if (inventoryData.isOnDiscount !== undefined) {
      updateData.is_on_discount = inventoryData.isOnDiscount
    }
    if (inventoryData.isPromo !== undefined) {
      updateData.is_promo = inventoryData.isPromo
    }
    if (inventoryData.discountPrice !== undefined) {
      updateData.discount_price = inventoryData.discountPrice
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
}

export const inventoryService = new InventoryService()
