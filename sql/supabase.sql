-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.app_settings (
  id integer NOT NULL DEFAULT nextval('app_settings_id_seq'::regclass),
  key character varying NOT NULL UNIQUE,
  value jsonb NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT app_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.banks (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  code text NOT NULL,
  CONSTRAINT banks_pkey PRIMARY KEY (id)
);
CREATE TABLE public.bodegon_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean DEFAULT true,
  image text,
  created_date timestamp with time zone,
  modified_date timestamp with time zone,
  created_by uuid,
  CONSTRAINT bodegon_categories_pkey PRIMARY KEY (id),
  CONSTRAINT bodegon_categories_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.bodegon_inventories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  bodegon_id uuid NOT NULL,
  is_available_at_bodegon boolean DEFAULT true,
  modified_date timestamp with time zone,
  created_by uuid,
  CONSTRAINT bodegon_inventories_pkey PRIMARY KEY (id),
  CONSTRAINT bodegoninventories_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.bodegon_products(id),
  CONSTRAINT bodegoninventories_bodegon_id_fkey FOREIGN KEY (bodegon_id) REFERENCES public.bodegons(id),
  CONSTRAINT bodegon_inventories_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.bodegon_products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_gallery_urls ARRAY,
  bar_code text,
  sku text UNIQUE,
  category_id uuid,
  subcategory_id uuid,
  price numeric NOT NULL,
  is_active boolean DEFAULT true,
  is_discount boolean DEFAULT false,
  is_promo boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  modified_at timestamp with time zone,
  discounted_price numeric,
  created_by uuid,
  CONSTRAINT bodegon_products_pkey PRIMARY KEY (id),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.bodegon_categories(id),
  CONSTRAINT products_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.bodegon_subcategories(id),
  CONSTRAINT bodegon_products_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.bodegon_subcategories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_category uuid NOT NULL,
  is_active boolean DEFAULT true,
  created_date timestamp with time zone,
  modified_date timestamp with time zone,
  image text,
  created_by uuid,
  CONSTRAINT bodegon_subcategories_pkey PRIMARY KEY (id),
  CONSTRAINT bodegon_subcategories_parent_category_fkey FOREIGN KEY (parent_category) REFERENCES public.bodegon_categories(id),
  CONSTRAINT bodegon_subcategories_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.bodegons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  phone_number text,
  is_active boolean DEFAULT true,
  logo_url text,
  created_date timestamp with time zone,
  modified_date timestamp with time zone,
  created_by uuid,
  CONSTRAINT bodegons_pkey PRIMARY KEY (id),
  CONSTRAINT bodegons_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.coupons (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  code text,
  type text,
  discount_value numeric,
  min_order_amount numeric,
  max_uses numeric,
  used_count numeric DEFAULT '0'::numeric,
  is_active boolean,
  expires_at timestamp with time zone,
  created_by uuid,
  CONSTRAINT coupons_pkey PRIMARY KEY (id),
  CONSTRAINT coupons_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.customer_addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city text,
  state text,
  is_default boolean DEFAULT false,
  label text,
  created_at timestamp with time zone,
  modified_at timestamp with time zone,
  CONSTRAINT customer_addresses_pkey PRIMARY KEY (id),
  CONSTRAINT customeraddresses_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id)
);
CREATE TABLE public.order_item (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL CHECK (unit_price >= 0::numeric),
  bodegon_product_id uuid,
  restaurant_product_id text,
  name_snapshot character varying NOT NULL,
  order_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  total_price numeric,
  invoiced boolean DEFAULT false,
  CONSTRAINT order_item_pkey PRIMARY KEY (id),
  CONSTRAINT order_item_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
  CONSTRAINT order_item_bodegon_product_id_fkey FOREIGN KEY (bodegon_product_id) REFERENCES public.bodegon_products(id),
  CONSTRAINT order_item_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.order_payments (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  order_id uuid,
  bank_origin bigint,
  document_type text,
  document_number text,
  payment_reference text,
  receipt_url text,
  verified_by uuid,
  verified_at timestamp with time zone,
  payment_type bigint,
  payment_method uuid,
  payment_status bigint,
  CONSTRAINT order_payments_pkey PRIMARY KEY (id),
  CONSTRAINT order_payments_bank_origin_fkey FOREIGN KEY (bank_origin) REFERENCES public.banks(id),
  CONSTRAINT order_payments_payment_method_fkey FOREIGN KEY (payment_method) REFERENCES public.payment_methods(id),
  CONSTRAINT order_payments_payment_type_fkey FOREIGN KEY (payment_type) REFERENCES public.payment_type(id),
  CONSTRAINT order_payments_payment_status_fkey FOREIGN KEY (payment_status) REFERENCES public.payment_status(id),
  CONSTRAINT order_payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_payments_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id)
);
CREATE TABLE public.order_status (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NOT NULL,
  code character varying UNIQUE,
  name_en character varying,
  description text,
  color character varying,
  icon character varying,
  order_position integer,
  is_active boolean DEFAULT true,
  is_final boolean DEFAULT false,
  CONSTRAINT order_status_pkey PRIMARY KEY (id)
);
CREATE TABLE public.order_status_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  status_id integer NOT NULL,
  previous_status_id integer,
  message text,
  internal_notes text,
  user_visible boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone,
  source text,
  ip_address inet,
  user_agent text,
  estimated_duration interval,
  actual_duration interval,
  CONSTRAINT order_status_history_pkey PRIMARY KEY (id),
  CONSTRAINT order_status_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_status_history_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.order_status(id),
  CONSTRAINT order_status_history_previous_status_id_fkey FOREIGN KEY (previous_status_id) REFERENCES public.order_status(id),
  CONSTRAINT order_status_history_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  delivery_address_id uuid,
  total_amount numeric NOT NULL,
  bodegon_id uuid,
  restaurant_id uuid,
  delivery_person_id uuid,
  notes text,
  verification_code text,
  order_number text,
  delivery_mode text,
  subtotal numeric,
  shipping_cost numeric,
  discount_amount numeric,
  coupon_code text,
  customer_phone text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  status bigint,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id),
  CONSTRAINT orders_delivery_address_id_fkey FOREIGN KEY (delivery_address_id) REFERENCES public.customer_addresses(id),
  CONSTRAINT orders_status_fkey FOREIGN KEY (status) REFERENCES public.order_status(id),
  CONSTRAINT orders_bodegon_id_fkey FOREIGN KEY (bodegon_id) REFERENCES public.bodegons(id),
  CONSTRAINT orders_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id),
  CONSTRAINT orders_delivery_person_id_fkey FOREIGN KEY (delivery_person_id) REFERENCES public.users(id)
);
CREATE TABLE public.payment_methods (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  account_number text,
  document_type text,
  document_number text,
  phone_number text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  bank bigint,
  payment_type bigint,
  name text,
  CONSTRAINT payment_methods_pkey PRIMARY KEY (id),
  CONSTRAINT payment_methods_payment_type_fkey FOREIGN KEY (payment_type) REFERENCES public.payment_type(id),
  CONSTRAINT payment_methods_bank_fkey FOREIGN KEY (bank) REFERENCES public.banks(id)
);
CREATE TABLE public.payment_status (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NOT NULL,
  code character varying UNIQUE,
  name_en character varying,
  description text,
  color character varying,
  icon character varying,
  is_success boolean DEFAULT false,
  is_active boolean DEFAULT true,
  CONSTRAINT payment_status_pkey PRIMARY KEY (id)
);
CREATE TABLE public.payment_type (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NOT NULL,
  code character varying UNIQUE,
  name_en character varying,
  is_active boolean DEFAULT true,
  CONSTRAINT payment_type_pkey PRIMARY KEY (id)
);
CREATE TABLE public.restaurant_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  restaurant_id uuid NOT NULL,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone,
  modified_at timestamp with time zone,
  image text,
  CONSTRAINT restaurant_categories_pkey PRIMARY KEY (id),
  CONSTRAINT restaurantcategories_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id),
  CONSTRAINT restaurant_categories_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.restaurant_products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_gallery_urls ARRAY,
  price numeric NOT NULL,
  restaurant_id uuid NOT NULL,
  category_id uuid,
  subcategory_id uuid,
  is_available boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone,
  modified_at timestamp with time zone,
  is_promo boolean,
  is_discount boolean,
  discounted_price numeric,
  CONSTRAINT restaurant_products_pkey PRIMARY KEY (id),
  CONSTRAINT restaurantplates_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id),
  CONSTRAINT restaurantplates_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.restaurant_categories(id),
  CONSTRAINT restaurantplates_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.restaurant_subcategories(id),
  CONSTRAINT restaurant_products_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.restaurant_subcategories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_category uuid NOT NULL,
  restaurant_id uuid NOT NULL,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone,
  modified_at timestamp with time zone,
  image text,
  CONSTRAINT restaurant_subcategories_pkey PRIMARY KEY (id),
  CONSTRAINT restaurantsubcategories_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id),
  CONSTRAINT restaurant_subcategories_parent_category_fkey FOREIGN KEY (parent_category) REFERENCES public.restaurant_categories(id),
  CONSTRAINT restaurant_subcategories_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.restaurants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone_number text,
  logo_url text,
  delivery_available boolean,
  pickup_available boolean,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone,
  modified_at timestamp with time zone,
  address text,
  CONSTRAINT restaurants_pkey PRIMARY KEY (id),
  CONSTRAINT restaurants_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.roles (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text,
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.sliders (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL,
  type text,
  display text,
  image_url text,
  title text,
  CONSTRAINT sliders_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_bodegon_assignments (
  user_id uuid NOT NULL,
  bodegon_id uuid NOT NULL,
  role_at_location text NOT NULL,
  CONSTRAINT user_bodegon_assignments_pkey PRIMARY KEY (user_id, role_at_location, bodegon_id),
  CONSTRAINT userbodegonassignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT userbodegonassignments_bodegon_id_fkey FOREIGN KEY (bodegon_id) REFERENCES public.bodegons(id)
);
CREATE TABLE public.user_restaurant_assignments (
  user_id uuid NOT NULL,
  restaurant_id uuid NOT NULL,
  role_at_location text NOT NULL,
  CONSTRAINT user_restaurant_assignments_pkey PRIMARY KEY (role_at_location, user_id, restaurant_id),
  CONSTRAINT userrestaurantassignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT userrestaurantassignments_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text,
  phone_number text,
  is_active boolean DEFAULT true,
  role bigint,
  document_number text,
  document_type text,
  assigned_restaurants ARRAY,
  created_at timestamp with time zone,
  email text,
  preferred_bodegon uuid,
  phone_dial text,
  user_auth uuid,
  order_notification boolean,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_user_auth_fkey FOREIGN KEY (user_auth) REFERENCES auth.users(id),
  CONSTRAINT users_role_fkey FOREIGN KEY (role) REFERENCES public.roles(id),
  CONSTRAINT users_preferred_bodegon_fkey FOREIGN KEY (preferred_bodegon) REFERENCES public.bodegons(id)
);