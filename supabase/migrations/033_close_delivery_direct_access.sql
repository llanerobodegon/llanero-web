-- Modo repartidor: cerrar el acceso directo del repartidor a pedidos y clientes.
--
-- Antes: una cuenta de repartidor podía leer completa la fila de sus pedidos (incluido el
-- código de entrega, montos y datos de pago), editarla o borrarla, y ver también los pedidos
-- sin asignar. Además leía directo los perfiles y direcciones de los clientes de sus pedidos.
--
-- Ahora: el repartidor no consulta tablas. Todo le llega por las funciones de la migración
-- anterior (get_delivery_orders, get_delivery_order, …), que devuelven solo lo necesario.
--
-- No cambia nada para admin, gerentes ni clientes. La app publicada 1.2.5 está en pausa y no
-- depende de estas reglas.
-- Aplicar después de 032_delivery_mode_functions.sql.

begin;

-- Pedidos: lectura, edición y borrado directos del repartidor (asignados o sin asignar).
drop policy if exists "Delivery members can view and update assigned orders" on public.orders;

-- Clientes y direcciones de los pedidos asignados: ahora los entrega get_delivery_order.
drop policy if exists "Delivery users can view customers of their assigned orders" on public.users;
drop policy if exists "Delivery users can view addresses of their assigned orders" on public.addresses;

-- Líneas del pedido: solo el cliente dueño del pedido (antes también el repartidor asignado).
drop policy if exists "Users can view items of their orders" on public.order_items;
create policy "Users can view items of their orders" on public.order_items
  for select
  using (
    exists (
      select 1
      from public.orders
      where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    )
  );

-- Las funciones auxiliares de las reglas eliminadas ya no se usan.
drop function if exists public.get_customer_ids_for_delivery();
drop function if exists public.get_address_ids_for_delivery();

commit;
