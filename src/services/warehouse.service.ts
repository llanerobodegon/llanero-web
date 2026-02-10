"use client";

import { createClient } from "@/lib/supabase/client";
import {
  Warehouse,
  CreateWarehouseData,
  UpdateWarehouseData,
} from "@/src/models/warehouse.model";
import { PaginationParams, PaginatedResponse } from "@/src/types/pagination";

const supabase = createClient();

// Transform database row to TypeScript model
function transformWarehouse(row: Record<string, unknown>): Warehouse {
  return {
    id: row.id as string,
    name: row.name as string,
    address: row.address as string | null,
    phone: row.phone as string | null,
    logoUrl: row.logo_url as string | null,
    deliveryFee: Number(row.delivery_fee) || 0,
    isActive: row.is_active as boolean,
    createdBy: row.created_by as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export type WarehouseWithProductCount = Warehouse & { productCount: number };

export const warehouseService = {
  async getAll(): Promise<Warehouse[]> {
    const { data, error } = await supabase
      .from("warehouses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map(transformWarehouse);
  },

  async getByUserId(userId: string): Promise<Warehouse[]> {
    const { data, error } = await supabase
      .from("warehouse_users")
      .select("warehouses(*)")
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }

    return (data || [])
      .map((row) => row.warehouses)
      .filter(Boolean)
      .map((w) => transformWarehouse(w as unknown as Record<string, unknown>));
  },

  async getById(id: string): Promise<Warehouse | null> {
    const { data, error } = await supabase
      .from("warehouses")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw new Error(error.message);
    }

    return transformWarehouse(data);
  },

  async create(warehouseData: CreateWarehouseData): Promise<Warehouse> {
    const { data: userData } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("warehouses")
      .insert({
        name: warehouseData.name,
        address: warehouseData.address || null,
        phone: warehouseData.phone || null,
        logo_url: warehouseData.logoUrl || null,
        delivery_fee: warehouseData.deliveryFee ?? 0,
        is_active: warehouseData.isActive ?? true,
        created_by: userData.user?.id || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return transformWarehouse(data);
  },

  async update(id: string, warehouseData: UpdateWarehouseData): Promise<Warehouse> {
    const updateData: Record<string, unknown> = {};

    if (warehouseData.name !== undefined) updateData.name = warehouseData.name;
    if (warehouseData.address !== undefined) updateData.address = warehouseData.address;
    if (warehouseData.phone !== undefined) updateData.phone = warehouseData.phone;
    if (warehouseData.logoUrl !== undefined) updateData.logo_url = warehouseData.logoUrl;
    if (warehouseData.deliveryFee !== undefined) updateData.delivery_fee = warehouseData.deliveryFee;
    if (warehouseData.isActive !== undefined) updateData.is_active = warehouseData.isActive;

    const { data, error } = await supabase
      .from("warehouses")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return transformWarehouse(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("warehouses")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }
  },

  async getProductCount(warehouseId: string): Promise<number> {
    const { count, error } = await supabase
      .from("warehouse_products")
      .select("*", { count: "exact", head: true })
      .eq("warehouse_id", warehouseId);

    if (error) {
      throw new Error(error.message);
    }

    return count || 0;
  },

  async getAllWithProductCount(): Promise<WarehouseWithProductCount[]> {
    const { data, error } = await supabase
      .from("warehouses")
      .select(`
        *,
        warehouse_products(count)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map((row) => ({
      ...transformWarehouse(row),
      productCount: (row.warehouse_products as { count: number }[])?.[0]?.count || 0,
    }));
  },

  async getPaginated(
    params: PaginationParams
  ): Promise<PaginatedResponse<WarehouseWithProductCount>> {
    const { page, pageSize } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from("warehouses")
      .select("*", { count: "exact", head: true });

    if (countError) {
      throw new Error(countError.message);
    }

    // Get paginated data
    const { data, error } = await supabase
      .from("warehouses")
      .select(`
        *,
        warehouse_products(count)
      `)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    const warehouses = (data || []).map((row) => ({
      ...transformWarehouse(row),
      productCount: (row.warehouse_products as { count: number }[])?.[0]?.count || 0,
    }));

    return {
      data: warehouses,
      totalCount: totalCount || 0,
      page,
      pageSize,
      totalPages: Math.ceil((totalCount || 0) / pageSize),
    };
  },
};
