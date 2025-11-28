import { createClient } from "@/lib/supabase/client"
import {
  Subcategory,
  Category,
  CreateSubcategoryData,
  UpdateSubcategoryData,
} from "@/src/models/warehouse.model"
import { PaginationParams, PaginatedResponse } from "@/src/types/pagination"

interface SubcategoryRow {
  id: string
  category_id: string
  name: string
  image_url: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

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

function transformSubcategory(row: SubcategoryRow, category?: CategoryRow): Subcategory {
  return {
    id: row.id,
    categoryId: row.category_id,
    category: category ? transformCategory(category) : undefined,
    name: row.name,
    imageUrl: row.image_url,
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export type SubcategoryWithProductCount = Subcategory & { productCount: number }

export const subcategoryService = {
  async getAll(): Promise<Subcategory[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("subcategories")
      .select(`
        *,
        category:categories(*)
      `)
      .order("name", { ascending: true })

    if (error) {
      throw new Error(`Error fetching subcategories: ${error.message}`)
    }

    return (data as (SubcategoryRow & { category: CategoryRow })[]).map((row) =>
      transformSubcategory(row, row.category)
    )
  },

  async getById(id: string): Promise<Subcategory | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("subcategories")
      .select(`
        *,
        category:categories(*)
      `)
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null
      throw new Error(`Error fetching subcategory: ${error.message}`)
    }

    const row = data as SubcategoryRow & { category: CategoryRow }
    return transformSubcategory(row, row.category)
  },

  async create(subcategoryData: CreateSubcategoryData): Promise<Subcategory> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("subcategories")
      .insert({
        category_id: subcategoryData.categoryId,
        name: subcategoryData.name,
        image_url: subcategoryData.imageUrl || null,
        is_active: subcategoryData.isActive ?? true,
      })
      .select(`
        *,
        category:categories(*)
      `)
      .single()

    if (error) {
      throw new Error(`Error creating subcategory: ${error.message}`)
    }

    const row = data as SubcategoryRow & { category: CategoryRow }
    return transformSubcategory(row, row.category)
  },

  async update(id: string, subcategoryData: UpdateSubcategoryData): Promise<Subcategory> {
    const supabase = createClient()

    const updateData: Record<string, unknown> = {}

    if (subcategoryData.categoryId !== undefined) {
      updateData.category_id = subcategoryData.categoryId
    }
    if (subcategoryData.name !== undefined) {
      updateData.name = subcategoryData.name
    }
    if (subcategoryData.imageUrl !== undefined) {
      updateData.image_url = subcategoryData.imageUrl
    }
    if (subcategoryData.isActive !== undefined) {
      updateData.is_active = subcategoryData.isActive
    }

    const { data, error } = await supabase
      .from("subcategories")
      .update(updateData)
      .eq("id", id)
      .select(`
        *,
        category:categories(*)
      `)
      .single()

    if (error) {
      throw new Error(`Error updating subcategory: ${error.message}`)
    }

    const row = data as SubcategoryRow & { category: CategoryRow }
    return transformSubcategory(row, row.category)
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase.from("subcategories").delete().eq("id", id)

    if (error) {
      throw new Error(`Error deleting subcategory: ${error.message}`)
    }
  },

  async getAllWithProductCount(): Promise<SubcategoryWithProductCount[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("subcategories")
      .select(`
        *,
        category:categories(*),
        products:products(count)
      `)
      .order("name", { ascending: true })

    if (error) {
      throw new Error(`Error fetching subcategories with product count: ${error.message}`)
    }

    return (data as (SubcategoryRow & { category: CategoryRow; products: { count: number }[] })[]).map((row) => ({
      ...transformSubcategory(row, row.category),
      productCount: row.products?.[0]?.count || 0,
    }))
  },

  async getPaginated(
    params: PaginationParams
  ): Promise<PaginatedResponse<SubcategoryWithProductCount>> {
    const supabase = createClient()
    const { page, pageSize } = params
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from("subcategories")
      .select("*", { count: "exact", head: true })

    if (countError) {
      throw new Error(`Error counting subcategories: ${countError.message}`)
    }

    // Get paginated data
    const { data, error } = await supabase
      .from("subcategories")
      .select(`
        *,
        category:categories(*),
        products:products(count)
      `)
      .order("name", { ascending: true })
      .range(from, to)

    if (error) {
      throw new Error(`Error fetching subcategories: ${error.message}`)
    }

    const subcategories = (data as (SubcategoryRow & { category: CategoryRow; products: { count: number }[] })[]).map((row) => ({
      ...transformSubcategory(row, row.category),
      productCount: row.products?.[0]?.count || 0,
    }))

    return {
      data: subcategories,
      totalCount: totalCount || 0,
      page,
      pageSize,
      totalPages: Math.ceil((totalCount || 0) / pageSize),
    }
  },
}
