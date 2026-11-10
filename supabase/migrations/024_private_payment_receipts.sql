-- Comprobantes de pago privados.
--
-- Antes: los comprobantes se subían al bucket público `admin-app` y cualquiera con la URL podía
-- verlos (datos bancarios, montos, nombres).
--
-- Ahora: bucket privado `payment-receipts`, con la ruta `<id del cliente>/<archivo>`.
-- - El cliente sube y ve solo los suyos; no reemplaza ni borra.
-- - Admin y gerentes (public.is_manager_or_admin()) ven todos.
-- - Nadie los ve por URL pública: el panel web abre un enlace firmado temporal.
--
-- En `orders.payment_proof_url` los nuevos se guardan como `payment-receipts/<uid>/<archivo>`
-- (bucket + ruta, no una URL). Los anteriores siguen siendo URLs públicas de `admin-app`.
-- Cambio aditivo: no toca el bucket `admin-app` ni sus reglas (la app 1.2.5 lo sigue usando).

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-receipts',
  'payment-receipts',
  false,
  10485760, -- 10 MB
  array['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "payment-receipts: customers upload own" on storage.objects;
drop policy if exists "payment-receipts: read own or staff" on storage.objects;

-- Cliente: sube solo en su carpeta.
create policy "payment-receipts: customers upload own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'payment-receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Lectura (y enlaces firmados): el dueño o admin/gerentes.
create policy "payment-receipts: read own or staff" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'payment-receipts'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_manager_or_admin()
    )
  );

commit;
