-- Favoritos del cliente: productos guardados con el ♡ en la app.
--
-- Cada cliente solo puede ver, agregar y quitar los suyos. Si se borra el usuario o el
-- producto, sus favoritos se borran con él. Cambio aditivo: no toca otras tablas ni reglas.

create table if not exists public.favorites (
  user_id uuid not null references public.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

comment on table public.favorites is 'Productos favoritos de cada cliente (app móvil)';

-- Para listar los favoritos de un usuario del más reciente al más antiguo.
create index if not exists idx_favorites_user_created on public.favorites (user_id, created_at desc);

alter table public.favorites enable row level security;

create policy "Users can view own favorites" on public.favorites
  for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can add own favorites" on public.favorites
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can remove own favorites" on public.favorites
  for delete to authenticated
  using (auth.uid() = user_id);
