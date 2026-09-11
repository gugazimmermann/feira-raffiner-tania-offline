-- Rode no SQL Editor do Supabase (Dashboard → SQL → New query)

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  empresa text,
  whatsapp text,
  instagram text,
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;

create policy "Anon e autenticados podem inserir leads"
  on public.leads
  for insert
  to anon, authenticated
  with check (true);

-- Migração: se a tabela já existir com NOT NULL / sem instagram, rode também:
-- alter table public.leads
--   add column if not exists instagram text;
-- alter table public.leads alter column empresa drop not null;
-- alter table public.leads alter column whatsapp drop not null;
-- alter table public.leads alter column instagram drop not null;
