-- Función create_order: crea un pedido del cliente con sus líneas, calculando en el servidor.
--
-- Por qué: hoy la app inserta `orders` y `order_items` directo y envía los precios y totales,
-- que la base guarda sin verificar. Esta función recibe solo productos y cantidades y calcula
-- precios (con descuento), costo de delivery y totales desde `products` y `warehouses`, valida
-- la tienda, la dirección, la cuenta de pago y la disponibilidad, y crea todo en una
-- transacción (si algo falla, no se crea nada).
--
-- Etapa 1 (esta migración): solo agrega la función. Las reglas de inserción directa se
-- mantienen porque la app publicada (1.2.5) todavía las usa.
-- Etapa 2 (al publicar la app nueva y forzar la actualización): quitar la inserción directa de
-- clientes en `orders`/`order_items` y restringir su edición de `orders`.
--
-- Los números de pedido, el código de entrega y la notificación a la tienda los siguen
-- generando los triggers existentes.

create or replace function public.create_order(
  p_warehouse_id uuid,
  p_delivery_type text,
  p_address_id uuid,
  p_payment_method_type text,
  p_bank_account_id uuid,
  p_payment_bank text,
  p_payment_reference text,
  p_exchange_rate numeric,
  p_items jsonb,
  p_customer_notes text default null,
  p_payment_proof_url text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_warehouse warehouses%rowtype;
  v_bank bank_accounts%rowtype;
  v_item jsonb;
  v_product products%rowtype;
  v_quantity int;
  v_unit_price numeric(10, 2);
  v_subtotal numeric(10, 2) := 0;
  v_delivery_fee numeric(10, 2) := 0;
  v_total numeric(10, 2);
  v_order_id uuid;
  v_seen uuid[] := '{}';
begin
  if v_user_id is null then
    raise exception 'Tu sesión expiró; vuelve a iniciar sesión' using errcode = '28000';
  end if;

  -- Tienda: activa y abierta.
  select * into v_warehouse from warehouses where id = p_warehouse_id and is_active;
  if not found then
    raise exception 'La tienda no está disponible' using errcode = 'P0001';
  end if;
  if not coalesce(v_warehouse.is_open, true) then
    raise exception '% está cerrada; podrás pedir cuando abra', v_warehouse.name using errcode = 'P0001';
  end if;

  -- Entrega: delivery necesita una dirección del propio cliente.
  if p_delivery_type not in ('pickup', 'delivery') then
    raise exception 'Tipo de entrega no válido' using errcode = 'P0001';
  end if;
  if p_delivery_type = 'delivery' then
    if p_address_id is null or not exists (
      select 1 from addresses where id = p_address_id and user_id = v_user_id
    ) then
      raise exception 'Elige una dirección de entrega válida' using errcode = 'P0001';
    end if;
    v_delivery_fee := coalesce(v_warehouse.delivery_fee, 0);
  end if;

  -- Pago: la cuenta debe ser de esta tienda, estar activa y aceptar el método.
  select * into v_bank from bank_accounts
    where id = p_bank_account_id and warehouse_id = p_warehouse_id and is_active;
  if not found then
    raise exception 'La cuenta de pago no es válida para esta tienda' using errcode = 'P0001';
  end if;
  if not (
    (p_payment_method_type = 'pago_movil' and v_bank.scope = 'nacional' and v_bank.pago_movil_phone is not null)
    or (p_payment_method_type = 'transferencia' and v_bank.scope = 'nacional')
    or (p_payment_method_type in ('zelle', 'banesco_panama') and v_bank.type = p_payment_method_type)
  ) then
    raise exception 'El método de pago no coincide con la cuenta' using errcode = 'P0001';
  end if;
  if coalesce(trim(p_payment_reference), '') = '' or length(trim(p_payment_reference)) > 10 then
    raise exception 'La referencia del pago debe tener entre 1 y 10 caracteres' using errcode = 'P0001';
  end if;
  if p_exchange_rate is null or p_exchange_rate <= 0 then
    raise exception 'La tasa del día no es válida' using errcode = 'P0001';
  end if;

  -- Productos: al menos uno, cantidades válidas, sin repetir.
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Tu carrito está vacío' using errcode = 'P0001';
  end if;

  -- Primero se valida todo y se calcula el subtotal (nada se inserta si un producto falla).
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_quantity := (v_item ->> 'quantity')::int;
    if v_quantity is null or v_quantity < 1 or v_quantity > 99 then
      raise exception 'Cantidad no válida' using errcode = 'P0001';
    end if;
    if (v_item ->> 'product_id')::uuid = any (v_seen) then
      raise exception 'Hay productos repetidos en el pedido' using errcode = 'P0001';
    end if;
    v_seen := v_seen || (v_item ->> 'product_id')::uuid;

    select p.* into v_product from products p
      join warehouse_products wp on wp.product_id = p.id
      where p.id = (v_item ->> 'product_id')::uuid
        and p.is_active
        and wp.warehouse_id = p_warehouse_id
        and wp.is_available;
    if not found then
      raise exception 'Un producto de tu carrito ya no está disponible en esta tienda' using errcode = 'P0001';
    end if;

    v_unit_price := case
      when coalesce(v_product.is_on_discount, false) and v_product.discount_price is not null
        then v_product.discount_price
      else v_product.price
    end;
    v_subtotal := v_subtotal + round(v_unit_price * v_quantity, 2);
  end loop;

  v_total := v_subtotal + v_delivery_fee;

  insert into orders (
    user_id, warehouse_id, address_id, delivery_type,
    status, payment_status,
    payment_method_type, payment_bank, payment_reference, payment_proof_url, bank_account_id,
    subtotal_usd, subtotal_bs, delivery_fee_usd, delivery_fee_bs, total_usd, total_bs,
    exchange_rate, customer_notes
  ) values (
    v_user_id, p_warehouse_id,
    case when p_delivery_type = 'delivery' then p_address_id end,
    p_delivery_type,
    'pending', 'pending',
    p_payment_method_type, nullif(trim(p_payment_bank), ''), trim(p_payment_reference),
    nullif(trim(p_payment_proof_url), ''), p_bank_account_id,
    v_subtotal, round(v_subtotal * p_exchange_rate, 2),
    v_delivery_fee, round(v_delivery_fee * p_exchange_rate, 2),
    v_total, round(v_total * p_exchange_rate, 2),
    p_exchange_rate, nullif(trim(p_customer_notes), '')
  )
  returning id into v_order_id;

  -- Líneas con la "foto" del producto al momento de comprar.
  insert into order_items (
    order_id, product_id, product_name, product_image_url,
    quantity, unit_price_usd, unit_price_bs, total_usd, total_bs
  )
  select
    v_order_id, p.id, p.name, p.image_urls[1],
    i.quantity, i.unit_price,
    round(i.unit_price * p_exchange_rate, 2),
    round(i.unit_price * i.quantity, 2),
    round(i.unit_price * i.quantity * p_exchange_rate, 2)
  from (
    select
      (e ->> 'product_id')::uuid as product_id,
      (e ->> 'quantity')::int as quantity,
      case
        when coalesce(pr.is_on_discount, false) and pr.discount_price is not null then pr.discount_price
        else pr.price
      end as unit_price
    from jsonb_array_elements(p_items) e
    join products pr on pr.id = (e ->> 'product_id')::uuid
  ) i
  join products p on p.id = i.product_id;

  return v_order_id;
end;
$$;

-- Solo usuarios con sesión pueden llamarla.
revoke all on function public.create_order(uuid, text, uuid, text, uuid, text, text, numeric, jsonb, text, text) from public, anon;
grant execute on function public.create_order(uuid, text, uuid, text, uuid, text, text, numeric, jsonb, text, text) to authenticated;
