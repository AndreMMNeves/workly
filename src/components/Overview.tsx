"use client";

import { useMemo } from "react";
import { brl, monthKey } from "@/lib/format";
import { useAccounts, useTransactions, useBalances } from "@/lib/data";
import { useHideValues } from "@/lib/hideValues";
import AccountCard from "./AccountCard";
import BalanceChart from "./BalanceChart";
import RecentTransactions from "./RecentTransactions";
import AddTransactionDialog from "./AddTransactionDialog";
import HideValuesToggle from "./HideValuesToggle";

export default function Overview() {
  const accounts = useAccounts();
  const transactions = useTransactions();
  const balances = useBalances(accounts, transactions);
  const { mask } = useHideValues();

  const total = useMemo(
    () => Array.from(balances.values()).reduce((a, b) => a + b, 0),
    [balances],
  );

  const chartData = useMemo(() => {
    const byMonth = new Map<string, number>();
    for (const t of [...transactions].reverse()) {
      const k = monthKey(t.date);
      byMonth.set(k, (byMonth.get(k) ?? 0) + t.amount);
    }
    let running = 0;
    return Array.from(byMonth.entries()).map(([k, delta]) => {
      running += delta;
      const [y, m] = k.split("-");
      const label = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(
        "pt-BR",
        { month: "short" },
      );
      return { label, value: running };
    });
  }, [transactions]);

  const now = monthKey(new Date().toISOString());
  const monthExpense = useMemo(
    () =>
      transactions
        .filter((t) => monthKey(t.date) === now && t.amount < 0)
        .reduce((a, t) => a + t.amount, 0),
    [transactions, now],
  );
  const monthIncome = useMemo(
    () =>
      transactions
        .filter((t) => monthKey(t.date) === now && t.amount > 0)
        .reduce((a, t) => a + t.amount, 0),
    [transactions, now],
  );

  return (
    <>
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="text-sm text-[var(--muted)]">
            Suas contas e transações em um só lugar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <HideValuesToggle />
          <AddTransactionDialog accounts={accounts} />
        </div>
      </header>

      <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {accounts.map((a) => (
          <AccountCard key={a.id} account={a} balance={balances.get(a.id) ?? 0} />
        ))}
      </section>

      <section className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-[var(--muted)]">Saldo total</div>
              <div className="text-2xl font-semibold">{mask(brl(total))}</div>
            </div>
            <div className="flex gap-4 text-right text-xs">
              <div>
                <div className="text-[var(--muted)]">Entradas (mês)</div>
                <div className="text-[var(--accent)] font-semibold text-sm">
                  {mask(brl(monthIncome))}
                </div>
              </div>
              <div>
                <div className="text-[var(--muted)]">Saídas (mês)</div>
                <div className="text-[var(--danger)] font-semibold text-sm">
                  {mask(brl(monthExpense))}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4">
            {chartData.length > 0 ? (
              <BalanceChart data={chartData} />
            ) : (
              <div className="h-64 grid place-items-center text-sm text-[var(--muted)]">
                Adicione transações pra ver o gráfico.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Transações recentes</h2>
            <span className="text-xs text-[var(--muted)]">
              {transactions.length} total
            </span>
          </div>
          <RecentTransactions
            items={transactions.slice(0, 8)}
            accounts={accounts}
          />
        </div>
      </section>
    </>
  );
}
