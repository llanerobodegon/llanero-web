# Payment Methods Per Warehouse - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the global payment_methods system with per-warehouse bank accounts (cuentas bancarias nacionales + pago movil opcional).

**Architecture:** New `bank_accounts` table with `warehouse_id` FK replaces `payment_methods`. Service, viewmodel, and UI components are rewritten to match the simplified schema. Existing data-table and drawer patterns are reused.

**Tech Stack:** Next.js, Supabase (PostgreSQL + RLS), TypeScript, TanStack Table, Radix UI (Sheet, Select, etc.), Sonner (toasts)

---

### Task 1: Database Migration - Create bank_accounts and drop payment_methods

**Files:**
- Create: `supabase/migrations/022_create_bank_accounts_table.sql`

**Step 1: Write the migration SQL**

Apply via Supabase MCP `apply_migration`:

```sql
-- Bank Accounts Table (replaces payment_methods)
-- Each warehouse has its own bank accounts for receiving payments

CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  holder_name VARCHAR(255) NOT NULL,
  rif VARCHAR(20) NOT NULL,
  bank VARCHAR(100) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  pago_movil_phone VARCHAR(20),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Updated at trigger (reuses existing function from migration 001)
CREATE TRIGGER update_bank_accounts_updated_at
  BEFORE UPDATE ON bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_bank_accounts_warehouse_id ON bank_accounts(warehouse_id);
CREATE INDEX idx_bank_accounts_is_active ON bank_accounts(is_active);

-- Enable RLS
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- SELECT: all authenticated users can read (needed for checkout)
CREATE POLICY "Allow read access to all authenticated users"
  ON bank_accounts FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: admin (role_id=2) full access, manager (role_id=3) only their warehouses
CREATE POLICY "Allow insert for admin and warehouse managers"
  ON bank_accounts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role_id = 2
    )
    OR
    EXISTS (
      SELECT 1 FROM warehouse_users
      WHERE warehouse_users.warehouse_id = bank_accounts.warehouse_id
      AND warehouse_users.user_id = auth.uid()
    )
  );

-- UPDATE: admin full access, manager only their warehouses
CREATE POLICY "Allow update for admin and warehouse managers"
  ON bank_accounts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role_id = 2
    )
    OR
    EXISTS (
      SELECT 1 FROM warehouse_users
      WHERE warehouse_users.warehouse_id = bank_accounts.warehouse_id
      AND warehouse_users.user_id = auth.uid()
    )
  );

-- DELETE: admin full access, manager only their warehouses
CREATE POLICY "Allow delete for admin and warehouse managers"
  ON bank_accounts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role_id = 2
    )
    OR
    EXISTS (
      SELECT 1 FROM warehouse_users
      WHERE warehouse_users.warehouse_id = bank_accounts.warehouse_id
      AND warehouse_users.user_id = auth.uid()
    )
  );

-- Drop old table
DROP TABLE IF EXISTS payment_methods CASCADE;
```

**Step 2: Apply migration via Supabase MCP**

Use `apply_migration` with project_id `uejjlbxgtlpqukuhusmt`, name `create_bank_accounts_table`.

**Step 3: Verify migration**

Use `list_tables` to confirm `bank_accounts` exists and `payment_methods` is gone.

**Step 4: Save migration file locally**

Save the SQL to `supabase/migrations/022_create_bank_accounts_table.sql` for version control.

**Step 5: Commit**

```bash
git add supabase/migrations/022_create_bank_accounts_table.sql
git commit -m "feat: add bank_accounts table, drop payment_methods"
```

---

### Task 2: Service Layer - Create BankAccountService

**Files:**
- Create: `src/services/bank-account.service.ts`
- Delete: `src/services/payment-method.service.ts`

**Step 1: Create `src/services/bank-account.service.ts`**

Follow the exact same patterns as `src/services/warehouse.service.ts` (createClient, transform function, class with methods, singleton export).

```typescript
"use client"

import { createClient } from "@/lib/supabase/client"
import { PaginationParams, PaginatedResponse } from "@/src/types/pagination"

const supabase = createClient()

export interface BankAccount {
  id: string
  warehouseId: string
  holderName: string
  rif: string
  bank: string
  accountNumber: string
  pagoMovilPhone: string | null
  isActive: boolean
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateBankAccountData {
  warehouseId: string
  holderName: string
  rif: string
  bank: string
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
        holder_name: data.holderName,
        rif: data.rif,
        bank: data.bank,
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
```

**Step 2: Delete old service**

Delete `src/services/payment-method.service.ts`.

**Step 3: Commit**

```bash
git add src/services/bank-account.service.ts
git rm src/services/payment-method.service.ts
git commit -m "feat: add BankAccountService, remove PaymentMethodService"
```

---

### Task 3: ViewModel - Create useBankAccountsViewModel

**Files:**
- Create: `src/viewmodels/useBankAccountsViewModel.ts`
- Delete: `src/viewmodels/usePaymentMethodsViewModel.ts`

**Step 1: Create `src/viewmodels/useBankAccountsViewModel.ts`**

