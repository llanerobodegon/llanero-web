-- Modo repartidor: señal en tiempo real "algo cambió en tus entregas".
--
-- Por qué: el repartidor no lee `orders` directo (así nunca ve el código de entrega), por eso
-- no puede usar el tiempo real de tablas como el cliente. Sin esto, si el bodegón cancela o
-- reasigna un pedido desde la web, el repartidor lo sigue viendo como suyo hasta refrescar.
--
-- Cómo: cuando cambia el estado o el repartidor de un pedido (o se borra), se envía un aviso
-- de Realtime Broadcast al canal privado `delivery:<id del repartidor>`. El aviso solo lleva
-- el id del pedido; la app, al recibirlo, vuelve a pedir sus entregas con las funciones de
-- siempre. Cada repartidor solo puede escuchar su propio canal.
--
-- El envío nunca hace fallar el cambio del pedido: si Realtime no está disponible, se ignora.

begin;

create or replace function public.notify_delivery_person_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_person uuid;
  v_people uuid[];
  v_order_id uuid;
begin
  if tg_op = 'DELETE' then
    v_people := array[old.delivery_person_id];
    v_order_id := old.id;
  elsif tg_op = 'INSERT' then
    v_people := array[new.delivery_person_id];
    v_order_id := new.id;
  else
    v_people := array[old.delivery_person_id, new.delivery_person_id];
    v_order_id := new.id;
  end if;

  for v_person in
    select distinct p from unnest(v_people) as p where p is not null
  loop
    begin
      perform realtime.send(
        jsonb_build_object('order_id', v_order_id),
        'changed',
        'delivery:' || v_person::text,
        true
      );
    exception when others then
      -- El aviso es una ayuda: nunca debe impedir que se guarde el pedido.
      null;
    end;
  end loop;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.notify_delivery_person_changes() from public, anon, authenticated;

drop trigger if exists trigger_notify_delivery_person_changes on public.orders;
create trigger trigger_notify_delivery_person_changes
  after update of status, delivery_person_id on public.orders
  for each row
  when (
    old.status is distinct from new.status
    or old.delivery_person_id is distinct from new.delivery_person_id
  )
  execute function public.notify_delivery_person_changes();

drop trigger if exists trigger_notify_delivery_person_changes_on_delete on public.orders;
create trigger trigger_notify_delivery_person_changes_on_delete
  after delete on public.orders
  for each row
  when (old.delivery_person_id is not null)
  execute function public.notify_delivery_person_changes();

-- Canal privado: cada usuario solo puede escuchar `delivery:<su propio id>`.
drop policy if exists "Delivery users can listen to their own channel" on realtime.messages;
create policy "Delivery users can listen to their own channel" on realtime.messages
  for select
  to authenticated
  using (
    realtime.messages.extension = 'broadcast'
    and (select realtime.topic()) = 'delivery:' || (select auth.uid())::text
  );

commit;
