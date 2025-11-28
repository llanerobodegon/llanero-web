// Role names
export type RoleName = "customer" | "admin" | "manager" | "delivery";

// Venezuela phone codes
export type PhoneCode = "0412" | "0414" | "0416" | "0424" | "0426";

// Document type
export type IdType = "V" | "E";

// Role interface
export interface Role {
  id: number;
  name: RoleName;
  description: string | null;
  createdAt: string;
}

// User interface
export interface User {
  id: string;
  roleId: number;
  role?: Role;
  firstName: string;
  lastName: string;
  email: string;
  phoneCode: PhoneCode | null;
  phone: string | null;
  idType: IdType | null;
  idNumber: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Address interface
export interface Address {
  id: string;
  userId: string;
  label: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: RoleName;
  phoneCode?: PhoneCode;
  phone?: string;
  idType?: IdType;
  idNumber?: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phoneCode?: PhoneCode | null;
  phone?: string | null;
  idType?: IdType | null;
  idNumber?: string | null;
  isActive?: boolean;
}

// Address types
export interface CreateAddressData {
  label: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  isDefault?: boolean;
}

export interface UpdateAddressData {
  label?: string;
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string;
  isDefault?: boolean;
}