Follow the same pattern as `src/viewmodels/usePaymentMethodsViewModel.ts` but with warehouse filter instead of scope/type filters.

```typescript
"use client"

import { useState, useEffect, useCallback } from "react"
import {
  bankAccountService,
  BankAccount,
  CreateBankAccountData,
  UpdateBankAccountData,
} from "@/src/services/bank-account.service"

interface PaginationState {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export function useBankAccountsViewModel() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  })

  const fetchBankAccounts = useCallback(
    async (page: number = 1, pageSize: number = 10, warehouseId?: string | null) => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await bankAccountService.getPaginated(
          { page, pageSize },
          warehouseId || undefined
        )
        setBankAccounts(result.data)
        setPagination({
          page: result.page,
          pageSize: result.pageSize,
          totalCount: result.totalCount,
          totalPages: result.totalPages,
        })
      } catch (err) {
        console.error("Error fetching bank accounts:", err)
        setError("Error al cargar las cuentas bancarias")
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    fetchBankAccounts(1, pagination.pageSize, selectedWarehouseId)
  }, [selectedWarehouseId])

  const setPage = useCallback(
    (page: number) => {
      fetchBankAccounts(page, pagination.pageSize, selectedWarehouseId)
    },
    [fetchBankAccounts, pagination.pageSize, selectedWarehouseId]
  )

  const setPageSize = useCallback(
    (pageSize: number) => {
      fetchBankAccounts(1, pageSize, selectedWarehouseId)
    },
    [fetchBankAccounts, selectedWarehouseId]
  )

  const filterByWarehouse = useCallback((warehouseId: string | null) => {
    setSelectedWarehouseId(warehouseId)
  }, [])

  const createBankAccount = useCallback(
    async (data: CreateBankAccountData) => {
      const created = await bankAccountService.create(data)
      setBankAccounts((prev) => [created, ...prev])
      setPagination((prev) => ({
        ...prev,
        totalCount: prev.totalCount + 1,
      }))
      return created
    },
    []
  )

  const updateBankAccount = useCallback(
    async (id: string, data: UpdateBankAccountData) => {
      const updated = await bankAccountService.update(id, data)
      setBankAccounts((prev) =>
        prev.map((item) => (item.id === id ? updated : item))
      )
      return updated
    },
    []
  )

  const deleteBankAccount = useCallback(async (id: string) => {
    await bankAccountService.delete(id)
    setBankAccounts((prev) => prev.filter((item) => item.id !== id))
    setPagination((prev) => ({
      ...prev,
      totalCount: prev.totalCount - 1,
    }))
  }, [])

  const refresh = useCallback(() => {
    fetchBankAccounts(pagination.page, pagination.pageSize, selectedWarehouseId)
  }, [fetchBankAccounts, pagination.page, pagination.pageSize, selectedWarehouseId])

  return {
    bankAccounts,
    isLoading,
    error,
    pagination,
    selectedWarehouseId,
    setPage,
    setPageSize,
    filterByWarehouse,
    createBankAccount,
    updateBankAccount,
    deleteBankAccount,
    refresh,
  }
}

export type { BankAccount, CreateBankAccountData, UpdateBankAccountData }
```

**Step 2: Delete old viewmodel**

Delete `src/viewmodels/usePaymentMethodsViewModel.ts`.

**Step 3: Commit**

```bash
git add src/viewmodels/useBankAccountsViewModel.ts
git rm src/viewmodels/usePaymentMethodsViewModel.ts
git commit -m "feat: add useBankAccountsViewModel, remove usePaymentMethodsViewModel"
```

---

### Task 4: Table Columns - Create bank-accounts-columns.tsx

**Files:**
- Create: `src/components/payment-methods/bank-accounts-columns.tsx`
- Delete: `src/components/payment-methods/columns.tsx`

**Step 1: Create `src/components/payment-methods/bank-accounts-columns.tsx`**

Follow the exact same pattern as the old `columns.tsx` but with the new BankAccount fields.

Columns: Titular (holder_name + rif), Banco, Numero de Cuenta, Pago Movil (checkmark or dash), Estado, Actions.

```typescript
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Pencil, Trash2, Check, Minus } from "lucide-react"
import { BankAccount } from "@/src/services/bank-account.service"

interface ColumnsProps {
  onEdit: (item: BankAccount) => void
  onDelete: (item: BankAccount) => void
}

export function getColumns({ onEdit, onDelete }: ColumnsProps): ColumnDef<BankAccount>[] {
  return [
    {
      accessorKey: "holderName",
      header: "Titular",
      cell: ({ row }) => {
        const account = row.original
        return (
          <div className="flex flex-col">
            <span className="font-medium">{account.holderName}</span>
            <span className="text-xs text-muted-foreground">{account.rif}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "bank",
      header: "Banco",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.bank}</span>
      ),
    },
    {
      accessorKey: "accountNumber",
      header: "N° de Cuenta",
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-sm">
          {row.original.accountNumber}
        </span>
      ),
    },
    {
      accessorKey: "pagoMovilPhone",
      header: "Pago Móvil",
      cell: ({ row }) => {
        const phone = row.original.pagoMovilPhone
        return phone ? (
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-green-500" />
            <span className="text-sm text-muted-foreground">{phone}</span>
          </div>
        ) : (
          <Minus className="h-4 w-4 text-muted-foreground" />
        )
      },
    },
    {
      accessorKey: "isActive",
      header: "Estado",
      cell: ({ row }) => {
        const isActive = row.original.isActive
        return (
          <Badge
            variant="outline"
            className="bg-transparent border-gray-300 text-gray-700 font-normal"
          >
            <span className={`h-2 w-2 rounded-full ${isActive ? "bg-green-500" : "bg-gray-400"}`} />
            {isActive ? "Activo" : "Inactivo"}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right"></div>,
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Abrir menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(item)}>
                  <Pencil className="h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(item)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]
}
```

