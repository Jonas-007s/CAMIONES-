-- Supabase setup.sql
-- Esquema mínimo para la app de Portería (camiones)
-- Incluye: tabla trucks, índices, trigger de duración, RLS con políticas "quick-start" (públicas)
-- NOTA DE SEGURIDAD: Las políticas "quick-start" permiten escritura desde la clave ANON.
-- Para producción, usa las políticas seguras del final (comentadas) y habilita autenticación.

-- Extensión necesaria para gen_random_uuid()
create extension if not exists pgcrypto;

-- Tabla principal: trucks
create table if not exists public.trucks (
  id uuid primary key default gen_random_uuid(),
  plate text not null,
  driver text,
  transporter text,
  area text not null check (area in ('Inbound','Outbound','Otros')),
  status text not null check (status in ('Ingreso','Salida','Espera','NoIngreso')),
  created_at timestamptz not null default now(),
  created_by text,
  exit_at timestamptz,
  exit_by text,
  photo_url text,
  entry_time timestamptz,
  duration integer,
  notes text,
  guard_name text,
  waiting_at timestamptz,
  waiting_by text,
  entered_at timestamptz,
  entered_by text,
  never_entered_at timestamptz,
  never_entered_by text,
  never_entered_reason text
);

-- Índices útiles
create index if not exists trucks_created_at_idx on public.trucks (created_at desc);
create index if not exists trucks_area_idx on public.trucks (area);
create index if not exists trucks_status_idx on public.trucks (status);
create index if not exists trucks_plate_idx on public.trucks (plate);

-- Trigger para calcular duración (en minutos) cuando haya entry_time y exit_at
create or replace function public.trucks_compute_duration()
returns trigger as $$
begin
  if NEW.entry_time is not null then
    if NEW.exit_at is not null then
      NEW.duration := greatest(0, floor(extract(epoch from (NEW.exit_at - NEW.entry_time)) / 60)::int);
    else
      -- Si no hay exit_at, mantener duración previa o 0
      NEW.duration := coalesce(NEW.duration, 0);
    end if;
  end if;
  return NEW;
end;
$$ language plpgsql;

-- Crea el trigger (antes de insertar/actualizar entry_time/exit_at)
drop trigger if exists trucks_set_duration on public.trucks;
create trigger trucks_set_duration
before insert or update of entry_time, exit_at
on public.trucks
for each row
execute function public.trucks_compute_duration();

-- Vista simple para estadísticas globales
create or replace view public.trucks_stats as
select
  count(*) as total,
  count(*) filter (where area = 'Inbound') as inbound,
  count(*) filter (where area = 'Outbound') as outbound,
  count(*) filter (where area = 'Otros') as otros
from public.trucks;

-- RLS y políticas
alter table public.trucks enable row level security;

-- QUICK-START (inseguro para producción): permite todo a anon y authenticated
-- Puedes ejecutarlas tal cual para que la app funcione sin Auth.
-- Para revertir a una configuración segura, elimina estas políticas y activa las del bloque seguro.

-- Elimina políticas previas si existen
do $$
begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='trucks' and policyname='trucks_select_all') then
    execute 'drop policy "trucks_select_all" on public.trucks';
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='trucks' and policyname='trucks_insert_all') then
    execute 'drop policy "trucks_insert_all" on public.trucks';
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='trucks' and policyname='trucks_update_all') then
    execute 'drop policy "trucks_update_all" on public.trucks';
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='trucks' and policyname='trucks_delete_all') then
    execute 'drop policy "trucks_delete_all" on public.trucks';
  end if;
end$$;

create policy "trucks_select_all" on public.trucks
  for select to anon, authenticated 
  using (true);

create policy "trucks_insert_all" on public.trucks
  for insert to anon, authenticated
  with check (true);

create policy "trucks_update_all" on public.trucks
  for update to anon, authenticated
  using (true)
  with check (true);

create policy "trucks_delete_all" on public.trucks
  for delete to anon, authenticated
  using (true);

-- =========================
-- POLÍTICAS SEGURAS (OPCIONAL)
-- =========================
-- Si vas a usar Autenticación, considera reemplazar las políticas anteriores por estas.
-- 1) Primero borra las quick-start (drop policy ... como arriba).
-- 2) Luego descomenta y ejecuta este bloque.
-- 3) Asegúrate de que tu frontend haga login y envíe el JWT de Supabase.
--
-- alter table public.trucks alter column created_by set default (auth.jwt() ->> 'email');
--
-- create policy "trucks_select_auth" on public.trucks
--   for select to authenticated
--   using (true);
--
-- create policy "trucks_insert_auth" on public.trucks
--   for insert to authenticated
--   with check (created_by = auth.jwt() ->> 'email');
--
-- create policy "trucks_update_own" on public.trucks
--   for update to authenticated
--   using (created_by = auth.jwt() ->> 'email')
--   with check (created_by = auth.jwt() ->> 'email');
--
-- create policy "trucks_delete_own" on public.trucks
--   for delete to authenticated
--   using (created_by = auth.jwt() ->> 'email');