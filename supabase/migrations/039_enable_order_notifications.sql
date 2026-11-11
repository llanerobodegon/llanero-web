-- Reactivar las notificaciones de pedidos.
--
-- Qué pasaba: los dos disparadores que avisan de los pedidos estaban DESACTIVADOS en
-- producción (`trigger_order_created_notification` y `trigger_order_status_notification`).
-- Por eso:
-- - El panel web no recibía ninguna notificación de pedido nuevo: las 54 que tiene (la última
--   del 15 de julio) las insertaba la app anterior desde el teléfono, no la base.
-- - El aviso al cliente por cambio de estado dependía solo del otro disparador
--   (`trigger_notify_order_status_change`), que la migración 037 eliminó creyéndolo
--   duplicado. Desde entonces el cliente no recibía ningún aviso. Esta migración lo corrige.
--
-- Ahora:
-- - Pedido nuevo -> una fila en `notifications` (el panel suena y la muestra en la campana).
--   Sin push a los teléfonos de los admin (038).
-- - Cambio de estado -> push al cliente con la función `notify-order-status`. Ya no se guarda
--   una fila en `notifications` por cada cambio: el panel solo lista pedidos nuevos.
-- - Solo la base inserta notificaciones: se quita la regla que dejaba a cualquier usuario con
--   sesión insertar filas en `notifications` (la usaba la app anterior).

begin;

create or replace function public.handle_order_status_notification()
returns trigger
language plpgsql
security definer
as $$
declare
    service_key text;
    project_url text := 'https://uejjlbxgtlpqukuhusmt.supabase.co';
begin
    if old.status is distinct from new.status then
        select replace(replace(trim(decrypted_secret), chr(10), ''), chr(13), '')
        into service_key
        from vault.decrypted_secrets
        where name = 'service_role_key'
        limit 1;

        if service_key is null then
            raise warning 'notify-order-status: service_role_key not found in vault';
            return new;
        end if;

        -- La función decide si ese estado se avisa (confirmado, en camino, entregado, cancelado).
        perform net.http_post(
            url     := project_url || '/functions/v1/notify-order-status',
            headers := jsonb_build_object(
                'Content-Type',  'application/json',
                'Authorization', 'Bearer ' || service_key
            ),
            body    := jsonb_build_object(
                'order_id',     new.id,
                'order_number', new.order_number,
                'user_id',      new.user_id,
                'new_status',   new.status
            )
        );
    end if;
    return new;
end;
$$;

alter table public.orders enable trigger trigger_order_created_notification;
alter table public.orders enable trigger trigger_order_status_notification;

-- Las funciones de los disparadores son `security definer` y no necesitan esta regla.
drop policy if exists "Service role can insert notifications" on public.notifications;

commit;
