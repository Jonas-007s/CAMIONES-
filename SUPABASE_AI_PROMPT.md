Instrucciones para Supabase AI (pegar este prompt en el SQL Editor > Supabase AI)

Quiero que generes la base de datos y el storage para una app de control de camiones en portería. Requisitos exactos:

1) Tabla principal: public.trucks
- Clave primaria: id uuid default gen_random_uuid()
- Campos:
  - plate text not null
  - driver text
  - transporter text
  - area text not null, limitado a ('Inbound','Outbound','Otros')
  - status text not null, limitado a ('Ingreso','Salida','Espera','NoIngreso')
  - created_at timestamptz not null default now()
  - created_by text (email opcional del usuario)
  - exit_at timestamptz
  - exit_by text
  - photo_url text
  - entry_time timestamptz
  - duration integer (minutos)
  - notes text
  - guard_name text
  - waiting_at timestamptz
  - waiting_by text
  - entered_at timestamptz
  - entered_by text
  - never_entered_at timestamptz
  - never_entered_by text
  - never_entered_reason text

2) Índices: created_at desc, area, status, plate

3) Trigger BEFORE INSERT/UPDATE que calcule duration en minutos cuando haya entry_time y exit_at.

4) Vista public.trucks_stats con columnas: total, inbound, outbound, otros.

5) Activar RLS en public.trucks.

6) Políticas QUICK-START (para que funcione con la clave ANON, inseguro en producción):
- select/insert/update/delete permitidos para roles anon y authenticated (using true / with check true).

7) Alternativa SEGURA (opcional, solo si uso Auth):
- default created_by = auth.jwt()->>'email'
- select para authenticated
- insert/update/delete solo si created_by = auth.jwt()->>'email'

8) Storage: crear bucket 'uploads' público (public => true).
- Políticas QUICK-START: select/insert/update/delete para anon y authenticated, limitado a bucket_id = 'uploads'.
- Alternativa SEGURA: select para anon y authenticated, y el resto solo para authenticated.

Salida esperada:
- SQL completo y ejecutable para Postgres/Supabase que cree todo lo anterior.
- Incluye create extension if not exists pgcrypto.
- Usa create table if not exists donde sea posible y create policy con nombres descriptivos.
- Asegúrate de que sea idempotente o, si repito la ejecución, no falle por objetos ya existentes.

Contexto app (por si ayuda):
- Frontend Vite + React ya inicializa Supabase con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
- Inicialmente no habrá autenticación; prioriza las políticas QUICK-START para arrancar.