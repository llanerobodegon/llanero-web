-- Modo repartidor: funciones del servidor.
--
-- Por qué: el repartidor no debe leer `orders` directo (vería el código de entrega, montos y
-- datos de pago), y las reglas de `users`/`addresses` no le dejan ver al cliente. Todo el modo
-- repartidor de la app pasa por estas funciones, que devuelven solo lo necesario y verifican
-- que quien llama es un repartidor activo y que el pedido está asignado a él.
--
-- Incluye:
-- - Lectura: lista de entregas, detalle y resumen del historial.
-- - Acciones: marcar retirado, confirmar la entrega con el código (máximo 5 intentos fallidos)
--   y cambiar la disponibilidad.
-- - Trigger que mantiene `users.delivery_status` al día cuando un pedido entra o sale de
--   "en camino" o cambia de repartidor, también si el cambio lo hace el admin desde la web.
-- - El aviso "Nuevo pedido asignado" (que ya se enviaba al asignar o reasignar un pedido
--   confirmado) ahora también se envía cuando un pedido que ya tenía repartidor pasa a
--   confirmado; antes ese caso no avisaba a nadie.
--
-- Cambio aditivo: no modifica reglas de acceso (eso va en la migración siguiente).

begin;

-- Intentos fallidos del código de entrega.
alter table public.orders
  add column if not exists delivery_code_attempts int not null default 0;

comment on column public.orders.delivery_code_attempts is
  'Intentos fallidos del código de entrega desde la app del repartidor (máximo 5)';

-- ---------------------------------------------------------------------------------------------
-- Guardia común: id de quien llama si es un repartidor activo; si no, error `not_delivery`.
-- ---------------------------------------------------------------------------------------------
create or replace function public.assert_active_delivery()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null or not exists (
    select 1
    from users u
    join roles r on r.id = u.role_id
    where u.id = v_user_id
      and r.name = 'delivery'
      and coalesce(u.is_active, false)
  ) then
    raise exception 'not_delivery';
  end if;
  return v_user_id;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Lista de entregas del repartidor: 'active' (por hacer) o 'history' (entregadas).
