-- Función get_order_delivery_person: el repartidor asignado a un pedido del cliente.
--
-- Por qué: las reglas de `users` solo dejan a cada usuario leer su propia fila, así que el
-- cliente no puede ver quién lleva su pedido. Esta función devuelve solo nombre y teléfono del
-- repartidor, y únicamente para pedidos del propio cliente (nunca expone el resto de `users`).
-- Cambio aditivo: no modifica reglas ni tablas.

create or replace function public.get_order_delivery_person(p_order_id uuid)
returns table (
  id uuid,
  first_name text,
  last_name text,
  phone_code text,
  phone text
)
language sql
stable
security definer
set search_path = public
as $$
  select u.id, u.first_name::text, u.last_name::text, u.phone_code::text, u.phone::text
  from orders o
  join users u on u.id = o.delivery_person_id
  where o.id = p_order_id
    and o.user_id = auth.uid();
$$;

revoke all on function public.get_order_delivery_person(uuid) from public, anon;
grant execute on function public.get_order_delivery_person(uuid) to authenticated;
