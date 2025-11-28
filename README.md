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
│   │   └── warehouses/     # Warehouses module
│   └── auth/               # Authentication
├── components/             # Shared UI components
├── lib/                    # Utilities and configurations
│   └── supabase/           # Supabase client setup
├── src/
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
```

**Roles:** `customer` | `admin` | `manager` | `delivery`

## Modules

### Warehouses (Bodegones)

Full CRUD implementation for managing warehouses:

- **List:** DataTable with sorting, filtering, and pagination
- **Create/Edit:** Side drawer with form validation
- **Delete:** Confirmation dialog
- **Features:**
  - Logo upload with drag & drop (Supabase Storage)
  - Active/Inactive status toggle
  - Product count per warehouse
  - Skeleton loading states
  - Toast notifications (Sonner)

## Supabase Storage

Create the following storage bucket for warehouse logos:

```sql
-- Create warehouse-logos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('warehouse-logos', 'warehouse-logos', true);

-- Allow public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'warehouse-logos');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated upload access"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'warehouse-logos' AND auth.role() = 'authenticated');

-- Allow users to delete their uploads
CREATE POLICY "Authenticated delete access"
ON storage.objects FOR DELETE
USING (bucket_id = 'warehouse-logos' AND auth.role() = 'authenticated');
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