**Step 2: Delete old columns file**

Delete `src/components/payment-methods/columns.tsx`.

**Step 3: Commit**

```bash
git add src/components/payment-methods/bank-accounts-columns.tsx
git rm src/components/payment-methods/columns.tsx
git commit -m "feat: add bank accounts table columns"
```

---

### Task 5: Main UI Component - Create bank-accounts-content.tsx

**Files:**
- Create: `src/components/payment-methods/bank-accounts-content.tsx`
- Delete: `src/components/payment-methods/payment-methods-content.tsx`

**Step 1: Create `src/components/payment-methods/bank-accounts-content.tsx`**

Follows the same structure as the old `payment-methods-content.tsx` but with:
- Warehouse selector dropdown (using `useWarehouseContext`)
- Simplified form fields: warehouse (create only), holder_name, rif, bank, account_number, pago_movil_phone, is_active
- Uses the BANKS array from the old component

The component should:
1. Import `useWarehouseContext` for the warehouse list
2. Use `useBankAccountsViewModel` for data
3. Show warehouse filter Select at the top
4. Show the DataTable with the new columns
5. Drawer with the new form fields

Key form fields in the drawer:
- Bodegon selector (only on create, locked on edit) - uses warehouses from context
- Titular de la cuenta (text input, required)
- RIF (text input, required)
- Banco (Select dropdown with BANKS array, required)
- Numero de cuenta (text input, required)
- Telefono pago movil (text input, optional)
- Activo toggle

Reuse:
- `DataTable` from `src/components/payment-methods/data-table.tsx` (unchanged)
- `PaymentMethodsSkeleton` from `src/components/payment-methods/payment-methods-skeleton.tsx` (update column headers)
- `EmptyState` from `components/empty-state`

Form validation: `holderName && rif && bank && accountNumber && (isEditing || warehouseId)`

**Step 2: Update skeleton component**

Modify `src/components/payment-methods/payment-methods-skeleton.tsx`:
- Update column headers to match new columns: Titular, Banco, N° de Cuenta, Pago Movil, Estado
- Add one extra column skeleton cell for the new layout

**Step 3: Delete old content component**

Delete `src/components/payment-methods/payment-methods-content.tsx`.

**Step 4: Update page.tsx**

Modify `app/admin/payment-methods/page.tsx`:
- Change import from `PaymentMethodsContent` to `BankAccountsContent`
- Update component usage

```typescript
import { Metadata } from "next"
import { BankAccountsContent } from "@/src/components/payment-methods/bank-accounts-content"

export const metadata: Metadata = {
  title: "Metodos de Pago",
}

export default function PaymentMethodsPage() {
  return <BankAccountsContent />
}
```

**Step 5: Commit**

```bash
git add src/components/payment-methods/bank-accounts-content.tsx
git add src/components/payment-methods/payment-methods-skeleton.tsx
git add app/admin/payment-methods/page.tsx
git rm src/components/payment-methods/payment-methods-content.tsx
git commit -m "feat: add bank accounts UI with warehouse filter and drawer"
```

---

### Task 6: Verify and Fix - Build check and manual testing

**Step 1: Check for stale imports**

Search the entire `src/` directory for any remaining references to:
- `payment-method.service`
- `usePaymentMethodsViewModel`
- `PaymentMethodsContent`
- `PaymentMethod` (the old type, not the order field)
- `getPaymentTypeLabel` (old helper)
- `getPaymentScopeLabel` (old helper)
- `getAccountDisplay` (old helper)

Fix any broken imports. The `orders.service.ts` has its own `PaymentMethodType` type — this should remain unchanged.

**Step 2: Run build**

```bash
npm run build
```

Expected: build succeeds with no errors.

**Step 3: Manual smoke test**

1. Navigate to `/admin/payment-methods`
2. Verify warehouse selector shows all warehouses
3. Select a warehouse — table should be empty
4. Click "Agregar" — drawer opens with warehouse pre-selected
5. Fill all fields, save — account appears in table
6. Edit the account — drawer opens with fields populated
7. Delete the account — confirmation dialog, account removed
8. Switch warehouse filter — shows different accounts

**Step 4: Run security advisors check**

Use Supabase MCP `get_advisors` with type `security` to check RLS on the new table.

**Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve stale imports and build issues"
```
