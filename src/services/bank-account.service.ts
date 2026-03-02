"use client"

import { createClient } from "@/lib/supabase/client"
import { PaginationParams, PaginatedResponse } from "@/src/types/pagination"

const supabase = createClient()

export type BankAccountScope = "nacional" | "internacional"
export type BankAccountType = "zelle" | "banesco_panama"

export interface BankAccount {
  id: string
  warehouseId: string
  scope: BankAccountScope
  type: BankAccountType | null
  holderName: string
  rif: string | null
  bank: string | null
  accountNumber: string
  pagoMovilPhone: string | null
  isActive: boolean
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateBankAccountData {
  warehouseId: string
  scope: BankAccountScope
  type?: BankAccountType | null
  holderName: string
  rif?: string | null
  bank?: string | null
  accountNumber: string
  pagoMovilPhone?: string | null
  isActive?: boolean
}

export type UpdateBankAccountData = Partial<Omit<CreateBankAccountData, "warehouseId">>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToBankAccount(row: any): BankAccount {
  return {
    id: row.id,
    warehouseId: row.warehouse_id,
    scope: row.scope,
    type: row.type,
    holderName: row.holder_name,
    rif: row.rif,
    bank: row.bank,
    accountNumber: row.account_number,
    pagoMovilPhone: row.pago_movil_phone,
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

class BankAccountService {
  async getPaginated(
    params: PaginationParams,
    warehouseId?: string
  ): Promise<PaginatedResponse<BankAccount>> {
    const { page, pageSize } = params
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let countQuery = supabase
      .from("bank_accounts")
      .select("*", { count: "exact", head: true })

    if (warehouseId) {
      countQuery = countQuery.eq("warehouse_id", warehouseId)
    }

    const { count: totalCount, error: countError } = await countQuery

    if (countError) {
      throw new Error("Failed to count bank accounts")
    }

    let dataQuery = supabase
      .from("bank_accounts")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to)

    if (warehouseId) {
      dataQuery = dataQuery.eq("warehouse_id", warehouseId)
    }

    const { data, error } = await dataQuery

    if (error) {
      throw new Error("Failed to fetch bank accounts")
    }

    return {
      data: (data || []).map(mapRowToBankAccount),
      totalCount: totalCount || 0,
      page,
      pageSize,
      totalPages: Math.ceil((totalCount || 0) / pageSize),
    }
  }

  async getByWarehouseId(warehouseId: string): Promise<BankAccount[]> {
    const { data, error } = await supabase
      .from("bank_accounts")
      .select("*")
      .eq("warehouse_id", warehouseId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error("Failed to fetch bank accounts")
    }

    return (data || []).map(mapRowToBankAccount)
  }

  async create(data: CreateBankAccountData): Promise<BankAccount> {
    const { data: userData } = await supabase.auth.getUser()

    const { data: created, error } = await supabase
      .from("bank_accounts")
      .insert({
        warehouse_id: data.warehouseId,
        scope: data.scope,
        type: data.type || null,
        holder_name: data.holderName,
        rif: data.rif || null,
        bank: data.bank || null,
        account_number: data.accountNumber,
        pago_movil_phone: data.pagoMovilPhone || null,
        is_active: data.isActive ?? true,
        created_by: userData.user?.id || null,
      })
      .select()
      .single()

    if (error) {
      throw new Error("Failed to create bank account")
    }

    return mapRowToBankAccount(created)
  }

  async update(id: string, data: UpdateBankAccountData): Promise<BankAccount> {
    const updateData: Record<string, unknown> = {}

    if (data.scope !== undefined) updateData.scope = data.scope
    if (data.type !== undefined) updateData.type = data.type
    if (data.holderName !== undefined) updateData.holder_name = data.holderName
    if (data.rif !== undefined) updateData.rif = data.rif
    if (data.bank !== undefined) updateData.bank = data.bank
    if (data.accountNumber !== undefined) updateData.account_number = data.accountNumber
    if (data.pagoMovilPhone !== undefined) updateData.pago_movil_phone = data.pagoMovilPhone
    if (data.isActive !== undefined) updateData.is_active = data.isActive

    const { data: updated, error } = await supabase
      .from("bank_accounts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      throw new Error("Failed to update bank account")
    }

    return mapRowToBankAccount(updated)
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("bank_accounts")
      .delete()
      .eq("id", id)

    if (error) {
      throw new Error("Failed to delete bank account")
    }
  }
}

export const bankAccountService = new BankAccountService()
