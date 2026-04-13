"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type Account = {
  id: string;
  name: string;
  kind: string;
  color: string;
  openingBalance: number;
};

export type Transaction = {
  id: string;
  accountId: string;
  date: string;
  description: string;
  merchant?: string;
  category: string;
  amount: number;
  transferGroupId?: string;
  createdAt: string;
};

export type Vault = {
  id: string;
  name: string;
  goal: number;
  color: string;
  accountId?: string;
  deadline?: string;
  createdAt: string;
};

export type RecurringTransaction = {
  id: string;
  accountId: string;
  description: string;
  merchant?: string;
  category: string;
  amount: number;
  frequency: "monthly" | "weekly";
  dayOfMonth?: number;
  startDate: string;
  endDate?: string;
  lastGeneratedDate?: string;
  active: boolean;
};

export type Budget = {
  id: string;
  category: string;
  monthlyLimit: number;
};

export type VaultMovement = {
  id: string;
  vaultId: string;
  amount: number;
  date: string;
  note?: string;
  createdAt: string;
};

export const DEFAULT_CATEGORIES = [
  "Alimentação",
  "Transporte",
  "Moradia",
  "Lazer",
  "Saúde",
  "Educação",
  "Mercado",
  "Assinaturas",
  "Salário",
  "Transferência",
  "Outros",
];

export const SEED_ACCOUNTS: Omit<Account, never>[] = [
  { id: "caixa", name: "Caixa", kind: "caixa", color: "#0072c6", openingBalance: 0 },
  { id: "hub4play-va", name: "VA Hub4play", kind: "hub4play-va", color: "#f5a524", openingBalance: 0 },
  { id: "hub4play-vr", name: "VR Hub4play", kind: "hub4play-vr", color: "#34e3b0", openingBalance: 0 },
  { id: "nubank", name: "Nubank", kind: "nubank", color: "#8a2be2", openingBalance: 0 },
];

// Row mappers ---------------------------------------------------------------

type AccountRow = {
  id: string;
  name: string;
  kind: string;
  color: string;
  opening_balance: number;
};
type TransactionRow = {
  id: string;
  account_id: string;
  date: string;
  description: string;
  merchant: string | null;
  category: string;
  amount: number;
  transfer_group_id: string | null;
  created_at: string;
};
type VaultRow = {
  id: string;
  name: string;
  goal: number;
  color: string;
  account_id: string | null;
  deadline: string | null;
  created_at: string;
};

type RecurringRow = {
  id: string;
  account_id: string;
  description: string;
  merchant: string | null;
  category: string;
  amount: number;
  frequency: string;
  day_of_month: number | null;
  start_date: string;
  end_date: string | null;
  last_generated_date: string | null;
  active: boolean;
};

type BudgetRow = {
  id: string;
  category: string;
  monthly_limit: number;
};
type VaultMovementRow = {
  id: string;
  vault_id: string;
  amount: number;
  date: string;
  note: string | null;
  created_at: string;
};

const mapAccount = (r: AccountRow): Account => ({
  id: r.id,
  name: r.name,
  kind: r.kind,
  color: r.color,
  openingBalance: Number(r.opening_balance),
});
const mapTransaction = (r: TransactionRow): Transaction => ({
  id: r.id,
  accountId: r.account_id,
  date: r.date,
  description: r.description,
  merchant: r.merchant ?? undefined,
  category: r.category,
  amount: Number(r.amount),
  transferGroupId: r.transfer_group_id ?? undefined,
  createdAt: r.created_at,
});
const mapVault = (r: VaultRow): Vault => ({
  id: r.id,
  name: r.name,
  goal: Number(r.goal),
  color: r.color,
  accountId: r.account_id ?? undefined,
  deadline: r.deadline ?? undefined,
  createdAt: r.created_at,
});
const mapRecurring = (r: RecurringRow): RecurringTransaction => ({
  id: r.id,
  accountId: r.account_id,
  description: r.description,
  merchant: r.merchant ?? undefined,
  category: r.category,
  amount: Number(r.amount),
  frequency: (r.frequency as "monthly" | "weekly") ?? "monthly",
  dayOfMonth: r.day_of_month ?? undefined,
  startDate: r.start_date,
  endDate: r.end_date ?? undefined,
  lastGeneratedDate: r.last_generated_date ?? undefined,
  active: r.active,
});
const mapBudget = (r: BudgetRow): Budget => ({
  id: r.id,
  category: r.category,
  monthlyLimit: Number(r.monthly_limit),
});
const mapVaultMovement = (r: VaultMovementRow): VaultMovement => ({
  id: r.id,
  vaultId: r.vault_id,
  amount: Number(r.amount),
  date: r.date,
  note: r.note ?? undefined,
  createdAt: r.created_at,
});

// Live queries with realtime --------------------------------------------------

