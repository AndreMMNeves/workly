-- Workly schema with row-level security.
-- Run this in Supabase Dashboard -> SQL Editor -> New query.

create extension if not exists "pgcrypto";

-- Accounts ------------------------------------------------------------------
create table if not exists public.accounts (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null,
  color text not null,
  opening_balance numeric not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists accounts_user_idx on public.accounts(user_id);

alter table public.accounts enable row level security;
drop policy if exists "accounts_select_own" on public.accounts;
drop policy if exists "accounts_insert_own" on public.accounts;
drop policy if exists "accounts_update_own" on public.accounts;
drop policy if exists "accounts_delete_own" on public.accounts;
create policy "accounts_select_own" on public.accounts for select using (auth.uid() = user_id);
create policy "accounts_insert_own" on public.accounts for insert with check (auth.uid() = user_id);
create policy "accounts_update_own" on public.accounts for update using (auth.uid() = user_id);
create policy "accounts_delete_own" on public.accounts for delete using (auth.uid() = user_id);

-- Transactions --------------------------------------------------------------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id text not null,
  date date not null,
  description text not null default '',
  merchant text,
  category text not null,
  amount numeric not null,
  created_at timestamptz not null default now(),
  foreign key (account_id) references public.accounts(id) on delete cascade
);
create index if not exists transactions_user_idx on public.transactions(user_id);
create index if not exists transactions_account_idx on public.transactions(account_id);
create index if not exists transactions_date_idx on public.transactions(date desc);

alter table public.transactions enable row level security;
drop policy if exists "tx_select_own" on public.transactions;
drop policy if exists "tx_insert_own" on public.transactions;
drop policy if exists "tx_update_own" on public.transactions;
drop policy if exists "tx_delete_own" on public.transactions;
create policy "tx_select_own" on public.transactions for select using (auth.uid() = user_id);
create policy "tx_insert_own" on public.transactions for insert with check (auth.uid() = user_id);
create policy "tx_update_own" on public.transactions for update using (auth.uid() = user_id);
create policy "tx_delete_own" on public.transactions for delete using (auth.uid() = user_id);

-- Vaults --------------------------------------------------------------------
create table if not exists public.vaults (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  goal numeric not null default 0,
  color text not null,
  account_id text references public.accounts(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists vaults_user_idx on public.vaults(user_id);

alter table public.vaults enable row level security;
drop policy if exists "vaults_select_own" on public.vaults;
drop policy if exists "vaults_insert_own" on public.vaults;
drop policy if exists "vaults_update_own" on public.vaults;
drop policy if exists "vaults_delete_own" on public.vaults;
create policy "vaults_select_own" on public.vaults for select using (auth.uid() = user_id);
create policy "vaults_insert_own" on public.vaults for insert with check (auth.uid() = user_id);
create policy "vaults_update_own" on public.vaults for update using (auth.uid() = user_id);
create policy "vaults_delete_own" on public.vaults for delete using (auth.uid() = user_id);

create table if not exists public.vault_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vault_id uuid not null references public.vaults(id) on delete cascade,
  amount numeric not null,
  date date not null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists vmov_user_idx on public.vault_movements(user_id);
create index if not exists vmov_vault_idx on public.vault_movements(vault_id);

alter table public.vault_movements enable row level security;
drop policy if exists "vmov_select_own" on public.vault_movements;
drop policy if exists "vmov_insert_own" on public.vault_movements;
drop policy if exists "vmov_update_own" on public.vault_movements;
drop policy if exists "vmov_delete_own" on public.vault_movements;
create policy "vmov_select_own" on public.vault_movements for select using (auth.uid() = user_id);
create policy "vmov_insert_own" on public.vault_movements for insert with check (auth.uid() = user_id);
create policy "vmov_update_own" on public.vault_movements for update using (auth.uid() = user_id);
create policy "vmov_delete_own" on public.vault_movements for delete using (auth.uid() = user_id);

-- Realtime ------------------------------------------------------------------
alter publication supabase_realtime add table public.accounts;
alter publication supabase_realtime add table public.transactions;
alter publication supabase_realtime add table public.vaults;
alter publication supabase_realtime add table public.vault_movements;
