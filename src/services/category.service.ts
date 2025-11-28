import { createClient } from "@/lib/supabase/client"
import {
  Category,
  CreateCategoryData,
  UpdateCategoryData,
} from "@/src/models/warehouse.model"
import { PaginationParams, PaginatedResponse } from "@/src/types/pagination"

interface CategoryRow {
  id: string
  name: string
  image_url: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

function transformCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    imageUrl: row.image_url,
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export type CategoryWithProductCount = Category & { productCount: number }

export const categoryService = {
  async getAll(): Promise<Category[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true })

    if (error) {
      throw new Error(`Error fetching categories: ${error.message}`)
    }

    return (data as CategoryRow[]).map(transformCategory)
  },

  async getById(id: string): Promise<Category | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null
      throw new Error(`Error fetching category: ${error.message}`)
    }

    return transformCategory(data as CategoryRow)
  },

  async create(categoryData: CreateCategoryData): Promise<Category> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("categories")
      .insert({
        name: categoryData.name,
        image_url: categoryData.imageUrl || null,
        is_active: categoryData.isActive ?? true,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Error creating category: ${error.message}`)
    }

    return transformCategory(data as CategoryRow)
  },

  async update(id: string, categoryData: UpdateCategoryData): Promise<Category> {
    const supabase = createClient()

    const updateData: Record<string, unknown> = {}

    if (categoryData.name !== undefined) {
      updateData.name = categoryData.name
    }
    if (categoryData.imageUrl !== undefined) {
      updateData.image_url = categoryData.imageUrl
    }
    if (categoryData.isActive !== undefined) {
      updateData.is_active = categoryData.isActive
    }

    const { data, error } = await supabase
      .from("categories")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      throw new Error(`Error updating category: ${error.message}`)
    }

    return transformCategory(data as CategoryRow)
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase.from("categories").delete().eq("id", id)

    if (error) {
      throw new Error(`Error deleting category: ${error.message}`)
    }
  },

  async getAllWithProductCount(): Promise<CategoryWithProductCount[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("categories")
      .select(`
        *,
        products:products(count)
      `)
      .order("name", { ascending: true })

    if (error) {
      throw new Error(`Error fetching categories with product count: ${error.message}`)
    }

    return (data as (CategoryRow & { products: { count: number }[] })[]).map((row) => ({
      ...transformCategory(row),
      productCount: row.products?.[0]?.count || 0,
    }))
  },

  async getPaginated(
    params: PaginationParams
  ): Promise<PaginatedResponse<CategoryWithProductCount>> {
    const supabase = createClient()
    const { page, pageSize } = params
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from("categories")
      .select("*", { count: "exact", head: true })

    if (countError) {
      throw new Error(`Error counting categories: ${countError.message}`)
    }

    // Get paginated data
    const { data, error } = await supabase
      .from("categories")
      .select(`
        *,
        products:products(count)
      `)
      .order("name", { ascending: true })
      .range(from, to)

    if (error) {
      throw new Error(`Error fetching categories: ${error.message}`)
    }

    const categories = (data as (CategoryRow & { products: { count: number }[] })[]).map((row) => ({
      ...transformCategory(row),
      productCount: row.products?.[0]?.count || 0,
    }))

    return {
      data: categories,
      totalCount: totalCount || 0,
      page,
      pageSize,
      totalPages: Math.ceil((totalCount || 0) / pageSize),
    }
  },
}
