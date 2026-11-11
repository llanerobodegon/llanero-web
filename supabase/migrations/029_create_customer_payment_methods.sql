-- Métodos de pago guardados por el cliente (desde dónde paga), para no reescribir sus datos al
-- pagar. No confundir con `bank_accounts`, que son las cuentas de las tiendas.
--
-- Por ahora la app guarda Pago Móvil (banco, teléfono y cédula); `type` deja lugar para otros.
-- Cada cliente solo ve y maneja los suyos, y tiene a lo sumo un predeterminado (trigger).
-- Cambio aditivo: no toca otras tablas ni reglas.

create table if not exists public.customer_payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type varchar(20) not null default 'pago_movil'
    check (type in ('pago_movil', 'transferencia', 'zelle', 'banesco_panama')),
  alias varchar(50) not null,
  bank varchar(100),
  phone_code varchar(4)
    check (phone_code is null or phone_code in ('0412', '0414', '0416', '0422', '0424', '0426')),
  phone_number varchar(7),
  document_type varchar(1) check (document_type is null or document_type in ('V', 'E')),
  document_number varchar(15),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.customer_payment_methods is
  'Métodos de pago guardados por cada cliente (app móvil). Las cuentas de las tiendas están en bank_accounts.';

create index if not exists idx_customer_payment_methods_user
  on public.customer_payment_methods (user_id, is_default desc, created_at desc);

-- updated_at automático (función existente de la migración 001).
create trigger update_customer_payment_methods_updated_at
  before update on public.customer_payment_methods
  for each row execute function public.update_updated_at_column();

-- Un solo método predeterminado por cliente: al marcar uno, se desmarcan los demás.
create or replace function public.ensure_single_default_customer_payment_method()
returns trigger
language plpgsql
as $$
begin
  if new.is_default then
    update public.customer_payment_methods
      set is_default = false
      where user_id = new.user_id and id <> new.id and is_default;
  end if;
  return new;
end;
$$;

create trigger ensure_single_default_customer_payment_method_trigger
  before insert or update on public.customer_payment_methods
  for each row execute function public.ensure_single_default_customer_payment_method();

alter table public.customer_payment_methods enable row level security;

create policy "Users can view own payment methods" on public.customer_payment_methods
  for select to authenticated using (auth.uid() = user_id);

create policy "Users can add own payment methods" on public.customer_payment_methods
  for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can update own payment methods" on public.customer_payment_methods
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete own payment methods" on public.customer_payment_methods
  for delete to authenticated using (auth.uid() = user_id);
