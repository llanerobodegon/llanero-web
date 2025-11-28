# Llanero Admin

Admin panel for managing warehouses, products, and deliveries.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Architecture:** MVVM

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── admin/              # Protected admin routes
│   │   ├── orders/         # Orders module
│   │   ├── warehouses/     # Warehouses module
│   │   ├── categories/     # Categories module
│   │   ├── subcategories/  # Subcategories module
│   │   ├── inventory/      # Products/Inventory module
│   │   │   ├── new/        # Add product page
│   │   │   └── [id]/edit/  # Edit product page
│   │   ├── payment-methods/ # Payment methods module
│   │   ├── team/           # Team members module
│   │   ├── delivery/       # Delivery members module
│   │   └── customers/      # Customers module (read-only)
│   ├── api/
│   │   ├── team/           # Team API route (server-side user creation)
│   │   └── delivery/       # Delivery API route (server-side user creation)
│   └── auth/               # Authentication
├── components/             # Shared UI components
├── lib/                    # Utilities and configurations
│   └── supabase/           # Supabase client setup
├── src/
│   ├── contexts/           # React contexts (breadcrumb, warehouse)
│   ├── models/             # TypeScript interfaces
│   ├── services/           # API/business logic
│   ├── viewmodels/         # State management hooks
│   ├── views/              # Page-specific components
│   └── components/         # Feature components
└── supabase/
    └── migrations/         # Database migrations
```

## Database Schema

```
┌───────────┐     ┌───────────┐     ┌─────────────┐
│   roles   │     │   users   │     │  addresses  │
├───────────┤     ├───────────┤     ├─────────────┤
│ id (PK)   │◄────│ role_id   │     │ id (PK)     │
│ name      │     │ id (PK)   │◄────│ user_id     │
│ description│    │ first_name│     │ label       │
└───────────┘     │ last_name │     │ address_1   │
                  │ email     │     │ address_2   │
                  │ phone_code│     │ city        │
                  │ phone     │     │ is_default  │
                  │ id_type   │     └─────────────┘
                  │ id_number │
                  │ is_active │
                  │ delivery_status│  -- available | on_delivery | unavailable (for delivery role)
                  └───────────┘

┌─────────────┐    ┌───────────────┐    ┌─────────────┐
│ categories  │    │ subcategories │    │  products   │
├─────────────┤    ├───────────────┤    ├─────────────┤
│ id (PK)     │◄───│ category_id   │    │ id (PK)     │
│ name        │    │ id (PK)       │◄───│ subcateg_id │
│ image_url   │    │ name          │    │ category_id │
│ is_active   │    │ image_url     │    │ name        │
│ created_by  │    │ is_active     │    │ description │
└─────────────┘    │ created_by    │    │ image_urls  │
                   └───────────────┘    │ barcode     │
                                        │ sku         │
                                        │ price       │
                                        │ is_active   │
                                        │ created_by  │
                                        └──────┬──────┘
                                               │
┌─────────────┐    ┌─────────────────────┐     │
│ warehouses  │    │ warehouse_products  │     │
├─────────────┤    ├─────────────────────┤     │
│ id (PK)     │◄───│ warehouse_id (PK)   │     │
│ name        │    │ product_id (PK)     │◄────┘
│ address     │    │ stock               │
│ phone       │    │ price               │
│ logo_url    │    │ is_available        │
│ is_active   │    │ is_on_discount      │
│ created_by  │    │ is_promo            │
└──────┬──────┘    │ discount_price      │
       │           └─────────────────────┘
       │
       ▼
┌─────────────────┐
│ warehouse_users │
├─────────────────┤
│ warehouse_id    │
│ user_id         │
└─────────────────┘

┌───────────────────┐
│ payment_methods   │
├───────────────────┤
│ id (PK)           │
│ scope             │  -- nacional | internacional
│ type              │  -- pago_movil | transferencia | zelle | banesco_panama
│ bank              │
│ document_type     │  -- V | J | E
│ document_number   │
│ phone_code        │
│ phone_number      │
│ account_number    │
│ email             │
│ holder_name       │
│ is_active         │
│ created_by        │
└───────────────────┘

┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   orders    │      │ order_items │      │  addresses  │
├─────────────┤      ├─────────────┤      └─────────────┘
│ id (PK)     │◄─────│ order_id    │
│ order_number│      │ id (PK)     │
│ user_id     │──────│ product_id  │
│ warehouse_id│      │ product_name│  (snapshot)
│ address_id  │      │ quantity    │
│ delivery_   │      │ unit_price_usd│
│ person_id   │      │ unit_price_bs│
│ delivery_type│     │ total_usd   │
│ delivery_code│     │ total_bs    │
│ status      │      └─────────────┘
│ payment_status│
│ payment_method_type│
│ payment_bank │
│ payment_reference│
│ payment_proof_url│
│ subtotal_usd │
│ subtotal_bs  │
│ delivery_fee_usd│
│ delivery_fee_bs│
│ total_usd    │
│ total_bs     │
│ exchange_rate│
│ customer_notes│
│ admin_notes  │
│ confirmed_at │
│ delivered_at │
│ cancelled_at │
│ cancellation_reason│
└─────────────┘
```

**Roles:** `customer` | `admin` | `manager` | `delivery`

**Order Status:** `pending` → `confirmed` → `on_delivery` → `completed` | `cancelled`

**Payment Status:** `pending` → `verified` | `rejected`

## Modules

All modules share a consistent UI pattern:
- **Title Section:** Module name with total count and description
- **Action Section:** Search input, filters (where applicable), and add button
- **Data Table:** Server-side pagination with configurable page size
- **Skeleton Loading:** Consistent layout during data fetching

### Warehouse Selector (Global Filter)

The sidebar includes a warehouse selector that filters data across all modules:

- **Location:** Top of sidebar (Team Switcher)
- **Options:**
  - "Todos los bodegones" (default) - Shows all data unfiltered
  - Individual warehouse selection - Filters all data by selected warehouse
- **Filtered Modules:**
  - Dashboard (sales, customers, products, charts)
  - Orders (by warehouse_id)
  - Team (by warehouse_users assignment)
  - Delivery (by warehouse_users assignment)
  - Customers (by orders placed in warehouse)
  - Inventory (by warehouse_products)
- **Features:**
  - Warehouses loaded from Supabase
  - Alphabetically sorted
  - Only shows active warehouses
  - Persists selection during session
  - Automatic page reset when changing warehouse

### Dashboard

Main dashboard with business metrics overview:

- **Greeting:** Personalized welcome message with user's first name
- **Stats Cards:** Four metric cards with trend indicators
  - Ventas Totales (total sales in USD)
  - Nuevos Clientes (new customers this month)
  - Productos Facturados (products sold)
  - Crecimiento (growth percentage vs last month)
- **Sales Chart:** Bar chart with tabs to toggle between:
  - Ventas (sales amount by day)
  - Pedidos (order count by day)
  - Shows last 7 days with weekly totals
- **Top Products:** Table showing top 5 best-selling products this month
  - Product image and name
  - Quantity sold
  - Total sales amount
- **Features:**
  - All metrics compare current month vs previous month
  - Positive/negative trend indicators with color coding
  - Skeleton loading states for all components
  - Responsive grid layout
  - Filtered by selected warehouse

### Warehouses (Bodegones)

Full CRUD implementation for managing warehouses:

- **List:** DataTable with search, sorting, and server-side pagination
- **Create/Edit:** Side drawer with form validation
- **Delete:** Confirmation dialog
- **Features:**
  - Logo upload with drag & drop (Supabase Storage)
  - Active/Inactive status toggle
  - Product count per warehouse
  - Search by name
  - Skeleton loading states
  - Toast notifications (Sonner)

### Categories (Categorías)

Full CRUD implementation for product categories:

- **List:** DataTable with search, sorting, and server-side pagination
- **Create/Edit:** Side drawer with form validation
- **Delete:** Confirmation dialog
- **Features:**
  - Image upload with drag & drop
  - Active/Inactive status toggle
  - Product count per category
  - Search by name
  - Image placeholder in table

### Subcategories (Subcategorías)

Full CRUD implementation for product subcategories:

- **List:** DataTable with search, category filter, and server-side pagination
- **Create/Edit:** Side drawer with category selector
- **Delete:** Confirmation dialog
- **Features:**
  - Image upload with drag & drop
  - Parent category assignment
  - Active/Inactive status toggle
  - Product count per subcategory
  - Search by name
  - Multi-select category filter with checkboxes
  - Image placeholder in table

### Products (Productos/Inventario)

Full CRUD implementation for product management:

- **List:** DataTable with search, multi-select filters, and server-side pagination
- **Create:** Full-page form with two-column layout
- **Edit:** Full-page form with product data pre-loaded
- **Delete:** Confirmation dialog with image cleanup
- **Features:**
  - Multi-image upload (max 4) with drag & drop
  - Category and subcategory assignment
  - Price with optional discount/promo toggles
  - SKU and barcode support (optional)
  - Warehouse availability selection with individual stock per warehouse
  - Global stock input to apply to all selected warehouses
  - Multi-select category and subcategory filters with checkboxes
  - Dynamic breadcrumb showing product name
  - Automatic image deletion from storage on product delete
  - Edit page with delete button

### Payment Methods (Métodos de Pago)

Full CRUD implementation for payment methods:

- **List:** DataTable with search and server-side pagination
- **Create/Edit:** Side drawer with dynamic form based on payment type
- **Delete:** Confirmation dialog
- **Features:**
  - Support for Nacional (Pago Móvil, Transferencia) and Internacional (Zelle, Banesco Panamá)
  - Dynamic form fields based on payment type selection
  - Venezuelan banks dropdown with all major banks
  - Phone codes for Venezuela (0412, 0414, 0416, 0422, 0424, 0426)
  - Document type selector (V, J, E) with document number
  - Active/Inactive status toggle
  - Holder name display in table (optional field)
  - Search by bank, email, account number, or phone

### Team (Equipo)

Full CRUD implementation for team member management:

- **List:** DataTable with search and server-side pagination
- **Create/Edit:** Side drawer with role and warehouse assignment
- **Delete:** Confirmation dialog with loading state
- **Features:**
  - Role assignment (Administrador, Gerente)
  - Multi-select warehouse assignment with checkboxes
  - Avatar with initials in table
  - Phone codes for Venezuela (0412, 0414, 0416, 0422, 0424, 0426)
  - Active/Inactive status toggle
  - Email invitation for new users (set password flow)
  - Server-side user creation/deletion via API route (secure service role key)
  - Current user cannot edit/delete themselves
  - Search by name or email

### Delivery (Repartidores)

Full CRUD implementation for delivery member management:

- **List:** DataTable with search and server-side pagination
- **Create/Edit:** Side drawer with warehouse assignment and delivery status
- **Delete:** Confirmation dialog with loading state
- **Features:**
  - Delivery status management (Disponible, En Delivery, No Disponible)
  - Multi-select warehouse assignment with checkboxes
  - Avatar with initials in table
  - Phone codes for Venezuela (0412, 0414, 0416, 0422, 0424, 0426)
  - Color-coded status badges (green: available, blue: on delivery, gray: unavailable)
  - Email invitation for new users (set password flow)
  - Server-side user creation/deletion via API route (secure service role key)
  - Current user cannot edit/delete themselves
  - Search by name or email
  - Separate module from Team (filtered by delivery role only)

### Customers (Clientes)

Read-only module for viewing registered customers:

- **List:** DataTable with search and server-side pagination
- **Features:**
  - Avatar with initials (first letter of first and last name)
  - Display: name, email, registration date
  - Search by name or email
  - No create/edit/delete functionality (customers self-register)
  - Filtered by customer role only

### Orders (Pedidos)

Full order management implementation:

- **List:** DataTable with search, status filter, and server-side pagination
- **View/Edit:** Side drawer with full order details and admin controls
- **Features:**
  - Auto-generated order number (ORD-00001, ORD-00002, etc.)
  - 4-digit delivery verification code (customer provides to delivery person)
  - Dual currency support (USD and Bolívares with exchange rate)
  - Order status flow: pending → confirmed → on_delivery → completed | cancelled
  - Payment status: pending → verified | rejected
  - Delivery types: pickup (retiro) or delivery
  - Payment methods: Pago Móvil, Transferencia, Zelle, Banesco Panamá
  - Payment proof image upload
  - Customer and delivery address information
  - Order items with product snapshots (name, price at time of purchase)
  - Subtotal, delivery fee, and total calculation
  - Delivery person assignment
  - Admin notes (internal)
  - Customer notes
  - Timestamps: created, confirmed, delivered, cancelled
  - Search by order number, customer name, or email
  - Status filter dropdown
  - Filtered by selected warehouse

### Store Settings (Configuración de Tienda)

Global store configuration:

- **Store Status:** Toggle to open/close the store (prevents new orders when closed)
- **Invoice Message:** Optional message displayed on customer invoices
  - Enable/disable toggle
  - Custom message text area
- **Features:**
  - Settings stored as key-value pairs in store_settings table
  - Global configuration (applies to all warehouses)
  - Real-time updates with toast notifications

### Account Settings (Configuración de Cuenta)

User profile management with tabbed interface:

- **Información Personal Tab:**
  - First name and last name
  - Email (read-only)
  - Phone with Venezuelan code selector
- **Seguridad Tab:**
  - Password change functionality
  - Password confirmation validation
- **Features:**
  - Accessible from user dropdown menu
  - Form validation
  - Save changes only when modified
  - Toast notifications for success/error

## Supabase Storage

Create the following storage buckets:

### warehouse-logos

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('warehouse-logos', 'warehouse-logos', true);

CREATE POLICY "Public read access" ON storage.objects FOR SELECT
USING (bucket_id = 'warehouse-logos');

CREATE POLICY "Authenticated upload access" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'warehouse-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete access" ON storage.objects FOR DELETE
USING (bucket_id = 'warehouse-logos' AND auth.role() = 'authenticated');
```

### product-images

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

CREATE POLICY "Public read access" ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated upload access" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete access" ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
```

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
```

## License

Private - All rights reserved.
