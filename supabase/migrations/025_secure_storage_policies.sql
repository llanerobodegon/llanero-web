-- Seguridad del Storage (bucket público `admin-app`).
--
-- Antes: cualquier usuario autenticado (incluidos los clientes de la app) podía subir,
-- reemplazar y borrar cualquier archivo del bucket (banners, logos, ubicaciones, categorías,
-- comprobantes de pago). Además quedaban reglas de un bucket `product-images` que no existe.
--
-- Ahora:
-- - Lectura: pública (igual que antes; la web y la app usan URLs públicas).
-- - Admin y gerentes (public.is_manager_or_admin()): suben, reemplazan y borran en todo el bucket.
-- - Clientes: solo suben comprobantes en `payment-receipts/<su id>/...`; no reemplazan ni borran.
-- - Las Edge Functions con service role no se ven afectadas (no pasan por RLS).

begin;

-- Reglas abiertas de admin-app
drop policy if exists "admin-app: Authenticated upload" on storage.objects;
drop policy if exists "admin-app: Authenticated update" on storage.objects;
drop policy if exists "admin-app: Authenticated delete" on storage.objects;

-- Reglas huérfanas del bucket `product-images` (no existe)
drop policy if exists "Authenticated users can upload" on storage.objects;
drop policy if exists "Authenticated users can delete" on storage.objects;
drop policy if exists "Public read access" on storage.objects;

-- Admin y gerentes: gestionan todo el bucket
create policy "admin-app: staff insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'admin-app' and public.is_manager_or_admin());

create policy "admin-app: staff update" on storage.objects
  for update to authenticated
  using (bucket_id = 'admin-app' and public.is_manager_or_admin())
  with check (bucket_id = 'admin-app' and public.is_manager_or_admin());

create policy "admin-app: staff delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'admin-app' and public.is_manager_or_admin());

-- Clientes: solo subir comprobantes de pago en su propia carpeta
create policy "admin-app: customers upload own receipts" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'admin-app'
    and (storage.foldername(name))[1] = 'payment-receipts'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

commit;
