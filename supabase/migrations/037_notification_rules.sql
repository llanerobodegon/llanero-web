-- Reglas de notificaciones push.
--
-- 1. Cliente: un solo aviso por cambio de estado.
--    Había dos disparadores avisando lo mismo al cliente: `trigger_order_status_notification`
--    (llama a la función `notify-order-status`) y `trigger_notify_order_status_change` (envía
--    directo a Expo). Con los dos activos el cliente recibía el aviso duplicado. Se elimina el
--    segundo, que además mandaba los datos con otros nombres (`orderId`), por lo que al tocar
--    el aviso la app no abría el pedido, y avisaba también al volver a "pendiente".
--
-- 2. Repartidor: aviso también cuando se cancela un pedido que tenía asignado.
--    `notify-delivery` recibe ahora `type`: 'assigned' (como hasta ahora) o 'cancelled'.
--    Requiere la versión de la función `notify-delivery` que entiende `type`; desplegarla ANTES
--    de aplicar esta migración (con la versión anterior, la cancelación llegaría con el texto
--    "Nuevo pedido asignado").

begin;

drop trigger if exists trigger_notify_order_status_change on public.orders;
drop function if exists public.notify_order_status_change();

create or replace function public.handle_delivery_person_assigned()
returns trigger
language plpgsql
security definer
as $$
declare
    service_key text;
    project_url text := 'https://uejjlbxgtlpqukuhusmt.supabase.co';
    v_type text;
begin
    if new.delivery_person_id is null then
        return new;
    end if;

    if new.status = 'confirmed'
       and (
         old.delivery_person_id is distinct from new.delivery_person_id
         or old.status is distinct from new.status
       )
    then
        -- Asignado (o reasignado) un pedido confirmado, o confirmado uno que ya tenía repartidor.
        v_type := 'assigned';
    elsif new.status = 'cancelled'
       and old.status is distinct from new.status
       and new.delivery_type = 'delivery'
    then
        -- Cancelado un pedido que el repartidor tenía asignado.
        v_type := 'cancelled';
    else
        return new;
    end if;

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
            'delivery_person_id', new.delivery_person_id,
            'type',               v_type
        )
    );
    return new;
end;
$$;

commit;
