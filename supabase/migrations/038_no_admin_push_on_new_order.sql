-- Pedido nuevo: los admin y gerentes se enteran solo por el panel web, sin push al teléfono.
--
-- Antes: al crearse un pedido, además de la notificación del panel, se llamaba a la función
-- `notify-order-created`, que enviaba un push a los admin y a los gerentes de la tienda.
--
-- Ahora: solo se inserta la notificación del panel (tabla `notifications`), que es la que hace
-- sonar el panel y mostrar el aviso. La función `notify-order-created` queda desplegada pero
-- sin usar, por si se quiere reactivar el push más adelante.

begin;

create or replace function public.handle_order_created_notification()
returns trigger
language plpgsql
security definer
as $$
begin
    insert into notifications (type, title, description, reference_id, warehouse_id, metadata)
    values (
        'order_created',
        'Nuevo pedido #' || new.order_number,
        'Se ha recibido un nuevo pedido',
        new.id,
        new.warehouse_id,
        jsonb_build_object(
            'order_number', new.order_number,
            'total_usd',    new.total_usd,
            'delivery_type', new.delivery_type
        )
    );
    return new;
end;
$$;

commit;
