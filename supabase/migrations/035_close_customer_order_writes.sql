-- Pedidos, etapa 2: cerrar la escritura directa de los clientes.
--
-- Antes: un cliente podía insertar directo en `orders` y `order_items` (enviando los precios y
-- totales que quisiera) y editar cualquier columna de sus propios pedidos: estado, estado del
-- pago, montos, repartidor asignado.
--
-- Ahora: los pedidos se crean solo con la función `create_order` (etapa 1,
-- 026_create_order_function.sql), que calcula precios y totales en el servidor, y
-- el cliente no modifica pedidos. Los cambios de estado y de pago los hacen admin y gerentes
-- desde la web, y el repartidor con sus funciones.
--
-- El cliente conserva la lectura de sus pedidos y sus líneas (y el tiempo real).
-- No cambia nada para admin ni gerentes. La app publicada 1.2.5, que usaba la inserción
-- directa, está en pausa; la app 2.0.0 solo usa `create_order`.

begin;

drop policy if exists "Customers can create their own orders" on public.orders;
drop policy if exists "Customers can update their own orders" on public.orders;
drop policy if exists "Customers can create items for their orders" on public.order_items;

commit;
