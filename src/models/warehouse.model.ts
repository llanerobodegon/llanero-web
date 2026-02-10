// Category interface
export interface Category {
  id: string;
  name: string;
  imageUrl: string | null;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// Subcategory interface
export interface Subcategory {
  id: string;
  categoryId: string;
  category?: Category;
  name: string;
  imageUrl: string | null;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// Product interface
export interface Product {
  id: string;
  categoryId: string;
  category?: Category;
  subcategoryId: string | null;
  subcategory?: Subcategory;
  name: string;
  description: string | null;
  imageUrls: string[];
  barcode: string | null;
  sku: string | null;
  price: number;
  isActive: boolean;
  isOnDiscount: boolean;
  isPromo: boolean;
  discountPrice: number | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// Warehouse interface
export interface Warehouse {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  logoUrl: string | null;
  deliveryFee: number;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// Warehouse Product (inventory) interface
export interface WarehouseProduct {
  warehouseId: string;
  warehouse?: Warehouse;
  productId: string;
  product?: Product;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

// Warehouse User (manager assignment) interface
export interface WarehouseUser {
  warehouseId: string;
  warehouse?: Warehouse;
  userId: string;
  createdAt: string;
}

// ============================================
// CREATE/UPDATE DTOs
// ============================================

export interface CreateCategoryData {
  name: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface UpdateCategoryData {
  name?: string;
  imageUrl?: string | null;
  isActive?: boolean;
}

export interface CreateSubcategoryData {
  categoryId: string;
  name: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface UpdateSubcategoryData {
  categoryId?: string;
  name?: string;
  imageUrl?: string | null;
  isActive?: boolean;
}

export interface CreateProductData {
  categoryId: string;
  subcategoryId?: string;
  name: string;
  description?: string;
  imageUrls?: string[];
  barcode?: string;
  sku?: string;
  price: number;
  isActive?: boolean;
  isOnDiscount?: boolean;
  isPromo?: boolean;
  discountPrice?: number;
}

export interface UpdateProductData {
  categoryId?: string;
  subcategoryId?: string | null;
  name?: string;
  description?: string | null;
  imageUrls?: string[];
  barcode?: string | null;
  sku?: string | null;
  price?: number;
  isActive?: boolean;
  isOnDiscount?: boolean;
  isPromo?: boolean;
  discountPrice?: number | null;
}

export interface CreateWarehouseData {
  name: string;
  address?: string;
  phone?: string;
  logoUrl?: string;
  deliveryFee?: number;
  isActive?: boolean;
}

export interface UpdateWarehouseData {
  name?: string;
  address?: string | null;
  phone?: string | null;
  logoUrl?: string | null;
  deliveryFee?: number;
  isActive?: boolean;
}

export interface CreateWarehouseProductData {
  warehouseId: string;
  productId: string;
  isAvailable?: boolean;
}

export interface UpdateWarehouseProductData {
  isAvailable?: boolean;
}

export interface AssignWarehouseUserData {
  warehouseId: string;
  userId: string;
}
