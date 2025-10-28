-- Supabase wipe.sql
-- Limpia datos para un arranque en limpio (trucks + objetos del bucket uploads)
-- Ejecuta esto en el SQL Editor de Supabase cuando quieras borrar todo.
-- Atención: Esta operación es destructiva.

-- Vaciar bucket 'uploads' (borra todos los archivos)
-- Requiere permisos de rol del proyecto (desde el panel) o ejecutar como propietario.
select storage.empty_bucket('uploads');

-- Alternativa si empty_bucket no está disponible o falla:
-- delete from storage.objects where bucket_id = 'uploads';

-- Borrar todos los registros de la tabla trucks
truncate table public.trucks restart identity cascade;