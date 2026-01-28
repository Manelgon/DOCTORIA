-- 20240127_diagnostics_catalog.sql
-- 1) Catálogo de diagnósticos
create table if not exists public.diagnosticos (
  id uuid primary key default gen_random_uuid(),
  system text not null default 'custom',  -- 'cie10es' | 'snomed' | 'custom'
  code text,                               -- ej: 'J06.9'
  display text not null,                   -- nombre legible
  active boolean not null default true,
  selectable boolean not null default true, -- si es una hoja (leaf) seleccionable
  created_at timestamptz not null default now(),
  unique (system, code)
);

create index if not exists idx_diagnosticos_display
  on public.diagnosticos using gin (to_tsvector('spanish', display));

create index if not exists idx_diagnosticos_active
  on public.diagnosticos(active);

-- Enable RLS
alter table public.diagnosticos enable row level security;

-- Policies for diagnosticos
drop policy if exists "Todos pueden ver diagnosticos activos" on public.diagnosticos;
create policy "Todos pueden ver diagnosticos activos" on public.diagnosticos
  for select to authenticated
  using (active = true);

drop policy if exists "Admins gestionan el catálogo" on public.diagnosticos;
create policy "Admins gestionan el catálogo" on public.diagnosticos
  for all to authenticated
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- 2) Relación consulta ↔ diagnóstico (muchos a muchos)
create table if not exists public.consultas_diagnosticos (
  consultation_id uuid not null references public.consultas(id) on delete cascade,
  diagnostico_id uuid not null references public.diagnosticos(id),
  rank int not null default 1,
  status text not null default 'provisional',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (consultation_id, diagnostico_id),
  constraint cd_status_check check (status in ('provisional','confirmado','descartado'))
);

create index if not exists idx_cd_consultation
  on public.consultas_diagnosticos(consultation_id);

create index if not exists idx_cd_diagnostico
  on public.consultas_diagnosticos(diagnostico_id);

create index if not exists idx_cd_created_at
  on public.consultas_diagnosticos(created_at);

-- Un solo diagnóstico principal (rank = 1) por consulta
create unique index if not exists cd_one_primary_per_consult
on public.consultas_diagnosticos (consultation_id)
where rank = 1;

-- Enable RLS
alter table public.consultas_diagnosticos enable row level security;

-- Policies for consultas_diagnosticos
drop policy if exists "Medicos ven diagnosticos de sus consultas" on public.consultas_diagnosticos;
drop policy if exists "Ver diagnosticos si puedo ver la consulta" on public.consultas_diagnosticos;

create policy "Ver diagnosticos si puedo ver la consulta" on public.consultas_diagnosticos
  for select to authenticated
  using (
    exists (
      select 1
      from public.consultas c
      where c.id = consultas_diagnosticos.consultation_id
        and (
          c.patient_id in (select id from pacientes) -- Acceso según carteras
          or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
        )
    )
  );

drop policy if exists "Medicos gestionan sus propios diagnosticos de consulta" on public.consultas_diagnosticos;
drop policy if exists "Gestionar diagnosticos propios con acceso a consulta" on public.consultas_diagnosticos;

create policy "Gestionar diagnosticos propios con acceso a consulta" on public.consultas_diagnosticos
  for all to authenticated
  using (
    auth.uid() = created_by
    and exists (
      select 1
      from public.consultas c
      where c.id = consultas_diagnosticos.consultation_id
        and (
          c.medico_id = auth.uid() -- Sigue la política de edición de la propia consulta
          or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
        )
    )
  )
  with check (
    auth.uid() = created_by
    and exists (
      select 1
      from public.consultas c
      where c.id = consultas_diagnosticos.consultation_id
        and (
          c.medico_id = auth.uid()
          or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
        )
    )
  );
