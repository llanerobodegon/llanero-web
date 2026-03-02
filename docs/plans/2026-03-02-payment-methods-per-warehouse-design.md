# Metodos de Pago por Bodegon - Design Document

## Context

The current `payment_methods` table is global (no warehouse relationship). It supports multiple scopes (nacional/internacional) and types (pago_movil, transferencia, zelle, banesco_panama) with different fields per type.

The business needs each warehouse (bodegon) to manage its own bank accounts independently. Only national payment methods are needed (bank transfers + optional pago movil).

## Decision

Replace the current `payment_methods` table with a simplified `bank_accounts` table tied to warehouses.

## Database Schema

### New table: `bank_accounts`

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | Unique identifier |
| warehouse_id | uuid | FK -> warehouses.id, NOT NULL | Warehouse this account belongs to |
| holder_name | varchar | NOT NULL | Account holder name (e.g. "BARILICORES EL LLANERO, C.A") |
| rif | varchar | NOT NULL | Tax ID (e.g. "J-50107296-5") |
| bank | varchar | NOT NULL | Bank name (BANESCO, PLAZA, etc.) |
| account_number | varchar | NOT NULL | 20-digit account number |
| pago_movil_phone | varchar | NULLABLE | Phone for pago movil (e.g. "0414-525.11.99"), null if not applicable |
| is_active | boolean | DEFAULT true | Active/inactive toggle |
| created_by | uuid | FK -> users.id, NULLABLE | User who created it |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

### Migration steps

1. Create `bank_accounts` table with RLS enabled
2. Add RLS policies (admin full access, managers access their warehouses, authenticated read for their warehouse)
3. Drop old `payment_methods` table (only 1 test record exists)

### RLS Policies

- SELECT: authenticated users can read bank_accounts for active warehouses
- INSERT/UPDATE/DELETE: admin (role_id=3) full access, manager (role_id=2) only their assigned warehouses via warehouse_users

## Admin UI

### Location

Existing `/admin/payment-methods/` page, redesigned.

### Layout

- Warehouse selector dropdown at the top (filters table by warehouse)
- Search input for filtering within selected warehouse
- "Agregar" button to create new bank account
- DataTable showing: Titular, Banco, Numero de Cuenta, Pago Movil (checkmark or dash), Estado, Actions

### Drawer (create/edit)

Fields:
- Warehouse selector (only on create, locked on edit)
- Titular de la cuenta (text input)
- RIF (text input)
- Banco (dropdown with Venezuelan banks list)
- Numero de cuenta (text input)
- Telefono pago movil (optional text input)
- Activo toggle

## Service Layer

### New: `BankAccountService`

Replaces `PaymentMethodService`. Methods:
- `getPaginated(params, warehouseId?)` - fetch with pagination filtered by warehouse
- `getByWarehouseId(warehouseId)` - get all accounts for a warehouse
- `getById(id)` - get single account
- `create(data)` - create bank account
- `update(id, data)` - update bank account
- `delete(id)` - delete bank account

### Types

```typescript
interface BankAccount {
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
```

## ViewModel

### New: `useBankAccountsViewModel`

Replaces `usePaymentMethodsViewModel`. Same pattern with:
- Pagination state
- CRUD operations
- Warehouse filter state
- Loading/error states

## Impact on Orders

- The `orders` table already stores payment info denormalized (`payment_method_type`, `payment_bank`). This remains unchanged for historical orders.
- Checkout flow (mobile app) will query `bank_accounts` filtered by `warehouse_id` to show available payment options.

## Files to Create/Modify

### New files
- `src/services/bank-account.service.ts`
- `src/viewmodels/useBankAccountsViewModel.ts`
- `src/components/payment-methods/bank-accounts-content.tsx`
- `src/components/payment-methods/bank-accounts-columns.tsx`

### Modified files
- `app/admin/payment-methods/page.tsx` - use new component
- `src/models/` - add bank account types if using models dir

### Deleted files
- `src/services/payment-method.service.ts`
- `src/viewmodels/usePaymentMethodsViewModel.ts`
- `src/components/payment-methods/payment-methods-content.tsx`
- `src/components/payment-methods/columns.tsx`

### Database
- Migration: create `bank_accounts`, drop `payment_methods`
