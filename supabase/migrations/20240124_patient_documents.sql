create table if not exists patient_documents (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references pacientes(id) on delete cascade not null,
  name text not null,
  url text not null,
  type text check (type in ('analitica', 'imagen', 'informe', 'receta', 'otro')) default 'otro',
  created_at timestamptz default now()
);

-- Enable RLS
alter table patient_documents enable row level security;

-- Policy: Owners can view documents
create policy "Owners can view documents of their portfolio patients"
  on patient_documents for select
  using (
    exists (
      select 1 from pacientes p
      join carteras c on p.cartera_id = c.id
      where p.id = patient_documents.patient_id
      and c.owner_id = auth.uid()
    )
  );

-- Policy: Shared users can view documents
create policy "Shared users can view documents"
  on patient_documents for select
  using (
    exists (
      select 1 from carteras_acceso ca
      join carteras c on ca.cartera_id = c.id
      join pacientes p on p.cartera_id = c.id
      where p.id = patient_documents.patient_id
      and ca.user_email = (select email from auth.users where id = auth.uid())
      and ca.status = 'accepted'
    )
  );