function useLive<T>(
  table:
    | "accounts"
    | "transactions"
    | "vaults"
    | "vault_movements"
    | "recurring_transactions"
    | "budgets",
  fetcher: () => Promise<T>,
) {
  const [state, setState] = useState<T | null>(null);
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    const run = () => {
      fetcher().then((v) => {
        if (!cancelled) setState(v);
      });
    };
    run();
    const channelName = `live:${table}:${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", { event: "*", schema: "public", table }, run)
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);
  return state;
}

export function useAccounts(): Account[] {
  const data = useLive<Account[]>("accounts", async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("accounts")
      .select("*")
      .order("name", { ascending: true });
    return (data ?? []).map(mapAccount);
  });
  return data ?? [];
}

export function useTransactions(): Transaction[] {
  const data = useLive<Transaction[]>("transactions", async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    return (data ?? []).map(mapTransaction);
  });
  return data ?? [];
}

export function useVaults(): Vault[] {
  const data = useLive<Vault[]>("vaults", async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("vaults")
      .select("*")
      .order("created_at", { ascending: true });
    return (data ?? []).map(mapVault);
  });
  return data ?? [];
}

export function useRecurring(): RecurringTransaction[] {
  const data = useLive<RecurringTransaction[]>("recurring_transactions", async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("recurring_transactions")
      .select("*")
      .order("created_at", { ascending: true });
    return (data ?? []).map(mapRecurring);
  });
  return data ?? [];
}

export function useBudgets(): Budget[] {
  const data = useLive<Budget[]>("budgets", async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("budgets")
      .select("*")
      .order("category", { ascending: true });
    return (data ?? []).map(mapBudget);
  });
  return data ?? [];
}

export function useVaultMovements(): VaultMovement[] {
  const data = useLive<VaultMovement[]>("vault_movements", async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("vault_movements")
      .select("*")
      .order("date", { ascending: true });
    return (data ?? []).map(mapVaultMovement);
  });
  return data ?? [];
}

export function useBalances(accounts: Account[], transactions: Transaction[]) {
  return useMemo(() => {
    const map = new Map<string, number>();
    for (const a of accounts) map.set(a.id, a.openingBalance);
    for (const t of transactions)
      map.set(t.accountId, (map.get(t.accountId) ?? 0) + t.amount);
    return map;
  }, [accounts, transactions]);
}

// Mutations -----------------------------------------------------------------

async function currentUserId() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export async function addAccount(
  input: Omit<Account, "id"> & { id?: string },
) {
  const supabase = createClient();
  const user_id = await currentUserId();
  const id =
    input.id ??
    input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") +
      "-" +
      Date.now().toString(36);
  const { error } = await supabase.from("accounts").insert({
    id,
    user_id,
    name: input.name,
    kind: input.kind,
    color: input.color,
    opening_balance: input.openingBalance,
  });
  if (error) throw error;
}

export async function updateAccount(id: string, patch: Partial<Account>) {
  const supabase = createClient();
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.color !== undefined) row.color = patch.color;
  if (patch.openingBalance !== undefined) row.opening_balance = patch.openingBalance;
  if (patch.kind !== undefined) row.kind = patch.kind;
  const { error } = await supabase.from("accounts").update(row).eq("id", id);
  if (error) throw error;
}

export async function deleteAccount(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) throw error;
}

export type TransactionInput = {
  accountId: string;
  date: string;
  description: string;
  merchant?: string;
  category: string;
  amount: number;
};

export async function addTransaction(input: TransactionInput) {
  const supabase = createClient();
  const user_id = await currentUserId();
  const { error } = await supabase.from("transactions").insert({
    user_id,
    account_id: input.accountId,
    date: input.date,
    description: input.description,
    merchant: input.merchant ?? null,
    category: input.category,
    amount: input.amount,
  });
  if (error) throw error;
}

export async function updateTransaction(id: string, patch: TransactionInput) {
  const supabase = createClient();
  const { error } = await supabase
    .from("transactions")
    .update({
      account_id: patch.accountId,
      date: patch.date,
      description: patch.description,
      merchant: patch.merchant ?? null,
      category: patch.category,
      amount: patch.amount,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteTransaction(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw error;
}

export async function addVault(input: {
  name: string;
  goal: number;
  color: string;
  accountId?: string;
  deadline?: string;
}) {
  const supabase = createClient();
  const user_id = await currentUserId();
  const { error } = await supabase.from("vaults").insert({
    user_id,
    name: input.name,
    goal: input.goal,
    color: input.color,
    account_id: input.accountId ?? null,
    deadline: input.deadline ?? null,
  });
  if (error) throw error;
}

export async function deleteVault(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("vaults").delete().eq("id", id);
  if (error) throw error;
}

export async function addVaultMovement(input: {
  vaultId: string;
  amount: number;
  date: string;
  note?: string;
}) {
  const supabase = createClient();
  const user_id = await currentUserId();
  const { error } = await supabase.from("vault_movements").insert({
    user_id,
    vault_id: input.vaultId,
    amount: input.amount,
    date: input.date,
    note: input.note ?? null,
  });
  if (error) throw error;
}

// Transfer ------------------------------------------------------------------

export async function addTransfer(input: {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  date: string;
  description?: string;
}) {
  if (input.fromAccountId === input.toAccountId)
    throw new Error("Escolha contas diferentes");
  if (input.amount <= 0) throw new Error("Valor inválido");
  const supabase = createClient();
  const user_id = await currentUserId();
  const groupId = crypto.randomUUID();
  const { error } = await supabase.from("transactions").insert([
    {
      user_id,
      account_id: input.fromAccountId,
      date: input.date,
      description: input.description ?? "Transferência enviada",
      category: "Transferência",
      amount: -Math.abs(input.amount),
      transfer_group_id: groupId,
    },
    {
      user_id,
      account_id: input.toAccountId,
      date: input.date,
      description: input.description ?? "Transferência recebida",
      category: "Transferência",
      amount: Math.abs(input.amount),
      transfer_group_id: groupId,
    },
  ]);
  if (error) throw error;
}

// Recurring -----------------------------------------------------------------

export type RecurringInput = {
  accountId: string;
  description: string;
  merchant?: string;
  category: string;
  amount: number;
  frequency: "monthly" | "weekly";
  dayOfMonth?: number;
  startDate: string;
  endDate?: string;
};

export async function addRecurring(input: RecurringInput) {
  const supabase = createClient();
  const user_id = await currentUserId();
  const { error } = await supabase.from("recurring_transactions").insert({
    user_id,
    account_id: input.accountId,
    description: input.description,
    merchant: input.merchant ?? null,
    category: input.category,
    amount: input.amount,
    frequency: input.frequency,
    day_of_month: input.dayOfMonth ?? null,
    start_date: input.startDate,
    end_date: input.endDate ?? null,
    active: true,
  });
  if (error) throw error;
}

export async function updateRecurring(id: string, patch: Partial<RecurringTransaction>) {
  const supabase = createClient();
  const row: Record<string, unknown> = {};
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.merchant !== undefined) row.merchant = patch.merchant ?? null;
  if (patch.category !== undefined) row.category = patch.category;
  if (patch.amount !== undefined) row.amount = patch.amount;
  if (patch.active !== undefined) row.active = patch.active;
  if (patch.dayOfMonth !== undefined) row.day_of_month = patch.dayOfMonth;
  const { error } = await supabase
    .from("recurring_transactions")
    .update(row)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteRecurring(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("recurring_transactions")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

function addMonths(iso: string, n: number) {
  const d = new Date(iso + "T12:00:00");
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}
function addDays(iso: string, n: number) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export async function materializeRecurring() {
  const supabase = createClient();
  const user_id = await currentUserId();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("recurring_transactions")
    .select("*")
    .eq("active", true);
  const rows = (data ?? []) as RecurringRow[];
  for (const r of rows) {
    let cursor = r.last_generated_date ?? r.start_date;
    // Compute next date from cursor
    const step = (iso: string) =>
      r.frequency === "weekly" ? addDays(iso, 7) : addMonths(iso, 1);
    // If never generated, we want to check whether the first occurrence (start_date) is due
    let next = r.last_generated_date ? step(cursor) : r.start_date;
    const inserts: Record<string, unknown>[] = [];
    while (next <= today && (!r.end_date || next <= r.end_date)) {
      inserts.push({
        user_id,
        account_id: r.account_id,
        date: next,
        description: r.description,
        merchant: r.merchant,
        category: r.category,
        amount: r.amount,
      });
      cursor = next;
      next = step(cursor);
    }
    if (inserts.length > 0) {
      const { error: insErr } = await supabase.from("transactions").insert(inserts);
      if (insErr) continue;
      await supabase
        .from("recurring_transactions")
        .update({ last_generated_date: cursor })
        .eq("id", r.id);
    }
  }
}

// Budgets -------------------------------------------------------------------

export async function upsertBudget(category: string, monthlyLimit: number) {
  const supabase = createClient();
  const user_id = await currentUserId();
  const { error } = await supabase
    .from("budgets")
    .upsert(
      { user_id, category, monthly_limit: monthlyLimit },
      { onConflict: "user_id,category" },
    );
  if (error) throw error;
}

export async function deleteBudget(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("budgets").delete().eq("id", id);
  if (error) throw error;
}

export async function exportAll() {
  const supabase = createClient();
  const [a, t, v, m, r, b] = await Promise.all([
    supabase.from("accounts").select("*"),
    supabase.from("transactions").select("*"),
    supabase.from("vaults").select("*"),
    supabase.from("vault_movements").select("*"),
    supabase.from("recurring_transactions").select("*"),
    supabase.from("budgets").select("*"),
  ]);
  return {
    accounts: a.data ?? [],
    transactions: t.data ?? [],
    vaults: v.data ?? [],
    vaultMovements: m.data ?? [],
    recurring: r.data ?? [],
    budgets: b.data ?? [],
  };
}

export async function ensureSeedAccounts() {
  const supabase = createClient();
  const { count } = await supabase
    .from("accounts")
    .select("id", { count: "exact", head: true });
  if ((count ?? 0) > 0) return;
  const user_id = await currentUserId();
  await supabase.from("accounts").insert(
    SEED_ACCOUNTS.map((a) => ({
      id: a.id,
      user_id,
      name: a.name,
      kind: a.kind,
      color: a.color,
      opening_balance: a.openingBalance,
    })),
  );
}
