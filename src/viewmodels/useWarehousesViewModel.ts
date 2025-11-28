"use client";

import { useState, useEffect, useCallback } from "react";
import { Warehouse, CreateWarehouseData, UpdateWarehouseData } from "@/src/models/warehouse.model";
import { warehouseService } from "@/src/services/warehouse.service";

export interface WarehouseWithProductCount extends Warehouse {
  productCount: number;
}

export function useWarehousesViewModel() {
  const [warehouses, setWarehouses] = useState<WarehouseWithProductCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWarehouses = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await warehouseService.getAllWithProductCount();
      setWarehouses(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cargar bodegones";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  const createWarehouse = async (data: CreateWarehouseData): Promise<Warehouse> => {
    const newWarehouse = await warehouseService.create(data);
    await fetchWarehouses(); // Refresh list
    return newWarehouse;
  };

  const updateWarehouse = async (id: string, data: UpdateWarehouseData): Promise<Warehouse> => {
    const updatedWarehouse = await warehouseService.update(id, data);
    await fetchWarehouses(); // Refresh list
    return updatedWarehouse;
  };

  const deleteWarehouse = async (id: string): Promise<void> => {
    await warehouseService.delete(id);
    await fetchWarehouses(); // Refresh list
  };

  const refresh = () => {
    fetchWarehouses();
  };

  return {
    warehouses,
    isLoading,
    error,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    refresh,
  };
}
