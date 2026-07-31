-- =========================================================
-- SCHEMA DO SISTEMA DE ASSINATURAS
-- Execute este script no SQL Editor do Supabase
-- =========================================================

-- ---------------------------------------------------------
-- Tabela: planos
-- Cada linha representa um plano vendável no Stripe.
-- A ligação com o Stripe é feita SEMPRE via price_id (nunca via valor).
-- ---------------------------------------------------------
create table if not exists planos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  price_id text not null unique,           -- Price ID do Stripe (price_xxx)
  valor numeric(10,2) not null,             -- apenas informativo/exibição
  link_grupo text not null,                 -- link do grupo (WhatsApp/Telegram/Discord)
  ativo boolean not null default true,
  ordem_exibicao integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_planos_price_id on planos (price_id);
create index if not exists idx_planos_ativo on planos (ativo);

-- ---------------------------------------------------------
-- Tabela: clientes
-- Representa a assinatura de um cliente. 1 linha = 1 assinatura ativa/histórica
-- vinculada a um subscription_id do Stripe.
-- ---------------------------------------------------------
create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nome text,
  email text not null,
  telefone text,
  stripe_customer_id text not null,
  subscription_id text unique,              -- sub_xxx do Stripe
  price_id text not null,                   -- price_xxx do plano contratado
  plano_id uuid references planos(id),
  status text not null default 'pendente',  -- pendente | ativa | inadimplente | cancelada
  link_enviado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_clientes_email on clientes (email);
create index if not exists idx_clientes_subscription_id on clientes (subscription_id);
create index if not exists idx_clientes_status on clientes (status);
create index if not exists idx_clientes_stripe_customer_id on clientes (stripe_customer_id);

-- ---------------------------------------------------------
-- Tabela: eventos_webhook (idempotência)
-- Evita processar o mesmo evento do Stripe duas vezes
-- (o Stripe pode reenviar eventos).
-- ---------------------------------------------------------
create table if not exists eventos_webhook (
  id text primary key,                      -- event.id do Stripe (evt_xxx)
  tipo text not null,
  processado_em timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Trigger genérico para manter updated_at atualizado
-- ---------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_planos_updated_at on planos;
create trigger trg_planos_updated_at
  before update on planos
  for each row execute function set_updated_at();

drop trigger if exists trg_clientes_updated_at on clientes;
create trigger trg_clientes_updated_at
  before update on clientes
  for each row execute function set_updated_at();

-- ---------------------------------------------------------
-- Seed inicial: os 2 planos do enunciado
-- Troque os price_id pelos IDs reais criados no Dashboard do Stripe.
-- ---------------------------------------------------------
insert into planos (nome, price_id, valor, link_grupo, ativo, ordem_exibicao)
values
  ('Plano Básico', 'price_SUBSTITUA_PELO_ID_BASICO', 49.00, 'https://chat.whatsapp.com/SEU_LINK_BASICO', true, 1),
  ('Plano Premium', 'price_SUBSTITUA_PELO_ID_PREMIUM', 97.00, 'https://chat.whatsapp.com/SEU_LINK_PREMIUM', true, 2)
on conflict (price_id) do nothing;

-- Observação sobre RLS (Row Level Security):
-- Como todo acesso ao Supabase é feito pelo backend usando a service_role key,
-- o RLS pode permanecer desabilitado nestas tabelas (o service role o ignora
-- de qualquer forma). Se quiser reforçar a segurança, habilite RLS e não
-- crie nenhuma policy pública — apenas o backend (service role) acessará.
