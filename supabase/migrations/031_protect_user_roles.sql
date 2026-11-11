-- Proteger el rol, el estado de la cuenta y el estado de repartidor en `users`.
--
-- Antes: las reglas "Users can update own profile" y "Users can update their own notification
-- settings" dejan a cada usuario editar su propia fila sin restringir columnas. Con eso un
-- cliente podía cambiarse `role_id` (y hacerse admin o repartidor), reactivar su cuenta
-- (`is_active`) o tocar `delivery_status`.
--
-- Ahora: desde la app (rol `authenticated`), esas columnas y el correo solo las cambian admin y
-- gerentes. El resto del perfil (nombre, teléfono, documento, notificaciones, tienda preferida)
-- se sigue editando igual.
--
-- No afecta a:
-- - La web al crear repartidores o equipo: usa la clave de servicio (rol `service_role`).
-- - Las funciones del servidor (`security definer`): dentro de ellas `current_user` es el dueño
--   de la función, no `authenticated`. Así el modo repartidor cambia `delivery_status` solo a
--   través de `set_delivery_availability` y del trigger de pedidos.
--
-- El registro no necesita cambios: `handle_new_user` ya crea siempre clientes (role_id 1).

begin;

-- Sin `security definer` a propósito: necesita ver el rol real de la sesión en `current_user`.
create or replace function public.protect_user_privileged_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user in ('authenticated', 'anon')
     and not public.is_manager_or_admin()
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

drop trigger if exists trigger_protect_user_privileged_columns on public.users;
create trigger trigger_protect_user_privileged_columns
  before update on public.users
  for each row
  execute function public.protect_user_privileged_columns();

commit;
