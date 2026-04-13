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
  createdAt: string;
};

export type Vault = {
  id: string;
  name: string;
  goal: number;
  color: string;
  accountId?: string;
  createdAt: string;
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
  created_at: string;
};
type VaultRow = {
  id: string;
  name: string;
  goal: number;
  color: string;
  account_id: string | null;
  created_at: string;
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
  createdAt: r.created_at,
});
const mapVault = (r: VaultRow): Vault => ({
  id: r.id,
  name: r.name,
  goal: Number(r.goal),
  color: r.color,
  accountId: r.account_id ?? undefined,
  createdAt: r.created_at,
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
  table: "accounts" | "transactions" | "vaults" | "vault_movements",
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
    const channel = supabase
      .channel(`live:${table}`)
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
}) {
  const supabase = createClient();
  const user_id = await currentUserId();
  const { error } = await supabase.from("vaults").insert({
    user_id,
    name: input.name,
    goal: input.goal,
    color: input.color,
    account_id: input.accountId ?? null,
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

export async function exportAll() {
  const supabase = createClient();
  const [a, t, v, m] = await Promise.all([
    supabase.from("accounts").select("*"),
    supabase.from("transactions").select("*"),
    supabase.from("vaults").select("*"),
    supabase.from("vault_movements").select("*"),
  ]);
  return {
    accounts: a.data ?? [],
    transactions: t.data ?? [],
    vaults: v.data ?? [],
    vaultMovements: m.data ?? [],
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
