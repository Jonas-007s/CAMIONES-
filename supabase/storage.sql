-- Supabase storage.sql
-- Configura el bucket de Storage "uploads" y sus políticas.
-- QUICK-START: pública lectura y escritura (inseguro para producción)
-- Versión segura (solo lectura pública, escritura autenticada) al final.

-- Crear bucket (ejecutar una sola vez)
select storage.create_bucket('uploads', public => true);

-- Eliminar políticas previas si existen
-- Nota: storage.objects ya tiene RLS habilitado por defecto
-- Borra por nombre si fuera necesario (opcional)
-- No todas las instalaciones nombran las políticas igual; este paso es opcional.

-- QUICK-START Policies (permiten a anon y authenticated)
create policy "uploads_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'uploads');

create policy "uploads_public_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'uploads');

create policy "uploads_public_update" on storage.objects
  for update to anon, authenticated
  using (bucket_id = 'uploads')
  with check (bucket_id = 'uploads');

create policy "uploads_public_delete" on storage.objects
  for delete to anon, authenticated
  using (bucket_id = 'uploads');

-- =========================
-- POLÍTICAS SEGURAS (OPCIONAL)
-- =========================
-- Para producción, elimina las quick-start (drop policy ...) y usa:
--
-- create policy "uploads_read_all" on storage.objects
--   for select to anon, authenticated
--   using (bucket_id = 'uploads');
--
-- create policy "uploads_insert_auth" on storage.objects
--   for insert to authenticated
--   with check (bucket_id = 'uploads');
--
-- create policy "uploads_update_auth" on storage.objects
--   for update to authenticated
--   using (bucket_id = 'uploads')
--   with check (bucket_id = 'uploads');
--
-- create policy "uploads_delete_auth" on storage.objects
--   for delete to authenticated
--   using (bucket_id = 'uploads');