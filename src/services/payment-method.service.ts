"use client"

import { createClient } from "@/lib/supabase/client"
import { PaginationParams, PaginatedResponse } from "@/src/types/pagination"

const supabase = createClient()

export type PaymentScope = "nacional" | "internacional"
export type PaymentType = "pago_movil" | "transferencia" | "zelle" | "banesco_panama"

export interface PaymentMethod {
  id: string
  scope: PaymentScope
  type: PaymentType
  bank: string | null
  documentType: "V" | "J" | "E" | null
  documentNumber: string | null
  phoneCode: string | null
  phoneNumber: string | null
  accountNumber: string | null
  email: string | null
  holderName: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreatePaymentMethodData {
  scope: PaymentScope
  type: PaymentType
  bank?: string | null
  documentType?: "V" | "J" | "E" | null
  documentNumber?: string | null
  phoneCode?: string | null
  phoneNumber?: string | null
  accountNumber?: string | null
  email?: string | null
  holderName?: string | null
  isActive?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToPaymentMethod(row: any): PaymentMethod {
  return {
    id: row.id,
    scope: row.scope,
    type: row.type,
    bank: row.bank,
    documentType: row.document_type,
    documentNumber: row.document_number,
    phoneCode: row.phone_code,
    phoneNumber: row.phone_number,
    accountNumber: row.account_number,
    email: row.email,
    holderName: row.holder_name,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

class PaymentMethodService {
  async getPaginated(
    params: PaginationParams,
    filters?: { scope?: PaymentScope; type?: PaymentType }
  ): Promise<PaginatedResponse<PaymentMethod>> {
    const { page, pageSize } = params
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Build count query
    let countQuery = supabase
      .from("payment_methods")
      .select("*", { count: "exact", head: true })

    if (filters?.scope) {
      countQuery = countQuery.eq("scope", filters.scope)
    }
    if (filters?.type) {
      countQuery = countQuery.eq("type", filters.type)
    }

    const { count: totalCount, error: countError } = await countQuery

    if (countError) {
      console.error("Error counting payment methods:", countError)
      throw new Error("Failed to count payment methods")
    }

    // Build data query
    let dataQuery = supabase
      .from("payment_methods")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to)

    if (filters?.scope) {
      dataQuery = dataQuery.eq("scope", filters.scope)
    }
    if (filters?.type) {
      dataQuery = dataQuery.eq("type", filters.type)
    }

    const { data, error } = await dataQuery

    if (error) {
      console.error("Error fetching payment methods:", error)
      throw new Error("Failed to fetch payment methods")
    }

    const items: PaymentMethod[] = (data || []).map(mapRowToPaymentMethod)

    return {
      data: items,
      totalCount: totalCount || 0,
      page,
      pageSize,
      totalPages: Math.ceil((totalCount || 0) / pageSize),
    }
  }

  async getById(id: string): Promise<PaymentMethod | null> {
    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null
      console.error("Error fetching payment method:", error)
      throw new Error("Failed to fetch payment method")
    }

    return mapRowToPaymentMethod(data)
  }

  async create(data: CreatePaymentMethodData): Promise<PaymentMethod> {
    const insertData = {
      scope: data.scope,
      type: data.type,
      bank: data.bank || null,
      document_type: data.documentType || null,
      document_number: data.documentNumber || null,
      phone_code: data.phoneCode || null,
      phone_number: data.phoneNumber || null,
      account_number: data.accountNumber || null,
      email: data.email || null,
      holder_name: data.holderName || null,
      is_active: data.isActive ?? true,
    }

    const { data: created, error } = await supabase
      .from("payment_methods")
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error("Error creating payment method:", error)
      throw new Error("Failed to create payment method")
    }

    return mapRowToPaymentMethod(created)
  }

  async update(id: string, data: Partial<CreatePaymentMethodData>): Promise<PaymentMethod> {
    const updateData: Record<string, unknown> = {}

    if (data.scope !== undefined) updateData.scope = data.scope
    if (data.type !== undefined) updateData.type = data.type
    if (data.bank !== undefined) updateData.bank = data.bank
    if (data.documentType !== undefined) updateData.document_type = data.documentType
    if (data.documentNumber !== undefined) updateData.document_number = data.documentNumber
    if (data.phoneCode !== undefined) updateData.phone_code = data.phoneCode
    if (data.phoneNumber !== undefined) updateData.phone_number = data.phoneNumber
    if (data.accountNumber !== undefined) updateData.account_number = data.accountNumber
    if (data.email !== undefined) updateData.email = data.email
    if (data.holderName !== undefined) updateData.holder_name = data.holderName
    if (data.isActive !== undefined) updateData.is_active = data.isActive

    const { data: updated, error } = await supabase
      .from("payment_methods")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating payment method:", error)
      throw new Error("Failed to update payment method")
    }

    return mapRowToPaymentMethod(updated)
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("payment_methods")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting payment method:", error)
      throw new Error("Failed to delete payment method")
    }
  }
}

export const paymentMethodService = new PaymentMethodService()

// Helper functions for display
export function getPaymentTypeLabel(type: PaymentType): string {
  const labels: Record<PaymentType, string> = {
    pago_movil: "Pago Móvil",
    transferencia: "Transferencia",
    zelle: "Zelle",
    banesco_panama: "Banesco Panamá",
  }
  return labels[type]
}

export function getPaymentScopeLabel(scope: PaymentScope): string {
  const labels: Record<PaymentScope, string> = {
    nacional: "Nacional",
    internacional: "Internacional",
  }
  return labels[scope]
}

export function getAccountDisplay(method: PaymentMethod): string {
  switch (method.type) {
    case "pago_movil":
      return `${method.phoneCode}-${method.phoneNumber}`
    case "transferencia":
    case "banesco_panama":
      return method.accountNumber || "-"
    case "zelle":
      return method.email || "-"
    default:
      return "-"
  }
}
