"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import { db, type Account, type Transaction } from "./db";

export function useAccounts(): Account[] {
  return useLiveQuery(() => db.accounts.toArray(), [], []) as Account[];
}

export function useTransactions(): Transaction[] {
  return useLiveQuery(
    () => db.transactions.orderBy("date").reverse().toArray(),
    [],
    [],
  ) as Transaction[];
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
