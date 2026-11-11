-- Funciones del catálogo para la app: más vendidos y búsqueda sin acentos.
-- Cambio aditivo: activa la extensión `unaccent` y agrega dos funciones; no toca tablas ni
-- reglas existentes.

create extension if not exists unaccent with schema extensions;

-- Más vendidos de una tienda: cuenta las unidades vendidas en pedidos no cancelados de TODAS
-- las tiendas (con pocos pedidos por tienda el ranking sería muy pobre) y devuelve solo los
-- productos activos y disponibles en la tienda pedida.
-- SECURITY DEFINER porque las reglas de `orders`/`order_items` solo dejan ver los pedidos
-- propios; la función devuelve únicamente ids y totales, nunca datos de pedidos.
create or replace function public.get_popular_product_ids(
  p_warehouse_id uuid,
  p_limit int default 12
)
returns table (product_id uuid, units_sold bigint)
language sql
stable
security definer
set search_path = public
as $$
  select oi.product_id, sum(oi.quantity)::bigint as units_sold
  from order_items oi
  join orders o on o.id = oi.order_id and o.status <> 'cancelled'
  join products p on p.id = oi.product_id and p.is_active
  join warehouse_products wp
    on wp.product_id = p.id and wp.warehouse_id = p_warehouse_id and wp.is_available
  group by oi.product_id
  order by units_sold desc, max(o.created_at) desc
  limit greatest(1, least(coalesce(p_limit, 12), 50));
$$;

revoke all on function public.get_popular_product_ids(uuid, int) from public, anon;
grant execute on function public.get_popular_product_ids(uuid, int) to authenticated;

-- Búsqueda de productos de una tienda sin distinguir mayúsculas ni acentos ("cafe" encuentra
-- "Café"), opcionalmente filtrada por subcategoría. SECURITY INVOKER: respeta las reglas de
-- `products` y `warehouse_products` del usuario que busca.
create or replace function public.search_products(
  p_warehouse_id uuid,
  p_query text default null,
  p_subcategory_id uuid default null,
  p_limit int default 100
)
returns setof public.products
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select p.*
  from products p
  join warehouse_products wp
    on wp.product_id = p.id and wp.warehouse_id = p_warehouse_id and wp.is_available
  where p.is_active
    and (p_subcategory_id is null or p.subcategory_id = p_subcategory_id)
    and (
      coalesce(trim(p_query), '') = ''
      or extensions.unaccent(lower(p.name)) like
        '%' || extensions.unaccent(lower(trim(p_query))) || '%'
    )
  order by p.name
  limit greatest(1, least(coalesce(p_limit, 100), 200));
$$;

revoke all on function public.search_products(uuid, text, uuid, int) from public, anon;
grant execute on function public.search_products(uuid, text, uuid, int) to authenticated;
