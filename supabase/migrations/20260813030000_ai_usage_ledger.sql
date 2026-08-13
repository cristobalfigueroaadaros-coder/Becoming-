-- A private, append-only ledger for monitoring Bcoming's AI spend.
create table if not exists public.ai_usage_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  feature text not null default 'unknown',
  provider text not null,
  model text,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  estimated_cost_usd numeric(12, 8) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_ledger_created_at_idx
  on public.ai_usage_ledger (created_at desc);
create index if not exists ai_usage_ledger_feature_created_at_idx
  on public.ai_usage_ledger (feature, created_at desc);

alter table public.ai_usage_ledger enable row level security;

-- No client-side access. The Edge Functions write via the service role.
revoke all on public.ai_usage_ledger from anon, authenticated;
