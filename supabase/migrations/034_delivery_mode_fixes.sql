-- Modo repartidor: correcciones tras la revisión de las migraciones 031 y 032.
--
-- 1. Roles: la protección de `users` exceptuaba a admin Y gerentes. Como cada usuario puede
--    editar su propia fila, un gerente podía cambiarse el rol a admin. Ningún gerente necesita
--    esa excepción (no existe regla que le deje editar a otros usuarios), así que ahora solo
--    se exceptúa a los admin.
--
-- 2. Estado del repartidor (`users.delivery_status`), tres casos que lo dejaban mal:
--    - Dos cambios simultáneos sobre pedidos del mismo repartidor podían dejarlo "en entrega"
--      sin pedidos en camino: ahora se bloquea su fila antes de recalcular.
--    - Borrar desde la web un pedido en camino no lo liberaba: se añade el caso de borrado.
--    - Si estaba "no disponible" y retiraba un pedido, seguía "no disponible" aunque iba en
--      camino: ahora pasa a "en entrega". Al terminar vuelve a "disponible".
--    Quien está "no disponible" y sin pedidos en camino no se toca.

begin;

create or replace function public.protect_user_privileged_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user in ('authenticated', 'anon')
     and not public.is_admin()
     and (
       new.role_id is distinct from old.role_id
       or new.is_active is distinct from old.is_active
       or new.delivery_status is distinct from old.delivery_status
       or new.email is distinct from old.email
     )
  then
    raise exception 'No puedes modificar estos datos' using errcode = '42501';
  end if;
  return new;
end;
$$;

create or replace function public.sync_delivery_person_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_person uuid;
  v_people uuid[];
begin
  if tg_op = 'DELETE' then
    v_people := array[old.delivery_person_id];
  else
    v_people := array[old.delivery_person_id, new.delivery_person_id];
  end if;

  for v_person in
    select distinct p from unnest(v_people) as p where p is not null order by p
  loop
    -- Bloquea al repartidor: dos cambios simultáneos se recalculan uno después del otro.
    perform 1 from users u where u.id = v_person for update;

    if exists (
      select 1 from orders o
      where o.delivery_person_id = v_person
        and o.delivery_type = 'delivery'
        and o.status = 'on_delivery'
    ) then
      update users u
      set delivery_status = 'on_delivery'
      where u.id = v_person
        and u.delivery_status is distinct from 'on_delivery';
    else
      update users u
      set delivery_status = 'available'
      where u.id = v_person
        and u.delivery_status = 'on_delivery';
    end if;
  end loop;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists trigger_sync_delivery_person_status_on_delete on public.orders;
create trigger trigger_sync_delivery_person_status_on_delete
  after delete on public.orders
  for each row
  when (old.delivery_person_id is not null)
  execute function public.sync_delivery_person_status();

revoke all on function public.sync_delivery_person_status() from public, anon, authenticated;

commit;