-- ---------------------------------------------------------------------------------------------
create or replace function public.get_delivery_orders(
  p_scope text,
  p_limit int default 20,
  p_offset int default 0
)
returns table (
  id uuid,
  order_number text,
  status text,
  warehouse_name text,
  customer_name text,
  address_line_1 text,
  city text,
  item_count int,
  created_at timestamptz,
  delivered_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid := assert_active_delivery();
  v_limit int := least(greatest(coalesce(p_limit, 20), 1), 50);
  v_offset int := greatest(coalesce(p_offset, 0), 0);
begin
  if p_scope is null or p_scope not in ('active', 'history') then
    raise exception 'invalid_status';
  end if;

  return query
  select
    o.id,
    o.order_number::text,
    o.status::text,
    w.name::text,
    trim(coalesce(c.first_name, '') || ' ' || coalesce(c.last_name, ''))::text,
    a.address_line_1::text,
    a.city::text,
    coalesce((select sum(oi.quantity) from order_items oi where oi.order_id = o.id), 0)::int,
    o.created_at,
    o.delivered_at
  from orders o
  join warehouses w on w.id = o.warehouse_id
  join users c on c.id = o.user_id
  left join addresses a on a.id = o.address_id
  where o.delivery_person_id = v_user_id
    and o.delivery_type = 'delivery'
    and (
      (p_scope = 'active' and o.status in ('pending', 'confirmed', 'on_delivery'))
      or (p_scope = 'history' and o.status = 'completed')
    )
  order by
    case when p_scope = 'active' then o.created_at end asc,
    case when p_scope = 'history' then o.delivered_at end desc nulls last,
    o.id
  limit v_limit
  offset v_offset;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Detalle de una entrega del repartidor, o null si el pedido no está asignado a él.
-- Nunca devuelve el código de entrega, montos, datos de pago ni notas internas.
-- ---------------------------------------------------------------------------------------------
create or replace function public.get_delivery_order(p_order_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid := assert_active_delivery();
  v_order orders%rowtype;
  v_contact_hidden boolean;
begin
  select * into v_order
  from orders o
  where o.id = p_order_id
    and o.delivery_person_id = v_user_id
    and o.delivery_type = 'delivery';

  if not found then
    return null;
  end if;

  -- Pasadas 24 horas de la entrega ya no se muestran el teléfono ni la dirección del cliente.
  v_contact_hidden := v_order.status = 'completed'
    and v_order.delivered_at is not null
    and v_order.delivered_at < now() - interval '24 hours';

  return jsonb_build_object(
    'id', v_order.id,
    'order_number', v_order.order_number,
    'status', v_order.status,
    'created_at', v_order.created_at,
    'confirmed_at', v_order.confirmed_at,
    'delivered_at', v_order.delivered_at,
    'customer_notes', v_order.customer_notes,
    'attempts_left', greatest(0, 5 - v_order.delivery_code_attempts),
    'contact_hidden', v_contact_hidden,
    'warehouse', (
      select jsonb_build_object('name', w.name, 'address', w.address, 'phone', w.phone)
      from warehouses w
      where w.id = v_order.warehouse_id
    ),
    'customer', (
      select jsonb_build_object(
        'first_name', c.first_name,
        'last_name', c.last_name,
        'phone_code', case when v_contact_hidden then null else c.phone_code end,
        'phone', case when v_contact_hidden then null else c.phone end
      )
      from users c
      where c.id = v_order.user_id
    ),
    'address', case
      when v_contact_hidden then null
      else (
        select jsonb_build_object(
          'label', a.label,
          'address_line_1', a.address_line_1,
          'address_line_2', a.address_line_2,
          'city', a.city
        )
        from addresses a
        where a.id = v_order.address_id
      )
    end,
    'items', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', oi.id,
          'product_name', oi.product_name,
          'product_image_url', oi.product_image_url,
          'quantity', oi.quantity
        )
        order by oi.product_name, oi.id
      )
      from order_items oi
      where oi.order_id = v_order.id
    ), '[]'::jsonb)
  );
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Resumen del historial: entregas de hoy (hora de Venezuela) y de los últimos 7 días.
-- ---------------------------------------------------------------------------------------------
create or replace function public.get_delivery_summary()
returns table (today int, last_7_days int)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid := assert_active_delivery();
begin
  return query
  select
    count(*) filter (
      where (o.delivered_at at time zone 'America/Caracas')::date
        = (now() at time zone 'America/Caracas')::date
    )::int,
    count(*) filter (where o.delivered_at >= now() - interval '7 days')::int
  from orders o
  where o.delivery_person_id = v_user_id
    and o.delivery_type = 'delivery'
    and o.status = 'completed';
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- "Retiré el pedido": confirmado -> en camino. Repetirlo no hace nada.
-- ---------------------------------------------------------------------------------------------
create or replace function public.delivery_mark_picked_up(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := assert_active_delivery();
  v_status text;
begin
  select o.status into v_status
  from orders o
  where o.id = p_order_id
    and o.delivery_person_id = v_user_id
    and o.delivery_type = 'delivery'
  for update;

  if not found then
    raise exception 'order_not_found';
  end if;

  if v_status = 'on_delivery' then
    return;
  end if;

  if v_status <> 'confirmed' then
    raise exception 'invalid_status';
  end if;

  update orders set status = 'on_delivery' where id = p_order_id;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Confirmar la entrega con el código de 4 dígitos del cliente.
-- Devuelve {"completed": bool, "attempts_left": int}. Un código incorrecto NO lanza error
-- (deshacería el contador de intentos): suma un intento y devuelve los que quedan.
-- ---------------------------------------------------------------------------------------------
create or replace function public.delivery_complete_order(p_order_id uuid, p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := assert_active_delivery();
  v_order orders%rowtype;
  v_attempts int;
begin
  select * into v_order
  from orders o
  where o.id = p_order_id
    and o.delivery_person_id = v_user_id
    and o.delivery_type = 'delivery'
  for update;

  if not found then
    raise exception 'order_not_found';
  end if;

  -- Ya estaba entregado (doble toque o reintento tras un fallo de red): no cambia nada.
  if v_order.status = 'completed' then
    return jsonb_build_object(
      'completed', true,
      'attempts_left', greatest(0, 5 - v_order.delivery_code_attempts)
    );
  end if;

  if v_order.status <> 'on_delivery' then
    raise exception 'invalid_status';
  end if;

  if v_order.delivery_code_attempts >= 5 then
    raise exception 'code_locked';
  end if;

  if p_code is not null and trim(p_code) = v_order.delivery_code then
    update orders
    set status = 'completed', delivered_at = now()
    where id = p_order_id;
    return jsonb_build_object(
      'completed', true,
      'attempts_left', greatest(0, 5 - v_order.delivery_code_attempts)
    );
  end if;

  v_attempts := v_order.delivery_code_attempts + 1;
  update orders set delivery_code_attempts = v_attempts where id = p_order_id;
  return jsonb_build_object('completed', false, 'attempts_left', greatest(0, 5 - v_attempts));
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Disponibilidad del repartidor. Devuelve el estado final.
-- ---------------------------------------------------------------------------------------------
create or replace function public.set_delivery_availability(p_available boolean)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := assert_active_delivery();
  v_has_active boolean;
begin
  perform 1 from users u where u.id = v_user_id for update;

  select exists (
    select 1 from orders o
    where o.delivery_person_id = v_user_id
      and o.delivery_type = 'delivery'
      and o.status = 'on_delivery'
  ) into v_has_active;

  if coalesce(p_available, false) then
    -- Con un pedido en camino sigue "en entrega"; sin ninguno, queda disponible.
    if v_has_active then
      update users set delivery_status = 'on_delivery'
      where id = v_user_id and delivery_status is distinct from 'on_delivery';
      return 'on_delivery';
    end if;
    update users set delivery_status = 'available' where id = v_user_id;
    return 'available';
  end if;

  if v_has_active then
    raise exception 'has_active_delivery';
  end if;

  update users set delivery_status = 'unavailable' where id = v_user_id;
  return 'unavailable';
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Mantiene `users.delivery_status` al día: "en entrega" mientras el repartidor tenga algún
-- pedido en camino, "disponible" cuando ya no. Nunca toca a quien está "no disponible".
-- Corre con cualquier cambio de estado o de repartidor, venga de la app o de la web.
-- ---------------------------------------------------------------------------------------------
create or replace function public.sync_delivery_person_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_person uuid;
  v_target delivery_status_enum;
begin
  for v_person in
    select distinct p
    from unnest(array[old.delivery_person_id, new.delivery_person_id]) as p
    where p is not null
  loop
    if exists (
      select 1 from orders o
      where o.delivery_person_id = v_person
        and o.delivery_type = 'delivery'
        and o.status = 'on_delivery'
    ) then
      v_target := 'on_delivery';
    else
      v_target := 'available';
    end if;

    update users u
    set delivery_status = v_target
    where u.id = v_person
      and u.delivery_status is distinct from 'unavailable'
      and u.delivery_status is distinct from v_target;
  end loop;
  return new;
end;
$$;

drop trigger if exists trigger_sync_delivery_person_status on public.orders;
create trigger trigger_sync_delivery_person_status
  after update of status, delivery_person_id on public.orders
  for each row
  when (
    old.status is distinct from new.status
    or old.delivery_person_id is distinct from new.delivery_person_id
  )
  execute function public.sync_delivery_person_status();

-- ---------------------------------------------------------------------------------------------
-- Aviso "Nuevo pedido asignado" al repartidor (función notify-delivery).
-- Igual que la versión en producción, con un caso más: además de avisar cuando cambia el
-- repartidor de un pedido confirmado, avisa cuando un pedido que ya tenía repartidor pasa a
-- confirmado (asignado mientras estaba pendiente de pago).
-- ---------------------------------------------------------------------------------------------
create or replace function public.handle_delivery_person_assigned()
returns trigger
language plpgsql
security definer
as $$
declare
    service_key text;
    project_url text := 'https://uejjlbxgtlpqukuhusmt.supabase.co';
begin
    if new.status = 'confirmed'
       and new.delivery_person_id is not null
       and (
         old.delivery_person_id is distinct from new.delivery_person_id
         or old.status is distinct from new.status
       )
    then
        select replace(replace(trim(decrypted_secret), chr(10), ''), chr(13), '')
        into service_key
        from vault.decrypted_secrets
        where name = 'service_role_key'
        limit 1;

        if service_key is null then
            raise warning 'notify-delivery: service_role_key not found in vault';
            return new;
        end if;

        perform net.http_post(
            url     := project_url || '/functions/v1/notify-delivery',
            headers := jsonb_build_object(
                'Content-Type',  'application/json',
                'Authorization', 'Bearer ' || service_key
            ),
            body    := jsonb_build_object(
                'order_id',           new.id,
                'order_number',       new.order_number,
                'delivery_person_id', new.delivery_person_id
            )
        );
    end if;
    return new;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Permisos: las funciones del repartidor solo para usuarios con sesión; las internas, para nadie.
-- ---------------------------------------------------------------------------------------------
revoke all on function public.assert_active_delivery() from public, anon, authenticated;
revoke all on function public.sync_delivery_person_status() from public, anon, authenticated;

revoke all on function public.get_delivery_orders(text, int, int) from public, anon;
revoke all on function public.get_delivery_order(uuid) from public, anon;
revoke all on function public.get_delivery_summary() from public, anon;
revoke all on function public.delivery_mark_picked_up(uuid) from public, anon;
revoke all on function public.delivery_complete_order(uuid, text) from public, anon;
revoke all on function public.set_delivery_availability(boolean) from public, anon;

grant execute on function public.get_delivery_orders(text, int, int) to authenticated;
grant execute on function public.get_delivery_order(uuid) to authenticated;
grant execute on function public.get_delivery_summary() to authenticated;
grant execute on function public.delivery_mark_picked_up(uuid) to authenticated;
grant execute on function public.delivery_complete_order(uuid, text) to authenticated;
grant execute on function public.set_delivery_availability(boolean) to authenticated;

commit;
