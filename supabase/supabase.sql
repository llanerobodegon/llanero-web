-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label character varying NOT NULL,
  address_line_1 character varying NOT NULL,
  address_line_2 character varying,
  city character varying NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT addresses_pkey PRIMARY KEY (id),
  CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  image_url text,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  order numeric,
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL,
  product_id uuid NOT NULL,
  product_name character varying NOT NULL,
  product_image_url text,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price_usd numeric NOT NULL,
  unit_price_bs numeric NOT NULL,
  total_usd numeric NOT NULL,
  total_bs numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_number character varying NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  warehouse_id uuid NOT NULL,
  address_id uuid,
  delivery_person_id uuid,
  delivery_type character varying NOT NULL CHECK (delivery_type::text = ANY (ARRAY['pickup'::character varying, 'delivery'::character varying]::text[])),
  delivery_code character varying NOT NULL,
  status character varying NOT NULL DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'confirmed'::character varying, 'on_delivery'::character varying, 'completed'::character varying, 'cancelled'::character varying]::text[])),
  payment_status character varying NOT NULL DEFAULT 'pending'::character varying CHECK (payment_status::text = ANY (ARRAY['pending'::character varying, 'verified'::character varying, 'rejected'::character varying]::text[])),
  payment_method_type character varying NOT NULL CHECK (payment_method_type::text = ANY (ARRAY['pago_movil'::character varying, 'transferencia'::character varying, 'zelle'::character varying, 'banesco_panama'::character varying]::text[])),
  payment_bank character varying,
  payment_reference character varying,
  payment_proof_url text,
  subtotal_usd numeric NOT NULL,
  subtotal_bs numeric NOT NULL,
  delivery_fee_usd numeric DEFAULT 0,
  delivery_fee_bs numeric DEFAULT 0,
  total_usd numeric NOT NULL,
  total_bs numeric NOT NULL,
  exchange_rate numeric NOT NULL,
  customer_notes text,
  admin_notes text,
  confirmed_at timestamp with time zone,
  delivered_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  cancellation_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT orders_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id),
  CONSTRAINT orders_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.addresses(id),
  CONSTRAINT orders_delivery_person_id_fkey FOREIGN KEY (delivery_person_id) REFERENCES public.users(id)
);
CREATE TABLE public.payment_methods (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  scope character varying NOT NULL CHECK (scope::text = ANY (ARRAY['nacional'::character varying, 'internacional'::character varying]::text[])),
  type character varying NOT NULL CHECK (type::text = ANY (ARRAY['pago_movil'::character varying, 'transferencia'::character varying, 'zelle'::character varying, 'banesco_panama'::character varying]::text[])),
  bank character varying,
  document_type character varying CHECK (document_type::text = ANY (ARRAY['V'::character varying, 'J'::character varying, 'E'::character varying]::text[])),
  document_number character varying,
  phone_code character varying,
  phone_number character varying,
  account_number character varying,
  email character varying,
  holder_name character varying,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  CONSTRAINT payment_methods_pkey PRIMARY KEY (id),
  CONSTRAINT payment_methods_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id uuid,
  subcategory_id uuid,
  name character varying NOT NULL,
  description text,
  image_urls ARRAY,
  barcode character varying UNIQUE,
  sku character varying UNIQUE,
  price numeric NOT NULL CHECK (price >= 0::numeric),
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id),
  CONSTRAINT products_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.subcategories(id),
  CONSTRAINT products_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.roles (
  id integer NOT NULL DEFAULT nextval('roles_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  description character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.slider_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  position integer NOT NULL UNIQUE CHECK ("position" = ANY (ARRAY[1, 2])),
  title character varying NOT NULL,
  is_enabled boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT slider_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.sliders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  position integer NOT NULL CHECK ("position" = ANY (ARRAY[1, 2])),
  slot integer NOT NULL CHECK (slot >= 1 AND slot <= 3),
  image_url text NOT NULL,
  link_url text,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sliders_pkey PRIMARY KEY (id),
  CONSTRAINT sliders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.store_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT store_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.subcategories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL,
  name character varying NOT NULL,
  image_url text,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subcategories_pkey PRIMARY KEY (id),
  CONSTRAINT subcategories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id),
  CONSTRAINT subcategories_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  role_id integer NOT NULL DEFAULT 1,
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  phone_code character varying CHECK (phone_code IS NULL OR (phone_code::text = ANY (ARRAY['0412'::character varying, '0414'::character varying, '0416'::character varying, '0422'::character varying, '0424'::character varying, '0426'::character varying]::text[]))),
  phone character varying,
  id_type character varying CHECK (id_type IS NULL OR (id_type::text = ANY (ARRAY['V'::character varying, 'E'::character varying]::text[]))),
  id_number character varying,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  delivery_status USER-DEFINED DEFAULT 'available'::delivery_status_enum,
  preferred_warehouse_id uuid,
  push_token text,
  push_token_updated_at timestamp with time zone,
  app_notification boolean DEFAULT true,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id),
  CONSTRAINT users_preferred_warehouse_id_fkey FOREIGN KEY (preferred_warehouse_id) REFERENCES public.warehouses(id)
);
CREATE TABLE public.warehouse_products (
  warehouse_id uuid NOT NULL,
  product_id uuid NOT NULL,
  stock integer DEFAULT 0 CHECK (stock >= 0),
  price numeric CHECK (price IS NULL OR price >= 0::numeric),
  is_available boolean DEFAULT true,
  is_on_discount boolean DEFAULT false,
  is_promo boolean DEFAULT false,
  discount_price numeric CHECK (discount_price IS NULL OR discount_price >= 0::numeric),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT warehouse_products_pkey PRIMARY KEY (warehouse_id, product_id),
  CONSTRAINT warehouse_products_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id),
  CONSTRAINT warehouse_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.warehouse_users (
  warehouse_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT warehouse_users_pkey PRIMARY KEY (warehouse_id, user_id),
  CONSTRAINT warehouse_users_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id),
  CONSTRAINT warehouse_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.warehouses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  address text,
  phone character varying,
  logo_url text,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  delivery_fee numeric DEFAULT 0,
  CONSTRAINT warehouses_pkey PRIMARY KEY (id),
  CONSTRAINT warehouses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);